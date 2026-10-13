import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './harness';

let t: TestDb;
let admin: string, teacher: string, classTeacher: string, outsiderTeacher: string, parent: string;
let ada: string, bola: string, chidi: string;
let classId: string, mathId: string, engId: string, termId: string;

const report = async (user: string, studentId: string) =>
  (await t.as<{ r: Record<string, any> }>(user, `select report_card($1, $2) as r`, [studentId, termId]))[0].r; // eslint-disable-line @typescript-eslint/no-explicit-any

beforeAll(async () => {
  t = await createTestDb();
  admin = await t.createUser('admin');
  teacher = await t.createUser('teacher');
  classTeacher = await t.createUser('teacher');
  outsiderTeacher = await t.createUser('teacher');
  parent = await t.createUser('parent');
  ada = await t.createUser('student', { first_name: 'Ada', last_name: 'Obi' });
  bola = await t.createUser('student', { first_name: 'Bola', last_name: 'Ade' });
  chidi = await t.createUser('student', { first_name: 'Chidi', last_name: 'Eze' });

  [{ id: classId }] = await t.as<{ id: string }>(admin, `insert into classes (level, arm, class_teacher_id) values ('JSS1', 'A', $1) returning id`, [classTeacher]);
  [{ id: mathId }] = await t.as<{ id: string }>(admin, `insert into subjects (name) values ('Mathematics') returning id`);
  [{ id: engId }] = await t.as<{ id: string }>(admin, `insert into subjects (name) values ('English') returning id`);
  const [{ id: sessionId }] = await t.as<{ id: string }>(admin, `insert into sessions (name) values ('2025/2026') returning id`);
  [{ id: termId }] = await t.as<{ id: string }>(admin, `insert into terms (session_id, term) values ($1, 1) returning id`, [sessionId]);
  await t.as(admin, `insert into class_subjects (class_id, subject_id, teacher_id) values ($1, $2, $3), ($1, $4, $3)`, [classId, mathId, teacher, engId]);
  await t.as(admin, `insert into students (id, admission_no, class_id) values ($1, 'A1', $4), ($2, 'A2', $4), ($3, 'A3', $4)`, [ada, bola, chidi, classId]);
  await t.as(admin, `insert into student_guardians (student_id, guardian_id) values ($1, $2)`, [ada, parent]);
  await t.as(null, `update profiles set phone = '2348031234567' where id = $1`, [parent]);
});

describe('term scores', () => {
  it('pulls CBT scores scaled to the CA and exam weights', async () => {
    // A term exam marked out of 50: Ada scores 40 → 40/50 × 60 = 48
    const [{ id: examId }] = await t.as<{ id: string }>(
      teacher,
      `insert into exams (title, duration_minutes, class_id, subject_id, term_id, counts_as, created_by) values ('Maths exam', 60, $1, $2, $3, 'exam', $4) returning id`,
      [classId, mathId, termId, teacher],
    );
    await t.as(null, `insert into attempts (exam_id, candidate_id, deadline_at, layout, status, score, max_score) values ($1, $2, now(), '[]', 'submitted', 40, 50)`, [examId, ada]);
    const [{ n }] = await t.as<{ n: number }>(teacher, `select pull_cbt_scores($1, $2, $3) as n`, [termId, classId, mathId]);
    expect(n).toBe(1);
    const [row] = await t.as<{ exam_score: string; ca_score: string | null }>(teacher, `select exam_score, ca_score from term_scores where student_id = $1`, [ada]);
    expect(Number(row.exam_score)).toBe(48);
    expect(row.ca_score).toBeNull();
  });

  it('refuses scores above the weight', async () => {
    await expect(
      t.as(teacher, `insert into term_scores (student_id, term_id, subject_id, ca_score) values ($1, $2, $3, 41)`, [bola, termId, mathId]),
    ).rejects.toThrow(/more than 40/);
  });

  it('stops a teacher entering scores for a subject they do not teach', async () => {
    await expect(
      t.as(outsiderTeacher, `insert into term_scores (student_id, term_id, subject_id, ca_score) values ($1, $2, $3, 10)`, [bola, termId, mathId]),
    ).rejects.toThrow(/row-level security/);
  });

  it('ranks subjects and overall with shared positions for ties', async () => {
    const scores: [string, string, number, number][] = [
      [ada, mathId, 30, 48], // 78 (exam already pulled; CA added)
      [bola, mathId, 30, 48], // 78, tie with Ada
      [chidi, mathId, 20, 30], // 50
      [ada, engId, 35, 50], // 85
      [bola, engId, 20, 30], // 50
      [chidi, engId, 30, 40], // 70
    ];
    for (const [student, subject, ca, exam] of scores) {
      await t.as(
        teacher,
        `insert into term_scores (student_id, term_id, subject_id, ca_score, exam_score) values ($1, $2, $3, $4, $5)
         on conflict (student_id, term_id, subject_id) do update set ca_score = excluded.ca_score, exam_score = excluded.exam_score`,
        [student, termId, subject, ca, exam],
      );
    }
    const sheet = await t.as<{ student_id: string; subject: string; total: string; grade: string; subject_position: number }>(
      classTeacher,
      `select * from class_broadsheet($1, $2)`,
      [termId, classId],
    );
    const maths = sheet.filter((r) => r.subject === 'Mathematics');
    expect(maths.find((r) => r.student_id === ada)).toMatchObject({ subject_position: 1, grade: 'A1' });
    expect(maths.find((r) => r.student_id === bola)?.subject_position).toBe(1);
    expect(maths.find((r) => r.student_id === chidi)).toMatchObject({ subject_position: 3, grade: 'C6' });
  });

  it('hides the broadsheet from teachers outside the class', async () => {
    await expect(t.as(outsiderTeacher, `select * from class_broadsheet($1, $2)`, [termId, classId])).rejects.toThrow(/cannot view/);
  });
});

