import { describe, expect, it } from 'vitest';
import { validateScale } from './grades';

const band = (min: number, max: number, grade = 'X') => ({ min_score: min, max_score: max, grade, remark: '' });

describe('validateScale', () => {
  it('accepts contiguous bands covering 0–100', () => {
    expect(validateScale([band(70, 100, 'A'), band(50, 69.99, 'B'), band(0, 49.99, 'F')])).toBeNull();
  });
  it('rejects gaps, overlaps and missing ends', () => {
    expect(validateScale([band(70, 100), band(0, 60)])).toMatch(/gap/);
    expect(validateScale([band(60, 100), band(0, 70)])).toMatch(/overlap/);
    expect(validateScale([band(10, 100)])).toMatch(/start at 0/);
  });
});
