'use server';

/**
 * @fileOverview Document analyzer flow that identifies potential inconsistencies or issues in uploaded documents before merging.
 *
 * - analyzeDocuments - Analyzes the documents for inconsistencies.
 * - AnalyzeDocumentsInput - Input type for analyzeDocuments function.
 * - AnalyzeDocumentsOutput - Return type for analyzeDocuments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentsInputSchema = z.array(
  z.object({
    fileName: z.string().describe('The name of the document.'),
    fileDataUri: z
      .string()
      .describe(
        "The document's data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
  })
).describe('An array of documents to analyze.');

export type AnalyzeDocumentsInput = z.infer<typeof AnalyzeDocumentsInputSchema>;

const AnalyzeDocumentsOutputSchema = z.object({
  analysisResults: z.array(
    z.object({
      fileName: z.string().describe('The name of the document analyzed.'),
      issues: z.array(
        z.string().describe('A list of issues found in the document.')
      ).describe('The issues found in the document.'),
    })
  ).describe('The analysis results for each document.'),
});

export type AnalyzeDocumentsOutput = z.infer<typeof AnalyzeDocumentsOutputSchema>;

export async function analyzeDocuments(input: AnalyzeDocumentsInput): Promise<AnalyzeDocumentsOutput> {
  return analyzeDocumentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDocumentsPrompt',
  input: {schema: AnalyzeDocumentsInputSchema},
  output: {schema: AnalyzeDocumentsOutputSchema},
  prompt: `You are an expert document analyst. Your task is to analyze a set of documents and identify any potential inconsistencies, errors, or issues that might cause problems during a merging process. Pay close attention to formatting differences, missing pages, corrupted content, or any other anomaly that could affect the quality of the final merged document.

Analyze the following documents and list out specific issues found in each document:

{{#each this}}
  Document Name: {{this.fileName}}
  Document Content: {{media url=this.fileDataUri}}
{{/each}}`,
});

const analyzeDocumentsFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentsFlow',
    inputSchema: AnalyzeDocumentsInputSchema,
    outputSchema: AnalyzeDocumentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
