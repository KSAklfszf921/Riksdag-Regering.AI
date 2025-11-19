#!/usr/bin/env node

/**
 * MCP Server för Riksdagen och Regeringskansliet - STDIO Transport
 *
 * Denna entry point använder STDIO-transport för lokal användning med Claude Desktop.
 *
 * För remote deployment via HTTP, se server.ts
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initSupabase } from './utils/supabase.js';
import { createMCPServer } from './core/mcpServer.js';

/**
 * Starta servern med STDIO transport
 */
async function main() {
  try {
    // Initialisera Supabase
    initSupabase();

    // Skapa MCP server med gemensam konfiguration
    const server = createMCPServer();

    // Anslut med STDIO transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Riksdag-Regering MCP Server v2.0 startad (STDIO mode)');
    console.error('Använder ENDAST data från Riksdagen och Regeringskansliet');
  } catch (error) {
    console.error('Fel vid start av server:', error);
    process.exit(1);
  }
}

main();
