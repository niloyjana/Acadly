import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 5 attempts per minute per identifier (IP, or IP+email). Applied to
// login, registration, and invite-code join — see PRD §22/§26 and the
// 2026-09-13 security audit ("No rate limiting on login or registration").
//
// Requires UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Upstash free
// tier: https://console.upstash.com — create a Redis database, copy the
// REST URL + token into .env and Vercel env vars).
let ratelimit: Ratelimit | null | undefined;

function getRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — " +
        "rate limiting is DISABLED. Set these env vars before going to production."
    );
    ratelimit = null;
    return ratelimit;
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "acadly:ratelimit",
  });
  return ratelimit;
}

/**
 * Returns `{ success: false }` once the identifier has made 5 requests in
 * the last minute. Fails OPEN (always succeeds) if Upstash isn't
 * configured, so local dev without Redis still works — but this means
 * rate limiting does nothing until the env vars are set. Don't ship to
 * production without them.
 */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const rl = getRatelimit();
  if (!rl) return { success: true };
  const { success } = await rl.limit(identifier);
  return { success };
}

export function getClientIp(req: Request | { headers: Headers }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
