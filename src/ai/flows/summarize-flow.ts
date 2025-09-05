
'use server';
/**
 * @fileOverview A server-side flow for summarizing text.
 *
 * - summarizeText - A function that takes a string of text and returns a summary.
 * - SummarizeInput - The input type for the summarizeText function.
 * - SummarizeOutput - The return type for the summarizeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const SummarizeInputSchema = z.object({
  text: z.string().describe('The text to be summarized.'),
});
export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;

export const SummarizeOutputSchema = z.object({
  summary: z.string().describe('The generated summary.'),
});
export type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>;

export async function summarizeText(
  input: SummarizeInput
): Promise<SummarizeOutput> {
  return summarizeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePrompt',
  input: {schema: SummarizeInputSchema},
  output: {schema: SummarizeOutputSchema},
  prompt: `Summarize the following text concisely.

{{{text}}}`,
});

const summarizeFlow = ai.defineFlow(
  {
    name: 'summarizeFlow',
    inputSchema: SummarizeInputSchema,
    outputSchema: SummarizeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No output from prompt');
    }
    return output;
  }
);
