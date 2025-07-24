
'use server';
/**
 * @fileOverview A flow for answering questions about a PDF document using RAG.
 *
 * - askPdf - A function that takes relevant PDF context and a question, and returns an answer.
 * - AskPdfInput - The input type for the askPdf function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AskPdfInputSchema = z.object({
  context: z.array(z.string()).describe('A list of the most relevant text chunks from the PDF file based on a vector search.'),
  question: z.string().describe('The user\'s question about the document.'),
});

export type AskPdfInput = z.infer<typeof AskPdfInputSchema>;

const askPdfPrompt = ai.definePrompt({
  name: 'askPdfPrompt',
  input: { schema: AskPdfInputSchema },
  prompt: `You are an expert AI assistant. Your task is to provide a clear and concise answer to the user's question based *only* on the provided source passages.

Synthesize the information from the following source passages to answer the user's question. Do not use any outside knowledge. If the answer cannot be found in the provided passages, state that you cannot answer based on the information given.

Source Passages:
---
{{#each context}}
{{this}}
---
{{/each}}

User's Question:
"{{{question}}}"

Provide a helpful and detailed answer based on the provided source passages.`,
});

const askPdfFlow = ai.defineFlow(
  {
    name: 'askPdfFlow',
    inputSchema: AskPdfInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    if (input.context.length === 0) {
      return "Sorry, I couldn't find any relevant information in the document to answer that question.";
    }
    const { output } = await askPdfPrompt(input);
    return output ?? "Sorry, I couldn't find an answer to that in the document.";
  }
);

export async function askPdf(input: AskPdfInput): Promise<string> {
  return await askPdfFlow(input);
}
