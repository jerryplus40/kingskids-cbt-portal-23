// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { confirmSaved, formatClock, isAnswered, loadPending, mergeAnswers, secondsLeft, storePending } from './answerQueue';

describe('answer queue', () => {
  beforeEach(() => localStorage.clear());

  it('survives a reload through localStorage', () => {
    storePending('a1', { q1: { option_id: 'o1', text: null, changedAt: 1 } });
    expect(loadPending('a1').q1.option_id).toBe('o1');
    storePending('a1', {});
    expect(loadPending('a1')).toEqual({});
  });

  it('lays unsaved answers over the server copy', () => {
    const merged = mergeAnswers(
      { q1: { option_id: 'old', text: null }, q2: { option_id: 'x', text: null } },
      { q1: { option_id: 'new', text: null, changedAt: 5 } },
    );
    expect(merged).toEqual({ q1: { option_id: 'new', text: null }, q2: { option_id: 'x', text: null } });
  });

  it('keeps an answer changed again while its save was in flight', () => {
    const pending = { q1: { option_id: 'b', text: null, changedAt: 2 } };
    expect(confirmSaved(pending, 'q1', 1)).toBe(pending);
    expect(confirmSaved(pending, 'q1', 2)).toEqual({});
  });

  it('treats blank theory answers as unanswered', () => {
    expect(isAnswered({ option_id: null, text: '   ' })).toBe(false);
    expect(isAnswered({ option_id: null, text: 'Plants' })).toBe(true);
  });
});

describe('clock', () => {
  it('uses the server clock, not the device clock', () => {
    const now = Date.parse('2026-10-12T10:00:00Z');
    // Device is 2 minutes slow: server time = device + 120 s
    expect(secondsLeft('2026-10-12T10:10:00Z', 120_000, now)).toBe(480);
  });

  it('never goes negative and formats hours only when needed', () => {
    expect(secondsLeft('2026-10-12T09:00:00Z', 0, Date.parse('2026-10-12T10:00:00Z'))).toBe(0);
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(3725)).toBe('1:02:05');
  });
});
