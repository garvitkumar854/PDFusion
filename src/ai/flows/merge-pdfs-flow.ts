'use server';
/**
 * @fileOverview A server-side flow for merging multiple PDF documents.
 *
 * - mergePdfs - A function that handles the PDF merging process.
 * - MergePdfsInput - The input type for the merging function.
 * - MergePdfsOutput - The return type for the merging function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';

// Define input schema
const MergePdfsInputSchema = z.object({
  pdfDataUris: z.array(z.string()).describe(
    "An array of PDF files as data URIs, each including a MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type MergePdfsInput = z.infer<typeof MergePdfsInputSchema>;

// Define output schema
const MergePdfsOutputSchema = z.object({
  mergedPdfBase64: z.string().describe('The merged PDF file, encoded as a Base64 string.'),
});
export type MergePdfsOutput = z.infer<typeof MergePdfsOutputSchema>;

export async function mergePdfs(input: MergePdfsInput): Promise<MergePdfsOutput> {
  return mergePdfsFlow(input);
}

const mergePdfsFlow = ai.defineFlow(
  {
    name: 'mergePdfsFlow',
    inputSchema: MergePdfsInputSchema,
    outputSchema: MergePdfsOutputSchema,
  },
  async (input) => {
    const { pdfDataUris } = input;
    
    if (pdfDataUris.length === 0) {
        throw new Error("No PDF files provided to merge.");
    }

    try {
        const mergedPdf = await PDFDocument.create();

        for (const dataUri of pdfDataUris) {
            const base64Data = dataUri.split(';base64,').pop();
            if (!base64Data) {
                console.warn('Skipping invalid data URI.');
                continue;
            }
            const pdfBytes = Buffer.from(base64Data, 'base64');
            
            try {
                const sourcePdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            } catch (error) {
                console.warn(`Skipping corrupted or encrypted file:`, error);
            }
        }
        
        if (mergedPdf.getPageCount() === 0) {
            throw new Error("Merge failed. All source PDFs might be corrupted, encrypted, or invalid.");
        }

        const mergedPdfBytes = await mergedPdf.save();

        return {
            mergedPdfBase64: Buffer.from(mergedPdfBytes).toString('base64'),
        };

    } catch (error) {
        console.error('Error in PDF merging flow:', error);
        throw new Error('Failed to merge PDF documents.');
    }
  }
);
