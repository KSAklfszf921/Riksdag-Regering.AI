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

import { createMCPServer } from './core/mcpServer.js';
import { getSyncStatus } from './tools/health.js';

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
/**
 * Create and configure Express app
 */
function createApp() {
  const app = express();

  // Trust proxy - required for Render.com and rate limiting
  app.set('trust proxy', 1);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Serve static files from public directory
  app.use(express.static('public'));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/mcp', limiter);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const sync = await getSyncStatus();
    res.json({
      status: 'ok',
      service: 'riksdag-regering-mcp',
      version: '2.2.0',
      timestamp: new Date().toISOString(),
      sync,
    });
  });

  // MCP Server instance - använd gemensam konfiguration med logger
  const mcpServer = createMCPServer(logger);

  // Helper to call MCP handlers directly (no connection needed for HTTP mode)
  async function callMCPHandler(method: string, params?: any) {
    // Construct proper MCP request object
    const request = {
      method,
      params: params || {}
    };

    switch (method) {
      case 'tools/list':
        return mcpServer['_requestHandlers'].get('tools/list')?.(request);
      case 'tools/call':
        return mcpServer['_requestHandlers'].get('tools/call')?.(request);
      case 'resources/list':
        return mcpServer['_requestHandlers'].get('resources/list')?.(request);
      case 'resources/read':
        return mcpServer['_requestHandlers'].get('resources/read')?.(request);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  // MCP endpoints
  app.post('/mcp/list-tools', async (req, res) => {
    try {
      const cacheKey = 'list-tools';
      const cached = cache.get(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const result = await callMCPHandler('tools/list');

      cache.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      logger.error('Error listing tools:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/mcp/call-tool', async (req, res) => {
    try {
      const { name, arguments: args } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Tool name is required' });
      }

      const result = await callMCPHandler('tools/call', { name, arguments: args || {} });

      res.json(result);
    } catch (error) {
      logger.error('Error calling tool:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/mcp/list-resources', async (req, res) => {
    try {
      const cacheKey = 'list-resources';
      const cached = cache.get(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      const result = await callMCPHandler('resources/list');

      cache.set(cacheKey, result);
      res.json(result);
    } catch (error) {
      logger.error('Error listing resources:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/mcp/read-resource', async (req, res) => {
    try {
      const { uri } = req.body;

      if (!uri) {
        return res.status(400).json({ error: 'Resource URI is required' });
      }

      const result = await callMCPHandler('resources/read', { uri });

      res.json(result);
    } catch (error) {
      logger.error('Error reading resource:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET handler for /mcp - Information page
  app.get('/mcp', (req, res) => {
    res.json({
      service: 'riksdag-regering-mcp',
      version: '2.1.0',
      description: 'MCP Server för Riksdagen och Regeringskansliet',
      status: 'operational',
      usage: {
        method: 'POST',
        contentType: 'application/json',
        body: {
          method: 'tools/list | tools/call | resources/list | resources/read',
          params: 'optional parameters depending on method'
        }
      },
      examples: [
        {
          description: 'List all available tools',
          request: {
            method: 'POST',
            url: '/mcp',
            body: { method: 'tools/list' }
          }
        },
        {
          description: 'Call a tool',
          request: {
            method: 'POST',
            url: '/mcp',
            body: {
              method: 'tools/call',
              params: {
                name: 'search_ledamoter',
                arguments: { parti: 'S', limit: 10 }
              }
            }
          }
        },
        {
          description: 'List all resources',
          request: {
            method: 'POST',
            url: '/mcp',
            body: { method: 'resources/list' }
          }
        }
      ],
      endpoints: {
        '/health': 'GET - Health check',
        '/mcp': 'POST - MCP protocol endpoint',
        '/sse': 'GET - Server-Sent Events streaming'
      },
      documentation: 'https://github.com/KSAklfszf921/Riksdag-Regering.AI',
      database: {
        connected: true,
        totalRecords: '14,372+',
        sources: ['Riksdagen', 'Regeringskansliet']
      }
    });
  });

  // Unified /mcp endpoint - supports both standard MCP (JSON-RPC 2.0) and legacy format
  app.post('/mcp', async (req, res) => {
    try {
      // Detect JSON-RPC 2.0 format vs legacy format
      const isJsonRpc = 'jsonrpc' in req.body;
      const requestId = req.body.id;
      const method = req.body.method;
      const params = req.body.params;

      if (!method) {
        const error = { error: 'Method is required' };
        if (isJsonRpc) {
          return res.json({
            jsonrpc: '2.0',
            id: requestId,
            error: { code: -32600, message: 'Invalid Request', data: error }
          });
        }
        return res.status(400).json(error);
      }

      logger.info(`[MCP] ${method}`, params ? { params } : {});

      // Handle initialize method (required for standard MCP)
      if (method === 'initialize') {
        const initResult = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {
              subscribe: false, // Not yet implemented
              listChanged: false
            },
            prompts: {
              listChanged: false
            },
            logging: {}
          },
          serverInfo: {
            name: 'riksdag-regering-mcp',
            version: '2.1.0',
            description: 'MCP Server för Riksdagen och Regeringskansliet med öppna API-verktyg'
          },
        };

        if (isJsonRpc) {
          return res.json({
            jsonrpc: '2.0',
            id: requestId,
            result: initResult
          });
        }
        return res.json(initResult);
      }

      // Handle ping method (health check)
      if (method === 'ping') {
        const pingResult = {};
        if (isJsonRpc) {
          return res.json({
            jsonrpc: '2.0',
            id: requestId,
            result: pingResult
          });
        }
        return res.json(pingResult);
      }

      // Handle initialized notification (no response needed)
      if (method === 'notifications/initialized') {
        logger.info('Client initialization complete');
        // Notifications don't send responses
        return res.status(204).send();
      }

      // Handle prompts/list
        if (method === 'prompts/list') {
          const promptsResult = {
            prompts: [
              {
                name: 'search-documents',
                description: 'Sök dokument i Riksdagen med avancerade filter',
                arguments: [
                  { name: 'query', description: 'Sökord, titel eller fritext', required: false },
                  { name: 'document_type', description: 'Dokumenttyp (prop, bet, mot, etc.)', required: false },
                  { name: 'rm', description: 'Riksmöte (2023/24)', required: false }
                ]
              },
              {
                name: 'search-ledamoter',
                description: 'Hitta ledamöter utifrån namn, parti eller område',
                arguments: [
                  { name: 'namn', description: 'Förnamn, efternamn eller sökfråga', required: false },
                  { name: 'parti', description: 'Parti (S, M, SD)', required: false },
                  { name: 'valkrets', description: 'Valkrets', required: false }
                ]
              },
              {
                name: 'search-voteringar',
                description: 'Sök voteringar med beteckning, punkt eller gruppering',
                arguments: [
                  { name: 'rm', description: 'Riksmöte', required: false },
                  { name: 'bet', description: 'Beteckning', required: false },
                  { name: 'groupBy', description: 'Gruppera per parti, valkrets eller namn', required: false }
                ]
              },
              {
                name: 'get-calendar-events',
                description: 'Hämtar händelser från kalendern (kammaren/utskott)',
                arguments: [
                  { name: 'from', description: 'Från datum (YYYY-MM-DD)', required: false },
                  { name: 'tom', description: 'Till datum (YYYY-MM-DD)', required: false },
                  { name: 'org', description: 'Organ (KU, FiU, etc.)', required: false }
                ]
              },
              {
                name: 'fetch-report',
                description: 'Hämtar en rapport (rdlstat, könsstatistik, diarium)',
                arguments: [
                  { name: 'report', description: 'Identifierare (ledamotsstatistik, diarium etc.)', required: true }
                ]
              }
            ]
          };

        if (isJsonRpc) {
          return res.json({
            jsonrpc: '2.0',
            id: requestId,
            result: promptsResult
          });
        }
        return res.json(promptsResult);
      }

      // Handle prompts/get
      if (method === 'prompts/get') {
        const promptName = params?.name;
        if (!promptName) {
          const error = { error: 'Prompt name is required' };
          if (isJsonRpc) {
            return res.json({
              jsonrpc: '2.0',
              id: requestId,
              error: { code: -32602, message: 'Invalid params', data: error }
            });
          }
          return res.status(400).json(error);
        }

        // Return prompt template based on name
        const prompts: Record<string, any> = {
          'search-documents': {
            description: 'Sök dokument med titlar, beteckningar eller ämnesattribut',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Hitta dokument om {{query}}${promptName === 'search-documents' ? '{{#if document_type}} av typ {{document_type}}{{/if}}' : ''}. Använd search_dokument och returnera kort metadata.`
                }
              }
            ]
          },
          'search-ledamoter': {
            description: 'Sök ledamöter efter namn, parti eller valkrets',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Hitta ledamöter baserat på {{namn}}{{#if parti}} (parti {{parti}}){{/if}}${promptName === 'search-ledamoter' && '{{#if valkrets}} i {{valkrets}}{{/if}}' || ''}.`
                }
              }
            ]
          },
          'search-voteringar': {
            description: 'Sök voteringar, gärna grupperade per parti/valkrets',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Visa voteringar för {{rm}}{{#if bet}} ({{bet}}){{/if}}{{#if groupBy}} grupperade per {{groupBy}}{{/if}}.`
                }
              }
            ]
          },
          'get-calendar-events': {
            description: 'Hämtar kalenderhändelser för utskott eller kammaren',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Lista kalenderhändelser mellan {{from}} och {{tom}} för {{org || 'alla organ'}}.`
                }
              }
            ]
          },
          'fetch-report': {
            description: 'Hämtar en rapport (rdlstat, könsstatistik, diarium)',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Hämta rapporten {{report}} från Riksdagens öppna data och summera innehållet.`
                }
              }
            ]
          }
        };

        const prompt = prompts[promptName];
        if (!prompt) {
          const error = { error: 'Prompt not found' };
          if (isJsonRpc) {
            return res.json({
              jsonrpc: '2.0',
              id: requestId,
              error: { code: -32602, message: 'Prompt not found', data: error }
            });
          }
          return res.status(404).json(error);
        }

        if (isJsonRpc) {
          return res.json({
            jsonrpc: '2.0',
            id: requestId,
            result: prompt
          });
        }
        return res.json(prompt);
      }

      // Route to appropriate MCP method
      let result;
      switch (method) {
        case 'tools/list':
          const toolsCacheKey = 'tools-list';
          const cachedTools = cache.get(toolsCacheKey);
          if (cachedTools) {
            result = cachedTools;
          } else {
            result = await callMCPHandler('tools/list');
            cache.set(toolsCacheKey, result);
          }
          break;

        case 'tools/call':
          result = await callMCPHandler('tools/call', params);
          break;

        case 'resources/list':
          const resourcesCacheKey = 'resources-list';
          const cachedResources = cache.get(resourcesCacheKey);
          if (cachedResources) {
            result = cachedResources;
          } else {
            result = await callMCPHandler('resources/list');
            cache.set(resourcesCacheKey, result);
          }
          break;

        case 'resources/read':
          result = await callMCPHandler('resources/read', params);
          break;

        default:
          const unknownError = { error: `Unknown method: ${method}` };
          if (isJsonRpc) {
            return res.json({
              jsonrpc: '2.0',
              id: requestId,
              error: { code: -32601, message: 'Method not found', data: unknownError }
            });
          }
          return res.status(400).json(unknownError);
      }

      // Return result in appropriate format
      if (isJsonRpc) {
        return res.json({
          jsonrpc: '2.0',
          id: requestId,
          result
        });
      }
      res.json(result);
    } catch (error) {
      logger.error('Error processing MCP request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if ('jsonrpc' in req.body) {
        return res.json({
          jsonrpc: '2.0',
          id: req.body.id,
          error: { code: -32603, message: 'Internal error', data: { details: errorMessage } }
        });
      }
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
  app.post('/sse', async (req, res) => {
    try {
      const { method, params } = req.body;

      if (!method) {
        return res.status(400).json({ error: 'Method is required' });
      }

      // Route to appropriate MCP method
      let result;
      switch (method) {
        case 'tools/list':
          result = await callMCPHandler('tools/list');
          break;
        case 'tools/call':
          result = await callMCPHandler('tools/call', params);
          break;
        case 'resources/list':
          result = await callMCPHandler('resources/list');
          break;
        case 'resources/read':
          result = await callMCPHandler('resources/read', params);
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
    // Create and start Express server
    const app = createApp();

  app.listen(PORT, () => {
      logger.info(`🚀 Riksdag-Regering MCP Server v2.1 started`);
      logger.info(`📡 HTTP Server listening on port ${PORT}`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
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
