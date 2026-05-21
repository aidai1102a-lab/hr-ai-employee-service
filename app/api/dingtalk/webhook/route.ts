import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { MessageRole, Role } from "@prisma/client";
import { chatModel } from "@/lib/ai/config";
import { buildRagMessages } from "@/lib/ai/rag";
import { sendDingTalkRobotMessage, type DingTalkIncomingMessage, verifyDingTalkToken } from "@/lib/integrations/dingtalk";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifyDingTalkToken(request.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  const payload = (await request.json()) as DingTalkIncomingMessage;
  const question = payload.text?.content?.replace(/@\S+/g, "").trim();
  if (!question) return NextResponse.json({ ok: true });

  const email = `${payload.senderStaffId ?? payload.senderNick ?? "dingtalk"}@dingtalk.local`;
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: payload.senderNick ?? "DingTalk User" },
    create: {
      email,
      name: payload.senderNick ?? "DingTalk User",
      passwordHash: "DINGTALK_OAUTH_ONLY",
      role: Role.EMPLOYEE,
      country: "CN"
    }
  });

  const chat = await prisma.chat.create({
    data: { userId: user.id, title: question.slice(0, 40) }
  });
  await prisma.message.create({ data: { chatId: chat.id, userId: user.id, role: MessageRole.USER, content: question } });

  const rag = await buildRagMessages({ question, chatId: chat.id, country: user.country, role: user.role });
  const answer = await generateText({ model: chatModel, messages: rag.messages, temperature: 0.2, maxTokens: 900 });

  await prisma.message.create({
    data: {
      chatId: chat.id,
      role: MessageRole.ASSISTANT,
      content: answer.text,
      citations: rag.citations,
      metadata: { channel: "dingtalk", agent: rag.agent }
    }
  });

  const citations = rag.citations.slice(0, 3).map((item, index) => `${index + 1}. ${item.fileName}`).join("\n");
  await sendDingTalkRobotMessage({
    webhook: payload.sessionWebhook,
    text: `${answer.text}\n\n${citations ? `**来源**\n${citations}\n\n` : ""}[转人工](${process.env.APP_URL}/tickets?chatId=${chat.id})`
  });

  return NextResponse.json({ ok: true });
}
