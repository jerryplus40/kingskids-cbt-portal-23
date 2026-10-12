import type { SavedAnswer } from '@/features/exams/types';

/**
 * Answers the candidate has given that the server has not confirmed yet.
 * Kept in localStorage too, so a refresh or power cut before a save loses nothing.
 */
export type Pending = Record<string, SavedAnswer & { changedAt: number }>;

const storageKey = (attemptId: string) => `kk-exam-pending-${attemptId}`;

export function loadPending(attemptId: string): Pending {
  try {
    return JSON.parse(localStorage.getItem(storageKey(attemptId)) ?? '{}') as Pending;
  } catch {
    return {};
  }
}

export function storePending(attemptId: string, pending: Pending) {
  try {
    if (Object.keys(pending).length === 0) localStorage.removeItem(storageKey(attemptId));
    else localStorage.setItem(storageKey(attemptId), JSON.stringify(pending));
  } catch {
    // Storage full or blocked: the in-memory queue still retries
  }
}

export const clearPending = (attemptId: string) => storePending(attemptId, {});

/** Server answers with any unsaved local answers laid on top. */
export function mergeAnswers(server: Record<string, SavedAnswer>, pending: Pending): Record<string, SavedAnswer> {
  const merged = { ...server };
  for (const [questionId, { option_id, text }] of Object.entries(pending)) merged[questionId] = { option_id, text };
  return merged;
}

/** Removes an entry once saved, unless the candidate changed it again while the save was in flight. */
export function confirmSaved(pending: Pending, questionId: string, savedChangedAt: number): Pending {
  if (pending[questionId]?.changedAt !== savedChangedAt) return pending;
  const next = { ...pending };
  delete next[questionId];
  return next;
}

export const isAnswered = (answer?: SavedAnswer) => !!answer && (!!answer.option_id || !!answer.text?.trim());

/** Seconds left, using the offset between server and device clocks measured at the last server reply. */
export function secondsLeft(deadlineIso: string, clockOffsetMs: number, now = Date.now()): number {
  return Math.max(0, Math.floor((Date.parse(deadlineIso) - (now + clockOffsetMs)) / 1000));
}

export function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
