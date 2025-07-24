
'use server';
/**
 * @fileOverview A flow for answering questions about a PDF document.
 *
 * - askPdfFlow - A function that takes PDF context and a question, and returns an answer.
 * - AskPdfInput - The input type for the askPdfFlow function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const AskPdfInputSchema = z.object({
  context: z.string().describe('The full text content extracted from the PDF file.'),
  question: z.string().describe('The user\'s question about the document.'),
});

export type AskPdfInput = z.infer<typeof AskPdfInputSchema>;

const askPdfPrompt = ai.definePrompt({
  name: 'askPdfPrompt',
  input: { schema: AskPdfInputSchema },
  prompt: `You are an intelligent assistant designed to answer questions based on the content of a provided document.

Analyze the following document content and answer the user's question. Your answer must be based *only* on the information present in the document. Do not use any external knowledge. If the answer cannot be found in the document, state that clearly.

DOCUMENT CONTENT:
---
{{{context}}}
---

USER'S QUESTION:
"{{{question}}}"

Based on the document, what is the answer?`,
});

export const askPdfFlow = ai.defineFlow(
  {
    name: 'askPdfFlow',
    inputSchema: AskPdfInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await askPdfPrompt(input);
    return output!;
  }
);
