import type { ParsedRow } from '@/components/ImportWizard';
import type { RawRow } from '@/lib/spreadsheet';
import { hasMathErrors } from '@/lib/richtext';
import type { Subject } from '@/types/db';
import { OPTION_LABELS, type Difficulty, type ImportPassage, type ImportQuestion, type OptionLabel } from './types';

export const QUESTION_TEMPLATE = [
  {
    subject: 'Mathematics', class_level: 'JSS1', topic: 'Linear equations', difficulty: 'medium', type: 'mcq',
    question: 'Solve for $x$: $2x + 5 = 13$',
    option_a: '$x = 3$', option_b: '$x = 4$', option_c: '$x = 5$', option_d: '$x = 6$', option_e: '',
    answer: 'B', marks: 1, passage_id: '', passage_title: '', passage: '', image: '',
    explanation: 'Subtract 5, then divide by 2',
  },
  {
    subject: 'English Language', class_level: 'JSS1', topic: 'Comprehension', difficulty: 'easy', type: 'mcq',
    question: 'Why did Ade leave the market early?',
    option_a: 'He was ill', option_b: 'He was late', option_c: 'It started to rain', option_d: 'He was tired', option_e: '',
    answer: 'C', marks: 1, passage_id: 'P1', passage_title: 'Market day',
    passage: 'Ade went to the market with his mother. Dark clouds gathered, and before long heavy rain began to fall…',
    image: '', explanation: '',
  },
  {
    subject: 'Basic Science', class_level: 'JSS1', topic: 'Plants', difficulty: 'medium', type: 'theory',
    question: 'Explain two ways plants are useful to humans.',
    option_a: '', option_b: '', option_c: '', option_d: '', option_e: '',
    answer: '', marks: 4, passage_id: '', passage_title: '', passage: '', image: 'plant-diagram.png', explanation: '',
  },
];

const normalise = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');

export interface QuestionImportContext {
  subjects: Subject[];
  /** Subject to use when a row has none (e.g. Word imports) */
  defaultSubjectId?: string;
  /** content hashes (normalised text) already in the bank, for duplicate warnings */
  existingTexts: Set<string>;
  /** file names of images chosen alongside the spreadsheet */
  imageFiles: Set<string>;
}

export interface ParsedQuestions {
  rows: ParsedRow<ImportQuestion>[];
  passages: Record<string, ImportPassage>;
}

/** Validates spreadsheet rows (one question per row) against the template above. */
export function parseQuestionRows(rows: RawRow[], ctx: QuestionImportContext): ParsedQuestions {
  const subjectsByName = new Map(ctx.subjects.flatMap((s) => [[normalise(s.name), s], ...(s.code ? [[normalise(s.code), s] as const] : [])]));
  const passages: Record<string, ImportPassage> = {};
  const seenText = new Map<string, number>();

  const parsed = rows.map((raw, index): ParsedRow<ImportQuestion> => {
    const line = index + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const subject = raw.subject ? subjectsByName.get(normalise(raw.subject)) : ctx.subjects.find((s) => s.id === ctx.defaultSubjectId);
    if (!subject) errors.push(raw.subject ? `Subject "${raw.subject}" does not exist` : 'Subject is missing');

    const body = raw.question ?? '';
    if (!body.trim()) errors.push('Question text is missing');
    if (body && hasMathErrors(body)) warnings.push('Some maths in the question will not display; check the $…$ parts');

    const type = (raw.type || 'mcq').toLowerCase() === 'theory' ? 'theory' : 'mcq';
    if (raw.type && !['mcq', 'theory'].includes(raw.type.toLowerCase())) errors.push(`Type "${raw.type}" should be mcq or theory`);

    const difficulty = (raw.difficulty || 'medium').toLowerCase() as Difficulty;
    if (!['easy', 'medium', 'hard'].includes(difficulty)) errors.push(`Difficulty "${raw.difficulty}" should be easy, medium or hard`);

    const marks = raw.marks ? Number(raw.marks) : 1;
    if (!(marks > 0 && marks <= 100)) errors.push(`Marks "${raw.marks}" should be a number from 0.5 to 100`);

    const options = OPTION_LABELS.map((label) => ({ label, body: raw[`option_${label.toLowerCase()}`] ?? '' })).filter((o) => o.body.trim());
    const answer = (raw.answer ?? '').trim().toUpperCase() as OptionLabel;
    if (type === 'mcq') {
      if (options.length < 2) errors.push('A multiple-choice question needs at least two options');
      if (!answer) errors.push('Answer is missing (A, B, C, D or E)');
      else if (!options.some((o) => o.label === answer)) errors.push(`Answer ${answer} has no option text`);
      // Gaps (A, B, D) usually mean a column was shifted
      const labels = options.map((o) => o.label).join('');
      if (labels && !'ABCDE'.startsWith(labels)) warnings.push(`Options ${labels.split('').join(', ')} skip a letter`);
      for (const o of options) if (hasMathErrors(o.body)) warnings.push(`Maths in option ${o.label} will not display`);
    } else if (options.length) {
      warnings.push('Options are ignored for theory questions');
    }

    const isUrl = (value?: string) => /^https?:\/\//.test(value ?? '');
    const optionImageFiles: Partial<Record<OptionLabel, string>> = {};
    for (const [field, label] of [['image', null], ...OPTION_LABELS.map((l) => [`option_${l.toLowerCase()}_image`, l] as const)] as const) {
      const file = raw[field];
      if (!file || isUrl(file)) continue;
      if (!ctx.imageFiles.has(file.toLowerCase())) errors.push(`Image "${file}" was not among the images you chose`);
      else if (label) optionImageFiles[label] = file.toLowerCase();
    }

    const key = normalise(body);
    if (key && seenText.has(key)) warnings.push(`Same question as row ${seenText.get(key)}`);
    if (key) seenText.set(key, line);
    if (key && ctx.existingTexts.has(key)) warnings.push('Already in the question bank');

    let passageKey: string | undefined;
    if (raw.passage_id) {
      passageKey = raw.passage_id.trim();
      if (raw.passage?.trim() && subject) {
        if (passages[passageKey] && passages[passageKey].body !== raw.passage.trim()) {
          errors.push(`Passage ${passageKey} is given twice with different text`);
        } else {
          passages[passageKey] = { subject_id: subject.id, title: raw.passage_title ?? '', body: raw.passage.trim() };
        }
      }
    }

    const value: ImportQuestion | null =
      errors.length || !subject
        ? null
        : {
            subject_id: subject.id,
            class_level: raw.class_level?.toUpperCase().replace(/\s+/g, '') || undefined,
            topic: raw.topic || undefined,
            difficulty,
            type,
            body,
            passage_key: passageKey,
            marks,
            explanation: raw.explanation || undefined,
            options: type === 'mcq' ? options.map((o) => ({ ...o, is_correct: o.label === answer })) : [],
            image_url: isUrl(raw.image) ? raw.image : undefined,
            imageFile: raw.image && !isUrl(raw.image) ? raw.image.toLowerCase() : undefined,
            optionImageFiles,
          };
    return { line, raw, value, errors, warnings };
  });

  // A passage referenced but never given text
  for (const row of parsed) {
    if (row.value?.passage_key && !passages[row.value.passage_key]) {
      row.errors.push(`Passage ${row.value.passage_key} has no text; put it in the passage column of its first row`);
      row.value = null;
    }
  }
  return { rows: parsed, passages };
}

