'use server';
/**
 * @fileOverview A flow for merging multiple PDF documents.
 *
 * - mergePdfsFlow - A function that handles the PDF merging process.
 * - MergePdfsInput - The input type for the mergePdfsFlow function.
 * - MergePdfsOutput - The return type for the mergePdfsFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {PDFDocument} from 'pdf-lib';

const MergePdfsInputSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string(),
        dataUri: z
          .string()
          .describe(
            "A PDF file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
          ),
      })
    )
    .describe('An array of PDF files to be merged.'),
});
export type MergePdfsInput = z.infer<typeof MergePdfsInputSchema>;

const MergePdfsOutputSchema = z.object({
  mergedPdfDataUri: z
    .string()
    .describe(
      'The merged PDF file as a data URI with Base64 encoding.'
    ),
});
export type MergePdfsOutput = z.infer<typeof MergePdfsOutputSchema>;

export async function mergePdfs(
  input: MergePdfsInput
): Promise<MergePdfsOutput> {
  return mergePdfsFlow(input);
}

const mergePdfsFlow = ai.defineFlow(
  {
    name: 'mergePdfsFlow',
    inputSchema: MergePdfsInputSchema,
    outputSchema: MergePdfsOutputSchema,
  },
  async ({files}) => {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      try {
        const sourcePdfBytes = Buffer.from(
          file.dataUri.substring(file.dataUri.indexOf(',') + 1),
          'base64'
        );
        const sourcePdf = await PDFDocument.load(sourcePdfBytes, {
          ignoreEncryption: true,
        });
        const copiedPages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices()
        );
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (error) {
        console.warn(`Skipping corrupted or encrypted file: ${file.name}`, error);
        continue;
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      throw new Error(
        'Merge failed. All source PDFs might be corrupted or encrypted.'
      );
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedPdfDataUri = `data:application/pdf;base64,${Buffer.from(
      mergedPdfBytes
    ).toString('base64')}`;

    return {mergedPdfDataUri};
  }
);
