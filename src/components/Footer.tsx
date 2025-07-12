"use client";

import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="py-6 border-t bg-background">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {currentYear || new Date().getFullYear()} PDFusion. All rights reserved. Built with ❤️.
        </p>
      </div>
    </footer>
  );
}
