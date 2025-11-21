#!/usr/bin/env node
import fetch from 'node-fetch';

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/mcp';
const API_KEY = process.env.API_KEY;

const call = async (method, params) => {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  const body = await res.text();
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
};

const run = async () => {
  console.log('Testing search_voteringar...');
  console.log(await call('tools/call', {
    name: 'search_voteringar',
    arguments: { rm: '2025/26', bet: 'AU4', limit: 1 },
  }));

  console.log('Testing get_calendar_events...');
  console.log(await call('tools/call', {
    name: 'get_calendar_events',
    arguments: { from: '2025-11-21', tom: '2025-11-22', akt: 'vo', org: 'kamm' },
  }));

  console.log('Testing fetch_report...');
  console.log(await call('tools/call', {
    name: 'fetch_report',
    arguments: { report: 'ledamotsstatistik', limit: 1 },
  }));
};

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
