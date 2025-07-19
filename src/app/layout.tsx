import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Poppins } from 'next/font/google'
import Header from '@/components/Header';
import { ThemeProvider } from '@/components/ThemeProvider';
import FooterLoader from '@/components/FooterLoader';

const poppins = Poppins({ 
  subsets: ['latin'], 
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: '--font-sans'
})

export const metadata: Metadata = {
  title: 'PDFusion',
  description: 'Merge and manage your PDF files with ease.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
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
