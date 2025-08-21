
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Poppins } from 'next/font/google'
import Header from '@/components/Header';
import FooterLoader from '@/components/FooterLoader';
import { ThemeProvider } from '@/components/ThemeProvider';
import { usePwa } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import BottomNavBar from '@/components/BottomNavBar';


const poppins = Poppins({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800']
})

const APP_NAME = "PDFusion";
const APP_DEFAULT_TITLE = "PDFusion: Your All-in-One PDF Toolkit";
const APP_TITLE_TEMPLATE = "%s | PDFusion";
const APP_DESCRIPTION = "Merge, split, compress, convert, and manage your PDF files with ease. Our tools run securely in your browser to protect your privacy. No uploads required.";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  usePwa();
  const isMobile = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    };
    setIsStandalone(checkStandalone());
  }, []);
  
  const showBottomNav = isMobile && isStandalone;

  const isToolPage = [
    '/merger', '/split-pdf', '/organize-pdf', '/pdf-to-jpg', 
    '/jpg-to-pdf', '/pdf-to-html', '/html-to-pdf', '/rotate-pdf',
    '/add-page-numbers', '/password-generator', '/qr-code-generator',
    '/unit-converter', '/currency-converter', '/calculator'
  ].some(path => pathname.startsWith(path));

  return (
    <html lang="en" className={cn(poppins.variable)} suppressHydrationWarning>
      <head>
        <title>{APP_DEFAULT_TITLE}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="application-name" content={APP_NAME} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_DEFAULT_TITLE} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#5e4dff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4853497722580911"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground flex flex-col min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className={cn(
              "flex-1 container mx-auto px-4 sm:px-6 lg:px-8", 
              showBottomNav && !isToolPage && "pb-24",
              showBottomNav && isToolPage && "pb-4"
            )}>
            {children}
            </main>
            {showBottomNav ? <BottomNavBar /> : <FooterLoader />}
            <Toaster />
          </ThemeProvider>
      </body>
    </html>
  );
}
