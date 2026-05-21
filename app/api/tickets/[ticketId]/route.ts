import { NextResponse } from "next/server";
import { Role, TicketStatus } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional()
});

export async function GET(_: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const user = await requireUser();
  const { ticketId } = await params;
  const ticket = await prisma.supportTicket.findFirst({
    where: [Role.ADMIN, Role.HR, Role.SUPPORT].includes(user.role) ? { id: ticketId } : { id: ticketId, requesterId: user.id },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, role: true } } } },
      chat: { include: { messages: { orderBy: { createdAt: "asc" } } } }
    }
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  await requireUser([Role.ADMIN, Role.HR, Role.SUPPORT]);
  const { ticketId } = await params;
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid ticket update." }, { status: 400 });

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      ...body.data,
      resolvedAt: body.data.status === TicketStatus.RESOLVED ? new Date() : undefined
    }
  });
  return NextResponse.json({ ticket });
}
