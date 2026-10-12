import type { GradeBand } from './types';

/** Same rule as grade_for() in the database: round to 2 decimals, then find the band. */
export const gradeFor = (total: number, scale: GradeBand[]) => {
  const score = Math.round(total * 100) / 100;
  return scale.find((g) => score >= Number(g.min_score) && score <= Number(g.max_score));
};

export type GradeBandDraft = Omit<GradeBand, 'id'> & { id?: string };

/** Checks that the bands cover 0–100 without gaps or overlaps (to 2 decimals). */
export function validateScale(bands: GradeBandDraft[]): string | null {
  const sorted = [...bands].sort((a, b) => Number(a.min_score) - Number(b.min_score));
  if (!sorted.length) return 'Add at least one grade';
  if (sorted.some((b) => !b.grade.trim())) return 'Every band needs a grade';
  if (Number(sorted[0].min_score) !== 0) return 'The lowest band must start at 0';
  if (Number(sorted.at(-1)!.max_score) !== 100) return 'The highest band must end at 100';
  for (let i = 1; i < sorted.length; i++) {
    const gap = Math.round((Number(sorted[i].min_score) - Number(sorted[i - 1].max_score)) * 100) / 100;
    if (gap !== 0.01) return `Check the bands around ${sorted[i].grade}: they overlap or leave a gap`;
  }
  return null;
}
