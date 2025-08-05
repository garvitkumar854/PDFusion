
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { Github, Instagram } from 'lucide-react';

const footerServices = [
  { href: '/merger', label: 'Merge PDF' },
  { href: '/split-pdf', label: 'Split PDF' },
  { href: '/compress-pdf', label: 'Compress PDF' },
  { href: '/pdf-to-jpg', label: 'PDF to JPG' },
];

const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/20 bg-background/95">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="PDFusion Logo" width={32} height={32} />
              <h2 className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  PDFusion
                </span>
              </h2>
            </Link>
            <p className="text-muted-foreground text-sm">
              Your All-in-One PDF Toolkit. Secure, reliable, and completely free.
            </p>
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Tools</h3>
            <ul className="space-y-2">
              {footerServices.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Explore</h3>
            <ul className="space-y-2">
              {footerLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials Section */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Connect</h3>
             <div className="flex gap-2 items-center">
                <Button asChild variant="outline" size="icon">
                    <Link href="https://github.com/garvitkumar854" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <Github className="h-4 w-4" />
                    </Link>
                </Button>
                 <Button asChild variant="outline" size="icon">
                    <Link href="https://instagram.com/its_garvit__854_" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <Instagram className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/20 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PDFusion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
