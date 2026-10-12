import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './harness';

let t: TestDb;
let admin: string, teacher: string, otherTeacher: string, student: string, classmate: string, outsider: string;
let classId: string, otherClassId: string, subjectId: string;

interface Paper {
  attempt_id: string;
  status: string;
  deadline_at: string;
  answers: Record<string, { option_id: string | null; text: string | null }>;
  sections: { id: string; questions: { id: string; type: string; marks: number; options: { id: string; label: string; is_correct?: boolean }[] }[] }[];
}

/** Creates an approved MCQ with options A–D, B correct. Returns question id and option ids by label. */
async function mcq(body: string, marks = 1) {
  const [{ id }] = await t.as<{ id: string }>(
    teacher,
    `insert into questions (subject_id, body, marks, created_by) values ($1, $2, $3, $4) returning id`,
    [subjectId, body, marks, teacher],
  );
  const options = await t.as<{ id: string; label: string }>(
    teacher,
    `insert into question_options (question_id, label, body, is_correct)
     values ($1, 'A', 'one', false), ($1, 'B', 'two', true), ($1, 'C', 'three', false), ($1, 'D', 'four', false)
     returning id, label`,
    [id],
  );
  await t.as(teacher, `select approve_questions(array[$1]::uuid[])`, [id]);
  return { id, option: Object.fromEntries(options.map((o) => [o.label, o.id])) as Record<'A' | 'B' | 'C' | 'D', string> };
}

/** Creates a published exam for the class with the given questions in one section. */
async function exam(questionIds: string[], extra: Record<string, unknown> = {}) {
  const fields = { title: 'Test', duration_minutes: 30, class_id: classId, subject_id: subjectId, created_by: teacher, ...extra };
  const keys = Object.keys(fields);
  const [{ id }] = await t.as<{ id: string }>(
    teacher,
    `insert into exams (${keys.join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')}) returning id`,
    Object.values(fields),
  );
  const [{ id: sectionId }] = await t.as<{ id: string }>(teacher, `insert into exam_sections (exam_id, title) values ($1, 'Section A') returning id`, [id]);
  for (const [i, q] of questionIds.entries()) {
    await t.as(teacher, `insert into exam_questions (exam_id, section_id, question_id, sort_order) values ($1, $2, $3, $4)`, [id, sectionId, q, i]);
  }
  await t.as(teacher, `select publish_exam($1)`, [id]);
  return { id, sectionId };
}

const start = async (user: string, examId: string) =>
  (await t.as<{ p: Paper }>(user, `select start_exam($1) as p`, [examId]))[0].p;

beforeAll(async () => {
  t = await createTestDb();
  admin = await t.createUser('admin');
  teacher = await t.createUser('teacher');
  otherTeacher = await t.createUser('teacher');
  student = await t.createUser('student');
  classmate = await t.createUser('student');
  outsider = await t.createUser('student');
  [{ id: classId }] = await t.as<{ id: string }>(admin, `insert into classes (level, arm) values ('JSS1', 'A') returning id`);
  [{ id: otherClassId }] = await t.as<{ id: string }>(admin, `insert into classes (level, arm) values ('JSS2', 'A') returning id`);
  [{ id: subjectId }] = await t.as<{ id: string }>(admin, `insert into subjects (name) values ('Mathematics') returning id`);
  await t.as(admin, `insert into class_subjects (class_id, subject_id, teacher_id) values ($1, $2, $3)`, [classId, subjectId, teacher]);
  await t.as(admin, `insert into students (id, admission_no, class_id) values ($1, 'A1', $4), ($2, 'A2', $4), ($3, 'B1', $5)`, [
    student, classmate, outsider, classId, otherClassId,
  ]);
});

