import { describe, expect, it } from 'vitest';
import { itemProblems } from './itemProblems';

const options = (a: number, b: number, c: number, d: number) => [
  { label: 'A', is_correct: true, chosen: a },
  { label: 'B', is_correct: false, chosen: b },
  { label: 'C', is_correct: false, chosen: c },
  { label: 'D', is_correct: false, chosen: d },
];

describe('itemProblems', () => {
  it('stays quiet for a healthy question or too few candidates', () => {
    expect(itemProblems({ type: 'mcq', seen: 40, difficulty: 0.6, discrimination: 0.45, options: options(24, 8, 5, 3) })).toEqual([]);
    expect(itemProblems({ type: 'mcq', seen: 5, difficulty: 0, discrimination: -1, options: options(0, 5, 0, 0) })).toEqual([]);
  });

  it('points at a probable wrong key', () => {
    const problems = itemProblems({ type: 'mcq', seen: 40, difficulty: 0.1, discrimination: -0.3, options: options(4, 30, 3, 3) });
    expect(problems).toContain('Very hard: check the key is right');
    expect(problems).toContain('Weaker candidates did better than stronger ones: check the key');
    expect(problems).toContain('More chose B than the key (A)');
  });

  it('notes distractors nobody picks', () => {
    expect(itemProblems({ type: 'mcq', seen: 40, difficulty: 0.95, discrimination: 0.1, options: options(38, 2, 0, 0) })).toContain('Nobody chose C, D');
  });
});
