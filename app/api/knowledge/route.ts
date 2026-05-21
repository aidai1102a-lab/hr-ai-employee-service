import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { KnowledgeVisibility, Role, SupportDepartment } from "@prisma/client";
import { audit, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/ai/chunk";
import { extractText, fileChecksum } from "@/lib/ai/documents";
import { embedAndStoreChunks } from "@/lib/ai/rag";

export const runtime = "nodejs";

export async function GET() {
  await requireUser();
  const files = await prisma.knowledgeFile.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } }
  });
  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const user = await requireUser([Role.ADMIN, Role.HR]);
  const form = await request.formData();
  const upload = form.get("file");
  if (!(upload instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  const category = String(form.get("category") ?? "General");
  const country = String(form.get("country") ?? "GLOBAL").toUpperCase();
  const departmentRaw = String(form.get("department") ?? "HR").toUpperCase();
  const visibilityRaw = String(form.get("visibility") ?? "EMPLOYEE").toUpperCase();
  const department = Object.values(SupportDepartment).includes(departmentRaw as SupportDepartment)
    ? (departmentRaw as SupportDepartment)
    : SupportDepartment.HR;
  const visibility = Object.values(KnowledgeVisibility).includes(visibilityRaw as KnowledgeVisibility)
    ? (visibilityRaw as KnowledgeVisibility)
    : KnowledgeVisibility.EMPLOYEE;
  const tags = String(form.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const safeName = `${Date.now()}-${upload.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_")}`;
  const filePath = path.join(uploadDir, safeName);
  await fs.writeFile(filePath, Buffer.from(await upload.arrayBuffer()));

  const record = await prisma.knowledgeFile.create({
    data: {
      name: safeName,
      originalName: upload.name,
      mimeType: upload.type || "application/octet-stream",
      size: upload.size,
      path: filePath,
      category,
      country,
      department,
      visibility,
      tags,
      uploadedBy: user.id,
      checksum: await fileChecksum(filePath),
      status: "PROCESSING"
    }
  });

  try {
    const text = await extractText(filePath, record.mimeType);
    const chunks = chunkText(text);
    await embedAndStoreChunks(record.id, chunks);
    const file = await prisma.knowledgeFile.update({
      where: { id: record.id },
      data: { status: "READY" },
      include: { _count: { select: { chunks: true } } }
    });
    await audit(user.id, "UPLOAD_KNOWLEDGE", "KnowledgeFile", file.id, { chunks: chunks.length });
    return NextResponse.json({ file });
  } catch (error) {
    await prisma.knowledgeFile.update({ where: { id: record.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to process file." }, { status: 500 });
  }
}
