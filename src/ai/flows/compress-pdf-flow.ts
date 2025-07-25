
'use server';
/**
 * @fileOverview A flow for compressing PDF files by reducing image quality and optimizing the file structure.
 *
 * - compressPdf - A function that takes a PDF and a quality setting and returns a compressed PDF.
 * - CompressPdfInput - The input type for the compressPdf function.
 * - CompressPdfOutput - The return type for the compressPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { createCanvas, loadImage } from 'canvas';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execAsync = promisify(exec);
const qpdfPath = 'qpdf';

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
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-compress-'));
    const inputPath = path.join(tempDir, 'input.pdf');
    const qpdfOutputPath = path.join(tempDir, 'qpdf_output.pdf');

    try {
        const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
        const originalSize = pdfBytes.length;
        await fs.writeFile(inputPath, pdfBytes);

        // Stage 1: Use qpdf to optimize the PDF structure
        const qpdfCommand = `"${qpdfPath}" "${inputPath}" "${qpdfOutputPath}" --object-streams=generate --recompress-flate --compression-level=9`;
        await execAsync(qpdfCommand);

        const optimizedBytes = await fs.readFile(qpdfOutputPath);
        const pdfDoc = await PDFDocument.load(optimizedBytes, {
            updateMetadata: false
        });

        // Stage 2: Re-compress images using canvas
        const imageRefs = new Set<string>();
        pdfDoc.getPages().forEach(page => {
            const xObject = page.node.Resources()?.lookup(undefined, 'XObject');
            if (xObject?.isDict()) {
                xObject.keys().forEach(key => {
                    const stream = page.node.lookup(key);
                    if (stream?.get('Subtype')?.toString() === '/Image') {
                        imageRefs.add(stream.ref.toString());
                    }
                });
            }
        });

        let imagesCompressed = 0;
        for (const refStr of imageRefs) {
            const ref = PDFDocument.parseRef(refStr);
            const image = pdfDoc.context.lookup(ref) as any;
            
            // Skip small or already compressed images (heuristic)
            if (!image.contents || image.contents.length < 10240 || image.dict.get('Filter')?.toString() === '/DCTDecode') {
                 continue;
            }

            try {
                const loadedImage = await loadImage(Buffer.from(image.contents));
                
                // Avoid re-compressing if the image is already small or simple
                if (loadedImage.width < 100 || loadedImage.height < 100) continue;

                const canvas = createCanvas(loadedImage.width, loadedImage.height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(loadedImage, 0, 0);

                const jpegDataUrl = canvas.toDataURL('image/jpeg', quality / 100);
                const jpegBytes = Buffer.from(jpegDataUrl.split(',')[1], 'base64');

                // Only replace if the new image is smaller
                if (jpegBytes.length < image.contents.length) {
                    const newImage = await pdfDoc.embedJpg(jpegBytes);
                    image.dict.set('Filter', newImage.stream.dict.get('Filter'));
                    image.dict.set('Width', newImage.stream.dict.get('Width'));
                    image.dict.set('Height', newImage.stream.dict.get('Height'));
                    image.dict.set('ColorSpace', newImage.stream.dict.get('ColorSpace'));
                    image.dict.set('BitsPerComponent', newImage.stream.dict.get('BitsPerComponent'));
                    image.contents = newImage.stream.contents;
                    
                    imagesCompressed++;
                }
            } catch (e) {
                console.warn("Could not compress an image, skipping.", e);
            }
        }
        
        const newPdfBytes = await pdfDoc.save();
        const newSize = newPdfBytes.length;

        // Final check: if for some reason the file grew, return the qpdf optimized one
        if (newSize > optimizedBytes.length) {
             return {
                pdfDataUri: `data:application/pdf;base64,${optimizedBytes.toString('base64')}`,
                stats: {
                    originalSize,
                    newSize: optimizedBytes.length,
                    pagesProcessed: pdfDoc.getPageCount(),
                    imagesCompressed: 0
                },
            };
        }

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
        return { error: `Failed to compress PDF. The file may be corrupted, encrypted or in an unsupported format. Details: ${e.message}` };
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
);

export async function compressPdf(input: CompressPdfInput): Promise<CompressPdfOutput> {
  return await compressPdfFlow(input);
}
