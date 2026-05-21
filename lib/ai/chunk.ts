export type Chunk = {
  content: string;
  tokenCount: number;
};

const approxTokens = (text: string) => Math.ceil(text.length / 3.5);

export function chunkText(text: string, chunkSize = 900, overlap = 140): Chunk[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: Chunk[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (approxTokens(next) <= chunkSize) {
      buffer = next;
      continue;
    }

    if (buffer) chunks.push({ content: buffer, tokenCount: approxTokens(buffer) });
    buffer = paragraph;

    while (approxTokens(buffer) > chunkSize) {
      const slice = buffer.slice(0, chunkSize * 3);
      chunks.push({ content: slice, tokenCount: approxTokens(slice) });
      buffer = buffer.slice(Math.max(0, slice.length - overlap * 3));
    }
  }

  if (buffer.trim()) chunks.push({ content: buffer, tokenCount: approxTokens(buffer) });
  return chunks;
}

