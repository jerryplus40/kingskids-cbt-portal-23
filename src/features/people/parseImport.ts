import type { ParsedRow } from '@/components/ImportWizard';
import type { RawRow } from '@/lib/spreadsheet';
import { normalisePhone } from '@/lib/login-id';
import type { SchoolClass } from '@/types/db';
import type { NewUser } from './api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accepts 2014-03-09, 09/03/2014 (day first, as used in Nigeria) or 9-3-2014. */
export function parseDate(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  let year: number, month: number, day: number;
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const dmy = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (iso) [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (dmy) [day, month, year] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
  else return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

const classKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

export const STUDENT_TEMPLATE = [
  {
    admission_no: 'KK/2025/001',
    first_name: 'Adaeze',
    last_name: 'Okafor',
    other_name: 'Chioma',
    class: 'JSS1 A',
    gender: 'female',
    date_of_birth: '2013-04-21',
    guardian_first_name: 'Ngozi',
    guardian_last_name: 'Okafor',
    guardian_phone: '08031234567',
    guardian_email: 'ngozi.okafor@example.com',
    guardian_relationship: 'Mother',
  },
];

export const STAFF_TEMPLATE = [
  { first_name: 'Tunde', last_name: 'Bakare', email: 'tunde.bakare@kingskidschools.com', phone: '08051234567', role: 'teacher' },
];

export function parseStudentRows(rows: RawRow[], classes: SchoolClass[], existingAdmissionNos: Set<string>): ParsedRow<NewUser>[] {
  const classesByKey = new Map(classes.map((c) => [classKey(c.name), c]));
  const seen = new Map<string, number>();

  return rows.map((raw, index) => {
    const line = index + 2;
    const errors: string[] = [];
    const warnings: string[] = [];
    const admissionNo = raw.admission_no ?? raw.admission_number ?? '';

    if (!admissionNo) errors.push('Admission number is missing');
    if (!raw.first_name) errors.push('First name is missing');
    if (!raw.last_name) errors.push('Last name is missing');

    const key = admissionNo.toLowerCase();
    if (admissionNo && seen.has(key)) errors.push(`Same admission number as row ${seen.get(key)}`);
    if (admissionNo) seen.set(key, line);
    if (admissionNo && existingAdmissionNos.has(key)) errors.push('A student with this admission number already exists');

    let classId: string | null = null;
    if (raw.class) {
      const match = classesByKey.get(classKey(raw.class));
      if (match) classId = match.id;
      else errors.push(`Class "${raw.class}" does not exist; create it first or fix the name`);
    } else {
      warnings.push('No class; the student will not see class exams until one is set');
    }

    const gender = raw.gender?.toLowerCase();
    let parsedGender: 'male' | 'female' | null = null;
    if (gender === 'm' || gender === 'male') parsedGender = 'male';
    else if (gender === 'f' || gender === 'female') parsedGender = 'female';
    else if (gender) errors.push(`Gender "${raw.gender}" should be male or female`);

    const dob = raw.date_of_birth ? parseDate(raw.date_of_birth) : null;
    if (raw.date_of_birth && !dob) errors.push(`Date of birth "${raw.date_of_birth}" is not a date (use 2013-04-21 or 21/04/2013)`);

    let guardian: NewUser['guardian'];
    if (raw.guardian_phone) {
      if (!normalisePhone(raw.guardian_phone)) errors.push(`Guardian phone "${raw.guardian_phone}" is not a Nigerian mobile number`);
      if (!raw.guardian_first_name || !raw.guardian_last_name) errors.push('Guardian first and last name are needed with a guardian phone');
      if (raw.guardian_email && !EMAIL.test(raw.guardian_email)) errors.push(`Guardian email "${raw.guardian_email}" is not valid`);
      guardian = {
        first_name: raw.guardian_first_name ?? '',
        last_name: raw.guardian_last_name ?? '',
        phone: raw.guardian_phone,
        email: raw.guardian_email || undefined,
        relationship: raw.guardian_relationship || undefined,
      };
    } else {
      warnings.push('No guardian phone; no parent account will be created');
    }

    const value: NewUser | null = errors.length
      ? null
      : {
          role: 'student',
          first_name: raw.first_name,
          last_name: raw.last_name,
          other_name: raw.other_name || undefined,
          student: { admission_no: admissionNo, class_id: classId, gender: parsedGender, date_of_birth: dob },
          guardian,
        };
    return { line, raw, value, errors, warnings };
  });
}

export function parseStaffRows(rows: RawRow[], existingEmails: Set<string>): ParsedRow<NewUser>[] {
  const seen = new Map<string, number>();
  const roles: Record<string, NewUser['role']> = {
    teacher: 'teacher',
    admin: 'admin',
    administrator: 'admin',
    exam_officer: 'exam_officer',
    'exam officer': 'exam_officer',
  };

  return rows.map((raw, index) => {
    const line = index + 2;
    const errors: string[] = [];
    const email = (raw.email ?? '').toLowerCase();
    if (!raw.first_name) errors.push('First name is missing');
    if (!raw.last_name) errors.push('Last name is missing');
    if (!EMAIL.test(email)) errors.push(email ? `Email "${raw.email}" is not valid` : 'Email is missing');
    if (email && seen.has(email)) errors.push(`Same email as row ${seen.get(email)}`);
    if (email) seen.set(email, line);
    if (existingEmails.has(email)) errors.push('A staff account with this email already exists');
    const role = roles[(raw.role || 'teacher').toLowerCase()];
    if (!role) errors.push(`Role "${raw.role}" should be teacher, exam_officer or admin`);

    const value: NewUser | null = errors.length
      ? null
      : { role, first_name: raw.first_name, last_name: raw.last_name, email, phone: raw.phone || undefined };
    return { line, raw, value, errors, warnings: [] };
  });
}
