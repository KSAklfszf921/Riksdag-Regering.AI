/**
 * HTTP Server för MCP - Remote deployment
 *
 * Denna server exponerar MCP över HTTP för remote access.
 * Optimerad för deployment på Render.com och andra cloud providers.
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import NodeCache from 'node-cache';

import { initSupabase } from './utils/supabase.js';
import { createMCPServer } from './core/mcpServer.js';

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configure cache (5 minutes default TTL)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const API_KEY = process.env.API_KEY; // Optional API key for authentication

/**
 * Create and configure Express app
 */
function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/mcp', limiter);

  // API key authentication middleware (optional)
  const authenticateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!API_KEY) {
      return next(); // No API key required if not configured
    }

    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (apiKey !== API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
  };

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'riksdag-regering-mcp',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // MCP Server instance - använd gemensam konfiguration med logger
  const mcpServer = createMCPServer(logger);

  // MCP endpoints
  app.post('/mcp/list-tools', authenticateApiKey, async (req, res) => {
    try {
      const cacheKey = 'list-tools';
      const cached = cache.get(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const result = await mcpServer.request(
        { method: 'tools/list' },
        ListToolsRequestSchema
      );

      cache.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      logger.error('Error listing tools:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/mcp/call-tool', authenticateApiKey, async (req, res) => {
    try {
      const { name, arguments: args } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Tool name is required' });
      }

      const result = await mcpServer.request(
        {
          method: 'tools/call',
          params: { name, arguments: args || {} }
        },
        CallToolRequestSchema
      );

      res.json(result);
    } catch (error) {
      logger.error('Error calling tool:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/mcp/list-resources', authenticateApiKey, async (req, res) => {
    try {
      const cacheKey = 'list-resources';
      const cached = cache.get(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const result = await mcpServer.request(
        { method: 'resources/list' },
        ListResourcesRequestSchema
      );

      cache.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      logger.error('Error listing resources:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/mcp/read-resource', authenticateApiKey, async (req, res) => {
    try {
      const { uri } = req.body;

      if (!uri) {
        return res.status(400).json({ error: 'Resource URI is required' });
      }

      const result = await mcpServer.request(
        {
          method: 'resources/read',
          params: { uri }
        },
        ReadResourceRequestSchema
      );

      res.json(result);
    } catch (error) {
      logger.error('Error reading resource:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Unified /mcp endpoint for ChatGPT and other clients (NO AUTH)
  app.post('/mcp', async (req, res) => {
    try {
      const { method, params } = req.body;

      if (!method) {
        return res.status(400).json({ error: 'Method is required' });
      }

      logger.info(`[MCP] ${method}`, params ? { params } : {});

      // Route to appropriate MCP method
      let result;
      switch (method) {
        case 'tools/list':
          const toolsCacheKey = 'tools-list';
          const cachedTools = cache.get(toolsCacheKey);
          if (cachedTools) {
            result = cachedTools;
          } else {
            result = await mcpServer.request({ method: 'tools/list' }, ListToolsRequestSchema);
            cache.set(toolsCacheKey, result);
          }
          break;

        case 'tools/call':
          result = await mcpServer.request({ method: 'tools/call', params }, CallToolRequestSchema);
          break;

        case 'resources/list':
          const resourcesCacheKey = 'resources-list';
          const cachedResources = cache.get(resourcesCacheKey);
          if (cachedResources) {
            result = cachedResources;
          } else {
            result = await mcpServer.request({ method: 'resources/list' }, ListResourcesRequestSchema);
            cache.set(resourcesCacheKey, result);
          }
          break;

        case 'resources/read':
          result = await mcpServer.request({ method: 'resources/read', params }, ReadResourceRequestSchema);
          break;

        default:
          return res.status(400).json({ error: `Unknown method: ${method}` });
      }

      res.json(result);
    } catch (error) {
      logger.error('Error processing MCP request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Internal server error', details: errorMessage });
    }
  });

  // SSE endpoint for streaming MCP protocol
  app.get('/sse', (req, res) => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    // Keep connection alive with periodic pings
    const pingInterval = setInterval(() => {
      res.write(`: ping\n\n`);
    }, 30000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(pingInterval);
      logger.info('SSE client disconnected');
    });
  });

  // POST endpoint for sending MCP requests via SSE (with optional auth)
  app.post('/sse', authenticateApiKey, async (req, res) => {
    try {
      const { method, params } = req.body;

      if (!method) {
        return res.status(400).json({ error: 'Method is required' });
      }

      // Route to appropriate MCP method
      let result;
      switch (method) {
        case 'tools/list':
          result = await mcpServer.request({ method: 'tools/list' }, ListToolsRequestSchema);
          break;
        case 'tools/call':
          result = await mcpServer.request({ method: 'tools/call', params }, CallToolRequestSchema);
          break;
        case 'resources/list':
          result = await mcpServer.request({ method: 'resources/list' }, ListResourcesRequestSchema);
          break;
        case 'resources/read':
          result = await mcpServer.request({ method: 'resources/read', params }, ReadResourceRequestSchema);
          break;
        default:
          return res.status(400).json({ error: `Unknown method: ${method}` });
      }

      res.json(result);
    } catch (error) {
      logger.error('Error processing SSE request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

/**
 * Start the server
 */
async function main() {
  try {
    // Initialize Supabase
    logger.info('Initializing Supabase connection...');
    initSupabase();

    // Create and start Express server
    const app = createApp();

    app.listen(PORT, () => {
      logger.info(`🚀 Riksdag-Regering MCP Server v2.0 started`);
      logger.info(`📡 HTTP Server listening on port ${PORT}`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
      logger.info(`🔒 API Key authentication: ${API_KEY ? 'enabled (SSE only)' : 'disabled'}`);
      logger.info(`\nEndpoints:`);
      logger.info(`  GET  /health - Health check`);
      logger.info(`  POST /mcp - Unified MCP endpoint (NO AUTH, for ChatGPT)`);
      logger.info(`  GET  /sse - SSE streaming endpoint`);
      logger.info(`  POST /sse - Send MCP requests via SSE (with auth)`);
      logger.info(`  POST /mcp/list-tools - List available tools (legacy, with auth)`);
      logger.info(`  POST /mcp/call-tool - Call a tool (legacy, with auth)`);
      logger.info(`  POST /mcp/list-resources - List available resources (legacy, with auth)`);
      logger.info(`  POST /mcp/read-resource - Read a resource (legacy, with auth)`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

main();
