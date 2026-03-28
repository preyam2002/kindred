// Simple in-memory rate limiter for API routes
// Uses sliding window counter algorithm

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULTS: RateLimitConfig = {
  windowMs: 60_000, // 1 minute
  maxRequests: 60,   // 60 requests per minute
};

export const RATE_LIMITS = {
  default: DEFAULTS,
  auth: { windowMs: 60_000, maxRequests: 10 },
  ai: { windowMs: 60_000, maxRequests: 10 },
  scrape: { windowMs: 60_000, maxRequests: 5 },
  search: { windowMs: 60_000, maxRequests: 30 },
  sync: { windowMs: 300_000, maxRequests: 5 },
} as const;

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULTS
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        ...getRateLimitHeaders(result),
      },
    }
  );
}
