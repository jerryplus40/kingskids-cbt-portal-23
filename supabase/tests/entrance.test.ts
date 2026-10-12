import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './harness';

let t: TestDb;
let admin: string, officer: string, teacher: string, candidate: string;
let mathId: string, cycleId: string, examId: string;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

beforeAll(async () => {
  t = await createTestDb();
  admin = await t.createUser('admin');
  officer = await t.createUser('exam_officer');
  teacher = await t.createUser('teacher');
  candidate = await t.createUser('applicant');
  [{ id: mathId }] = await t.as<{ id: string }>(admin, `insert into subjects (name) values ('Mathematics') returning id`);
});

describe('entrance admissions', () => {
  it('lets the exam officer set up a cycle with a multi-subject entrance exam', async () => {
    [{ id: examId }] = await t.as<{ id: string }>(
      officer,
      `insert into exams (title, kind, duration_minutes, created_by, max_attempts) values ('JSS1 entrance', 'entrance', 60, $1, 1) returning id`,
      [officer],
    );
    [{ id: cycleId }] = await t.as<{ id: string }>(
      officer,
      `insert into entrance_cycles (title, class_level, fee_kobo, is_open, exam_id) values ('JSS1 2026/2027', 'JSS1', 1000000, true, $1) returning id`,
      [examId],
    );
    expect(cycleId).toBeTruthy();
  });

  it('shows open cycles to the public but not applications', async () => {
    const cycles = await t.db.transaction(async (tx) => {
      await tx.exec('set local role anon');
      return (await tx.query('select title from entrance_cycles')).rows;
    });
    expect(cycles).toHaveLength(1);
    await expect(
      t.db.transaction(async (tx) => {
        await tx.exec('set local role anon');
        return (await tx.query('select * from applicants')).rows;
      }),
    ).resolves.toHaveLength(0);
  });

  it('numbers applications and checks status only with the secret', async () => {
    const [{ no }] = await t.as<{ no: string }>(null, `select next_application_no() as no`);
    expect(no).toMatch(/^ENT\/\d{4}\/0001$/);
    await t.as(
      null,
      `insert into applicants (cycle_id, application_no, access_token_hash, first_name, last_name, guardian_name, guardian_phone, consent_at, user_id)
       values ($1, $2, $3, 'Tolu', 'Ade', 'Mrs Ade', '2348031111111', now(), $4)`,
      [cycleId, no, sha('secret-123'), candidate],
    );
    const [{ s }] = await t.as<{ s: { status: string; fee_kobo: number } | null }>(null, `select application_status($1, 'secret-123') as s`, [no.toLowerCase()]);
    expect(s).toMatchObject({ status: 'submitted', fee_kobo: 1000000 });
    const [{ s: wrong }] = await t.as<{ s: unknown }>(null, `select application_status($1, 'guess') as s`, [no]);
    expect(wrong).toBeNull();
  });

  it('keeps applications from teachers without admissions rights', async () => {
    expect(await t.as(teacher, `select * from applicants`)).toHaveLength(0);
  });

  it('lets a scheduled candidate sit the entrance exam and ranks the score', async () => {
    const [{ id: sectionId }] = await t.as<{ id: string }>(officer, `insert into exam_sections (exam_id, title, subject_id) values ($1, 'Mathematics', $2) returning id`, [examId, mathId]);
    const [{ id: q }] = await t.as<{ id: string }>(officer, `insert into questions (subject_id, body, created_by) values ($1, '1+1?', $2) returning id`, [mathId, officer]);
    const [, { id: right }] = await t.as<{ id: string }>(officer, `insert into question_options (question_id, label, body, is_correct) values ($1, 'A', '1', false), ($1, 'B', '2', true) returning id`, [q]);
    await t.as(officer, `select approve_questions(array[$1]::uuid[])`, [q]);
    await t.as(officer, `insert into exam_questions (exam_id, section_id, question_id) values ($1, $2, $3)`, [examId, sectionId, q]);
    await t.as(officer, `insert into exam_candidates (exam_id, candidate_id) values ($1, $2)`, [examId, candidate]);
    await t.as(officer, `select publish_exam($1)`, [examId]);

    const [{ p }] = await t.as<{ p: { attempt_id: string } }>(candidate, `select start_exam($1) as p`, [examId]);
    await t.as(candidate, `select save_answer($1, $2, $3)`, [p.attempt_id, q, right]);
    await t.as(candidate, `select submit_exam($1)`, [p.attempt_id]);

    await t.as(officer, `select refresh_applicant_scores($1)`, [cycleId]);
    const [row] = await t.as<{ score: string }>(officer, `select score from applicants where user_id = $1`, [candidate]);
    expect(Number(row.score)).toBe(1);

    await t.as(officer, `update applicants set status = 'admitted', decision_note = 'Welcome' where user_id = $1`, [candidate]);
    const [{ a }] = await t.as<{ a: { status: string; decision_note: string } }>(candidate, `select my_application() as a`);
    expect(a).toMatchObject({ status: 'admitted', decision_note: 'Welcome' });
  });
});

