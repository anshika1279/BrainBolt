import { redis } from "@/lib/cache/redis";

// Atomic Lua script: increment and set expiry in one operation
const INCR_WITH_EXPIRY_SCRIPT = `
  local current = redis.call("INCR", KEYS[1])
  if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  end
  return current
`;

export async function rateLimit({
  key,
  max,
  windowSeconds,
}: {
  key: string;
  max: number;
  windowSeconds: number;
}) {
  // Bypass rate limiting in development for easier testing
  if (process.env.NODE_ENV === "development") {
    return { allowed: true, remaining: max };
  }

  try {
    // Namespace key to avoid collisions
    const namespacedKey = `ratelimit:${key}`;
    
    // Execute atomic Lua script: INCR + EXPIRE in single operation
    const count = (await redis.eval(
      INCR_WITH_EXPIRY_SCRIPT,
      1,
      namespacedKey,
      windowSeconds
    )) as number;

    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
    };
  } catch (err) {
    // Fail-open strategy: allow requests if Redis is down
    // This prevents Redis outage from blocking all traffic
    console.error("[RateLimit] Redis error, failing open:", err instanceof Error ? err.message : err);
    return { allowed: true, remaining: max };
  }
}
