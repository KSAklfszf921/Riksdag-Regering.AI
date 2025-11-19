/**
 * Supabase client för MCP server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { logger } from './logger.js';
import { databaseError } from './errors.js';

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
 * Retry logic för databas-operationer
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 4,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // Table doesn't exist or similar structural errors
        throw databaseError(error.message, error);
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`Database operation failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries,
          error: error.message,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logger.error('Database operation failed after all retries', {
    error: lastError?.message,
  });

  throw databaseError('Operation failed after multiple retries', lastError);
}

/**
 * Health check för Supabase connection
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('riksdagen_ledamoter').select('count').limit(1);

    if (error) {
      logger.error('Supabase health check failed', { error: error.message });
      return false;
    }

    return true;
  } catch (error: any) {
    logger.error('Supabase health check error', { error: error.message });
    return false;
  }
}
