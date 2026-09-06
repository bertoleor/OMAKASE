/**
 * Rate Limiting Utility
 * 
 * Provides rate limiting functionality for API routes.
 * Supports both in-memory (development) and Redis-based (production) implementations.
 */

import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Message to return when rate limit is exceeded */
  message?: string;
  /** Status code to return when rate limit is exceeded */
  statusCode?: number;
}

/**
 * Simple in-memory rate limiter for development/single-instance deployments.
 * Note: Does not work across multiple server instances.
 */
class InMemoryRateLimiter {
  private readonly requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup old entries every minute
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (value.resetTime < now) {
        this.requests.delete(key);
      }
    }
  }

  check(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const existing = this.requests.get(identifier);

    if (!existing || existing.resetTime < now) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (existing.count >= limit) {
      return false;
    }

    existing.count++;
    return true;
  }

  getRetryAfter(identifier: string): number {
    const existing = this.requests.get(identifier);
    if (!existing) return 0;
    return Math.max(0, Math.ceil((existing.resetTime - Date.now()) / 1000));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton for in-memory rate limiter
let rateLimiterInstance: InMemoryRateLimiter | null = null;

function getRateLimiter(): InMemoryRateLimiter {
  rateLimiterInstance ??= new InMemoryRateLimiter();
  return rateLimiterInstance;
}

/*
 * The InMemoryRateLimiter is a single-instance, in-process store: counters reset on
 * restart and are not shared across server instances. A Redis-backed limiter behind
 * the same checkRateLimit signature is deferred to ops slice D (env-driven backend).
 */
export interface RateLimitCheckConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfter: number;
}

export function checkRateLimit(
  key: string,
  cfg: RateLimitCheckConfig,
): RateLimitCheckResult {
  const limiter = getRateLimiter();
  const allowed = limiter.check(key, cfg.limit, cfg.windowMs);
  return { allowed, retryAfter: limiter.getRetryAfter(key) };
}

/**
 * Creates a rate limiting middleware for API routes.
 * 
 * @param config - Rate limit configuration
 * @returns Middleware function for Next.js API routes
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    limit,
    windowMs,
    message = "Too many requests, please try again later.",
    statusCode = 429,
  } = config;

  return async function rateLimitMiddleware(
    request: NextRequest
  ): Promise<NextResponse | null> {
    // Get client identifier (IP address or user ID)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    
    const userAgent = request.headers.get("user-agent") ?? "";
    const identifier = `${ip}:${userAgent.slice(0, 50)}`;

    const limiter = getRateLimiter();
    const allowed = limiter.check(identifier, limit, windowMs);

    if (!allowed) {
      const retryAfter = limiter.getRetryAfter(identifier);
      return new NextResponse(JSON.stringify({ error: message }), {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": (Date.now() + windowMs).toString(),
        },
      });
    }

    // Return null to indicate request should proceed
    return null;
  };
}

/**
 * Pre-configured rate limiters for common use cases.
 */
export const rateLimiters = {
  /** Strict: 5 requests per minute - for authentication endpoints */
  strict: rateLimit({
    limit: 5,
    windowMs: 60 * 1000,
    message: "Too many attempts. Please wait before trying again.",
  }),

  /** Standard: 20 requests per minute - for general API endpoints */
  standard: rateLimit({
    limit: 20,
    windowMs: 60 * 1000,
    message: "Too many requests. Please slow down.",
  }),

  /** Relaxed: 100 requests per minute - for data fetching endpoints */
  relaxed: rateLimit({
    limit: 100,
    windowMs: 60 * 1000,
  }),

  /** Email: 3 requests per 5 minutes - for sending emails */
  email: rateLimit({
    limit: 3,
    windowMs: 5 * 60 * 1000,
    message: "Too many emails sent. Please wait before sending more.",
  }),
};

/**
 * Helper to add rate limit headers to successful responses.
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number = limit - 1
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", (Date.now() + 60 * 1000).toString());
  return response;
}
