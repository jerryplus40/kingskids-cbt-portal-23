import { describe, expect, it } from 'vitest';
import { scoreAnswers } from '../grading';

const questions = [{ correctAnswer: 'A' }, { correctAnswer: 'B' }, { correctAnswer: 'C' }];

describe('scoreAnswers', () => {
  it('counts only matching answers', () => {
    expect(scoreAnswers(questions, { 0: 'A', 1: 'C', 2: 'C' })).toBe(2);
  });

  it('scores an empty sheet as zero', () => {
    expect(scoreAnswers(questions, {})).toBe(0);
  });
});
