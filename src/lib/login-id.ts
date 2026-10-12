// Turns what a person types in the login box into the email Supabase Auth knows them by.
// Staff use their real email; students their admission number; parents their phone number.
// KEEP IN SYNC with supabase/functions/_shared/login-id.ts (tested in login-id.test.ts).

export const STUDENT_DOMAIN = 'students.kingskids.internal';
export const PARENT_DOMAIN = 'parents.kingskids.internal';
export const APPLICANT_DOMAIN = 'applicants.kingskids.internal';

/** Normalises a Nigerian phone number to 234XXXXXXXXXX, or returns null if it is not one. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[\s()+-]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  if (/^0[789][01]\d{8}$/.test(digits)) return `234${digits.slice(1)}`;
  if (/^234[789][01]\d{8}$/.test(digits)) return digits;
  return null;
}

/** Admission or registration numbers such as KK/2025/014 become kk-2025-014. */
export function slugifyId(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const studentEmail = (admissionNo: string) => `${slugifyId(admissionNo)}@${STUDENT_DOMAIN}`;
export const parentEmail = (phone: string) => `${normalisePhone(phone)}@${PARENT_DOMAIN}`;
export const applicantEmail = (registrationNo: string) => `${slugifyId(registrationNo)}@${APPLICANT_DOMAIN}`;

/** Maps a login identifier to the auth email. */
export function loginEmail(identifier: string): string {
  const value = identifier.trim();
  if (value.includes('@')) return value.toLowerCase();
  if (normalisePhone(value)) return parentEmail(value);
  if (/^ent/i.test(value)) return applicantEmail(value);
  return studentEmail(value);
}

/** True for the placeholder addresses above, which cannot receive mail. */
export const isInternalEmail = (email: string | null | undefined) =>
  !!email && /@(students|parents|applicants)\.kingskids\.internal$/.test(email);
