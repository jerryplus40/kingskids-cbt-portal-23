// Creates a load-test class with N students and a published 40-question exam.
//   node --env-file=.env loadtest/seed.mjs 500
// Writes loadtest/users.json for exam.js. Remove everything afterwards with: node --env-file=.env loadtest/seed.mjs --clean
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const LEVEL = 'LOADTEST';
const PASSWORD = 'Loadtest-2026';
const OFFICER = 'loadtest-officer@kingskids.internal';

// Questions are approved and the exam published through the normal permission-checked
// functions, so the seed signs in as a temporary exam officer
async function officerClient() {
  const { data } = await db.auth.admin.createUser({ email: OFFICER, password: PASSWORD, email_confirm: true, app_metadata: { role: 'exam_officer' } });
  if (data?.user) await db.from('profiles').update({ first_name: 'Load', last_name: 'Test' }).eq('id', data.user.id);
  const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: session, error } = await client.auth.signInWithPassword({ email: OFFICER, password: PASSWORD });
  if (error) throw error;
  return { client, id: session.user.id };
}

async function clean() {
  const { data: cls } = await db.from('classes').select('id').eq('level', LEVEL).maybeSingle();
  if (!cls) return console.log('Nothing to clean');
  const { data: students } = await db.from('students').select('id').eq('class_id', cls.id);
  const { data: exams } = await db.from('exams').select('id').eq('class_id', cls.id);
  // Attempts first: the paper of a started exam is locked until they are gone
  for (const e of exams ?? []) await db.from('attempts').delete().eq('exam_id', e.id);
  await db.from('exams').delete().eq('class_id', cls.id);
  const { data: officer } = await db.from('profiles').select('id').eq('email', OFFICER).maybeSingle();
  if (officer) await db.auth.admin.deleteUser(officer.id);
  for (const s of students ?? []) await db.auth.admin.deleteUser(s.id);
  await db.from('classes').delete().eq('id', cls.id);
  const { data: subject } = await db.from('subjects').select('id').eq('name', 'Load test').maybeSingle();
  if (subject) await db.from('questions').delete().eq('subject_id', subject.id);
  await db.from('subjects').delete().eq('name', 'Load test');
  console.log(`Removed ${students?.length ?? 0} test students`);
}

async function seed(count) {
  const { data: subject } = await db.from('subjects').upsert({ name: 'Load test' }, { onConflict: 'name' }).select('id').single();
  const { data: cls } = await db.from('classes').upsert({ level: LEVEL, arm: 'A' }, { onConflict: 'level,arm' }).select('id').single();

  const users = [];
  for (let i = 1; i <= count; i++) {
    const admission = `LT-${String(i).padStart(4, '0')}`;
    const email = `${admission.toLowerCase()}@students.kingskids.internal`;
    const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, app_metadata: { role: 'student' } });
    if (error && !error.message.includes('already')) throw error;
    const id = data?.user?.id;
    if (id) await db.from('students').upsert({ id, admission_no: admission, class_id: cls.id });
    users.push({ email, password: PASSWORD });
    if (i % 50 === 0) console.log(`${i} students`);
  }

  const officer = await officerClient();
  await db.from('class_subjects').upsert({ class_id: cls.id, subject_id: subject.id, teacher_id: officer.id }, { onConflict: 'class_id,subject_id' });
  const { data: exam, error: examError } = await officer.client
    .from('exams')
    .insert({ title: 'Load test', class_id: cls.id, subject_id: subject.id, duration_minutes: 60, created_by: officer.id, max_attempts: 1, lockdown: false })
    .select('id')
    .single();
  if (examError) throw examError;
  const { data: section } = await officer.client.from('exam_sections').insert({ exam_id: exam.id }).select('id').single();
  const ids = [];
  for (let n = 1; n <= 40; n++) {
    const { data: q } = await officer.client.from('questions').insert({ subject_id: subject.id, body: `Load test question ${n}: what is ${n} + ${n}?`, created_by: officer.id }).select('id').single();
    await officer.client.from('question_options').insert(['A', 'B', 'C', 'D'].map((label, k) => ({ question_id: q.id, label, body: String(2 * n + k - 1), is_correct: k === 1 })));
    ids.push(q.id);
  }
  await officer.client.rpc('approve_questions', { p_ids: ids });
  await officer.client.from('exam_questions').insert(ids.map((question_id, i) => ({ exam_id: exam.id, section_id: section.id, question_id, sort_order: i })));
  const { error: publishError } = await officer.client.rpc('publish_exam', { p_exam_id: exam.id });
  if (publishError) throw publishError;

  writeFileSync(new URL('./users.json', import.meta.url), JSON.stringify({ examId: exam.id, users }, null, 2));
  console.log(`Seeded ${count} students and exam ${exam.id}. Wrote loadtest/users.json`);
}

if (process.argv.includes('--clean')) await clean();
else await seed(Number(process.argv[2] ?? 100));
