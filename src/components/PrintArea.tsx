import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Content that appears only on paper. Rendered at the body root so dialogs and layouts don't offset it. */
export function PrintArea({ children, className = '' }: { children: ReactNode; className?: string }) {
  return createPortal(<div className={`print-area bg-white text-black ${className}`}>{children}</div>, document.body);
}
