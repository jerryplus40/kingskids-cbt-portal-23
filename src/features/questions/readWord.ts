import type { DocLine } from './parseQuestions';

export interface WordDocument {
  lines: DocLine[];
  /** Embedded images by placeholder name (word-image-1.png …) */
  images: Map<string, Blob>;
}

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';

const parseXml = (text: string) => new DOMParser().parseFromString(text, 'application/xml');
const attr = (el: Element | null | undefined, name: string) => el?.getAttributeNS(W, name) ?? el?.getAttribute(`w:${name}`) ?? null;
const child = (el: Element | null | undefined, name: string) =>
  (el ? Array.from(el.children).find((c) => c.localName === name) : undefined) ?? null;

/**
 * Word's automatic numbering keeps "1." and "A." out of the paragraph text, so the only way
 * to tell a numbered question from a lettered option is the list's format in numbering.xml.
 * Returns numId → level → format ("decimal", "upperLetter", "bullet", …).
 */
export function readNumberingFormats(numberingXml: string | null): Map<string, Map<string, string>> {
  const formats = new Map<string, Map<string, string>>();
  if (!numberingXml) return formats;
  const doc = parseXml(numberingXml);
  const abstract = new Map<string, Map<string, string>>();
  for (const el of Array.from(doc.getElementsByTagNameNS(W, 'abstractNum'))) {
    const levels = new Map<string, string>();
    for (const lvl of Array.from(el.getElementsByTagNameNS(W, 'lvl'))) {
      levels.set(attr(lvl, 'ilvl') ?? '0', attr(child(lvl, 'numFmt'), 'val') ?? 'decimal');
    }
    abstract.set(attr(el, 'abstractNumId') ?? '', levels);
  }
  for (const num of Array.from(doc.getElementsByTagNameNS(W, 'num'))) {
    const levels = new Map(abstract.get(attr(child(num, 'abstractNumId'), 'val') ?? '') ?? []);
    for (const override of Array.from(num.getElementsByTagNameNS(W, 'lvlOverride'))) {
      const fmt = attr(child(child(override, 'lvl'), 'numFmt'), 'val');
      if (fmt) levels.set(attr(override, 'ilvl') ?? '0', fmt);
    }
    formats.set(attr(num, 'numId') ?? '', levels);
  }
  return formats;
}

/** Paragraph styles (e.g. "List Number") can carry numbering instead of the paragraph itself. */
function readStyleNumbering(stylesXml: string | null): Map<string, { numId: string; ilvl: string }> {
  const map = new Map<string, { numId: string; ilvl: string }>();
  if (!stylesXml) return map;
  for (const style of Array.from(parseXml(stylesXml).getElementsByTagNameNS(W, 'style'))) {
    const numPr = child(child(style, 'pPr'), 'numPr');
    const numId = attr(child(numPr, 'numId'), 'val');
    if (numId) map.set(attr(style, 'styleId') ?? '', { numId, ilvl: attr(child(numPr, 'ilvl'), 'val') ?? '0' });
  }
  return map;
}

/** How an automatically numbered paragraph should be read. */
export function listRoleFor(format: string | undefined, level: number): DocLine['listRole'] {
  if (!format || format === 'none') return undefined;
  // Letters (and roman numerals) mark options; so does anything nested under a question
  if (/letter|roman/i.test(format) || level > 0) return 'option';
  if (format === 'bullet') return 'option';
  return 'question';
}

/** Converts a .docx into lines for docLinesToRows(), keeping list structure and images. */
export async function readWordDocument(file: File | Blob | Uint8Array): Promise<WordDocument> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(file instanceof Uint8Array ? file : await file.arrayBuffer());
  const read = (path: string) => zip.file(path)?.async('string') ?? Promise.resolve(null);
  const [documentXml, numberingXml, stylesXml, relsXml] = await Promise.all([
    read('word/document.xml'),
    read('word/numbering.xml'),
    read('word/styles.xml'),
    read('word/_rels/document.xml.rels'),
  ]);
  if (!documentXml) throw new Error('This does not look like a Word .docx file');

  const formats = readNumberingFormats(numberingXml);
  const styleNumbering = readStyleNumbering(stylesXml);
  const targets = new Map<string, string>();
  if (relsXml) {
    for (const rel of Array.from(parseXml(relsXml).getElementsByTagName('Relationship'))) {
      targets.set(rel.getAttribute('Id') ?? '', rel.getAttribute('Target') ?? '');
    }
  }

  const images = new Map<string, Blob>();
  const imageNames = new Map<string, string>();
  const imageFor = async (relId: string) => {
    if (imageNames.has(relId)) return imageNames.get(relId)!;
    const target = targets.get(relId);
    const entry = target && zip.file(`word/${target.replace(/^\/?word\//, '').replace(/^\//, '')}`);
    if (!entry) return null;
    const extension = (target!.split('.').pop() ?? 'png').toLowerCase();
    const type = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : `image/${extension}`;
    const name = `word-image-${images.size + 1}.${extension}`;
    images.set(name, new Blob([await entry.async('uint8array')], { type }));
    imageNames.set(relId, name);
    return name;
  };

  const body = child(parseXml(documentXml).documentElement, 'body');
  // Every paragraph in reading order, including those inside tables
  const paragraphs = body ? Array.from(body.getElementsByTagNameNS(W, 'p')) : [];
  const lines: DocLine[] = [];
  for (const p of paragraphs) {
    let text = '';
    const pictures: string[] = [];
    for (const node of Array.from(p.getElementsByTagNameNS('*', '*'))) {
      if (node.namespaceURI === W && node.localName === 't') text += node.textContent ?? '';
      else if (node.namespaceURI === W && (node.localName === 'tab')) text += ' ';
      else if (node.namespaceURI === W && (node.localName === 'br' || node.localName === 'cr')) text += '\n';
      else if (node.namespaceURI === A && node.localName === 'blip') {
        const relId = node.getAttributeNS(R, 'embed') ?? node.getAttribute('r:embed');
        const name = relId && (await imageFor(relId));
        if (name) pictures.push(name);
      }
    }

    const pPr = child(p, 'pPr');
    const numPr = child(pPr, 'numPr');
    let numId = attr(child(numPr, 'numId'), 'val');
    let ilvl = attr(child(numPr, 'ilvl'), 'val') ?? '0';
    if (!numId) {
      const styled = styleNumbering.get(attr(child(pPr, 'pStyle'), 'val') ?? '');
      if (styled) ({ numId, ilvl } = styled);
    }
    const listRole = numId && numId !== '0' ? listRoleFor(formats.get(numId)?.get(ilvl), Number(ilvl)) : undefined;

    // Line breaks inside one paragraph read as separate lines, like separate paragraphs
    const parts = text.split('\n');
    parts.forEach((part, i) => {
      lines.push({ text: part, images: i === parts.length - 1 ? pictures : [], listRole: i === 0 ? listRole : undefined });
    });
  }
  return { lines, images };
}
