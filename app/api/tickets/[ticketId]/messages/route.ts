import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().default(false)
});

export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const user = await requireUser();
  const { ticketId } = await params;
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid message." }, { status: 400 });

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId: user.id,
      content: body.data.content,
      isInternal: body.data.isInternal
    },
    include: { author: { select: { name: true, role: true } } }
  });

  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "IN_PROGRESS" } });
  return NextResponse.json({ message });
}
