import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loginEmail, normalisePhone, isInternalEmail } from '../login-id';

describe('loginEmail', () => {
  it('keeps staff emails, lower-cased', () => {
    expect(loginEmail(' Teacher@KingsKids.com ')).toBe('teacher@kingskids.com');
  });

  it('maps admission numbers to student addresses', () => {
    expect(loginEmail('KK/2025/014')).toBe('kk-2025-014@students.kingskids.internal');
  });

  it('maps Nigerian phone numbers in either format to the same parent address', () => {
    expect(loginEmail('0803 123 4567')).toBe('2348031234567@parents.kingskids.internal');
    expect(loginEmail('+234 803 123 4567')).toBe('2348031234567@parents.kingskids.internal');
  });

  it('maps entrance registration numbers to applicant addresses', () => {
    expect(loginEmail('ENT/2026/0042')).toBe('ent-2026-0042@applicants.kingskids.internal');
  });

  it('does not treat short numeric admission numbers as phones', () => {
    expect(normalisePhone('2025014')).toBeNull();
    expect(loginEmail('2025014')).toBe('2025014@students.kingskids.internal');
  });

  it('recognises internal addresses', () => {
    expect(isInternalEmail('kk-1@students.kingskids.internal')).toBe(true);
    expect(isInternalEmail('a@gmail.com')).toBe(false);
  });
});

describe('edge-function copy', () => {
  it('matches src/lib/login-id.ts', () => {
    const body = (path: string, skip: number) => readFileSync(join(__dirname, path), 'utf8').split('\n').slice(skip).join('\n');
    expect(body('../../../supabase/functions/_shared/login-id.ts', 2)).toBe(body('../login-id.ts', 3));
  });
});