describe('question bank', () => {
  it('hides questions and answer keys from students', async () => {
    await mcq('Hidden?');
    expect(await t.as(student, `select * from questions`)).toHaveLength(0);
    expect(await t.as(student, `select * from question_options`)).toHaveLength(0);
  });

  it('keeps new questions as drafts until approved', async () => {
    const [{ status }] = await t.as<{ status: string }>(
      teacher,
      `insert into questions (subject_id, body, created_by, status) values ($1, 'Draft?', $2, 'draft') returning status`,
      [subjectId, teacher],
    );
    expect(status).toBe('draft');
  });

  it('refuses to approve an MCQ without exactly one correct option', async () => {
    const [{ id }] = await t.as<{ id: string }>(teacher, `insert into questions (subject_id, body, created_by) values ($1, 'No key', $2) returning id`, [subjectId, teacher]);
    await t.as(teacher, `insert into question_options (question_id, label, body) values ($1, 'A', 'x'), ($1, 'B', 'y')`, [id]);
    const [{ n }] = await t.as<{ n: number }>(teacher, `select approve_questions(array[$1]::uuid[]) as n`, [id]);
    expect(n).toBe(0);
  });

  it('does not let a direct update approve a question', async () => {
    const [{ id }] = await t.as<{ id: string }>(teacher, `insert into questions (subject_id, body, created_by) values ($1, 'Sneaky', $2) returning id`, [subjectId, teacher]);
    await t.as(teacher, `update questions set status = 'approved' where id = $1`, [id]);
    const [{ status }] = await t.as<{ status: string }>(null, `select status from questions where id = $1`, [id]);
    expect(status).toBe('draft');
  });

  it('imports a batch with a shared passage and can undo it', async () => {
    const rows = [1, 2].map((n) => ({
      subject_id: subjectId,
      body: `Imported ${n}`,
      passage_key: 'P1',
      options: [
        { label: 'A', body: 'yes', is_correct: true },
        { label: 'B', body: 'no' },
      ],
    }));
    const [{ id }] = await t.as<{ id: string }>(teacher, `select import_questions('q.xlsx', $1, $2) as id`, [
      JSON.stringify(rows),
      JSON.stringify({ P1: { subject_id: subjectId, title: 'Read', body: 'Once upon a time' } }),
    ]);
    const imported = await t.as<{ passage_id: string; status: string }>(teacher, `select passage_id, status from questions where import_id = $1`, [id]);
    expect(imported).toHaveLength(2);
    expect(new Set(imported.map((q) => q.passage_id)).size).toBe(1);
    expect(imported.every((q) => q.status === 'draft')).toBe(true);
    await t.as(teacher, `select undo_import($1)`, [id]);
    expect(await t.as(teacher, `select id from questions where import_id = $1`, [id])).toHaveLength(0);
  });

  it('stops students importing questions', async () => {
    await expect(t.as(student, `select import_questions('x', '[]')`)).rejects.toThrow(/permission/);
  });
});

