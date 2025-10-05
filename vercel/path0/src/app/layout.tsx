import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Poppins, Inter } from 'next/font/google'
import Header from '@/components/Header';
import FooterLoader from '@/components/FooterLoader';
import { ThemeProvider } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import type { Metadata, Viewport } from 'next';
import ClientLayout from '@/components/ClientLayout';

const poppins = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800']
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
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
        url: "/og-image.png",
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
        url: "/og-image.png",
        alt: "PDFusion Logo and Title",
      },
    ],
    creator: "@its_garvit__854_",
  },
};

export const viewport: Viewport = {
  themeColor: "#5e4dff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.variable, inter.variable)} suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4853497722580911" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4853497722580911"
          crossOrigin="anonymous"
        ></script>
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
