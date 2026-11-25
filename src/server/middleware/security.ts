import type { NextFunction, Request, Response } from 'express';
import {
  isValidCoordinate,
  sanitizePlainText,
  sanitizePromptInput,
} from '../../shared/validation.ts';

export { isValidCoordinate, sanitizePromptInput, sanitizePlainText as sanitizeUserText };

/**
 * Sets secure HTTP response headers across all Express routes.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

/**
 * Returns clean JSON 400 when a request body contains malformed JSON.
 */
export function jsonSyntaxErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    res.status(400).json({ error: 'Malformed JSON request payload.' });
    return;
  }
  next(err);
}

interface RateBucket {
  count: number;
  resetAt: number;
}

/**
 * Creates a bounded sliding-window rate limiter by client IP + route group.
 * Automatically prunes expired buckets to avoid unbounded memory growth.
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  maxBuckets?: number;
}) {
  const buckets = new Map<string, RateBucket>();
  const maxBuckets = options.maxBuckets ?? 2000;

  const pruneExpired = (now: number) => {
    for (const [k, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(k);
      }
    }
    if (buckets.size > maxBuckets) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey) buckets.delete(oldestKey);
    }
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();

    if (buckets.size >= maxBuckets) {
      pruneExpired(now);
    }

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.maxRequests - 1)));
      next();
      return;
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({
        error: 'Rate limit exceeded. Please wait briefly before making another request.',
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    existing.count += 1;
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.maxRequests - existing.count)));
    next();
  };
}