describe('taking an exam', () => {
  it('serves the paper without the answer key and grades on the server', async () => {
    const q1 = await mcq('2+2?', 2);
    const q2 = await mcq('3+3?', 3);
    const { id } = await exam([q1.id, q2.id]);

    const paper = await start(student, id);
    expect(JSON.stringify(paper)).not.toMatch(/is_correct/);
    expect(paper.sections[0].questions).toHaveLength(2);
    expect(paper.sections[0].questions[0].options.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D']);

    await t.as(student, `select save_answer($1, $2, $3)`, [paper.attempt_id, q1.id, q1.option.B]); // correct, 2 marks
    await t.as(student, `select save_answer($1, $2, $3)`, [paper.attempt_id, q2.id, q2.option.A]); // wrong
    const [{ r }] = await t.as<{ r: { status: string; score: number | null } }>(student, `select submit_exam($1) as r`, [paper.attempt_id]);
    expect(r.status).toBe('submitted');
    expect(r.score).toBeNull(); // hidden until released

    const [attempt] = await t.as<{ score: string; max_score: string }>(null, `select score, max_score from attempts where id = $1`, [paper.attempt_id]);
    expect(Number(attempt.score)).toBe(2);
    expect(Number(attempt.max_score)).toBe(5);
  });

  it('resumes the same paper in the same order after a refresh', async () => {
    const qs = await Promise.all([1, 2, 3, 4, 5].map((n) => mcq(`Resume ${n}`)));
    const { id } = await exam(qs.map((q) => q.id));
    const first = await start(classmate, id);
    await t.as(classmate, `select save_answer($1, $2, $3)`, [first.attempt_id, qs[0].id, qs[0].option.C]);
    const again = await start(classmate, id);
    expect(again.attempt_id).toBe(first.attempt_id);
    expect(again.deadline_at).toBe(first.deadline_at);
    expect(again.sections).toEqual(first.sections);
    expect(again.answers[qs[0].id].option_id).toBe(qs[0].option.C);
  });

  it('refuses students outside the class', async () => {
    const q = await mcq('Outsider');
    const { id } = await exam([q.id]);
    await expect(start(outsider, id)).rejects.toThrow(/not available/);
  });

  it('enforces the attempt limit', async () => {
    const q = await mcq('Once only');
    const { id } = await exam([q.id]);
    const paper = await start(student, id);
    await t.as(student, `select submit_exam($1)`, [paper.attempt_id]);
    await expect(start(student, id)).rejects.toThrow(/already taken/);
  });

  it('refuses to start before the exam opens', async () => {
    const q = await mcq('Later');
    const { id } = await exam([q.id], { opens_at: new Date(Date.now() + 3600_000).toISOString() });
    await expect(start(student, id)).rejects.toThrow(/opens at/);
  });

  it('grades the saved answers when time runs out, without a submit click', async () => {
    const q = await mcq('Timed out');
    const { id } = await exam([q.id]);
    const paper = await start(student, id);
    await t.as(student, `select save_answer($1, $2, $3)`, [paper.attempt_id, q.id, q.option.B]);
    // Time passes beyond the deadline and grace period
    await t.as(null, `update attempts set deadline_at = now() - interval '5 minutes' where id = $1`, [paper.attempt_id]);
    await t.as(null, `select close_expired_attempts()`);
    const [row] = await t.as<{ status: string; score: string; submit_reason: string }>(null, `select status, score, submit_reason from attempts where id = $1`, [paper.attempt_id]);
    expect(row).toMatchObject({ status: 'submitted', submit_reason: 'timeout' });
    expect(Number(row.score)).toBe(1);
  });

  it('refuses answers after the deadline', async () => {
    const q = await mcq('Too late');
    const { id } = await exam([q.id]);
    const paper = await start(classmate, id);
    await t.as(null, `update attempts set deadline_at = now() - interval '2 minutes' where id = $1`, [paper.attempt_id]);
    await expect(t.as(classmate, `select save_answer($1, $2, $3)`, [paper.attempt_id, q.id, q.option.B])).rejects.toThrow(/Time is up/);
  });

  it('stops one student writing to another student’s attempt', async () => {
    const q = await mcq('Mine');
    const { id } = await exam([q.id], { max_attempts: 3 });
    const paper = await start(student, id);
    await expect(t.as(classmate, `select save_answer($1, $2, $3)`, [paper.attempt_id, q.id, q.option.B])).rejects.toThrow(/not found/);
  });

  it('rejects an option from a different question', async () => {
    const q1 = await mcq('Q1');
    const q2 = await mcq('Q2');
    const { id } = await exam([q1.id, q2.id], { max_attempts: 3 });
    const paper = await start(student, id);
    await expect(t.as(student, `select save_answer($1, $2, $3)`, [paper.attempt_id, q1.id, q2.option.B])).rejects.toThrow(/does not belong/);
  });

  it('draws the configured number of random questions', async () => {
    const qs = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => mcq(`Pool ${n}`)));
    const [{ id }] = await t.as<{ id: string }>(teacher, `insert into exams (title, duration_minutes, class_id, subject_id, created_by) values ('Pool', 10, $1, $2, $3) returning id`, [classId, subjectId, teacher]);
    const [{ id: sectionId }] = await t.as<{ id: string }>(teacher, `insert into exam_sections (exam_id, random_count) values ($1, 4) returning id`, [id]);
    for (const q of qs) await t.as(teacher, `insert into exam_questions (exam_id, section_id, question_id) values ($1, $2, $3)`, [id, sectionId, q.id]);
    await t.as(teacher, `select publish_exam($1)`, [id]);
    const paper = await start(student, id);
    expect(paper.sections[0].questions).toHaveLength(4);
  });
});

describe('publishing and editing', () => {
  it('refuses to publish an exam with draft questions', async () => {
    const [{ id: q }] = await t.as<{ id: string }>(teacher, `insert into questions (subject_id, body, created_by) values ($1, 'Unapproved', $2) returning id`, [subjectId, teacher]);
    await expect(exam([q])).rejects.toThrow(/drafts/);
  });

  it('refuses a direct status update to published', async () => {
    const [{ id }] = await t.as<{ id: string }>(teacher, `insert into exams (title, duration_minutes, class_id, subject_id, created_by) values ('X', 10, $1, $2, $3) returning id`, [classId, subjectId, teacher]);
    await expect(t.as(teacher, `update exams set status = 'published' where id = $1`, [id])).rejects.toThrow(/publish_exam/);
  });

  it('stops a teacher creating exams for a subject they do not teach', async () => {
    await expect(
      t.as(otherTeacher, `insert into exams (title, duration_minutes, class_id, subject_id, created_by) values ('X', 10, $1, $2, $3)`, [classId, subjectId, otherTeacher]),
    ).rejects.toThrow(/row-level security/);
  });

  it('locks the paper once a candidate has started', async () => {
    const q1 = await mcq('Locked 1');
    const q2 = await mcq('Locked 2');
    const { id, sectionId } = await exam([q1.id], { max_attempts: 2 });
    await start(student, id);
    await expect(t.as(teacher, `insert into exam_questions (exam_id, section_id, question_id) values ($1, $2, $3)`, [id, sectionId, q2.id])).rejects.toThrow(/already started/);
  });
});

