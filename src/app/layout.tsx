
'use client';

import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Poppins } from 'next/font/google'
import Header from '@/components/Header';
import FooterLoader from '@/components/FooterLoader';
import { ThemeProvider } from '@/components/ThemeProvider';
import { usePwa } from '@/hooks/use-pwa';


const poppins = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800']
})

const APP_NAME = "PDFusion";
const APP_DEFAULT_TITLE = "PDFusion: Your All-in-One PDF Toolkit";
const APP_TITLE_TEMPLATE = "%s | PDFusion";
const APP_DESCRIPTION = "Merge, split, compress, convert, and manage your PDF files with ease. Our tools run securely in your browser to protect your privacy. No uploads required.";

// These are now static for the client component
const metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://pdfusion.vercel.app'),
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PDFusion - All-in-one PDF toolkit banner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
     images: ['/og-image.png'],
  },
};

const viewport = {
  themeColor: "#5e4dff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  usePwa();
  
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8">
            {children}
            </main>
            <FooterLoader />
            <Toaster />
          </ThemeProvider>
      </body>
    </html>
  );
}
