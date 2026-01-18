import 'src/app/globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Poppins, Inter } from 'next/font/google'
import Header from '@/components/Header';
import FooterLoader from '@/components/FooterLoader';
import { ThemeProvider } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import ClientLayout from '@/components/ClientLayout';

const poppins = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  weight: ['400', '500', '700']
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})


const APP_NAME = "PDFusion";
const APP_DEFAULT_TITLE = "PDFusion: Your All-in-One PDF Toolkit";
const APP_TITLE_TEMPLATE = "%s | PDFusion";
const APP_DESCRIPTION = "Merge, split, compress, convert, and manage your PDF files with ease. Our tools run securely in your browser to protect your privacy. No uploads required.";

export const metadata: Metadata = {
  metadataBase: new URL('https://pdf-fusion.vercel.app'),
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  creator: "Garvit Kumar",
  keywords: [
    "PDF", "PDF tools", "Merge PDF", "Split PDF", "Compress PDF", "PDF to JPG", "JPG to PDF", "Rotate PDF", "Add page numbers", "free pdf editor", "online pdf tools"
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "//192x192.png",
    shortcut: "/192x192.png",
    apple: "/192x192.png",
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    url: new URL('https://pdf-fusion.vercel.app'),
    images: [
      {
        url: "/512x512.png",
        width: 1200,
        height: 630,
        alt: "PDFusion Logo and Title",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/512x512.png",
        alt: "PDFusion Logo and Title",
      },
    ],
    creator: "@its_garvit__854_",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#040B1D" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.variable, inter.variable)} suppressHydrationWarning>
      <head>
      </head>
      <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClientLayout>
              {children}
            </ClientLayout>
          </ThemeProvider>
      </body>
    </html>
  );
}
