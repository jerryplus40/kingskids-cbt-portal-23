export interface ItemStats {
  type: 'mcq' | 'theory';
  seen: number;
  difficulty: number;
  discrimination: number;
  options: { label: string; is_correct: boolean; chosen: number }[];
}

/** Why a question deserves a second look, in plain words. */
export function itemProblems(item: ItemStats): string[] {
  if (item.type !== 'mcq' || item.seen < 10) return [];
  const problems: string[] = [];
  const p = Number(item.difficulty);
  const d = Number(item.discrimination);
  if (p < 0.2) problems.push('Very hard: check the key is right');
  if (p > 0.9) problems.push('Very easy');
  if (d < 0) problems.push('Weaker candidates did better than stronger ones: check the key');
  else if (d < 0.2) problems.push('Does not separate strong from weak candidates');
  const correct = item.options.find((o) => o.is_correct);
  const popularWrong = item.options.filter((o) => !o.is_correct).sort((a, b) => b.chosen - a.chosen)[0];
  if (correct && popularWrong && popularWrong.chosen > correct.chosen) problems.push(`More chose ${popularWrong.label} than the key (${correct.label})`);
  const unused = item.options.filter((o) => !o.is_correct && o.chosen === 0).map((o) => o.label);
  if (unused.length) problems.push(`Nobody chose ${unused.join(', ')}`);
  return problems;
}
