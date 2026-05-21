import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { audit, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const user = await requireUser([Role.ADMIN, Role.HR]);
  const { fileId } = await params;
  await prisma.knowledgeFile.delete({ where: { id: fileId } });
  await audit(user.id, "DELETE_KNOWLEDGE", "KnowledgeFile", fileId);
  return NextResponse.json({ ok: true });
}
