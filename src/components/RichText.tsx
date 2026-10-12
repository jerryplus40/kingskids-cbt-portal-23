import { useEffect, useMemo, useState } from 'react';
import { hasMath, isKatexLoaded, loadKatex, renderRichText } from '@/lib/richtext';

/** Question, option and passage text with maths. Input is escaped; only KaTeX output is HTML. */
export function RichText({ text, className, as: Tag = 'div' }: { text: string; className?: string; as?: 'div' | 'span' }) {
  const needsKatex = hasMath(text);
  const [ready, setReady] = useState(isKatexLoaded());
  useEffect(() => {
    if (needsKatex && !ready) void loadKatex().then(() => setReady(true));
  }, [needsKatex, ready]);
  const html = useMemo(() => renderRichText(text), [text, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
