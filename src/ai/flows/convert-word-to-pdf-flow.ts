'use server';

/**
 * @fileOverview A server-side flow for converting Word documents to PDF.
 *
 * - convertWordToPdf - A function that handles the Word to PDF conversion.
 * - ConvertWordToPdfInput - The input type for the conversion function.
 * - ConvertWordToPdfOutput - The return type for the conversion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import docx_pdf from 'docx-pdf';
import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

// Define input schema
const ConvertWordToPdfInputSchema = z.object({
  docxDataUri: z.string().describe(
    "A Word document as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type ConvertWordToPdfInput = z.infer<typeof ConvertWordToPdfInputSchema>;

// Define output schema
const ConvertWordToPdfOutputSchema = z.object({
  pdfBase64: z.string().describe('The converted PDF file, encoded as a Base64 string.'),
});
export type ConvertWordToPdfOutput = z.infer<typeof ConvertWordToPdfOutputSchema>;


export async function convertWordToPdf(input: ConvertWordToPdfInput): Promise<ConvertWordToPdfOutput> {
  return convertWordToPdfFlow(input);
}


const convertWordToPdfFlow = ai.defineFlow(
  {
    name: 'convertWordToPdfFlow',
    inputSchema: ConvertWordToPdfInputSchema,
    outputSchema: ConvertWordToPdfOutputSchema,
  },
  async (input) => {
    const { docxDataUri } = input;
    
    // Create temporary file paths
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-conversion-'));
    const inputPath = path.join(tempDir, 'input.docx');
    const outputPath = path.join(tempDir, 'output.pdf');

    try {
        // Decode the data URI and write to a temporary file
        const base64Data = docxDataUri.split(';base64,').pop();
        if (!base64Data) {
            throw new Error('Invalid data URI format');
        }
        const docxBuffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(inputPath, docxBuffer);

        // Perform the conversion
        await new Promise<void>((resolve, reject) => {
            docx_pdf(inputPath, outputPath, (err: any, result: any) => {
                if (err) {
                    console.error('docx-pdf conversion error:', err);
                    return reject(err);
                }
                resolve();
            });
        });

        // Read the converted PDF file
        const pdfBuffer = await fs.readFile(outputPath);

        // Return the PDF as a Base64 string
        return {
            pdfBase64: pdfBuffer.toString('base64'),
        };
    } catch (error) {
        console.error('Error in conversion flow:', error);
        throw new Error('Failed to convert document.');
    } finally {
        // Clean up temporary files
        await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
);
