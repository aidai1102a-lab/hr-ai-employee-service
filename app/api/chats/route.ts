import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  const chats = await prisma.chat.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    include: { messages: { take: 1, orderBy: { createdAt: "desc" } } }
  });
  return NextResponse.json({ chats });
}

export async function POST() {
  const user = await requireUser();
  const chat = await prisma.chat.create({
    data: {
      title: "新的 HR 咨询",
      userId: user.id
    }
  });
  return NextResponse.json({ chat });
}
