/**
 * Helper functions for API response normalization
 * Handles single object vs array responses from Riksdagen API
 */

export interface PaginatedResponse<T> {
  data: T[];
  hits: number;
  page: number;
  hasMore: boolean;
  nextPage?: string;
}

/**
 * Normalize API response based on antal/hits
 * Riksdagen API returns different structures:
 * - @antal='0' → no data
 * - @antal='1' → single object (NOT array!)
 * - @antal='2+' → array of objects
 */
export function normalizeApiResponse(
  data: any,
  listKey: string
): any[] {
  const list = data[listKey];

  if (!list) return [];

  const hits = parseInt(list['@antal'] || list['@hits'] || '0');

  if (hits === 0) {
    return [];
  }

  if (hits === 1) {
    // Single object → convert to array
    const itemKey = listKey.replace('lista', '');
    const singleItem = list[itemKey];
    return singleItem ? [singleItem] : [];
  }

  // Array of objects
  const itemKey = listKey.replace('lista', '');
  return list[itemKey] || [];
}

/**
 * Extract pagination metadata from API response
 */
export function extractPaginationMeta(data: any, listKey: string): {
  hits: number;
  page: number;
  hasMore: boolean;
  nextPage?: string;
} {
  const list = data[listKey];

  if (!list) {
    return { hits: 0, page: 1, hasMore: false };
  }

  const hits = parseInt(list['@hits'] || list['@antal'] || '0');
  const page = parseInt(list['@sida'] || '1');
  const nextPage = list['@nasta_sida'];

  return {
    hits,
    page,
    hasMore: nextPage !== undefined && nextPage !== '',
    nextPage,
  };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: any,
  listKey: string
): PaginatedResponse<T> {
  const items = normalizeApiResponse(data, listKey);
  const meta = extractPaginationMeta(data, listKey);

  return {
    data: items as T[],
    ...meta,
  };
}

/**
 * Fetch all pages from a paginated endpoint
 * WARNING: Can be slow for large datasets!
 */
export async function fetchAllPages<T>(
  fetchFn: (page: number) => Promise<PaginatedResponse<T>>,
  maxPages: number = 100,
  delayMs: number = 100
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (page <= maxPages) {
    const response = await fetchFn(page);
    results.push(...response.data);

    if (!response.hasMore) break;
    page++;

    // Rate limiting delay
    if (page <= maxPages) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * URL-encode riksmöte (1990/91 → 1990%2F91)
 */
export function encodeRiksmote(rm: string): string {
  return rm.replace('/', '%2F');
}

/**
 * Decode URL-encoded riksmöte (1990%2F91 → 1990/91)
 */
export function decodeRiksmote(rm: string): string {
  return rm.replace('%2F', '/');
}

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  }

  return queryParams.toString();
}

/**
 * Error types from Riksdagen API
 */
export class RiksdagenApiError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    public url: string
  ) {
    super(`Riksdagen API error: ${statusCode} ${statusText} (${url})`);
    this.name = 'RiksdagenApiError';
  }
}

/**
 * Safe API fetch with error handling and retry logic
 */
export async function safeFetch(
  url: string,
  headers?: Record<string, string>,
  maxRetries: number = 3
): Promise<any> {
  const defaultHeaders = {
    'User-Agent': 'riksdag-regering-mcp/2.1',
    Accept: 'application/json',
    ...headers,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { headers: defaultHeaders });

      if (!response.ok) {
        // Don't retry on client errors (4xx), only server errors (5xx) and network errors
        if (response.status >= 400 && response.status < 500) {
          throw new RiksdagenApiError(response.status, response.statusText, url);
        }

        // Server error - retry with backoff
        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        throw new RiksdagenApiError(response.status, response.statusText, url);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      // Don't retry RiksdagenApiError with 4xx status codes
      if (error instanceof RiksdagenApiError && error.statusCode < 500) {
        throw error;
      }

      // Retry on network errors
      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries + 1} attempts`);
}
