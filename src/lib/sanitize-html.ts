import DOMPurify from 'dompurify';

/**
 * The Markdown preview and the AI summary are both injected with
 * `dangerouslySetInnerHTML`. `marked` passes raw HTML straight through —
 * `marked.parse('<script>alert(1)</script>')` returns the script tag untouched —
 * so anything rendered this way has to be sanitized first.
 *
 * `USE_PROFILES: { html: true }` keeps normal formatting markup and drops
 * scripts, event handlers and `javascript:` URLs.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
}

/** Strips tags so word/character counters don't count markup. */
export function htmlToPlainText(html: string): string {
  if (typeof window === 'undefined') return html;
  return new DOMParser().parseFromString(html, 'text/html').body.textContent || '';
}
