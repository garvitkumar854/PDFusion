'use server';
/**
 * @fileOverview A server-side flow for summarizing text.
 * - summarizeText - A function to generate a summary for a given piece of text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { marked } from 'marked';

const SummarizeInputSchema = z.object({
  text: z.string().min(20, {message: 'Please enter at least 20 characters to summarize.'}).describe('The text to be summarized.'),
  length: z.enum(['short', 'medium', 'long']).default('medium').describe("The desired length of the summary."),
  format: z.enum(['paragraph', 'bullets']).default('paragraph').describe("The desired format of the summary."),
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

Follow these instructions for the output:
-   **Length**: The summary should be {{length}}. A "short" summary is a single sentence. A "medium" summary is a short paragraph. A "long" summary is a more detailed paragraph.
-   **Format**: The summary should be in a {{format}} format.
-   **Markdown**: If the format is 'bullets', use Markdown for the bullet points (e.g., "- Point 1").

Do not start with "This is a summary of the text" or any other preamble. Just provide the summary directly.

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
    
    // If bullet points are requested, convert markdown to HTML for rendering
    if (input.format === 'bullets') {
      const htmlSummary = marked.parse(output.summary);
      return { summary: htmlSummary };
    }

    return output;
  }
);
