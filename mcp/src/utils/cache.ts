/**
 * Enkel cache-hjälpare för att slippa duplicerade Supabase-anrop.
 */

import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
});

type Fetcher<T> = () => Promise<T>;

/**
 * Wrapper som cache:ar resultat från dyra async-funktioner.
 */
export async function withCache<T>(key: string, fetcher: Fetcher<T>, ttlSeconds = 60): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await fetcher();
  cache.set(key, result, ttlSeconds);
  return result;
}
