/**
 * Response Safety Utilities
 *
 * Förhindrar för stora responses som kan orsaka timeout, memory issues,
 * eller DOS av LLM-klienter.
 *
 * Följer MCP best practices för cross-platform kompatibilitet.
 */

import { logger } from './logger.js';

/**
 * Maximum response sizes
 */
export const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB total JSON size
export const MAX_ITEMS_DEFAULT = 500; // Default array limit
export const MAX_ITEMS_ABSOLUTE = 2000; // Hard limit
export const MAX_STRING_LENGTH = 100_000; // För enskilda strings

/**
 * Response size validation error
 */
export class ResponseTooLargeError extends Error {
  constructor(
    public actualSize: number,
    public maxSize: number,
    public suggestion?: string
  ) {
    super(`Response too large: ${actualSize} bytes (max: ${maxSize} bytes)`);
    this.name = 'ResponseTooLargeError';
  }
}

/**
 * Validate response size before returning to client
 */
export function validateResponseSize(data: any): void {
  const jsonString = JSON.stringify(data);
  const size = Buffer.byteLength(jsonString, 'utf8');

  if (size > MAX_RESPONSE_SIZE) {
    logger?.warn('Response too large', {
      size,
      maxSize: MAX_RESPONSE_SIZE,
      dataType: typeof data,
    });

    throw new ResponseTooLargeError(
      size,
      MAX_RESPONSE_SIZE,
      'Consider using pagination, filtering, or requesting fewer fields'
    );
  }
}

/**
 * Truncate array to prevent oversized responses
 */
export function truncateArray<T>(
  items: T[],
  maxItems: number = MAX_ITEMS_DEFAULT,
  options?: {
    warningMessage?: string;
    includeMetadata?: boolean;
  }
): {
  items: T[];
  truncated: boolean;
  originalCount: number;
  metadata?: {
    limit: number;
    suggestion: string;
  };
} {
  const originalCount = items.length;
  const truncated = originalCount > maxItems;

  if (truncated) {
    logger?.info('Array truncated', {
      originalCount,
      maxItems,
      message: options?.warningMessage,
    });
  }

  const result: any = {
    items: items.slice(0, maxItems),
    truncated,
    originalCount,
  };

  if (options?.includeMetadata && truncated) {
    result.metadata = {
      limit: maxItems,
      suggestion: `Use pagination parameters to retrieve more results. Total available: ${originalCount}`,
    };
  }

  return result;
}

/**
 * Safe truncate string
 */
export function truncateString(
  str: string,
  maxLength: number = MAX_STRING_LENGTH
): { value: string; truncated: boolean } {
  if (str.length <= maxLength) {
    return { value: str, truncated: false };
  }

  return {
    value: str.substring(0, maxLength) + '... [TRUNCATED]',
    truncated: true,
  };
}

/**
 * Validate and sanitize tool response
 *
 * Ensures response follows MCP best practices:
 * - Size limits
 * - Proper structure
 * - Error handling
 */
export function sanitizeToolResponse(
  data: any,
  options?: {
    maxItems?: number;
    truncateStrings?: boolean;
  }
): any {
  // Handle arrays
  if (Array.isArray(data)) {
    const result = truncateArray(data, options?.maxItems, {
      includeMetadata: true,
    });

    // Validate final size
    validateResponseSize(result);

    return result;
  }

  // Handle objects with array properties
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        sanitized[key] = truncateArray(value, options?.maxItems).items;
      } else if (
        typeof value === 'string' &&
        options?.truncateStrings &&
        value.length > MAX_STRING_LENGTH
      ) {
        sanitized[key] = truncateString(value).value;
      } else {
        sanitized[key] = value;
      }
    }

    // Validate final size
    validateResponseSize(sanitized);

    return sanitized;
  }

  // Validate primitives
  validateResponseSize(data);

  return data;
}

/**
 * Create a safe error response for MCP clients
 *
 * Follows MCP error format specification
 */
export function createSafeErrorResponse(
  error: Error,
  toolName?: string,
  context?: Record<string, any>
): {
  code: number;
  message: string;
  data?: {
    tool?: string;
    reason: string;
    hint?: string;
    documentation?: string;
    context?: Record<string, any>;
  };
} {
  // Map common errors to JSON-RPC error codes
  let code = -32603; // Internal error

  if (error instanceof ResponseTooLargeError) {
    code = -32000; // Server error
  } else if (error.name === 'ZodError') {
    code = -32602; // Invalid params
  } else if (error.message.includes('not found') || error.message.includes('404')) {
    code = -32001; // Resource not found
  } else if (error.message.includes('rate limit') || error.message.includes('429')) {
    code = -32002; // Rate limit exceeded
  }

  const response: any = {
    code,
    message: error.message,
  };

  // Add detailed error data
  if (toolName || context) {
    response.data = {
      ...(toolName && { tool: toolName }),
      reason: error.message,
      ...(error instanceof ResponseTooLargeError && {
        hint: error.suggestion || 'Use pagination or filtering to reduce response size',
      }),
      ...(context && { context }),
    };
  }

  return response;
}

/**
 * Batch process large datasets safely
 *
 * Processes items in batches to avoid memory issues
 */
export async function processBatchSafe<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options?: {
    batchSize?: number;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<R[]> {
  const batchSize = options?.batchSize || 100;
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    if (options?.onProgress) {
      options.onProgress(Math.min(i + batchSize, items.length), items.length);
    }
  }

  return results;
}
