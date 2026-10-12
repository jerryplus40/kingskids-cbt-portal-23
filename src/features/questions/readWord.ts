import type { DocLine } from './parseQuestions';

export interface WordDocument {
  lines: DocLine[];
  /** Embedded images by placeholder name (word-image-1.png …) */
  images: Map<string, Blob>;
}

const base64ToBlob = (base64: string, type: string) => {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type });
};

/** Converts a .docx into lines for docLinesToRows(), keeping Word's list structure and images. */
export async function readWordDocument(file: File): Promise<WordDocument> {
  const { default: mammoth } = await import('mammoth');
  const images = new Map<string, Blob>();
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer: await file.arrayBuffer() },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const name = `word-image-${images.size + 1}.${image.contentType.split('/')[1] ?? 'png'}`;
        images.set(name, base64ToBlob(await image.read('base64'), image.contentType));
        return { src: name };
      }),
    },
  );

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const lines: DocLine[] = [];

  const textWithoutLists = (el: Element) => {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('ol, ul').forEach((list) => list.remove());
    return clone.textContent ?? '';
  };
  const imagesIn = (el: Element) => {
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('ol, ul').forEach((list) => list.remove());
    return [...clone.querySelectorAll('img')].map((img) => img.getAttribute('src') ?? '').filter(Boolean);
  };

  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'ol' || tag === 'ul') {
      // Top-level numbered items are questions; items nested under them are options
      for (const li of el.querySelectorAll(':scope > li')) {
        lines.push({ text: textWithoutLists(li), images: imagesIn(li), listRole: 'question' });
        for (const nested of li.querySelectorAll(':scope > ol > li, :scope > ul > li')) {
          lines.push({ text: textWithoutLists(nested), images: imagesIn(nested), listRole: 'option' });
        }
      }
    } else if (tag === 'table') {
      el.querySelectorAll('p').forEach((p) => lines.push({ text: p.textContent ?? '', images: imagesIn(p) }));
    } else {
      lines.push({ text: el.textContent ?? '', images: imagesIn(el) });
    }
  };
  for (const child of doc.body.children) walk(child);
  return { lines, images };
}
