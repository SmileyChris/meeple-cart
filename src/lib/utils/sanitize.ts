import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * The single sanitisation boundary for user-authored content.
 *
 * Nothing in the app may pass a string to `{@html}` without routing it through here.
 * `marked` does not sanitise (its `sanitize` option was removed in v5), so rendering
 * Markdown from another user without this step is stored XSS — and PocketBase keeps the
 * auth token in localStorage, so that means account takeover.
 */

const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'del',
  's',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

const ALLOWED_ATTR = ['href', 'title'];

/** Sanitise a raw HTML string, returning markup safe to pass to `{@html}`. */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  // DOMPurify needs a DOM. During SSR/prerender there isn't one, and none of our
  // `{@html}` sinks render user content server-side (it all arrives via the client-side
  // PocketBase SDK), so refusing to emit anything is the safe answer.
  if (typeof window === 'undefined') return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/** Render user-authored Markdown to sanitised HTML. */
export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return '';

  const html = marked.parse(source, { async: false, breaks: true, gfm: true }) as string;

  return sanitizeHtml(html);
}
