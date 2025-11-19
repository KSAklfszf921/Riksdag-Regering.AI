/**
 * Supabase client för MCP server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';


let supabaseClient: SupabaseClient | null = null;

/**
 * Initialisera Supabase client med connection pooling
 */
export function initSupabase(): SupabaseClient {
  const supabaseUrl = config.supabase.url;
  const supabaseKey = config.supabase.anonKey || config.supabase.serviceRoleKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) environment variables must be set'
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Server-side, no session persistence
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'riksdag-regering-mcp',
        },
      },
    });

    logger.info('Supabase client initialized');
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

}
