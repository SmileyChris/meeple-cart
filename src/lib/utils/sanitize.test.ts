import { describe, it, expect } from 'vitest';
import { renderMarkdown, sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });

  it('strips inline event handlers', () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).not.toContain('onerror');
  });

  it('strips javascript: urls', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  it('strips iframes', () => {
    expect(sanitizeHtml('<iframe src="https://evil.example"></iframe>')).toBe('');
  });

  it('strips svg-based payloads', () => {
    expect(sanitizeHtml('<svg><animate onbegin="alert(1)" /></svg>')).not.toContain('onbegin');
  });

  it('keeps safe formatting markup', () => {
    expect(sanitizeHtml('<p><strong>bold</strong> and <em>italic</em></p>')).toBe(
      '<p><strong>bold</strong> and <em>italic</em></p>'
    );
  });

  it('keeps safe links', () => {
    const result = sanitizeHtml('<a href="https://boardgamegeek.com">bgg</a>');
    expect(result).toContain('href="https://boardgamegeek.com"');
  });

  it('returns an empty string for nullish input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});

describe('renderMarkdown', () => {
  it('renders markdown emphasis', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('strips embedded html payloads from markdown', () => {
    const result = renderMarkdown('hello <script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('hello');
  });

  it('strips javascript: urls written as markdown links', () => {
    const result = renderMarkdown('[click](javascript:alert(1))');
    expect(result).not.toContain('javascript:');
  });

  it('returns an empty string for nullish input', () => {
    expect(renderMarkdown(null)).toBe('');
    expect(renderMarkdown(undefined)).toBe('');
  });
});