describe('invigilation', () => {
  it('lets the class teacher add time, and refuses students', async () => {
    const q = await mcq('Extra time');
    const { id } = await exam([q.id], { max_attempts: 2 });
    const paper = await start(classmate, id);
    await expect(t.as(classmate, `select add_time($1, 10)`, [paper.attempt_id])).rejects.toThrow(/cannot supervise/);
    const [{ d }] = await t.as<{ d: string }>(teacher, `select add_time($1, 10) as d`, [paper.attempt_id]);
    expect(new Date(d).getTime() - new Date(paper.deadline_at).getTime()).toBeGreaterThanOrEqual(10 * 60_000 - 1000);
  });

  it('shows progress for every candidate in the monitor', async () => {
    const q = await mcq('Monitor');
    const { id } = await exam([q.id]);
    const paper = await start(student, id);
    await t.as(student, `select save_answer($1, $2, $3)`, [paper.attempt_id, q.id, q.option.A]);
    const rows = await t.as<{ candidate_id: string; status: string; answered: number }>(teacher, `select * from exam_monitor($1)`, [id]);
    expect(rows).toHaveLength(2); // both students in the class
    expect(rows.find((r) => r.candidate_id === student)).toMatchObject({ status: 'in_progress', answered: 1 });
    expect(rows.find((r) => r.candidate_id === classmate)).toMatchObject({ status: 'not_started' });
  });

  it('force-submits and resets with a logged reason', async () => {
    const q = await mcq('Force');
    const { id } = await exam([q.id]);
    const paper = await start(student, id);
    await t.as(teacher, `select force_submit($1)`, [paper.attempt_id]);
    const [{ submit_reason }] = await t.as<{ submit_reason: string }>(null, `select submit_reason from attempts where id = $1`, [paper.attempt_id]);
    expect(submit_reason).toBe('invigilator');
    await t.as(teacher, `select reset_attempt($1, 'Computer froze')`, [paper.attempt_id]);
    const again = await start(student, id);
    expect(again.attempt_id).not.toBe(paper.attempt_id);
    const log = await t.as(null, `select * from audit_log where action = 'attempt.reset'`);
    expect(log.length).toBeGreaterThan(0);
  });
});

describe('theory and review', () => {
  it('marks theory answers by hand and only reveals the key after release', async () => {
    const choice = await mcq('Choice');
    const [{ id: theory }] = await t.as<{ id: string }>(
      teacher,
      `insert into questions (subject_id, body, type, marks, created_by) values ($1, 'Explain photosynthesis', 'theory', 10, $2) returning id`,
      [subjectId, teacher],
    );
    await t.as(teacher, `select approve_questions(array[$1]::uuid[])`, [theory]);
    const { id } = await exam([choice.id, theory], { review_allowed: true });
    const paper = await start(classmate, id);
    await t.as(classmate, `select save_answer($1, $2, $3)`, [paper.attempt_id, choice.id, choice.option.B]);
    await t.as(classmate, `select save_answer($1, $2, null, $3)`, [paper.attempt_id, theory, 'Plants make food from light.']);
    await t.as(classmate, `select submit_exam($1)`, [paper.attempt_id]);

    const [before] = await t.as<{ needs_marking: boolean; score: string }>(null, `select needs_marking, score from attempts where id = $1`, [paper.attempt_id]);
    expect(before.needs_marking).toBe(true);
    expect(Number(before.score)).toBe(1);

    await expect(t.as(classmate, `select review_attempt($1)`, [paper.attempt_id])).rejects.toThrow(/not available/);
    await expect(t.as(teacher, `select mark_answer($1, $2, 11)`, [paper.attempt_id, theory])).rejects.toThrow(/between 0 and 10/);
    await t.as(teacher, `select mark_answer($1, $2, 7, 'Good')`, [paper.attempt_id, theory]);
    const [after] = await t.as<{ needs_marking: boolean; score: string }>(null, `select needs_marking, score from attempts where id = $1`, [paper.attempt_id]);
    expect(after.needs_marking).toBe(false);
    expect(Number(after.score)).toBe(8);

    await t.as(teacher, `update exams set results_released = true where id = $1`, [id]);
    const [{ r }] = await t.as<{ r: { key: Record<string, string>; answers: Record<string, { comment: string }> } }>(classmate, `select review_attempt($1) as r`, [paper.attempt_id]);
    expect(r.key[choice.id]).toBe(choice.option.B);
    expect(r.answers[theory].comment).toBe('Good');
  });

  it('lists the student’s exams with scores hidden until release', async () => {
    const rows = await t.as<{ title: string; score: string | null; results_released: boolean }>(classmate, `select * from my_exams()`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((r) => !r.results_released).every((r) => r.score === null)).toBe(true);
  });
});
