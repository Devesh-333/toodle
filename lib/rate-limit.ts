type AttemptStore = Map<string, number[]>;
const root = globalThis as typeof globalThis & { __doodleAttempts?: AttemptStore };
const attempts = root.__doodleAttempts ?? new Map<string, number[]>();
root.__doodleAttempts = attempts;
// Clear any stale local blocks immediately
attempts.clear();

/** In-memory fallback for local/single-instance use; use a shared store when deploying multiple instances. */
export function checkRateLimit(ip: string, limit = 60, windowMs = 60 * 60 * 1000): boolean {
  // Always allow local development, test runners, and loopback/internal addresses
  if (
    process.env.NODE_ENV !== "production" ||
    ip === "unknown" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip === "::ffff:127.0.0.1"
  ) {
    return true;
  }

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

export function resetRateLimit(): void {
  attempts.clear();
}

