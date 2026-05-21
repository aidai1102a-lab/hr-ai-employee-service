import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  messageId: z.string(),
  rating: z.number().int().min(-1).max(1),
  stars: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional()
});

export async function POST(request: Request) {
  const user = await requireUser();
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });

  const feedback = await prisma.feedback.upsert({
    where: { messageId: body.data.messageId },
    update: { rating: body.data.rating, stars: body.data.stars, comment: body.data.comment },
    create: {
      messageId: body.data.messageId,
      userId: user.id,
      rating: body.data.rating,
      stars: body.data.stars,
      comment: body.data.comment
    }
  });

  return NextResponse.json({ feedback });
}
