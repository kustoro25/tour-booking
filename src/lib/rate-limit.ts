/**
 * Simple in-memory rate limiter.
 * For production with multiple instances, replace with Redis-based limiter.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is within rate limits.
 * Uses IP-based tracking with in-memory storage.
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // Start fresh window
    const resetAt = now + config.windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}
