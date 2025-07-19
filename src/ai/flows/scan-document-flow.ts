'use server';
/**
 * @fileOverview An AI agent for scanning and analyzing PDF documents.
 *
 * - scanDocument - A function that handles the document analysis process.
 * - ScanDocumentInput - The input type for the scanDocument function.
 * - ScanDocumentOutput - The return type for the scanDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window === 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

const ScanDocumentInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ScanDocumentInput = z.infer<typeof ScanDocumentInputSchema>;

const ScanIssueSchema = z.object({
    severity: z.enum(['low', 'medium', 'high']).describe("The severity of the issue: 'low' for minor suggestions, 'medium' for recommendations, 'high' for critical problems."),
    category: z.string().describe("The category of the issue (e.g., 'Formatting', 'Image Quality', 'Readability')."),
    description: z.string().describe("A concise, user-friendly description of the issue found."),
    page: z.number().optional().describe("The specific page number where the issue was found, if applicable."),
});

const ScanDocumentOutputSchema = z.object({
    overallStatus: z.enum(['good', 'concerns', 'critical']).describe("An overall assessment of the document's quality."),
    summary: z.string().describe("A brief, one-sentence summary of the document's condition."),
    issues: z.array(ScanIssueSchema).describe("A list of specific issues identified in the document."),
});
export type ScanDocumentOutput = z.infer<typeof ScanDocumentOutputSchema>;

async function getPdfTextContent(pdfDataUri: string): Promise<string> {
  const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
  const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const numPages = pdfjsDoc.numPages;
  let fullText = '';

  for (let i = 1; i <= Math.min(numPages, 10); i++) { // Limit to first 10 pages for performance
    const page = await pdfjsDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
    fullText += `[Page ${i}]\n${pageText}\n\n`;
  }
  pdfjsDoc.destroy();
  return fullText;
}

export async function scanDocument(input: ScanDocumentInput): Promise<ScanDocumentOutput> {
  return scanDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanDocumentPrompt',
  input: { schema: z.object({ textContent: z.string() }) },
  output: { schema: ScanDocumentOutputSchema },
  prompt: `You are an expert document analyst. Your task is to review the text content of a PDF and identify potential issues for the user before they merge or finalize it.

Analyze the following document content:
{{{textContent}}}

Identify issues related to:
- Formatting: Inconsistent headers, footers, fonts, or layouts between pages.
- Readability: Missing page numbers, sudden changes in style.
- Content: Placeholder text like "lorem ipsum" or "insert text here".
- Image Quality (based on text hints): Mention if you see text like "[image]" or "figure" and advise the user to check image quality, as you cannot see images.

Provide a list of issues with their severity. Be concise and helpful. If there are no major issues, give a positive summary.
- high: Critical problems that need attention (e.g., placeholder text).
- medium: Recommendations for improvement (e.g., inconsistent formatting).
- low: Minor suggestions (e.g., a missing page number on one page).

Set the overallStatus based on the highest severity issue found. If no issues, status is 'good'.
`,
});

const scanDocumentFlow = ai.defineFlow(
  {
    name: 'scanDocumentFlow',
    inputSchema: ScanDocumentInputSchema,
    outputSchema: ScanDocumentOutputSchema,
  },
  async ({ pdfDataUri }) => {
    const textContent = await getPdfTextContent(pdfDataUri);
    if (!textContent.trim()) {
        return {
            overallStatus: 'critical',
            summary: "The document appears to be empty or contains no readable text.",
            issues: [{
                severity: 'high',
                category: 'Content',
                description: 'The PDF does not contain any text to analyze. It might be an image-only PDF.'
            }]
        }
    }
    const { output } = await prompt({ textContent });
    return output!;
  }
);
