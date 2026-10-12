import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Paper, SavedAnswer } from '@/features/exams/types';
import {
  clearPaper,
  clearPending,
  confirmSaved,
  isNetworkError,
  loadPaper,
  loadPending,
  mergeAnswers,
  secondsLeft,
  storePaper,
  storePending,
  type Pending,
} from './answerQueue';

export type Connection = 'online' | 'saving' | 'offline';
export type Phase = 'loading' | 'error' | 'writing' | 'submitting' | 'finished';

export interface SubmitResult {
  score: number | null;
  max_score: number | null;
  needs_marking: boolean;
  reason: 'candidate' | 'timeout';
}

interface LockdownEvent {
  kind: string;
  details?: Record<string, unknown>;
}

const HEARTBEAT_MS = 30_000;
const RETRY_MS = 5_000;

// Postgres error codes raised by the exam functions
const TIME_UP = 'P0003';
const ALREADY_SUBMITTED = 'P0002';

const clientInfo = () => ({
  user_agent: navigator.userAgent.slice(0, 200),
  screen: `${window.screen.width}x${window.screen.height}`,
  language: navigator.language,
});

/**
 * Runs one sitting: loads (or resumes) the paper, saves answers through a retrying
 * queue, keeps the clock in step with the server, and submits.
 */
