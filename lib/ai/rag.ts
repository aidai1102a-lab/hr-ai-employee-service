import { embed, embedMany, generateText, type CoreMessage } from "ai";
import { AgentType, MessageRole, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { embeddingModel, fastModel, embeddingModelName } from "@/lib/ai/config";
import { agentLabel, routeAgent } from "@/lib/ai/agents";

export type Citation = {
  fileId: string;
  fileName: string;
  chunkId: string;
  category: string;
  country: string;
  score: number;
  preview: string;
};

type RetrievedChunk = {
  chunk_id: string;
  content: string;
  file_id: string;
  file_name: string;
  category: string;
  country: string;
  distance: number;
};

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

export async function embedAndStoreChunks(fileId: string, chunks: { content: string; tokenCount: number }[]) {
  if (chunks.length === 0) return;
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks.map((chunk) => chunk.content)
  });

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = await prisma.knowledgeChunk.create({
      data: {
        fileId,
        content: chunks[index].content,
        tokenCount: chunks[index].tokenCount,
        chunkIndex: index
      }
    });

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Embedding" ("id", "model", "vector", "chunkId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2::vector, $3, now())`,
      embeddingModelName,
      vectorLiteral(embeddings[index]),
      chunk.id
    );
  }
}

export async function rewriteQuery(question: string, history: CoreMessage[]) {
  const recent = history.slice(-6).map((message) => `${message.role}: ${message.content}`).join("\n");
  const result = await generateText({
    model: fastModel,
    system: "Rewrite the user's HR question into a concise bilingual semantic search query. Preserve country, policy type, dates, and employee context. Return only the query.",
    prompt: `Conversation:\n${recent}\n\nQuestion:\n${question}`
  });
  return result.text.trim() || question;
}

export async function retrieveContext(query: string, options: { country?: string; topK?: number }) {
  const { embedding } = await embed({
    model: embeddingModel,
    value: query
  });

  const topK = options.topK ?? 6;
  const country = options.country ?? "GLOBAL";
  const rows = await prisma.$queryRawUnsafe<RetrievedChunk[]>(
    `SELECT kc.id as chunk_id,
            kc.content,
            kf.id as file_id,
            kf."originalName" as file_name,
            kf.category,
            kf.country,
            (e.vector <=> $1::vector) as distance
       FROM "Embedding" e
       JOIN "KnowledgeChunk" kc ON kc.id = e."chunkId"
       JOIN "KnowledgeFile" kf ON kf.id = kc."fileId"
      WHERE kf.status = 'READY'
        AND (kf.country = $2 OR kf.country = 'GLOBAL')
      ORDER BY e.vector <=> $1::vector
      LIMIT $3`,
    vectorLiteral(embedding),
    country,
    topK
  );

  const citations: Citation[] = rows.map((row) => ({
    fileId: row.file_id,
    fileName: row.file_name,
    chunkId: row.chunk_id,
    category: row.category,
    country: row.country,
    score: Number((1 - row.distance).toFixed(4)),
    preview: row.content.slice(0, 220)
  }));

  const context = rows
    .map((row, index) => `[${index + 1}] ${row.file_name} / ${row.category} / ${row.country}\n${row.content}`)
    .join("\n\n---\n\n");

  return { context, citations };
}

function visibilityForRole(role?: Role) {
  if (role === Role.ADMIN) return ["EMPLOYEE", "MANAGER", "HR_ONLY", "ADMIN_ONLY"];
  if (role === Role.HR || role === Role.SUPPORT) return ["EMPLOYEE", "MANAGER", "HR_ONLY"];
  if (role === Role.MANAGER) return ["EMPLOYEE", "MANAGER"];
  return ["EMPLOYEE"];
}

export async function retrieveContextWithPermissions(query: string, options: { country?: string; topK?: number; role?: Role }) {
  const { embedding } = await embed({ model: embeddingModel, value: query });
  const allowed = visibilityForRole(options.role);
  const rows = await prisma.$queryRawUnsafe<RetrievedChunk[]>(
    `SELECT kc.id as chunk_id,
            kc.content,
            kf.id as file_id,
            kf."originalName" as file_name,
            kf.category,
            kf.country,
            (e.vector <=> $1::vector) as distance
       FROM "Embedding" e
       JOIN "KnowledgeChunk" kc ON kc.id = e."chunkId"
       JOIN "KnowledgeFile" kf ON kf.id = kc."fileId"
      WHERE kf.status = 'READY'
        AND (kf.country = $2 OR kf.country = 'GLOBAL')
        AND kf.visibility = ANY($3::"KnowledgeVisibility"[])
      ORDER BY e.vector <=> $1::vector
      LIMIT $4`,
    vectorLiteral(embedding),
    options.country ?? "GLOBAL",
    allowed,
    options.topK ?? 6
  );

  const citations: Citation[] = rows.map((row) => ({
    fileId: row.file_id,
    fileName: row.file_name,
    chunkId: row.chunk_id,
    category: row.category,
    country: row.country,
    score: Number((1 - row.distance).toFixed(4)),
    preview: row.content.slice(0, 220)
  }));

  return {
    context: rows.map((row, index) => `[${index + 1}] ${row.file_name} / ${row.category} / ${row.country}\n${row.content}`).join("\n\n---\n\n"),
    citations
  };
}

export async function buildRagMessages(input: {
  question: string;
  chatId: string;
  country?: string;
  role?: Role;
}) {
  const previous = await prisma.message.findMany({
    where: { chatId: input.chatId },
    orderBy: { createdAt: "asc" },
    take: 12
  });

  const history: CoreMessage[] = previous.map((message) => ({
    role: message.role === MessageRole.ASSISTANT ? "assistant" : message.role === MessageRole.USER ? "user" : "system",
    content: message.content
  }));

  const query = await rewriteQuery(input.question, history);
  const { context, citations } = await retrieveContextWithPermissions(query, { country: input.country, role: input.role });
  const agent = routeAgent(input.question);
  const activePrompt = await prisma.prompt.findFirst({
    where: {
      isActive: true,
      OR: [{ role: agent }, { role: AgentType.GENERAL }],
      country: { in: [input.country ?? "GLOBAL", "GLOBAL"] }
    },
    orderBy: [{ role: "asc" }, { updatedAt: "desc" }]
  });

  const system = [
    activePrompt?.content,
    `当前路由: ${agentLabel(agent)}。`,
    "RAG 回答规则:",
    "1. 只能依据 <context> 中的公司知识库回答。",
    "2. 如果 context 为空或没有直接依据，回答: 当前知识库没有足够信息确认该问题，并建议联系 HR。",
    "3. 引用来源时使用 [1]、[2] 这样的编号。",
    "4. 对流程类问题给出步骤、责任人、入口或材料清单；没有入口信息时明确说明未检索到。",
    "5. 中英文问题均可回答，默认使用用户提问语言。",
    `<context>\n${context || "EMPTY_CONTEXT"}\n</context>`
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: CoreMessage[] = [
    { role: "system", content: system },
    ...history.slice(-8),
    { role: "user", content: input.question }
  ];

  return { messages, citations, agent, query };
}
