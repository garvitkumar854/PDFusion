
'use server';
/**
 * @fileOverview A server-side flow for summarizing text.
 * - summarizeText - A function to generate a summary for a given piece of text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SummarizeInputSchema = z.object({
  text: z.string().min(20, {message: 'Please enter at least 20 characters to summarize.'}).describe('The text to be summarized.'),
});
export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;

const SummarizeOutputSchema = z.object({
  summary: z.string().describe('The generated summary of the text.'),
});
export type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>;

export async function summarizeText(input: SummarizeInput): Promise<SummarizeOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeInputSchema},
  output: {schema: SummarizeOutputSchema},
  prompt: `You are an expert in text summarization. Your task is to provide a concise and clear summary of the following text.
The summary should be approximately 1/3rd of the length of the original text, or shorter if possible, while retaining the key information.
Focus on the main points and key information. The summary should be easy to understand and capture the essence of the original text.
Do not start with "This is a summary of the text". Just provide the summary directly.

Text to summarize:
{{{text}}}
`,
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeInputSchema,
    outputSchema: SummarizeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output?.summary) {
      throw new Error("The AI failed to generate a summary. The content may be too short or unclear. Please try again with a different text.");
    }
    return output;
  }
);
