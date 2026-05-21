import { openai } from "@ai-sdk/openai";
import OpenAI from "openai";

export const chatModelName = process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1";
export const fastModelName = process.env.OPENAI_FAST_MODEL ?? "gpt-4o-mini";
export const embeddingModelName = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-large";

export const chatModel = openai(chatModelName);
export const fastModel = openai(fastModelName);
export const embeddingModel = openai.embedding(embeddingModelName);

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

