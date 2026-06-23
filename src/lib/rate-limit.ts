type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

export function consumeRateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
  now = Date.now(),
) {
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}
