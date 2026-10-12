import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * Renders a print-only element, opens the print dialog, then removes it.
 * Use: const { printing, print } = usePrint(); {printing && <div className="print-area">…</div>}
 */
export function usePrint() {
  const [printing, setPrinting] = useState(false);
  const print = useCallback(() => {
    flushSync(() => setPrinting(true));
    window.print();
    setPrinting(false);
  }, []);
  return { printing, print };
}
