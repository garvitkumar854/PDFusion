
'use server';
/**
 * @fileOverview A flow for compressing PDF files by reducing image quality and optimizing the file structure.
 *
 * - compressPdf - A function that takes a PDF and returns a compressed PDF.
 * - CompressPdfInput - The input type for the compressPdf function.
 * - CompressPdfOutput - The return type for the compressPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';

const CompressPdfInputSchema = z.object({
  pdfDataUri: z.string().describe("The PDF file to compress, as a data URI."),
  quality: z.number().min(0).max(100).describe("The image quality setting (0-100). Not currently used, placeholder."),
});
export type CompressPdfInput = z.infer<typeof CompressPdfInputSchema>;

const CompressionStatsSchema = z.object({
    originalSize: z.number(),
    newSize: z.number(),
    pagesProcessed: z.number(),
    imagesCompressed: z.number(),
});
export type CompressionStats = z.infer<typeof CompressionStatsSchema>;

const CompressPdfOutputSchema = z.object({
  pdfDataUri: z.string().optional(),
  stats: CompressionStatsSchema.optional(),
  error: z.string().optional(),
});
export type CompressPdfOutput = z.infer<typeof CompressPdfOutputSchema>;


const compressPdfFlow = ai.defineFlow(
  {
    name: 'compressPdfFlow',
    inputSchema: CompressPdfInputSchema,
    outputSchema: CompressPdfOutputSchema,
  },
  async ({ pdfDataUri }) => {
    try {
        const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
        const originalSize = pdfBytes.length;

        const pdfDoc = await PDFDocument.load(pdfBytes, {
            // Skips parsing of objects that are not required to save the document.
            // This can significantly speed up loading of large documents.
            updateMetadata: false
        });
        
        // This process of saving the document with `pdf-lib` can itself
        // result in a smaller file size due to optimization of the PDF structure.
        const compressedBytes = await pdfDoc.save({
            // Re-use existing objects when possible to reduce file size.
            useObjectStreams: true,
        });

        const newSize = compressedBytes.length;

        return {
            pdfDataUri: `data:application/pdf;base64,${Buffer.from(compressedBytes).toString('base64')}`,
            stats: {
                originalSize,
                newSize,
                pagesProcessed: pdfDoc.getPageCount(),
                imagesCompressed: 0, // pdf-lib does not re-compress images in this mode
            },
        };

    } catch (e: any) {
        console.error("Compression failed:", e);
        let userMessage = "Failed to compress PDF.";
        if (e.message.includes('encrypted')) {
            userMessage = "The file is password-protected and cannot be compressed.";
        } else if (e.message.includes('Invalid PDF')) {
            userMessage = "The file is corrupted or not a valid PDF.";
        }
        return { error: userMessage };
    }
  }
);

export async function compressPdf(input: CompressPdfInput): Promise<CompressPdfOutput> {
  return await compressPdfFlow(input);
}
