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
  tone: z.enum(['professional', 'casual', 'confident', 'friendly', 'neutral']).default('neutral').describe("The desired tone of the summary."),
  audience: z.enum(['general', 'beginner', 'expert']).default('general').describe("The intended audience for the summary."),
  language: z.string().default('English').describe("The desired output language for the summary."),
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
  prompt: `You are an expert in text summarization. Your task is to provide a concise and clear summary of the following text, adhering to the user's specific requirements.

Follow these instructions for the output:
-   **Length**: The summary should be {{length}}. A "short" summary is 1-2 sentences. A "medium" summary is a concise paragraph. A "long" summary is a more detailed paragraph.
-   **Format**: The summary should be in a {{format}} format. If 'bullets' is chosen, focus on extracting key themes, conclusions, or action items. Use Markdown for the bullet points (e.g., "- Point 1").
-   **Tone**: The tone of the summary should be {{tone}}.
-   **Audience**: The summary should be tailored for a(n) {{audience}} audience.
-   **Language**: The summary must be written in {{language}}.

Do not start with "This is a summary of the text" or any other preamble. Provide the summary directly.

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
      const htmlSummary = await marked.parse(output.summary);
      return { summary: htmlSummary };
    }

    return output;
  }
);
