
'use server';
/**
 * @fileOverview A server-side flow for summarizing text.
 *
 * - summarizeText - A function that takes a string of text and returns a summary.
 */

import {ai} from '@/ai/genkit';
import {
  SummarizeInput,
  SummarizeInputSchema,
  SummarizeOutput,
  SummarizeOutputSchema,
} from './summarize-types';

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
