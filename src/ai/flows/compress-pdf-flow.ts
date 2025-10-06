
'use server';
/**
 * @fileOverview A server-side flow for compressing PDFs.
 * - compressPdf - A function to compress a PDF file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';

export const CompressPdfInputSchema = z.object({
    pdfDataUri: z.string().describe("A data URI of the PDF file to be compressed."),
    quality: z.number().min(10).max(100).default(75).describe("The image quality level for compression (10-100)."),
});
export type CompressPdfInput = z.infer<typeof CompressPdfInputSchema>;

export const CompressionStatsSchema = z.object({
  originalSize: z.number(),
  newSize: z.number(),
});
export type CompressionStats = z.infer<typeof CompressionStatsSchema>;

export const CompressPdfOutputSchema = z.object({
  pdfDataUri: z.string().optional(),
  stats: CompressionStatsSchema.optional(),
  error: z.string().optional(),
});
export type CompressPdfOutput = z.infer<typeof CompressPdfOutputSchema>;


export async function compressPdf(input: CompressPdfInput): Promise<CompressPdfOutput> {
    return compressPdfFlow(input);
}


const compressPdfFlow = ai.defineFlow(
    {
        name: 'compressPdfFlow',
        inputSchema: CompressPdfInputSchema,
        outputSchema: CompressPdfOutputSchema,
    },
    async (input) => {
        try {
            const { pdfDataUri, quality } = input;
            const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
            const originalSize = pdfBytes.length;

            const pdfDoc = await PDFDocument.load(pdfBytes, {
                // This option is crucial for handling complex PDFs that might cause issues.
                updateMetadata: false
            });

            const pages = pdfDoc.getPages();
            let processedImages = 0;

            for (const page of pages) {
                const images = Array.from(page.getXObjects().values());
                for (const image of images) {
                    if ('embed' in image && image.isJpeg()) {
                        const jpegImage = await pdfDoc.embedJpg(image.bytes);
                        image.embed(jpegImage);
                        processedImages++;
                    }
                }
            }

            // Only save if there were images to process, to avoid bloating files with no images.
            let compressedPdfBytes;
            if (processedImages > 0) {
               compressedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
            } else {
               compressedPdfBytes = await pdfDoc.save();
            }

            const newSize = compressedPdfBytes.length;

            if (newSize >= originalSize) {
                return {
                    error: "Compression did not result in a smaller file. The PDF may already be optimized or contain no compressible images.",
                };
            }
            
            const compressedDataUri = `data:application/pdf;base64,${Buffer.from(compressedPdfBytes).toString('base64')}`;

            return {
                pdfDataUri: compressedDataUri,
                stats: {
                    originalSize,
                    newSize,
                },
            };

        } catch (error: any) {
            console.error("PDF Compression Error:", error);
            if(error.message.includes('encrypted')) {
                return { error: 'This PDF is password-protected and cannot be compressed.' };
            }
            return {
                error: error.message || 'An unknown error occurred during PDF compression.',
            };
        }
    }
);
