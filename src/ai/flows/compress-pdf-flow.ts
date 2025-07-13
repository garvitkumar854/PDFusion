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
import { PDFDocument, PDFImage, PDFName } from 'pdf-lib';

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
        ignoreEncryption: true,
        updateMetadata: false
      });
      
      const imageQuality = getImageQuality(compressionLevel);
      let imagesProcessed = 0;

      const pages = pdfDoc.getPages();
      for (const page of pages) {
          const resources = page.node.Resources();
          if (!resources) continue;

          const xobjects = resources.get(PDFName.of('XObject'));
          if (!xobjects || !('asDict' in xobjects)) continue;
          
          const xobjectDict = xobjects.asDict();
          const imageNames = xobjectDict.keys();

          for (const imageName of imageNames) {
              const imageStream = xobjectDict.get(imageName);
              if (!imageStream || !('asStream' in imageStream)) continue;
              
              try {
                  const image = await pdfDoc.embedPdf(imageStream);
                  if (image.type === 'image' && image.subtype === 'jpeg') {
                      const compressedImage = await pdfDoc.embedJpg(image.data, { quality: imageQuality });
                      xobjectDict.set(imageName, compressedImage.ref);
                      imagesProcessed++;
                  }
              } catch (e) {
                  console.warn(`Could not process an image resource (${imageName.toString()}). Skipping it.`, e);
              }
          }
      }

      if (imagesProcessed === 0) {
        return {
           compressedPdfDataUri: pdfDataUri,
           originalSize,
           compressedSize: originalSize,
        }
      }

      const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const compressedSize = compressedPdfBytes.length;

      if (compressedSize === 0) {
        throw new Error("Compression resulted in an empty file. This can happen if the PDF has an unsupported structure.");
      }
      
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