describe('report cards and release', () => {
  it('keeps the report card from the student and parent until release', async () => {
    await expect(report(ada, ada)).rejects.toThrow(/not available/);
    await expect(report(parent, ada)).rejects.toThrow(/not available/);
    const r = await report(classTeacher, ada);
    expect(r.released).toBe(false);
    expect(r.overall).toMatchObject({ position: 1, class_size: 3 }); // Ada averages 81.5
  });

  it('lets the class teacher comment but not write the principal’s comment', async () => {
    await t.as(classTeacher, `insert into report_comments (student_id, term_id, class_teacher_comment, days_present, days_open) values ($1, $2, 'A hard worker', 58, 60)`, [ada, termId]);
    await expect(
      t.as(classTeacher, `update report_comments set principal_comment = 'Promoted' where student_id = $1 and term_id = $2`, [ada, termId]),
    ).rejects.toThrow(/principal/);
    await t.as(admin, `update report_comments set principal_comment = 'Excellent result' where student_id = $1 and term_id = $2`, [ada, termId]);
  });

  it('stops teachers releasing results', async () => {
    await expect(t.as(classTeacher, `insert into result_releases (term_id, class_id) values ($1, $2)`, [termId, classId])).rejects.toThrow(/row-level security/);
  });

  it('on release, opens the report card, notifies the family and queues an SMS', async () => {
    await t.as(admin, `insert into result_releases (term_id, class_id) values ($1, $2)`, [termId, classId]);
    const r = await report(parent, ada);
    expect(r.released).toBe(true);
    expect(r.comments).toMatchObject({ class_teacher_comment: 'A hard worker', principal_comment: 'Excellent result', days_present: 58 });
    expect(r.subjects).toHaveLength(2);

    const notes = await t.as<{ title: string }>(parent, `select title from notifications`);
    expect(notes.map((n) => n.title)).toContain('Report card ready');
    const sms = await t.as<{ recipient: string; body: string }>(null, `select recipient, body from message_outbox where channel = 'sms'`);
    expect(sms).toHaveLength(1);
    expect(sms[0].recipient).toBe('2348031234567');
    expect(sms[0].body).toMatch(/Ada's First term 2025\/2026 report card is ready/);

    const cards = await t.as<{ term: number }>(parent, `select * from my_report_cards($1)`, [ada]);
    expect(cards).toHaveLength(1);
  });

  it('freezes released scores for teachers', async () => {
    await expect(
      t.as(teacher, `update term_scores set ca_score = 39 where student_id = $1 and subject_id = $2`, [ada, mathId]),
    ).rejects.toThrow(/released/);
  });

  it('still lets a teacher who entered released scores be deleted', async () => {
    await t.as(null, `delete from auth.users where id = $1`, [teacher]);
    const rows = await t.as<{ updated_by: string | null }>(null, `select updated_by from term_scores where subject_id = $1`, [mathId]);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.updated_by === null)).toBe(true);
  });

  it('deletes a student with exam attempts, released scores and comments completely', async () => {
    await t.as(null, `delete from auth.users where id = $1`, [ada]);
    for (const table of ['students', 'term_scores', 'report_comments', 'attempts', 'student_guardians', 'notifications']) {
      const column = table === 'students' ? 'id' : table === 'attempts' ? 'candidate_id' : table === 'notifications' ? 'user_id' : 'student_id';
      const rows = await t.as(null, `select 1 from ${table} where ${column} = $1`, [ada]);
      expect(rows, table).toHaveLength(0);
    }
    // The parent account itself stays; only the link went
    expect(await t.as(null, `select 1 from profiles where id = $1`, [parent])).toHaveLength(1);
  });

  it('shows other students’ scores to nobody but staff', async () => {
    const rows = await t.as<{ student_id: string }>(bola, `select student_id from term_scores`);
    expect(new Set(rows.map((r) => r.student_id))).toEqual(new Set([bola]));
    await expect(report(bola, chidi)).rejects.toThrow(/not available/);
  });

  it('keeps notifications private to their owner', async () => {
    const rows = await t.as(bola, `select * from notifications where user_id <> $1`, [bola]);
    expect(rows).toHaveLength(0);
  });
});