export function useExamSession(examId: string) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [deadline, setDeadline] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection>('online');
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [, forceTick] = useState(0);

  const clockOffset = useRef(0);
  const pending = useRef<Pending>({});
  const events = useRef<LockdownEvent[]>([]);
  const flushing = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();
  const attemptId = paper?.attempt_id;

  const syncClock = (serverNow: string) => {
    clockOffset.current = Date.parse(serverNow) - Date.now();
  };

  // --- Load or resume ------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: startError } = await supabase.rpc('start_exam', { p_exam_id: examId, p_client_info: clientInfo() });
      if (cancelled) return;
      let loaded = data as Paper | null;
      if (startError || !loaded) {
        // No internet: carry on from the copy on this device; answers queue until it returns
        const cached = isNetworkError(startError) ? loadPaper<Paper>(examId) : null;
        if (!cached) {
          setError(isNetworkError(startError) ? 'No internet connection. Check the network and try again.' : startError?.message ?? 'Could not load the exam');
          setPhase('error');
          return;
        }
        loaded = cached;
        setConnection('offline');
      } else {
        syncClock(loaded.server_now);
        storePaper(examId, loaded);
      }
      pending.current = loadPending(loaded.attempt_id);
      setPaper(loaded);
      setDeadline(loaded.deadline_at);
      setAnswers(mergeAnswers(loaded.answers, pending.current));
      setPhase(loaded.status === 'submitted' ? 'finished' : 'writing');
    })();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  const finish = useCallback((reason: SubmitResult['reason'], payload?: Partial<SubmitResult>) => {
    if (attemptId) clearPending(attemptId);
    clearPaper(examId);
    setResult({ score: null, max_score: null, needs_marking: false, reason, ...payload });
    setPhase('finished');
  }, [attemptId, examId]);

  // --- Saving --------------------------------------------------------------
  const flush = useCallback(async () => {
    if (!attemptId || flushing.current) return;
    flushing.current = true;
    clearTimeout(retryTimer.current);
    try {
      for (const [questionId, entry] of Object.entries(pending.current)) {
        setConnection('saving');
        const { data, error: saveError } = await supabase.rpc('save_answer', {
          p_attempt_id: attemptId,
          p_question_id: questionId,
          p_option_id: entry.option_id,
          p_text: entry.text,
        });
        if (saveError) {
          if (saveError.code === TIME_UP || saveError.code === ALREADY_SUBMITTED) {
            finish('timeout');
            return;
          }
          // Anything else is treated as a dropped connection: keep the answer and retry
          setConnection('offline');
          retryTimer.current = setTimeout(() => void flush(), RETRY_MS);
          return;
        }
        syncClock((data as { server_now: string }).server_now);
        setDeadline((data as { deadline_at: string }).deadline_at);
        pending.current = confirmSaved(pending.current, questionId, entry.changedAt);
        storePending(attemptId, pending.current);
      }
      setConnection('online');
    } finally {
      flushing.current = false;
    }
    // Answers given while this flush was running
    if (Object.keys(pending.current).length) void flush();
  }, [attemptId, finish]);

  const answer = useCallback(
    (questionId: string, value: SavedAnswer, { immediate = true } = {}) => {
      if (!attemptId || phase !== 'writing') return;
      setAnswers((a) => ({ ...a, [questionId]: value }));
      pending.current = { ...pending.current, [questionId]: { ...value, changedAt: Date.now() } };
      storePending(attemptId, pending.current);
      if (immediate) void flush();
    },
    [attemptId, phase, flush],
  );

  // Theory answers are saved after typing pauses
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const typeAnswer = useCallback(
    (questionId: string, text: string) => {
      answer(questionId, { option_id: null, text }, { immediate: false });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => void flush(), 1500);
    },
    [answer, flush],
  );

  // --- Heartbeat: keeps the server informed and picks up added time --------
  const heartbeat = useCallback(async () => {
    if (!attemptId) return;
    const batch = events.current.splice(0, events.current.length);
    const { data, error: beatError } = await supabase.rpc('exam_heartbeat', { p_attempt_id: attemptId, p_events: batch });
    if (beatError) {
      events.current.unshift(...batch);
      setConnection('offline');
      return;
    }
    const beat = data as { status: string; deadline_at: string; server_now: string };
    syncClock(beat.server_now);
    setDeadline(beat.deadline_at);
    if (beat.status === 'submitted') finish('timeout');
    else if (Object.keys(pending.current).length) void flush();
    else setConnection('online');
  }, [attemptId, finish, flush]);

  useEffect(() => {
    if (phase !== 'writing') return;
    const timer = setInterval(() => void heartbeat(), HEARTBEAT_MS);
    const onOnline = () => void heartbeat();
    window.addEventListener('online', onOnline);
    if (Object.keys(pending.current).length) void flush();
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
    };
  }, [phase, heartbeat, flush]);

  const recordEvent = useCallback((event: LockdownEvent) => {
    events.current.push(event);
  }, []);

  // --- Submitting ----------------------------------------------------------
  const submit = useCallback(
    async (reason: SubmitResult['reason'] = 'candidate') => {
      if (!attemptId || phase === 'submitting' || phase === 'finished') return;
      setPhase('submitting');
      // Make one last attempt to save everything first
      await flush();
      if (Object.keys(pending.current).length && reason === 'candidate') {
        setPhase('writing');
        setError('Some answers have not reached the server. Check the connection and try again.');
        return;
      }
      const { data, error: submitError } = await supabase.rpc('submit_exam', { p_attempt_id: attemptId });
      if (submitError) {
        if (reason === 'timeout') {
          // The server grades it anyway once the deadline passes
          finish('timeout');
          return;
        }
        setPhase('writing');
        setError(`Could not submit: ${submitError.message}. Your answers are saved; try again.`);
        return;
      }
      const outcome = data as { score: number | null; max_score: number | null; needs_marking: boolean };
      finish(reason, outcome);
    },
    [attemptId, phase, flush, finish],
  );

  // --- Clock ---------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'writing') return;
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const remaining = deadline ? secondsLeft(deadline, clockOffset.current) : null;

  useEffect(() => {
    if (phase === 'writing' && remaining === 0) void submit('timeout');
  }, [phase, remaining, submit]);

  return {
    phase,
    error,
    clearError: () => setError(null),
    paper,
    answers,
    remaining,
    connection,
    unsaved: Object.keys(pending.current).length,
    result,
    answer,
    typeAnswer,
    submit,
    recordEvent,
  };
}
