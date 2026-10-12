// End-to-end check against a deployed project, through the real API and edge functions.
// Creates temporary SMOKE data and accounts, runs a full term's flow, then deletes it all.
//   node --env-file=.env scripts/smoke-test.mjs
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const URL = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const service = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const client = () => createClient(URL, ANON, { auth: { persistSession: false } });

const tag = `SMOKE${randomBytes(3).toString('hex').toUpperCase()}`;
const created = { users: [], classId: null, subjectId: null, sessionId: null, examIds: [], cycleId: null, phone: null };
let failures = 0;
const step = async (name, fn) => {
  try {
    const detail = await fn();
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (error) {
    failures++;
    console.log(`  ✗ ${name} — ${error.message}`);
  }
};
const must = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};
const assert = (cond, message) => {
  if (!cond) throw new Error(message);
};
const signIn = async (email, password) => {
  const c = client();
  must(await c.auth.signInWithPassword({ email, password }));
  return c;
};
const invoke = async (c, name, body) => {
  const { data, error } = await c.functions.invoke(name, { body });
  if (error) {
    const payload = await error.context?.json?.().catch(() => null);
    throw new Error(payload?.error ?? error.message);
  }
  return data;
};

async function run() {
  console.log(`Smoke test ${tag} against ${URL}\n`);
  const password = `Smoke-${randomBytes(6).toString('hex')}1`;
  let admin, teacher, studentCreds, parentCreds, studentId, examId;

  await step('create a temporary administrator', async () => {
    const { user } = must(await service.auth.admin.createUser({
      email: `${tag.toLowerCase()}-admin@kingskids.internal`, password, email_confirm: true,
      app_metadata: { role: 'admin' }, user_metadata: { first_name: 'Smoke', last_name: 'Admin' },
    }));
    created.users.push(user.id);
    admin = await signIn(`${tag.toLowerCase()}-admin@kingskids.internal`, password);
  });

  await step('public sign-up is refused', async () => {
    const { error } = await client().auth.signUp({ email: `${tag.toLowerCase()}-x@example.com`, password });
    assert(error, 'sign-up was allowed');
    return error.message;
  });

  await step('admin sets up session, term, class and subject', async () => {
    const session = must(await admin.from('sessions').insert({ name: '2098/2099' }).select('id').single());
    created.sessionId = session.id;
    must(await admin.from('terms').insert([1, 2, 3].map((term) => ({ session_id: session.id, term }))));
    const cls = must(await admin.from('classes').insert({ level: tag, arm: 'A' }).select('id').single());
    created.classId = cls.id;
    const subject = must(await admin.from('subjects').insert({ name: `${tag} Mathematics` }).select('id').single());
    created.subjectId = subject.id;
  });

  await step('admin creates a teacher through the admin-users function', async () => {
    const result = await invoke(admin, 'admin-users', {
      action: 'create', user: { role: 'teacher', first_name: 'Smoke', last_name: 'Teacher', email: `${tag.toLowerCase()}-teacher@kingskids.internal` },
    });
    created.users.push(result.account.user_id);
    must(await service.from('profiles').update({ must_change_password: false }).eq('id', result.account.user_id));
    teacher = await signIn(result.account.login_id, result.account.password);
    must(await admin.from('class_subjects').insert({ class_id: created.classId, subject_id: created.subjectId, teacher_id: result.account.user_id }));
  });

  await step('admin bulk-creates a student with a parent', async () => {
    created.phone = `0809${String(Date.now()).slice(-7)}`;
    const { results } = await invoke(admin, 'admin-users', {
      action: 'bulk_create',
      users: [{
        role: 'student', first_name: 'Ada', last_name: tag, student: { admission_no: `${tag}/001`, class_id: created.classId },
        guardian: { first_name: 'Ngozi', last_name: tag, phone: created.phone },
      }],
    });
    assert(results[0].ok, results[0].error);
    studentCreds = results[0].account;
    parentCreds = results[0].guardian;
    studentId = studentCreds.user_id;
    created.users.push(studentId, parentCreds.user_id);
    return `student ${studentCreds.login_id}, parent ${parentCreds.login_id}`;
  });

  await step('student signs in with the admission number and must change password', async () => {
    const student = await signIn(`${tag.toLowerCase()}-001@students.kingskids.internal`, studentCreds.password);
    const profile = must(await student.from('profiles').select('must_change_password').eq('id', studentId).single());
    assert(profile.must_change_password, 'not forced to change password');
    must(await service.from('profiles').update({ must_change_password: false }).in('id', [studentId, parentCreds.user_id]));
  });

  await step('teacher builds and publishes an exam', async () => {
    const qIds = [];
    for (const n of [1, 2]) {
      const q = must(await teacher.from('questions').insert({ subject_id: created.subjectId, body: `${tag} ${n}+${n}?`, created_by: (await teacher.auth.getUser()).data.user.id }).select('id').single());
      must(await teacher.from('question_options').insert([
        { question_id: q.id, label: 'A', body: String(2 * n), is_correct: true },
        { question_id: q.id, label: 'B', body: String(2 * n + 1), is_correct: false },
      ]));
      qIds.push(q.id);
    }
    assert((must(await teacher.rpc('approve_questions', { p_ids: qIds }))) === 2, 'questions not approved');
    const { data: term } = await admin.from('terms').select('id').eq('session_id', created.sessionId).eq('term', 1).single();
    const exam = must(await teacher.from('exams').insert({
      title: `${tag} test`, class_id: created.classId, subject_id: created.subjectId, term_id: term.id, duration_minutes: 10,
      counts_as: 'exam', created_by: (await teacher.auth.getUser()).data.user.id,
    }).select('id').single());
    examId = exam.id;
    created.examIds.push(exam.id);
    const section = must(await teacher.from('exam_sections').insert({ exam_id: exam.id }).select('id').single());
    must(await teacher.from('exam_questions').insert(qIds.map((question_id, i) => ({ exam_id: exam.id, section_id: section.id, question_id, sort_order: i }))));
    must(await teacher.rpc('publish_exam', { p_exam_id: exam.id }));
  });

  let student;
  await step('student cannot read the question bank', async () => {
    student = await signIn(`${tag.toLowerCase()}-001@students.kingskids.internal`, studentCreds.password);
    const rows = must(await student.from('question_options').select('id, is_correct'));
    assert(rows.length === 0, `student saw ${rows.length} options`);
  });

  await step('student sits the exam; the paper carries no answer key', async () => {
    const exams = must(await student.rpc('my_exams'));
    assert(exams.some((e) => e.exam_id === examId), 'exam not listed');
    const paper = must(await student.rpc('start_exam', { p_exam_id: examId, p_client_info: { agent: 'smoke' } }));
    assert(!JSON.stringify(paper).includes('is_correct'), 'answer key leaked');
    const questions = paper.sections.flatMap((s) => s.questions);
    for (const q of questions) {
      const right = q.options.find((o) => o.body === String(2 * Number(q.body.match(/(\d)\+/)[1])));
      must(await student.rpc('save_answer', { p_attempt_id: paper.attempt_id, p_question_id: q.id, p_option_id: right.id }));
    }
    const result = must(await student.rpc('submit_exam', { p_attempt_id: paper.attempt_id }));
    assert(result.score === null, 'score shown before release');
    const attempt = must(await service.from('attempts').select('score, max_score').eq('id', paper.attempt_id).single());
    assert(Number(attempt.score) === 2, `graded ${attempt.score}/${attempt.max_score}`);
    return 'graded 2/2 on the server';
  });

  await step('teacher fills term scores from CBT and the class is released', async () => {
    const { data: term } = await admin.from('terms').select('id').eq('session_id', created.sessionId).eq('term', 1).single();
    must(await teacher.rpc('pull_cbt_scores', { p_term_id: term.id, p_class_id: created.classId, p_subject_id: created.subjectId }));
    must(await teacher.from('term_scores').update({ ca_score: 35 }).eq('student_id', studentId));
    must(await admin.from('result_releases').insert({ term_id: term.id, class_id: created.classId }));
    const card = must(await student.rpc('report_card', { p_student_id: studentId, p_term_id: term.id }));
    assert(card.subjects[0].total === 95 && card.subjects[0].grade === 'A1', `report shows ${card.subjects[0].total} ${card.subjects[0].grade}`);
    return 'CA 35 + exam 60 = 95, A1';
  });

  await step('parent sees the report card, a notification and an SMS is queued', async () => {
    const parent = await signIn(`${parentCreds.login_id}@parents.kingskids.internal`, parentCreds.password);
    const cards = must(await parent.rpc('my_report_cards', { p_student_id: studentId }));
    assert(cards.length === 1, 'no report card');
    const notes = must(await parent.from('notifications').select('title'));
    assert(notes.some((n) => n.title === 'Report card ready'), 'no notification');
    const sms = must(await service.from('message_outbox').select('id').eq('recipient', parentCreds.login_id));
    assert(sms.length >= 1, 'no SMS queued');
  });

  await step('send-notifications runs (no SMS provider configured yet)', async () => {
    const result = await invoke(admin, 'send-notifications', {});
    return result.note ?? `sent ${result.sent}`;
  });

  await step('public entrance application and status check', async () => {
    const cycle = must(await admin.from('entrance_cycles').insert({ title: `${tag} entrance`, class_level: 'JSS1', is_open: true }).select('id').single());
    created.cycleId = cycle.id;
    const applied = await invoke(client(), 'entrance-apply', {
      cycle_id: cycle.id, first_name: 'Tolu', last_name: tag, guardian_name: 'Mrs Tolu', guardian_phone: created.phone, consent: true,
    });
    const status = must(await client().rpc('application_status', { p_application_no: applied.application_no, p_token: applied.token }));
    assert(status?.status === 'paid', `status ${status?.status}`);
    const wrong = must(await client().rpc('application_status', { p_application_no: applied.application_no, p_token: 'guess' }));
    assert(wrong === null, 'status visible without the secret');
    return applied.application_no;
  });

  await step('teachers cannot see the audit log; admins can', async () => {
    assert(must(await teacher.from('audit_log').select('id').limit(1)).length === 0, 'teacher saw audit log');
    assert(must(await admin.from('audit_log').select('id').limit(1)).length === 1, 'admin saw nothing');
  });
}

