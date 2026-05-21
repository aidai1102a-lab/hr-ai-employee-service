import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ chatId: string }> }) {
  const user = await requireUser();
  const { chatId } = await params;
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });
  if (!chat) return NextResponse.json({ error: "Chat not found." }, { status: 404 });
  return NextResponse.json({ chat });
}
