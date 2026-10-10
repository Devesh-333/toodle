type AttemptStore = Map<string, number[]>;
const root = globalThis as typeof globalThis & { __ideaProbeAttempts?: AttemptStore };
const attempts = root.__ideaProbeAttempts ?? new Map<string, number[]>();
root.__ideaProbeAttempts = attempts;

/** In-memory fallback for local/single-instance use; use a shared store when deploying multiple instances. */
export function checkRateLimit(ip: string, limit = 10, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  attempts.set(ip, [...recent, now]);
  if (attempts.size > 1000) {
    for (const [key, values] of attempts) {
      if (values.every((time) => now - time >= windowMs)) attempts.delete(key);
    }
  }
  return true;
}
