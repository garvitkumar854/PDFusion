/**
 * Wraps the bytes produced by `pdf-lib`'s `save()` in a Blob.
 *
 * Since TypeScript 5.7 `Uint8Array` is generic over its backing buffer, and the
 * DOM lib types `BlobPart` as requiring an `ArrayBuffer`-backed view, handing
 * the result of `save()` straight to `new Blob([...])` no longer type-checks.
 * pdf-lib always backs its output with a plain `ArrayBuffer`, so the assertion
 * is safe and keeps the zero-copy path (no re-allocation of the whole document).
 */
export function createPdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
}
