const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (value.resetAt < now) requestCounts.delete(key);
  }
}, 300000);

/**
 * Simple in-memory IP-based rate limiter.
 * Returns { allowed, remaining } or throws nothing — just returns false when blocked.
 */
export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number,
  prefix = ""
): { allowed: boolean; remaining: number } {
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

/** Helper to get client IP from request */
export function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Helper to return 429 response */
export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}
