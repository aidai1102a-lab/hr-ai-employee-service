import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limit = rateLimit(`login:${ip}`);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid login payload." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: body.data.email } });
  if (!user || !user.isActive || !(await verifyPassword(body.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    country: user.country
  };
  const token = await createSession(sessionUser);
  await setSessionCookie(token);
  return NextResponse.json({ user: sessionUser });
}
