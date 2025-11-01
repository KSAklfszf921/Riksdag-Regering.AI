import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import { API_CONFIG } from '@/config/api';

/**
 * Rate Limiting Utilities
 * Provides client-side rate limiting, debouncing, and throttling
 */

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: number[] = [];
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  /**
   * Check if a request is allowed under the rate limit
   */
  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Remove old requests outside the time window
    this.requests = this.requests.filter((time) => time > windowStart);

    // Check if we're under the limit
    if (this.requests.length < this.options.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  /**
   * Get the time until the next request is allowed
   */
  getTimeUntilNextRequest(): number {
    if (this.requests.length === 0) return 0;

    const now = Date.now();
    const oldestRequest = this.requests[0];
    const windowStart = oldestRequest + this.options.windowMs;

    return Math.max(0, windowStart - now);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

// Create a global rate limiter instance
export const globalRateLimiter = new RateLimiter({
  maxRequests: API_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE,
  windowMs: 60000, // 1 minute
});

/**
 * Higher-order function that wraps an async function with rate limiting
 */
export const withRateLimit = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  rateLimiter: RateLimiter = globalRateLimiter
): T => {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!rateLimiter.isAllowed()) {
      const waitTime = rateLimiter.getTimeUntilNextRequest();
      throw new Error(
        `För många förfrågningar. Försök igen om ${Math.ceil(waitTime / 1000)} sekunder.`
      );
    }

    return fn(...args);
  }) as T;
};

/**
 * Create a debounced function (useful for search inputs)
 * Delays execution until after wait milliseconds have elapsed since the last invocation
 */
export const createDebounced = <T extends (...args: any[]) => any>(
  fn: T,
  wait: number = API_CONFIG.RATE_LIMIT.DEBOUNCE_MS
): T & { cancel: () => void; flush: () => void } => {
  return debounce(fn, wait);
};

/**
 * Create a throttled function (useful for scroll/resize handlers)
 * Executes at most once per every wait milliseconds
 */
export const createThrottled = <T extends (...args: any[]) => any>(
  fn: T,
  wait: number = API_CONFIG.RATE_LIMIT.THROTTLE_MS
): T & { cancel: () => void; flush: () => void } => {
  return throttle(fn, wait);
};

/**
 * Hook to create a debounced callback
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = API_CONFIG.RATE_LIMIT.DEBOUNCE_MS
) => {
  return createDebounced(callback, delay);
};

/**
 * Hook to create a throttled callback
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = API_CONFIG.RATE_LIMIT.THROTTLE_MS
) => {
  return createThrottled(callback, delay);
};

/**
 * Request queue for managing multiple API calls
 */
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrentLimit: number;

  constructor(concurrentLimit = 3) {
    this.concurrentLimit = concurrentLimit;
  }

  /**
   * Add a request to the queue
   */
  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  /**
   * Process the queue
   */
  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrentLimit);
      await Promise.all(batch.map((fn) => fn()));
    }

    this.processing = false;
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
  }

  /**
   * Get queue length
   */
  get length() {
    return this.queue.length;
  }
}

// Export a global request queue
export const globalRequestQueue = new RequestQueue(3);
