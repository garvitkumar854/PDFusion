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
import { PDFDocument, PDFImage } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window === 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export const CompressPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  compressionLevel: z.enum(['low', 'recommended', 'extreme']).describe('The desired level of compression.'),
});
export type CompressPdfInput = z.infer<typeof CompressPdfInputSchema>;

export const CompressPdfOutputSchema = z.object({
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
      
      const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      const compressedPdfDoc = await PDFDocument.create();
      const imageQuality = getImageQuality(compressionLevel);

      for (let i = 1; i <= pdfjsDoc.numPages; i++) {
        const page = await pdfjsDoc.getPage(i);
        const operators = await page.getOperatorList();
        const newPage = compressedPdfDoc.addPage([page.view[2], page.view[3]]);
        
        const resources = page.getResources();
        
        for (const op of operators.fnArray) {
           if (op === pdfjsLib.OPS.paintImageXObject) {
              const [imgName] = operators.argsArray[operators.argsArray.length - 1];
              const img = await resources.getImage(imgName);

              if (img) {
                const imageBytes = img.data;

                let pdfImage: PDFImage;
                try {
                    pdfImage = await compressedPdfDoc.embedJpg(imageBytes);
                } catch (e) {
                    // Fallback to PNG if it's not a valid JPG
                    try {
                        pdfImage = await compressedPdfDoc.embedPng(imageBytes);
                    } catch (pngError) {
                        console.warn(`Could not embed image ${imgName} on page ${i}. Skipping.`);
                        continue;
                    }
                }
                
                // Compress the image before drawing
                const canvas = newPage.ownerDocument.context.canvas({
                    width: img.width,
                    height: img.height,
                });

                const ctx = canvas.getContext('2d');
                const imageBitmap = await createImageBitmap(new Blob([imageBytes]));
                ctx.drawImage(imageBitmap, 0, 0);
                const compressedImageBytes = await canvas.toBuffer('image/jpeg', imageQuality);
                const compressedImage = await compressedPdfDoc.embedJpg(compressedImageBytes);

                newPage.drawImage(compressedImage, {
                  x: 0,
                  y: 0,
                  width: newPage.getWidth(),
                  height: newPage.getHeight(),
                });
              }
           }
        }
        // This is a simplified approach. A full implementation would need to handle all operators,
        // not just images. For text, vectors, etc., they would be drawn here.
        // For now, this flow will primarily compress pages that contain images.
      }

      const compressedPdfBytes = await compressedPdfDoc.save();
      const compressedSize = compressedPdfBytes.length;

      if (compressedSize === 0) {
        throw new Error("Compression resulted in an empty file. This can happen if the PDF contains no compressible images or has an unsupported structure.")
      }

      const compressedPdfDataUri = `data:application/pdf;base64,${Buffer.from(compressedPdfBytes).toString('base64')}`;

      return {
        compressedPdfDataUri,
        originalSize,
        compressedSize,
      };
    } catch (error: any) {
      console.error('Error during PDF compression:', error);
      throw new Error(`Failed to compress PDF. ${error.message}`);
    }
  }
);