/**
 * Word documents in the fixed layout:
 *   1. Question text          (or an automatically numbered list item)
 *   A. option                 (A–E; or a nested list)
 *   Answer: B
 *   Marks: 2                  (optional)
 *   Topic: Fractions          (optional)
 *   Explanation: …            (optional)
 * Lines that match none of these continue the question (or the last option).
 * A question with no options is a theory question. [image:N] marks an embedded image.
 */
export interface DocLine {
  text: string;
  /** 'question' / 'option' when Word's automatic numbering produced the line */
  listRole?: 'question' | 'option';
  images: string[];
}

export function docLinesToRows(lines: DocLine[]): RawRow[] {
  const rows: RawRow[] = [];
  let current: RawRow | null = null;
  let lastField = 'question';
  let autoOption = 0;

  const flush = () => {
    if (current) rows.push(current);
    current = null;
  };
  const append = (field: string, text: string) => {
    if (!current) return;
    current[field] = current[field] ? `${current[field]}\n${text}` : text;
  };

  for (const line of lines) {
    const text = line.text.trim();
    const numbered = text.match(/^(?:Q(?:uestion)?\s*)?(\d{1,3})\s*[.):-]\s*(.*)$/i);
    const option = text.match(/^\(?([A-Ea-e])\s*[.):]\s*(.*)$/);
    const field = text.match(/^(answer|ans|marks?|topic|explanation|difficulty)\s*[:\-–]\s*(.*)$/i);

    if (line.listRole === 'question' || (numbered && !line.listRole)) {
      flush();
      current = { question: line.listRole === 'question' ? text : numbered![2] };
      lastField = 'question';
      autoOption = 0;
    } else if (!current) {
      continue; // title, instructions before the first question
    } else if (line.listRole === 'option') {
      const label = OPTION_LABELS[autoOption++];
      if (label) {
        current[`option_${label.toLowerCase()}`] = text;
        lastField = `option_${label.toLowerCase()}`;
      }
    } else if (option && (lastField.startsWith('option') || lastField === 'question') && option[2]) {
      const key = `option_${option[1].toLowerCase()}`;
      current[key] = option[2];
      lastField = key;
    } else if (field) {
      const name = field[1].toLowerCase();
      const key = name.startsWith('ans') ? 'answer' : name.startsWith('mark') ? 'marks' : name;
      current[key] = field[2].trim().replace(/^\(?([A-Ea-e])\)?\.?$/, '$1');
      lastField = key;
    } else if (text) {
      append(lastField === 'answer' || lastField === 'marks' ? 'question' : lastField, text);
    }

    for (const image of line.images) {
      if (lastField.startsWith('option')) current![`${lastField}_image`] = image;
      else current!.image = current!.image ?? image;
    }
  }
  flush();

  for (const row of rows) {
    if (!OPTION_LABELS.some((l) => row[`option_${l.toLowerCase()}`])) row.type = 'theory';
  }
  return rows;
}
