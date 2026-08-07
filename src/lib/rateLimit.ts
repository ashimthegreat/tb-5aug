import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

function prune(now: number): void {
  if (store.size > 10_000) {
    for (const [k, b] of store) {
      if (b.resetAt <= now) store.delete(k);
    }
  }
}

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now);
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (bucket.count >= max) return true;
  bucket.count += 1;
  return false;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
