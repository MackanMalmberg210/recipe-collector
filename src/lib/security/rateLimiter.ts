/**
 * In-memory sliding window rate limiter for public API routes.
 * Tracks requests by IP address or client identifier.
 */

type ClientRecord = {
  timestamps: number[];
};

const clientStore = new Map<string, ClientRecord>();

// Automatically clean up stale client records every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleRecords(now: number, maxWindowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of clientStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < maxWindowMs);
    if (record.timestamps.length === 0) {
      clientStore.delete(key);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Checks whether a given identifier has exceeded the rate limit.
 *
 * @param identifier Client identifier (typically IP address or user ID)
 * @param limit Maximum number of allowed requests within the window
 * @param windowMs Time window in milliseconds (e.g. 60_000 for 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  cleanupStaleRecords(now, windowMs);

  let record = clientStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    clientStore.set(identifier, record);
  }

  // Remove timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetTimeMs = oldest + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetTimeMs / 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Extracts client IP address from incoming Request headers.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  return "127.0.0.1";
}
