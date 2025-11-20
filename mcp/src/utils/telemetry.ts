/**
 * Enkel telemetri/loggning av MCP-anrop.
 */

import { getSupabase } from './supabase.js';

interface LogPayload {
  tool_name: string;
  status: 'success' | 'error';
  duration_ms: number;
  error_message?: string;
  args?: Record<string, unknown>;
}

/**
 * Försök skriva ett logg-event till admin_activity_log (ignorerar fel).
 */
export async function logToolCall(payload: LogPayload): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('admin_activity_log').insert({
      action: 'mcp_tool_call',
      metadata: payload,
    });
  } catch (error) {
    // Felsäkert: skriv bara till stderr om loggtabellen saknas eller RLS blockerar.
    console.warn('Kunde inte logga MCP-anrop:', (error as Error).message);
  }
}
