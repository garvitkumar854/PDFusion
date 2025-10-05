
import {z} from 'zod';

export const SummarizeInputSchema = z.object({
  text: z.string().describe('The text to be summarized.'),
});
export type SummarizeInput = z.infer<typeof SummarizeInputSchema>;

export const SummarizeOutputSchema = z.object({
  summary: z.string().describe('The generated summary.'),
});
export type SummarizeOutput = z.infer<typeof SummarizeOutputSchema>;