describe('extra time', () => {
  it('lengthens the deadline by the candidate’s percentage', async () => {
    const student = await t.createUser('student');
    const [{ id: classId }] = await t.as<{ id: string }>(admin, `insert into classes (level, arm) values ('JSS3', 'A') returning id`);
    await t.as(admin, `insert into students (id, admission_no, class_id) values ($1, 'X1', $2)`, [student, classId]);
    await t.as(admin, `update profiles set extra_time_percent = 25 where id = $1`, [student]);
    const [{ id: q }] = await t.as<{ id: string }>(admin, `insert into questions (subject_id, body, created_by) values ($1, 'Q', $2) returning id`, [mathId, admin]);
    await t.as(admin, `insert into question_options (question_id, label, body, is_correct) values ($1, 'A', 'a', true), ($1, 'B', 'b', false)`, [q]);
    await t.as(admin, `select approve_questions(array[$1]::uuid[])`, [q]);
    const [{ id }] = await t.as<{ id: string }>(admin, `insert into exams (title, duration_minutes, class_id, subject_id, created_by) values ('T', 40, $1, $2, $3) returning id`, [classId, mathId, admin]);
    const [{ id: s }] = await t.as<{ id: string }>(admin, `insert into exam_sections (exam_id) values ($1) returning id`, [id]);
    await t.as(admin, `insert into exam_questions (exam_id, section_id, question_id) values ($1, $2, $3)`, [id, s, q]);
    await t.as(admin, `select publish_exam($1)`, [id]);
    const [{ p }] = await t.as<{ p: { deadline_at: string; server_now: string } }>(student, `select start_exam($1) as p`, [id]);
    const minutes = (Date.parse(p.deadline_at) - Date.parse(p.server_now)) / 60_000;
    expect(Math.round(minutes)).toBe(50);
  });
});

describe('item analysis and data export', () => {
  it('reports difficulty and option choices per question', async () => {
    const rows = await t.as<{ seen: number; correct: number; difficulty: string; options: { label: string; chosen: number }[] }>(
      officer,
      `select * from item_analysis($1)`,
      [examId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ seen: 1, correct: 1 });
    expect(Number(rows[0].difficulty)).toBe(1);
    expect(rows[0].options.find((o) => o.label === 'B')?.chosen).toBe(1);
  });

  it('exports a person’s data for an admin, and refuses others', async () => {
    const [{ d }] = await t.as<{ d: { profile: { id: string }; exam_attempts: unknown[] } }>(admin, `select export_person_data($1) as d`, [candidate]);
    expect(d.profile.id).toBe(candidate);
    expect(d.exam_attempts).toHaveLength(1);
    expect(JSON.stringify(d)).not.toContain('access_token_hash');
    const [{ d: refused }] = await t.as<{ d: unknown }>(teacher, `select export_person_data($1) as d`, [candidate]);
    expect(refused).toBeNull();
  });
});
