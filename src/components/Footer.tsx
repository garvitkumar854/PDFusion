"use client";

import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-6 border-t border-border/20 bg-transparent">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {currentYear}{' '}
          <span className="font-semibold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            PDFusion
          </span>
          . All rights reserved. Built with ❤️.
        </p>
      </div>
    </footer>
  );
}
