"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import React, { useState } from 'react';
import AnimatedArrow from './AnimatedArrow';

const toolsLinks = [
  { href: '/merger', label: 'Merge PDF' },
  { href: '/split-pdf', label: 'Split PDF' },
  { href: '/compress-pdf', label: 'Compress PDF' },
  { href: '/pdf-to-jpg', label: 'PDF to JPG' },
];

const exploreLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const FooterLink = ({ href, label }: { href: string; label: string }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Link 
            href={href} 
            className="text-sm md:text-base text-muted-foreground hover:text-primary transition-colors group inline-flex items-center gap-1"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {label}
            <AnimatedArrow isHovered={isHovered} />
        </Link>
    )
}

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="bg-background/95 shadow-[0_-4px_12px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_-5px_rgba(255,255,255,0.05)] border-t border-border/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="PDFusion Logo" width={32} height={32} />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  PDFusion
                </span>
              </h2>
            </Link>
            <p className="text-muted-foreground text-sm md:text-base">
              Your All-in-One PDF Toolkit. Secure, reliable, and completely free. Process your files in seconds without ever uploading them.
            </p>
             <p className="text-muted-foreground text-sm md:text-base">
              We believe in privacy and simplicity. That's why our tools work entirely in your browser, ensuring your files are never uploaded to a server.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 col-span-1 md:col-span-2 gap-8">
              {/* Tools Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 text-base md:text-lg">Tools</h3>
                <ul className="space-y-3">
                  {toolsLinks.map(link => (
                    <li key={link.href}>
                      <FooterLink href={link.href} label={link.label} />
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Explore Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 text-base md:text-lg">Explore</h3>
                <ul className="space-y-3">
                  {exploreLinks.map(link => (
                    <li key={link.href}>
                      <FooterLink href={link.href} label={link.label} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Socials Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 text-base md:text-lg">Connect</h3>
                <div className="flex gap-2 items-center">
                    <Link href="https://github.com/garvitkumar854" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <div className="group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-muted">
                            <Image src={theme === 'dark' ? "/github-light.svg" : "/github-dark.svg"} alt="GitHub" width={40} height={40} />
                        </div>
                    </Link>
                    <Link href="https://instagram.com/its_garvit__854_" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <div className="group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-muted">
                            <Image src="/instagram.svg" alt="Instagram" width={40} height={40} />
                        </div>
                    </Link>
                </div>
              </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border/20 text-center space-y-2">
           <p className="text-sm text-muted-foreground">
            Built with ❤️ &nbsp;&bull;&nbsp; Version 1.2.0
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}{' '}
            <span className="font-semibold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              PDFusion
            </span>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
