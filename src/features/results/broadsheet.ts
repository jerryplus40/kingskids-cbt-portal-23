import type { BroadsheetRow } from './types';

export interface StudentSummary {
  student_id: string;
  name: string;
  admission_no: string;
  scores: Record<string, number>; // subject → total
  subjects: number;
  grandTotal: number;
  average: number;
  position: number;
}

/** Pivots broadsheet rows to one line per student, ranked by average (1, 2, 2, 4 for ties). */
export function summariseBroadsheet(rows: BroadsheetRow[]): { subjects: string[]; students: StudentSummary[] } {
  const subjects = [...new Set(rows.map((r) => r.subject))].sort();
  const byStudent = new Map<string, StudentSummary>();
  for (const r of rows) {
    const s = byStudent.get(r.student_id) ?? {
      student_id: r.student_id, name: r.student_name, admission_no: r.admission_no, scores: {}, subjects: 0, grandTotal: 0, average: 0, position: 0,
    };
    s.scores[r.subject] = Number(r.total);
    s.subjects++;
    s.grandTotal += Number(r.total);
    byStudent.set(r.student_id, s);
  }
  const students = [...byStudent.values()].map((s) => ({ ...s, average: Math.round((s.grandTotal / s.subjects) * 100) / 100 }));
  const sorted = [...students].sort((a, b) => b.average - a.average);
  for (const s of students) s.position = sorted.findIndex((x) => x.average === s.average) + 1;
  return { subjects, students: students.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)) };
}
