import { leaderboardChannel } from "@/lib/db/leaderboard";
import { redis } from "@/lib/cache/redis";
import { verifyToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    verifyToken(token);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const encoder = new TextEncoder();
  const subscriber = redis.duplicate();

  await subscriber.subscribe(leaderboardChannel);

  let pingTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const push = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      push("connected", { ok: true });

      subscriber.on("message", (_channel, message) => {
        push("leaderboard", JSON.parse(message));
      });

      pingTimer = setInterval(() => {
        push("ping", { t: Date.now() });
      }, 15000);
    },
    cancel() {
      if (pingTimer) clearInterval(pingTimer);
      subscriber.disconnect();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
