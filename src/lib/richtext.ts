import type katexType from 'katex';

type Katex = typeof katexType;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const MATH = /\$\$([\s\S]+?)\$\$|(?<!\\)\$([^$\n]+?)(?<!\\)\$/g;

/** True when the text holds $…$ maths, which needs KaTeX. */
export const hasMath = (text: string) => new RegExp(MATH.source).test(text);

// KaTeX is ~75 kB gzipped; load it only for text that actually contains maths
let katex: Katex | null = null;
let loading: Promise<Katex> | null = null;
export function loadKatex(): Promise<Katex> {
  loading ??= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([module]) => (katex = module.default));
  return loading;
}
export const isKatexLoaded = () => katex !== null;

/**
 * Turns question text into safe HTML: everything is escaped except maths between
 * $…$ (inline) or $$…$$ (display), which KaTeX renders. **bold** and line breaks are kept.
 * Write \$ for a literal dollar sign (e.g. prices). Until KaTeX has loaded, maths shows as source.
 */
export function renderRichText(text: string, renderer: Katex | null = katex): string {
  const parts: string[] = [];
  let last = 0;
  for (const match of text.matchAll(MATH)) {
    parts.push(formatPlain(text.slice(last, match.index)));
    const source = (match[1] ?? match[2]).trim();
    const display = match[1] !== undefined;
    parts.push(
      renderer
        ? renderer.renderToString(source, { displayMode: display, throwOnError: false, trust: false, strict: 'ignore', output: 'html' })
        : `<code>${escapeHtml(source)}</code>`,
    );
    last = (match.index ?? 0) + match[0].length;
  }
  parts.push(formatPlain(text.slice(last)));
  return parts.join('');
}

function formatPlain(text: string): string {
  return escapeHtml(text.replace(/\\\$/g, '$'))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/** True if KaTeX cannot parse some maths in the text. Needs KaTeX loaded; false otherwise. */
export function hasMathErrors(text: string, renderer: Katex | null = katex): boolean {
  return !!renderer && hasMath(text) && renderRichText(text, renderer).includes('katex-error');
}
