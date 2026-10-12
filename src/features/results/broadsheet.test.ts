import { describe, expect, it } from 'vitest';
import { summariseBroadsheet } from './broadsheet';
import type { BroadsheetRow } from './types';

const row = (student: string, subject: string, total: number) =>
  ({ student_id: student, student_name: student, admission_no: student, subject, total }) as BroadsheetRow;

describe('summariseBroadsheet', () => {
  it('averages over the subjects each student took and shares tied positions', () => {
    const { subjects, students } = summariseBroadsheet([
      row('Ada', 'Maths', 80), row('Ada', 'English', 70),
      row('Bola', 'Maths', 75), row('Bola', 'English', 75),
      row('Chidi', 'Maths', 60),
    ]);
    expect(subjects).toEqual(['English', 'Maths']);
    expect(students.map((s) => [s.name, s.average, s.position])).toEqual([
      ['Ada', 75, 1],
      ['Bola', 75, 1],
      ['Chidi', 60, 3],
    ]);
  });
});
