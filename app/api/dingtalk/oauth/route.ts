import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { createSession, setSessionCookie } from "@/lib/auth";
import { exchangeDingTalkOAuthCode } from "@/lib/integrations/dingtalk";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing DingTalk code." }, { status: 400 });

  const profile = await exchangeDingTalkOAuthCode(code);
  const account = await prisma.dingTalkAccount.upsert({
    where: { unionId: profile.unionId },
    update: { openId: profile.openId, nick: profile.nick },
    create: { unionId: profile.unionId, openId: profile.openId, nick: profile.nick }
  });

  const user =
    account.userId
      ? await prisma.user.findUniqueOrThrow({ where: { id: account.userId } })
      : await prisma.user.create({
          data: {
            email: `${profile.unionId}@dingtalk.local`,
            name: profile.nick ?? "DingTalk User",
            passwordHash: "DINGTALK_OAUTH_ONLY",
            role: Role.EMPLOYEE,
            country: "CN",
            dingTalkAccount: { connect: { id: account.id } }
          }
        });

  const token = await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, country: user.country });
  await setSessionCookie(token);
  return NextResponse.redirect(new URL("/", request.url));
}
