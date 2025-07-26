
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
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execAsync = promisify(exec);
const qpdfPath = 'qpdf';

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
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-compress-'));
    const inputPath = path.join(tempDir, 'input.pdf');
    const outputPath = path.join(tempDir, 'output.pdf');

    try {
        const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
        const originalSize = pdfBytes.length;
        await fs.writeFile(inputPath, pdfBytes);

        // Use qpdf to optimize the PDF structure
        const qpdfCommand = `"${qpdfPath}" "${inputPath}" "${outputPath}" --object-streams=generate --recompress-flate --compression-level=9`;
        await execAsync(qpdfCommand);

        const compressedBytes = await fs.readFile(outputPath);
        const newSize = compressedBytes.length;

        return {
            pdfDataUri: `data:application/pdf;base64,${compressedBytes.toString('base64')}`,
            stats: {
                originalSize,
                newSize,
                pagesProcessed: 0, // qpdf doesn't easily expose this
                imagesCompressed: 0, // qpdf doesn't recompress images in this mode
            },
        };

    } catch (e: any) {
        console.error("Compression failed:", e);
        let userMessage = "Failed to compress PDF.";
        if (e.stderr) {
            if (e.stderr.includes('password') || e.stderr.includes('permission to open')) {
                userMessage = "The file is password-protected and cannot be compressed.";
            } else if (e.stderr.includes('is not a PDF file')) {
                userMessage = "The file is corrupted or not a valid PDF.";
            }
        }
        return { error: userMessage };
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
);

export async function compressPdf(input: CompressPdfInput): Promise<CompressPdfOutput> {
  return await compressPdfFlow(input);
}
