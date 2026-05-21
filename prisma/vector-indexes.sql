-- Optional production indexes after Prisma creates tables.
-- Run after `prisma db push` or include in a migration.

CREATE INDEX IF NOT EXISTS embedding_vector_hnsw_idx
ON "Embedding"
USING hnsw (vector vector_cosine_ops);

CREATE INDEX IF NOT EXISTS knowledge_chunk_content_trgm_idx
ON "KnowledgeChunk"
USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS message_content_trgm_idx
ON "Message"
USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS support_ticket_status_sla_idx
ON "SupportTicket" (status, "slaDueAt");
