import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const cookieName = "hr_ai_session";
const encoder = new TextEncoder();

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 24) {
    throw new Error("JWT_SECRET must be set to at least 24 characters.");
  }
  return encoder.encode(value);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  country: string;
};

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function createSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function getSessionFromToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const jar = await cookies();
  return getSessionFromToken(jar.get(cookieName)?.value);
}

export async function getRequestUser(request: NextRequest) {
  return getSessionFromToken(request.cookies.get(cookieName)?.value);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(cookieName);
}

export function can(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}

export async function requireUser(allowed?: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (allowed && !can(user.role, allowed)) throw new Error("FORBIDDEN");
  return user;
}

export async function audit(userId: string | undefined, action: string, entity: string, entityId?: string, metadata?: unknown) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      metadata: metadata as object
    }
  });
}
