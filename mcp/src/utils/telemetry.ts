/**
 * Enkel telemetri/loggning av MCP-anrop.
 */

interface ToolLogPayload extends Record<string, unknown> {
  tool_name: string;
  status: 'success' | 'error';
  duration_ms: number;
  error_message?: string;
  args?: Record<string, unknown>;
}

export async function logToolCall(payload: ToolLogPayload): Promise<void> {
  const entry = {
    ...payload,
    created_at: new Date().toISOString(),
  };
  // Logga till stderr så att container-plattformen kan samla upp posterna.
  console.error('[telemetry]', JSON.stringify(entry));
}

export async function logDataMiss(payload: { entity: string; identifier: string; reason?: string }): Promise<void> {
  const entry = {
    type: 'data_miss',
    ...payload,
    created_at: new Date().toISOString(),
  };
  console.warn('[telemetry:data_miss]', JSON.stringify(entry));
}
