
'use server';
/**
 * @fileOverview A flow for compressing PDF files by reducing image quality.
 *
 * - compressPdf - A function that takes a PDF and a quality setting and returns a compressed PDF.
 * - CompressPdfInput - The input type for the compressPdf function.
 * - CompressPdfOutput - The return type for the compressPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';

const CompressPdfInputSchema = z.object({
  pdfDataUri: z.string().describe("The PDF file to compress, as a data URI."),
  quality: z.number().min(0).max(100).describe("The image quality setting (0-100)."),
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
  async ({ pdfDataUri, quality }) => {
    try {
        const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
        const originalSize = pdfBytes.length;

        const pdfDoc = await PDFDocument.load(pdfBytes, {
            updateMetadata: false
        });

        const imageRefs = new Set();
        pdfDoc.getPages().forEach(page => {
            const imageNames = page.node.Resources()?.lookup(undefined, 'XObject')?.keys() ?? [];
            imageNames.forEach(name => {
                const stream = page.node.lookup(name);
                if(stream?.get('Subtype')?.toString() === '/Image') {
                    imageRefs.add(stream.ref);
                }
            });
        });

        let imagesCompressed = 0;
        const processedRefs = new Set();

        for (const ref of imageRefs) {
            if (processedRefs.has(ref)) continue;
            processedRefs.add(ref);

            const image = pdfDoc.context.lookup(ref) as any;
            const imageBytes = image.get('DecodeParms') === undefined ? image.contents : image.get('SMask') === undefined ? image.contents : null;

            if(!imageBytes) continue;

            try {
                const loadedImage = await loadImage(Buffer.from(imageBytes));
                const canvas = createCanvas(loadedImage.width, loadedImage.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(loadedImage, 0, 0);

                const jpegDataUrl = canvas.toDataURL('image/jpeg', quality / 100);
                const jpegBytes = Buffer.from(jpegDataUrl.split(',')[1], 'base64');

                const newImage = await pdfDoc.embedJpg(jpegBytes);

                // Replace the image stream's contents
                image.contents = newImage.stream.contents;
                image.dict.delete('DecodeParms');
                image.dict.delete('Filter');
                image.dict.set('Width', newImage.width);
                image.dict.set('Height', newImage.height);
                image.dict.set('ColorSpace', newImage.colorSpace);
                image.dict.set('BitsPerComponent', newImage.bitsPerComponent);

                imagesCompressed++;
            } catch (e) {
                console.warn("Could not compress an image, skipping.", e);
            }
        }
        
        const newPdfBytes = await pdfDoc.save();
        const newSize = newPdfBytes.length;

        return {
            pdfDataUri: `data:application/pdf;base64,${Buffer.from(newPdfBytes).toString('base64')}`,
            stats: {
                originalSize,
                newSize,
                pagesProcessed: pdfDoc.getPageCount(),
                imagesCompressed
            },
        };

    } catch (e: any) {
        console.error("Compression failed:", e);
        return { error: `Failed to compress PDF. The file may be corrupted or encrypted. Details: ${e.message}` };
    }
  }
);


export async function compressPdf(input: CompressPdfInput): Promise<CompressPdfOutput> {
  return await compressPdfFlow(input);
}
