/**
 * Cache-hjälpare för att minska onödiga API-anrop.
 * Används för att cache:a data från Riksdagen och Regeringskansliet.
 */

import NodeCache from 'node-cache';

// Default cache: 5 minuter TTL
const defaultCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 120,
  maxKeys: 1000,
});

// Långvarig cache för statisk data: 1 timme TTL
const longCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
  maxKeys: 500,
});

type Fetcher<T> = () => Promise<T>;

/**
 * Wrapper som cache:ar resultat från dyra async-funktioner.
 * Använder default cache (5 minuter TTL).
 */
export async function withCache<T>(key: string, fetcher: Fetcher<T>, ttlSeconds = 300): Promise<T> {
  const cached = defaultCache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await fetcher();
  defaultCache.set(key, result, ttlSeconds);
  return result;
}

/**
 * Cache för statisk/långvarig data (t.ex. ledamöter, partier).
 * Använder längre TTL (1 timme).
 */
export async function withLongCache<T>(key: string, fetcher: Fetcher<T>, ttlSeconds = 3600): Promise<T> {
  const cached = longCache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await fetcher();
  longCache.set(key, result, ttlSeconds);
  return result;
}

/**
 * Rensa hela cachen (används vid behov).
 */
export function clearCache(): void {
  defaultCache.flushAll();
  longCache.flushAll();
}

/**
 * Hämta cache-statistik för monitoring.
 */
export function getCacheStats() {
  return {
    default: {
      keys: defaultCache.keys().length,
      hits: defaultCache.getStats().hits,
      misses: defaultCache.getStats().misses,
    },
    long: {
      keys: longCache.keys().length,
      hits: longCache.getStats().hits,
      misses: longCache.getStats().misses,
    },
  };
}
