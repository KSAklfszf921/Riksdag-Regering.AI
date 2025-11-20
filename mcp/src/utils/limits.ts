/**
 * Gemensamma gränser och helper för antal poster i MCP-verktygen
 */

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

/**
 * Normalisera ett limit-värde så att det alltid ligger inom [1, MAX_LIMIT]
 * och har ett vettigt standardvärde.
 */
export function resolveLimit(requested?: number, fallback: number = DEFAULT_LIMIT): number {
  const base = typeof requested === 'number' ? requested : fallback;
  if (!Number.isFinite(base) || base <= 0) {
    return fallback;
  }

  const normalized = Math.floor(base);
  return Math.min(Math.max(normalized, 1), MAX_LIMIT);
}
