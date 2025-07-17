
'use server';
/**
 * @fileOverview A PDF unlocking AI agent.
 *
 * - unlockPdf - A function that handles the PDF unlocking process.
 * - UnlockPdfInput - The input type for the unlockPdf function.
 * - UnlockPdfOutput - The return type for the unlockPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';

const UnlockPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  password: z.string().describe('The password for the PDF file.'),
});
export type UnlockPdfInput = z.infer<typeof UnlockPdfInputSchema>;

const UnlockPdfOutputSchema = z.object({
  unlockedPdfDataUri: z.string().describe('The unlocked PDF file as a data URI.'),
  wasEncrypted: z.boolean().describe('Whether the original file was encrypted.'),
});
export type UnlockPdfOutput = z.infer<typeof UnlockPdfOutputSchema>;


export async function unlockPdf(input: UnlockPdfInput): Promise<UnlockPdfOutput> {
  return unlockPdfFlow(input);
}


const unlockPdfFlow = ai.defineFlow(
  {
    name: 'unlockPdfFlow',
    inputSchema: UnlockPdfInputSchema,
    outputSchema: UnlockPdfOutputSchema,
  },
  async ({ pdfDataUri, password }) => {
    try {
      const pdfBytes = Buffer.from(pdfDataUri.split(',')[1], 'base64');
      
      let pdfDoc;
      let wasEncrypted = true;

      try {
        // First, try loading with the provided password.
        pdfDoc = await PDFDocument.load(pdfBytes, { password });
      } catch (e: any) {
        // If it's an incorrect password error, re-throw it to be caught by the outer catch block.
        if (e.name === 'PasswordIsIncorrectError') {
          throw e;
        }
        
        // If it's any other error, try loading without a password.
        // This handles cases where the file was not encrypted in the first place.
        try {
            pdfDoc = await PDFDocument.load(pdfBytes);
            wasEncrypted = false; // It wasn't encrypted, but we can still return it.
        } catch (finalError: any) {
            // If it fails again, the file is likely corrupted.
            throw new Error('Could not load the PDF. The file may be corrupted or in an unsupported format.');
        }
      }

      // Re-save the document to remove encryption. If it was never encrypted, this just saves it as-is.
      const unlockedPdfBytes = await pdfDoc.save();
      const unlockedPdfDataUri = `data:application/pdf;base64,${Buffer.from(unlockedPdfBytes).toString('base64')}`;

      return {
        unlockedPdfDataUri,
        wasEncrypted,
      };

    } catch (error: any) {
      if (error.name === 'PasswordIsIncorrectError') {
        // Create a specific, catchable error for incorrect passwords.
        throw new Error('Incorrect password. Please try again.');
      }
      console.error('Error during PDF unlock:', error);
      throw new Error(error.message || 'An unexpected error occurred while trying to unlock the PDF.');
    }
  }
);
