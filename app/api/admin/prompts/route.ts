import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  key: z.string().min(2),
  name: z.string().min(2),
  content: z.string().min(20),
  country: z.string().default("GLOBAL")
});

export async function GET() {
  await requireUser([Role.ADMIN, Role.HR]);
  const prompts = await prisma.prompt.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ prompts });
}

export async function POST(request: Request) {
  await requireUser([Role.ADMIN]);
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid prompt." }, { status: 400 });
  const prompt = await prisma.prompt.upsert({
    where: { key: body.data.key },
    update: body.data,
    create: body.data
  });
  return NextResponse.json({ prompt });
}
