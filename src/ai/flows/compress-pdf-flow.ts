'use server';
/**
 * @fileOverview A PDF compression AI agent.
 *
 * - compressPdf - A function that handles the PDF compression process.
 * - CompressPdfInput - The input type for the compressPdf function.
 * - CompressPdfOutput - The return type for the compressPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';

const CompressPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  compressionLevel: z.enum(['low', 'recommended', 'extreme']).describe('The desired level of compression.'),
});
export type CompressPdfInput = z.infer<typeof CompressPdfInputSchema>;

const CompressPdfOutputSchema = z.object({
  compressedPdfDataUri: z.string().describe('The compressed PDF file as a data URI.'),
  originalSize: z.number().describe('The original file size in bytes.'),
  compressedSize: z.number().describe('The compressed file size in bytes.'),
});
export type CompressPdfOutput = z.infer<typeof CompressPdfOutputSchema>;

export async function compressPdf(input: CompressPdfInput): Promise<CompressPdfOutput> {
  return compressPdfFlow(input);
}

const getImageQuality = (level: 'low' | 'recommended' | 'extreme'): number => {
    switch (level) {
        case 'low':
            return 0.75; // Less compression, higher quality
        case 'recommended':
            return 0.5; // Balanced
        case 'extreme':
            return 0.25; // High compression, lower quality
        default:
            return 0.5;
    }
}

const compressPdfFlow = ai.defineFlow(
  {
    name: 'compressPdfFlow',
    inputSchema: CompressPdfInputSchema,
    outputSchema: CompressPdfOutputSchema,
  },
  async ({ pdfDataUri, compressionLevel }) => {
    try {
      const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
      const originalSize = pdfBytes.length;

      const pdfDoc = await PDFDocument.load(pdfBytes, { 
        // Some PDFs have objects that are not properly structured, this can help
        ignoreEncryption: true,
        updateMetadata: false 
      });
      
      const imageQuality = getImageQuality(compressionLevel);
      const images = pdfDoc.getImages();
      
      // We are primarily targeting JPG images as they are common and compress well.
      // Other image formats like PNG are not re-compressed to avoid quality issues
      // with lossless formats.
      for (const image of images) {
        if (image.isJpg) {
            try {
                const compressedImage = await pdfDoc.embedJpg(image.jpgBytes!, { quality: imageQuality });
                image.ref.set(compressedImage.ref);
            } catch (e) {
                console.warn('Could not re-compress an image. Skipping it.', e);
            }
        }
      }

      // save() will automatically remove unused objects, helping to reduce file size.
      const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const compressedSize = compressedPdfBytes.length;

      if (compressedSize === 0) {
        throw new Error("Compression resulted in an empty file. This can happen if the PDF has an unsupported structure.");
      }
      
      // If the "compressed" file is larger, return the original.
      if (compressedSize >= originalSize) {
         return {
            compressedPdfDataUri: pdfDataUri,
            originalSize,
            compressedSize: originalSize,
         }
      }

      const compressedPdfDataUri = `data:application/pdf;base64,${Buffer.from(compressedPdfBytes).toString('base64')}`;

      return {
        compressedPdfDataUri,
        originalSize,
        compressedSize,
      };
    } catch (error: any) {
      console.error('Error during PDF compression:', error);
      throw new Error(`Failed to compress PDF. The file may be corrupted, encrypted, or in an unsupported format.`);
    }
  }
);
