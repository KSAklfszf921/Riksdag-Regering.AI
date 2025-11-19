/**
 * Supabase client för MCP server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateTable } from './validation.js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialisera Supabase client
 */
export function initSupabase(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) environment variables must be set'
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

/**
 * Hämta Supabase client
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * Säker query-builder som validerar tabellnamn
 * Detta säkerställer att endast data från Riksdagen och Regeringskansliet används
 */
export function safeQuery(tableName: string) {
  // Validera att tabellen är tillåten
  validateTable(tableName);

  const client = getSupabase();
  return client.from(tableName);
}
