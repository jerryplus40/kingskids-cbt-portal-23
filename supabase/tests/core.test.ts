import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './harness';

let t: TestDb;
let admin: string, teacher: string, student: string, otherStudent: string, parent: string;
let classId: string;

beforeAll(async () => {
  t = await createTestDb();
  admin = await t.createUser('admin');
  teacher = await t.createUser('teacher');
  student = await t.createUser('student');
  otherStudent = await t.createUser('student');
  parent = await t.createUser('parent');
  [{ id: classId }] = await t.as<{ id: string }>(admin, `insert into classes (level, arm) values ('JSS1', 'A') returning id`);
  await t.as(admin, `insert into students (id, admission_no, class_id) values ($1, 'KK/001', $3), ($2, 'KK/002', $3)`, [student, otherStudent, classId]);
  await t.as(admin, `insert into student_guardians (student_id, guardian_id) values ($1, $2)`, [student, parent]);
});

describe('profiles and roles', () => {
  it('creates a profile with the role from app metadata', async () => {
    const rows = await t.as<{ role: string }>(null, `select role from profiles where id = $1`, [teacher]);
    expect(rows[0].role).toBe('teacher');
  });

  it('picks up a role that Supabase Auth writes after inserting the user', async () => {
    // GoTrue inserts with default app_metadata, then updates it with the custom role
    const [{ id }] = await t.as<{ id: string }>(
      null,
      `insert into auth.users (email, raw_app_meta_data) values ('late@test.local', '{"provider":"email"}') returning id`,
    );
    await t.as(
      null,
      `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"teacher","must_change_password":true}',
       raw_user_meta_data = '{"first_name":"Late","last_name":"Role"}' where id = $1`,
      [id],
    );
    const [row] = await t.as<{ role: string; must_change_password: boolean; first_name: string }>(
      null,
      `select role, must_change_password, first_name from profiles where id = $1`,
      [id],
    );
    expect(row).toEqual({ role: 'teacher', must_change_password: true, first_name: 'Late' });
  });

  it('gives users with no role the least-privileged applicant role', async () => {
    const [{ id }] = await t.as<{ id: string }>(null, `insert into auth.users (email) values ('x@test.local') returning id`);
    const rows = await t.as<{ role: string }>(null, `select role from profiles where id = $1`, [id]);
    expect(rows[0].role).toBe('applicant');
  });

  it('lets a student see only their own student record', async () => {
    const rows = await t.as<{ id: string }>(student, `select id from students`);
    expect(rows.map((r) => r.id)).toEqual([student]);
  });

  it('lets a parent see their linked child only', async () => {
    const rows = await t.as<{ id: string }>(parent, `select id from students`);
    expect(rows.map((r) => r.id)).toEqual([student]);
  });

  it('lets staff see all students', async () => {
    const rows = await t.as(teacher, `select id from students`);
    expect(rows).toHaveLength(2);
  });

  it('stops a student from changing their own role', async () => {
    await t.as(student, `update profiles set role = 'admin' where id = $1`, [student]);
    const rows = await t.as<{ role: string }>(null, `select role from profiles where id = $1`, [student]);
    expect(rows[0].role).toBe('student');
  });

  it('stops a teacher from creating classes', async () => {
    await expect(t.as(teacher, `insert into classes (level, arm) values ('JSS2', 'A')`)).rejects.toThrow(/row-level security/);
  });

  it('treats a deactivated admin as having no permissions', async () => {
    const other = await t.createUser('admin');
    await t.as(admin, `update profiles set is_active = false where id = $1`, [other]);
    const rows = await t.as<{ ok: boolean }>(other, `select has_perm('users.manage') as ok`);
    expect(rows[0].ok).toBe(false);
  });
});

describe('audit log', () => {
  it('records who changed what', async () => {
    await t.as(admin, `update classes set stream = 'science' where id = $1`, [classId]);
    const rows = await t.as<{ actor_id: string; details: Record<string, unknown> }>(
      admin,
      `select actor_id, details from audit_log where entity = 'classes' and action = 'update' order by id desc limit 1`,
    );
    expect(rows[0].actor_id).toBe(admin);
    expect(rows[0].details).toMatchObject({ stream: 'science' });
  });

  it('is hidden from teachers', async () => {
    const rows = await t.as(teacher, `select * from audit_log`);
    expect(rows).toHaveLength(0);
  });

  it('ignores log_action calls from students', async () => {
    await t.as(student, `select log_action('fake', 'x', '1')`);
    const rows = await t.as(null, `select * from audit_log where action = 'fake'`);
    expect(rows).toHaveLength(0);
  });
});
