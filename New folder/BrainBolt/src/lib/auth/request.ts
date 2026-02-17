import { headers } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";

export async function getUserIdFromRequest() {
  const headerList = await headers();
  const authHeader = headerList.get("authorization");

  // Strict Bearer token validation (not just any prefix)
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  // Extract token: "Bearer <token>" → "<token>"
  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}