async function cleanup() {
  console.log('\nCleaning up');
  for (const id of created.examIds) {
    await service.from('attempts').delete().eq('exam_id', id);
    await service.from('exams').delete().eq('id', id);
  }
  if (created.subjectId) await service.from('questions').delete().eq('subject_id', created.subjectId);
  if (created.cycleId) {
    await service.from('applicants').delete().eq('cycle_id', created.cycleId);
    await service.from('entrance_cycles').delete().eq('id', created.cycleId);
  }
  if (created.phone) await service.from('message_outbox').delete().like('recipient', `%${created.phone.slice(-7)}`);
  for (const id of created.users) await service.auth.admin.deleteUser(id);
  if (created.classId) await service.from('classes').delete().eq('id', created.classId);
  if (created.subjectId) await service.from('subjects').delete().eq('id', created.subjectId);
  if (created.sessionId) await service.from('sessions').delete().eq('id', created.sessionId);
  const left = must(await service.from('profiles').select('id').in('id', created.users));
  console.log(left.length ? `  ! ${left.length} accounts left behind` : '  ✓ removed all smoke-test data');
}

try {
  await run();
} finally {
  await cleanup();
  console.log(failures ? `\n${failures} checks failed` : '\nAll checks passed');
  process.exitCode = failures ? 1 : 0;
}
