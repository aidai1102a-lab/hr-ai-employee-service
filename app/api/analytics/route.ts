import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireUser([Role.ADMIN, Role.HR, Role.SUPPORT]);
  const [questionCount, tickets, unresolved, slaOverdue, feedbackAvg, byDepartment, failures] = await Promise.all([
    prisma.message.count({ where: { role: "USER" } }),
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] }, slaDueAt: { lt: new Date() } } }),
    prisma.feedback.aggregate({ _avg: { stars: true, rating: true } }),
    prisma.supportTicket.groupBy({ by: ["department"], _count: true }),
    prisma.message.findMany({
      where: { role: "ASSISTANT", content: { contains: "当前知识库没有足够信息" } },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  const handoffRate = questionCount ? tickets / questionCount : 0;
  return NextResponse.json({
    metrics: {
      questionCount,
      ticketCount: tickets,
      unresolved,
      slaOverdue,
      handoffRate,
      aiResolutionRate: 1 - handoffRate,
      satisfaction: feedbackAvg._avg.stars ?? feedbackAvg._avg.rating ?? 0
    },
    byDepartment,
    failures
  });
}
