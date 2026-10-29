// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { readWordDocument } from './readWord';
import { docLinesToRows } from './parseQuestions';

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';

/** A paragraph; numId/ilvl make it part of Word's automatic numbering. */
const p = (text: string, numId?: number, ilvl = 0, extra = '') =>
  `<w:p>${numId ? `<w:pPr><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${text}</w:t></w:r>${extra}</w:p>`;

const NUMBERING = `<?xml version="1.0"?><w:numbering ${NS}>
  <w:abstractNum w:abstractNumId="10"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl><w:lvl w:ilvl="1"><w:numFmt w:val="lowerLetter"/></w:lvl></w:abstractNum>
  <w:abstractNum w:abstractNumId="20"><w:lvl w:ilvl="0"><w:numFmt w:val="upperLetter"/></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="20"/></w:num>
  <w:num w:numId="3"><w:abstractNumId w:val="20"/></w:num>
</w:numbering>`;

async function docx(paragraphs: string[], { image = false } = {}) {
  const zip = new JSZip();
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document ${NS}><w:body>${paragraphs.join('')}</w:body></w:document>`);
  zip.file('word/numbering.xml', NUMBERING);
  if (image) {
    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Target="media/image1.png"/></Relationships>`);
    zip.file('word/media/image1.png', new Uint8Array([137, 80, 78, 71]));
  }
  return zip.generateAsync({ type: 'uint8array' });
}

const rowsFrom = async (file: Uint8Array) => docLinesToRows((await readWordDocument(file)).lines);

describe('Word import', () => {
  it('keeps auto-lettered options as options, not questions (the reported bug)', async () => {
    // What Word produces when a teacher types "1. …" then "A. …": a numbered list for the
    // question and a separate lettered list for the options, with no numbers in the text
    const rows = await rowsFrom(
      await docx([
        p('Mathematics test'),
        p('What is 5 × 3?', 1),
        p('8', 2), p('15', 2), p('53', 2),
        p('Answer: B'),
        p('Capital of Nigeria?', 1),
        p('Lagos', 3), p('Abuja', 3),
        p('Answer: B'),
      ]),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ question: 'What is 5 × 3?', option_a: '8', option_b: '15', option_c: '53', answer: 'B' });
    expect(rows[1]).toMatchObject({ question: 'Capital of Nigeria?', option_a: 'Lagos', option_b: 'Abuja', answer: 'B' });
  });

  it('reads options nested one level under a numbered question', async () => {
    const rows = await rowsFrom(await docx([p('Which is a mammal?', 1), p('Shark', 1, 1), p('Whale', 1, 1), p('Answer: B')]));
    expect(rows).toEqual([expect.objectContaining({ question: 'Which is a mammal?', option_a: 'Shark', option_b: 'Whale', answer: 'B' })]);
  });

  it('still reads typed numbering with no Word lists', async () => {
    const rows = await rowsFrom(await docx([p('1. Two plus two?'), p('A. 3'), p('B. 4'), p('Answer: B'), p('2. Explain photosynthesis.'), p('Marks: 5')]));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ option_a: '3', option_b: '4', answer: 'B' });
    expect(rows[1]).toMatchObject({ type: 'theory', marks: '5' });
  });

  it('brings embedded pictures along with the question', async () => {
    const blip = '<w:r><w:drawing><a:blip r:embed="rId9"/></w:drawing></w:r>';
    const { lines, images } = await readWordDocument(await docx([p('Name the shape.', 1, 0, blip), p('Square', 2), p('Circle', 2), p('Answer: A')], { image: true }));
    expect([...images.keys()]).toEqual(['word-image-1.png']);
    expect(docLinesToRows(lines)[0]).toMatchObject({ image: 'word-image-1.png', option_a: 'Square' });
  });
});
