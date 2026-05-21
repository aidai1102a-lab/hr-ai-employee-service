import path from "node:path";
import { prisma } from "@/lib/prisma";
import { extractText } from "@/lib/ai/documents";
import { chunkText } from "@/lib/ai/chunk";
import { embedAndStoreChunks } from "@/lib/ai/rag";

async function main() {
  const fileId = process.argv[2];
  if (!fileId) throw new Error("Usage: npm run ingest <knowledgeFileId>");

  const file = await prisma.knowledgeFile.update({
    where: { id: fileId },
    data: { status: "PROCESSING" }
  });

  try {
    const text = await extractText(path.resolve(file.path), file.mimeType);
    const chunks = chunkText(text);
    await prisma.knowledgeChunk.deleteMany({ where: { fileId } });
    await embedAndStoreChunks(fileId, chunks);
    await prisma.knowledgeFile.update({ where: { id: fileId }, data: { status: "READY" } });
  } catch (error) {
    await prisma.knowledgeFile.update({ where: { id: fileId }, data: { status: "FAILED" } });
    throw error;
  }
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

