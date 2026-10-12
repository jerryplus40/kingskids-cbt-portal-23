import { describe, expect, it } from 'vitest';
import { initialCalc, pressKey, type CalcKey } from './calculator';

const run = (keys: string) => keys.split(' ').reduce((s, k) => pressKey(s, k as CalcKey), initialCalc).display;

describe('calculator', () => {
  it('does arithmetic left to right, like a pocket calculator', () => {
    expect(run('1 2 + 3 =')).toBe('15');
    expect(run('2 + 3 × 4 =')).toBe('20');
    expect(run('7 ÷ 2 =')).toBe('3.5');
  });
  it('hides floating-point noise', () => {
    expect(run('0 . 1 + 0 . 2 =')).toBe('0.3');
  });
  it('handles division by zero, square roots and percentages', () => {
    expect(run('5 ÷ 0 =')).toBe('Error');
    expect(run('1 6 √')).toBe('4');
    expect(run('5 0 %')).toBe('0.5');
  });
  it('edits and clears', () => {
    expect(run('1 2 3 ⌫')).toBe('12');
    expect(run('9 ±')).toBe('-9');
    expect(run('5 ÷ 0 = C')).toBe('0');
  });
});
