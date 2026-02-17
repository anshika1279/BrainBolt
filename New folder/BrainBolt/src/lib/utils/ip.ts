/**
 * Extract client IP from request headers.
 * Checks multiple header sources for compatibility with various proxy setups.
 */
export function getClientIp(request: Request): string {
  // Check X-Forwarded-For (most common with proxies)
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Take the first IP if there are multiple
    return xForwardedFor.split(",")[0].trim();
  }

  // Check Cloudflare
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Check X-Real-IP (nginx, Apache)
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback for local development or unknown setups
  return "127.0.0.1";
}
