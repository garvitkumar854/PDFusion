/**
 * Single entry point for pdf.js.
 *
 * pdf.js needs the URL of its worker script. Every tool used to configure this
 * on its own, and half of them pointed at the unpkg CDN. That made the tools
 * depend on a third-party host at runtime (they broke offline, which defeats
 * the PWA, and it contradicts the "everything stays on your device" promise).
 *
 * Importing this module configures the worker once, from the copy that
 * Next/webpack bundles with the app.
 */
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
}

export * from 'pdfjs-dist/legacy/build/pdf.mjs';
