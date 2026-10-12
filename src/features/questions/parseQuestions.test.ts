import { describe, expect, it } from 'vitest';
import { docLinesToRows, parseQuestionRows, type DocLine } from './parseQuestions';
import type { Subject } from '@/types/db';

const subjects: Subject[] = [
  { id: 'math', name: 'Mathematics', code: 'MTH' },
  { id: 'eng', name: 'English Language', code: null },
];
const ctx = { subjects, existingTexts: new Set<string>(), imageFiles: new Set(['graph.png']) };
const base = { subject: 'Mathematics', question: '2 + 2 = ?', option_a: '3', option_b: '4', answer: 'b' };

describe('parseQuestionRows', () => {
  it('builds options and marks the answer, matching subject names loosely', () => {
    const { rows } = parseQuestionRows([{ ...base, subject: 'mth' }], ctx);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].value?.subject_id).toBe('math');
    expect(rows[0].value?.options).toEqual([
      { label: 'A', body: '3', is_correct: false },
      { label: 'B', body: '4', is_correct: true },
    ]);
  });

  it('rejects an answer that points at an empty option', () => {
    const { rows } = parseQuestionRows([{ ...base, answer: 'D' }], ctx);
    expect(rows[0].errors).toContain('Answer D has no option text');
  });

  it('warns about duplicates in the file and in the bank', () => {
    const { rows } = parseQuestionRows([base, { ...base }], { ...ctx, existingTexts: new Set(['2 + 2 = ?']) });
    expect(rows[1].warnings).toContain('Same question as row 2');
    expect(rows[0].warnings).toContain('Already in the question bank');
  });

  it('links questions to a shared passage given once', () => {
    const { rows, passages } = parseQuestionRows(
      [
        { ...base, passage_id: 'P1', passage: 'Long text', passage_title: 'Story' },
        { ...base, question: 'Second', passage_id: 'P1' },
      ],
      ctx,
    );
    expect(passages.P1).toEqual({ subject_id: 'math', title: 'Story', body: 'Long text' });
    expect(rows.every((r) => r.value?.passage_key === 'P1')).toBe(true);
  });

  it('fails a passage reference with no text anywhere', () => {
    const { rows } = parseQuestionRows([{ ...base, passage_id: 'P9' }], ctx);
    expect(rows[0].value).toBeNull();
    expect(rows[0].errors[0]).toMatch(/P9 has no text/);
  });

  it('checks that referenced images were chosen', () => {
    const { rows } = parseQuestionRows([{ ...base, image: 'missing.png' }, { ...base, question: 'B', image: 'Graph.png' }], ctx);
    expect(rows[0].errors[0]).toMatch(/missing.png/);
    expect(rows[1].value?.imageFile).toBe('graph.png');
  });

  it('accepts theory questions without options', () => {
    const { rows } = parseQuestionRows([{ subject: 'English Language', question: 'Write a letter', type: 'theory', marks: '10' }], ctx);
    expect(rows[0].value).toMatchObject({ type: 'theory', marks: 10, options: [] });
  });
});

describe('docLinesToRows', () => {
  const line = (text: string, extra: Partial<DocLine> = {}): DocLine => ({ text, images: [], ...extra });

  it('reads typed numbering, options, answer and extra fields', () => {
    const rows = docLinesToRows([
      line('MATHEMATICS TEST — JSS1'),
      line('1. What is 5 × 3?'),
      line('A. 8'),
      line('B) 15'),
      line('C. 53'),
      line('Answer: B'),
      line('Marks: 2'),
      line('2. Name the shape below.', { images: ['img-1'] }),
      line('a. Square'),
      line('b. Triangle'),
      line('Ans - (a)'),
      line('3. Explain why the sky is blue.'),
      line('It should be at least two sentences.'),
    ]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ question: 'What is 5 × 3?', option_a: '8', option_b: '15', option_c: '53', answer: 'B', marks: '2' });
    expect(rows[1]).toMatchObject({ option_a: 'Square', answer: 'a', image: 'img-1' });
    expect(rows[2]).toMatchObject({ type: 'theory', question: 'Explain why the sky is blue.\nIt should be at least two sentences.' });
  });

  it('reads Word automatic numbering', () => {
    const rows = docLinesToRows([
      line('Capital of Nigeria?', { listRole: 'question' }),
      line('Lagos', { listRole: 'option' }),
      line('Abuja', { listRole: 'option' }),
      line('Answer: B'),
    ]);
    expect(rows[0]).toMatchObject({ question: 'Capital of Nigeria?', option_a: 'Lagos', option_b: 'Abuja', answer: 'B' });
  });

  it('attaches an image after an option to that option', () => {
    const rows = docLinesToRows([line('1. Which graph?'), line('A. This one'), line('', { images: ['img-2'] }), line('B. That one')]);
    expect(rows[0].option_a_image).toBe('img-2');
  });
});
