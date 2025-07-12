
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-6 border-t bg-background">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} PDFusion. All rights reserved. Built with ❤️.
        </p>
      </div>
    </footer>
  );
}
