
'use server';
/**
 * @fileOverview A flow for answering questions about a PDF document.
 *
 * - askPdf - A function that takes PDF context and a question, and returns an answer.
 * - AskPdfInput - The input type for the askPdf function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AskPdfInputSchema = z.object({
  context: z.string().describe('The full text content extracted from the PDF file.'),
  question: z.string().describe('The user\'s question about the document.'),
});

export type AskPdfInput = z.infer<typeof AskPdfInputSchema>;

const askPdfPrompt = ai.definePrompt({
  name: 'askPdfPrompt',
  input: { schema: AskPdfInputSchema },
  prompt: `You are an expert AI assistant. Your task is to provide clear, helpful, and insightful answers based on the user's question and the provided document content.

Use the document content as the primary source of truth. You can summarize, explain, and synthesize information from the document. While your answer should be grounded in the document's content, you can use your general knowledge to provide more comprehensive explanations where appropriate.

If the question is completely unrelated to the document, politely state that you can only answer questions about the provided content.

DOCUMENT CONTENT:
---
{{{context}}}
---

USER'S QUESTION:
"{{{question}}}"

Provide a helpful and detailed answer.`,
});

const askPdfFlow = ai.defineFlow(
  {
    name: 'askPdfFlow',
    inputSchema: AskPdfInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await askPdfPrompt(input);
    return output ?? "Sorry, I couldn't find an answer to that in the document.";
  }
);

export async function askPdf(input: AskPdfInput): Promise<string> {
  return await askPdfFlow(input);
}
