import { useCallback, useEffect, useState } from 'react';

interface LockdownEvent {
  kind: string;
  details?: Record<string, unknown>;
}

/**
 * Exam lockdown in the browser: full screen, and a record of leaving the window,
 * leaving full screen, copying and pasting. A browser cannot truly lock a computer;
 * this deters casual cheating and gives invigilators evidence.
 */
export function useLockdown(enabled: boolean, record: (event: LockdownEvent) => void) {
  const [warning, setWarning] = useState<string | null>(null);
  const [outOfFullscreen, setOutOfFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
      setOutOfFullscreen(false);
    } catch {
      // Some browsers (older iPads) refuse; the exam continues without it
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        record({ kind: 'blur', details: { at: new Date().toISOString() } });
        setWarning('You left the exam window. This has been recorded for the invigilator.');
      }
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        record({ kind: 'fullscreen_exit' });
        setOutOfFullscreen(true);
      }
    };
    const block = (kind: 'copy' | 'paste' | 'cut') => (e: ClipboardEvent) => {
      // Typing theory answers is fine; moving text in or out of the page is not
      e.preventDefault();
      record({ kind: kind === 'cut' ? 'copy' : kind });
      setWarning(kind === 'paste' ? 'Pasting is not allowed in this exam.' : 'Copying is not allowed in this exam.');
    };
    const onCopy = block('copy');
    const onCut = block('cut');
    const onPaste = block('paste');
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [enabled, record]);

  return { warning, dismissWarning: () => setWarning(null), outOfFullscreen: enabled && outOfFullscreen, enterFullscreen };
}
