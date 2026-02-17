import { NextResponse } from "next/server";
import { z } from "zod";
import { signToken } from "@/lib/auth/jwt";

const schema = z.object({
  userId: z.string().min(3),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const token = signToken(parsed.data.userId);
  return NextResponse.json({ token });
}
