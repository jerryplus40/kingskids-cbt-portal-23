// k6 load test: every virtual user signs in at once, starts the exam, answers 40 questions
// over about 20 minutes and submits — the busiest moment of a real exam morning.
//   k6 run -e SUPABASE_URL=https://xxx.supabase.co -e ANON_KEY=... loadtest/exam.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const seed = JSON.parse(open('./users.json'));
const users = new SharedArray('users', () => seed.users);
const BASE = __ENV.SUPABASE_URL;
const ANON = __ENV.ANON_KEY;

export const options = {
  scenarios: {
    exam_morning: {
      executor: 'per-vu-iterations',
      vus: users.length,
      iterations: 1,
      maxDuration: '40m',
    },
  },
  thresholds: {
    'http_req_duration{name:start_exam}': ['p(95)<3000'],
    'http_req_duration{name:save_answer}': ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const rpc = (token, fn, body) =>
  http.post(`${BASE}/rest/v1/rpc/${fn}`, JSON.stringify(body), {
    headers: { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    tags: { name: fn },
  });

export default function () {
  const user = users[(__VU - 1) % users.length];
  const login = http.post(`${BASE}/auth/v1/token?grant_type=password`, JSON.stringify(user), {
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    tags: { name: 'sign_in' },
  });
  check(login, { 'signed in': (r) => r.status === 200 });
  const token = login.json('access_token');

  const start = rpc(token, 'start_exam', { p_exam_id: seed.examId, p_client_info: { agent: 'k6' } });
  check(start, { 'paper loaded': (r) => r.status === 200 });
  const paper = start.json();
  const questions = paper.sections.flatMap((s) => s.questions);

  for (const q of questions) {
    sleep(15 + Math.random() * 30); // reading time
    const option = q.options[Math.floor(Math.random() * q.options.length)];
    const save = rpc(token, 'save_answer', { p_attempt_id: paper.attempt_id, p_question_id: q.id, p_option_id: option.id });
    check(save, { 'answer saved': (r) => r.status === 200 });
  }
  const submit = rpc(token, 'submit_exam', { p_attempt_id: paper.attempt_id });
  check(submit, { submitted: (r) => r.status === 200 });
}
