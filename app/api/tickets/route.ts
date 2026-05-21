import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { departmentFromQuestion, priorityFromQuestion, slaDueAt } from "@/lib/support/routing";
import { notify } from "@/lib/notifications";

const schema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(2),
  chatId: z.string().optional(),
  department: z.enum(["HR", "IT", "FINANCE", "ADMIN", "LEGAL"]).optional()
});

export async function GET() {
  const user = await requireUser();
  const supportRoles = [Role.ADMIN, Role.HR, Role.SUPPORT];
  const tickets = await prisma.supportTicket.findMany({
    where: supportRoles.includes(user.role) ? {} : { requesterId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      requester: { select: { name: true, email: true } },
      assignee: { select: { name: true, email: true } },
      _count: { select: { messages: true } }
    }
  });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid ticket." }, { status: 400 });

  const priority = priorityFromQuestion(`${body.data.title}\n${body.data.description}`);
  const ticket = await prisma.supportTicket.create({
    data: {
      title: body.data.title,
      description: body.data.description,
      department: body.data.department ?? departmentFromQuestion(body.data.description),
      priority,
      slaDueAt: slaDueAt(priority),
      requesterId: user.id,
      chatId: body.data.chatId
    },
    include: { requester: { select: { name: true, email: true } } }
  });

  await notify({
    channel: "SYSTEM",
    title: `新工单 ${ticket.title}`,
    content: `${ticket.department} / ${ticket.priority} / SLA ${ticket.slaDueAt.toLocaleString()}`,
    metadata: { ticketId: ticket.id }
  });

  if (process.env.DINGTALK_ROBOT_WEBHOOK) {
    await notify({
      channel: "DINGTALK",
      title: `新员工服务工单: ${ticket.title}`,
      content: `部门: ${ticket.department}\n优先级: ${ticket.priority}\n提交人: ${ticket.requester.name}`,
      target: process.env.DINGTALK_ROBOT_WEBHOOK,
      metadata: { ticketId: ticket.id }
    });
  }

  return NextResponse.json({ ticket });
}
