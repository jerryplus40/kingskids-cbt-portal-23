import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { hasMathErrors, renderRichText } from '../richtext';

const render = (text: string) => renderRichText(text, katex);

describe('renderRichText', () => {
  it('escapes HTML so question text cannot inject markup', () => {
    const html = render('<img src=x onerror=alert(1)> & "quotes"');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('renders inline and display maths with KaTeX', () => {
    expect(render('Solve $x^2 = 4$')).toContain('class="katex"');
    expect(render('$$\\frac{1}{2}$$')).toContain('katex-display');
  });

  it('keeps escaped dollar signs as text', () => {
    const html = render('It costs \\$5 and \\$10');
    expect(html).toBe('It costs $5 and $10');
  });

  it('keeps bold and line breaks', () => {
    expect(render('**Read**\nthen answer')).toBe('<strong>Read</strong><br>then answer');
  });

  it('shows maths as source until KaTeX loads', () => {
    expect(renderRichText('$x<1$', null)).toBe('<code>x&lt;1</code>');
  });

  it('flags broken maths', () => {
    expect(hasMathErrors('$\\frac{1}{$', katex)).toBe(true);
    expect(hasMathErrors('$x+1$', katex)).toBe(false);
  });
});
