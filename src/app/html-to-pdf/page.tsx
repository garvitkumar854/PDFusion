
'use client';

import ComingSoon from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'HTML to PDF Converter - Convert Web Pages to PDF | PDFusion',
    description: 'Convert any URL or HTML file into a high-quality PDF document. Our tool is fast, free, and coming soon to PDFusion!',
    keywords: ['html to pdf', 'url to pdf', 'webpage to pdf', 'convert html to pdf', 'html to pdf converter'],
};

export default function HtmlToPdfPage() {
  return <ComingSoon />;
}
