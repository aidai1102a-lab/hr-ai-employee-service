import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MessageRole } from "@prisma/client";
import { chatModel } from "@/lib/ai/config";
import { buildRagMessages } from "@/lib/ai/rag";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  chatId: z.string().optional(),
  message: z.string().min(1).max(4000)
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const limit = rateLimit(`chat:${user.id}`);
  if (!limit.ok) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid chat payload." }, { status: 400 });

  const chat =
    body.data.chatId
      ? await prisma.chat.findFirst({ where: { id: body.data.chatId, userId: user.id } })
      : await prisma.chat.create({
          data: {
            title: body.data.message.slice(0, 40),
            userId: user.id
          }
        });

  if (!chat) return NextResponse.json({ error: "Chat not found." }, { status: 404 });

  await prisma.message.create({
    data: {
      chatId: chat.id,
      userId: user.id,
      role: MessageRole.USER,
      content: body.data.message
    }
  });

  const rag = await buildRagMessages({
    question: body.data.message,
    chatId: chat.id,
    country: user.country,
    role: user.role
  });

  await prisma.chat.update({ where: { id: chat.id }, data: { agent: rag.agent } });

  const result = streamText({
    model: chatModel,
    messages: rag.messages,
    temperature: 0.2,
    maxTokens: 1200,
    onFinish: async ({ text }) => {
      await prisma.message.create({
        data: {
          chatId: chat.id,
          role: MessageRole.ASSISTANT,
          content: text,
          citations: rag.citations,
          metadata: { agent: rag.agent, rewrittenQuery: rag.query }
        }
      });
      await prisma.chat.update({
        where: { id: chat.id },
        data: { title: chat.title === "新的 HR 咨询" ? body.data.message.slice(0, 40) : chat.title }
      });
    }
  });

  return result.toTextStreamResponse({
    headers: {
      "x-chat-id": chat.id,
      "x-citations": encodeURIComponent(JSON.stringify(rag.citations))
    }
  });
}
