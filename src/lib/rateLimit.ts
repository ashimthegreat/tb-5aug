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
  // Only trust X-Forwarded-For / X-Real-IP when the app runs behind a trusted
  // reverse proxy (cPanel Apache/nginx). Otherwise these headers are
  // client-controlled and can be spoofed to bypass rate limits.
  if (process.env.TRUST_PROXY !== "1") {
    return "unknown";
  }
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
