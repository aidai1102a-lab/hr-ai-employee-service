import { generateText } from "ai";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { chatModel } from "@/lib/ai/config";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  await requireUser([Role.ADMIN, Role.HR]);
  const { type = "WEEKLY" } = await request.json().catch(() => ({ type: "WEEKLY" }));
  const report = await prisma.aiReport.create({
    data: { type, title: `${type === "MONTHLY" ? "月报" : "周报"} - 员工服务 AI`, status: "RUNNING" }
  });

  const [questions, tickets, feedbacks] = await Promise.all([
    prisma.message.findMany({ where: { role: "USER" }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
  ]);

  const result = await generateText({
    model: chatModel,
    system: "你是企业员工服务数据分析专家。生成结构化中文报告，包含热门问题、AI解决率、转人工、部门趋势、满意度、知识库缺口和下周行动建议。",
    prompt: JSON.stringify({ questions, tickets, feedbacks }).slice(0, 24000)
  });

  const updated = await prisma.aiReport.update({
    where: { id: report.id },
    data: {
      status: "READY",
      summary: result.text,
      metrics: { questions: questions.length, tickets: tickets.length, feedbacks: feedbacks.length }
    }
  });

  return NextResponse.json({ report: updated });
}
