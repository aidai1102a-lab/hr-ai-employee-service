import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireUser([Role.ADMIN, Role.HR]);
  const [questions, activeUsers, files, feedbacks, popular] = await Promise.all([
    prisma.message.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.knowledgeFile.count({ where: { status: "READY" } }),
    prisma.feedback.groupBy({ by: ["rating"], _count: true }),
    prisma.message.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, content: true, createdAt: true }
    })
  ]);

  const trend = await prisma.$queryRawUnsafe<{ day: string; count: number }[]>(
    `SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') as day, count(*)::int as count
       FROM "Message"
      WHERE role = 'USER'
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 14`
  );

  return NextResponse.json({
    stats: {
      questions,
      activeUsers,
      files,
      satisfaction: feedbacks.length
        ? feedbacks.reduce((sum, item) => sum + item.rating * item._count, 0) / feedbacks.reduce((sum, item) => sum + item._count, 0)
        : 0
    },
    popular,
    trend: trend.reverse()
  });
}
