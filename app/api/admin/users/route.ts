import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { hashPassword, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  country: z.string().default("CN"),
  department: z.string().optional()
});

export async function GET() {
  await requireUser([Role.ADMIN, Role.HR]);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, country: true, department: true, isActive: true, createdAt: true }
  });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  await requireUser([Role.ADMIN]);
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  const user = await prisma.user.create({
    data: {
      email: body.data.email,
      name: body.data.name,
      role: body.data.role,
      country: body.data.country,
      department: body.data.department,
      passwordHash: await hashPassword(body.data.password)
    },
    select: { id: true, email: true, name: true, role: true, country: true, department: true }
  });
  return NextResponse.json({ user });
}
