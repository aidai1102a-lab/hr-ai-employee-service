import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/api/auth/login", "/api/dingtalk/webhook", "/api/dingtalk/oauth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isAsset = pathname.startsWith("/_next") || pathname.includes(".");
  if (isPublic || isAsset) return NextResponse.next();

  const hasSession = request.cookies.has("hr_ai_session");
  if (!hasSession && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
