
'use server';
/**
 * @fileOverview A server-side flow for creating text embeddings.
 * This is used to convert text chunks and user queries into vector representations
 * for semantic search in a Retrieval-Augmented Generation (RAG) system.
 *
 * - embed - A function to create an embedding for a single piece of text.
 * - embedMany - A function to create embeddings for an array of texts.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const embedder = 'googleai/text-embedding-v1';

const embedManyFlow = ai.defineFlow(
  {
    name: 'embedManyFlow',
    inputSchema: z.array(z.string()),
    outputSchema: z.array(z.array(z.number())),
  },
  async (texts) => {
    const { embeddings } = await ai.embed({
      embedder,
      content: texts,
    });
    return embeddings;
  }
);

export async function embed(text: string): Promise<number[]> {
  const { embedding } = await ai.embed({
    embedder,
    content: text,
  });
  return embedding;
}

export async function embedMany(
  texts: string[],
  onProgress?: (progress: number) => void
): Promise<number[][]> {
  const batchSize = 50;
  let allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await embedManyFlow(batch);
    allEmbeddings.push(...batchEmbeddings);
    if (onProgress) {
      onProgress((i + batch.length) / texts.length);
    }
  }
  return allEmbeddings;
}
