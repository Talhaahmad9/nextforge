import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { ActionState } from "@/types";

// ─── Redis + Ratelimit setup ──────────────────────────────────────────────────

const hasCredentials =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

type RatelimitLike = {
  limit: (identifier: string) => Promise<{ success: boolean }>;
};

function createNoOp(name: string): RatelimitLike {
  let warned = false;
  return {
    async limit(_identifier: string) {
      if (!warned) {
        console.warn(
          `[ratelimit] ${name}: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. ` +
            "Rate limiting is disabled — running in no-op mode."
        );
        warned = true;
      }
      return { success: true };
    },
  };
}

function createRatelimit(
  requests: number,
  windowSeconds: number
): RatelimitLike {
  if (!hasCredentials) return createNoOp(`${requests}req/${windowSeconds}s`);

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
  });
}

// ─── Exported limiters ────────────────────────────────────────────────────────

/** 5 requests per 15 minutes — for login / register */
export const authRatelimit = createRatelimit(5, 15 * 60);

/** 3 requests per 10 minutes — for OTP sends */
export const otpRatelimit = createRatelimit(3, 10 * 60);

// ─── checkRateLimit helper ────────────────────────────────────────────────────

/**
 * Checks a rate limiter for the given identifier.
 * Fails open on Redis errors — infrastructure failures never block users.
 */
export async function checkRateLimit(
  limiter: RatelimitLike,
  identifier: string
): Promise<ActionState<void>> {
  try {
    const { success } = await limiter.limit(identifier);

    if (!success) {
      return {
        success: false,
        error: "Too many attempts. Please try again later.",
      };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[ratelimit] Redis error — failing open:", err);
    return { success: true, data: undefined };
  }
}
