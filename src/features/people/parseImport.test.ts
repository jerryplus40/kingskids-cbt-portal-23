import { describe, expect, it } from 'vitest';
import { parseDate, parseStaffRows, parseStudentRows } from './parseImport';
import type { SchoolClass } from '@/types/db';

const classes = [{ id: 'c1', level: 'JSS1', arm: 'A', name: 'JSS1 A', stream: null, sort_order: 0, class_teacher_id: null }] as SchoolClass[];

describe('parseDate', () => {
  it('reads ISO and day-first dates', () => {
    expect(parseDate('2013-04-21')).toBe('2013-04-21');
    expect(parseDate('21/04/2013')).toBe('2013-04-21');
  });
  it('rejects impossible dates', () => {
    expect(parseDate('31/02/2013')).toBeNull();
    expect(parseDate('April 2013')).toBeNull();
  });
});

describe('parseStudentRows', () => {
  const row = {
    admission_no: 'KK/1',
    first_name: 'Ada',
    last_name: 'Obi',
    class: 'jss1a',
    gender: 'F',
    guardian_first_name: 'Ngozi',
    guardian_last_name: 'Obi',
    guardian_phone: '0803 123 4567',
  };

  it('accepts a complete row and matches the class loosely', () => {
    const [parsed] = parseStudentRows([row], classes, new Set());
    expect(parsed.errors).toEqual([]);
    expect(parsed.value?.student).toMatchObject({ admission_no: 'KK/1', class_id: 'c1', gender: 'female' });
    expect(parsed.value?.guardian?.phone).toBe('0803 123 4567');
  });

  it('flags duplicates within the file and against existing students', () => {
    const parsed = parseStudentRows([row, { ...row, first_name: 'Bola' }], classes, new Set(['kk/1']));
    expect(parsed[0].errors).toContain('A student with this admission number already exists');
    expect(parsed[1].errors).toContain('Same admission number as row 2');
  });

  it('reports an unknown class and a bad phone', () => {
    const [parsed] = parseStudentRows([{ ...row, class: 'SS9 Z', guardian_phone: '12345' }], classes, new Set());
    expect(parsed.value).toBeNull();
    expect(parsed.errors.join(' ')).toMatch(/SS9 Z/);
    expect(parsed.errors.join(' ')).toMatch(/12345/);
  });

  it('warns but accepts a row without a guardian', () => {
    const [parsed] = parseStudentRows([{ admission_no: 'KK/2', first_name: 'A', last_name: 'B', class: 'JSS1 A' }], classes, new Set());
    expect(parsed.value).not.toBeNull();
    expect(parsed.warnings[0]).toMatch(/guardian/);
  });
});

describe('parseStaffRows', () => {
  it('defaults the role to teacher and checks the email', () => {
    const parsed = parseStaffRows(
      [
        { first_name: 'T', last_name: 'B', email: 'T@School.com' },
        { first_name: 'X', last_name: 'Y', email: 'bad', role: 'cleaner' },
      ],
      new Set(),
    );
    expect(parsed[0].value).toMatchObject({ role: 'teacher', email: 't@school.com' });
    expect(parsed[1].errors).toHaveLength(2);
  });
});
