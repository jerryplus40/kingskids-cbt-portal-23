# King's Kids CBT Portal

Computer-based tests and examinations, term results and report cards, and entrance admissions for King's Kids Christian International High School.

Live at **https://cbt.kingskidschools.com** (Vercel project `kingskids-cbt-portal-23`). The school's main website at www.kingskidschools.com is a separate project.

- **Staff** build question banks (typed, or imported from Excel or Word), set exams, supervise sittings live, mark theory answers, enter CA and exam scores, and print broadsheets and report cards.
- **Students** sit exams in a JAMB-style screen that saves every answer as it is chosen and survives refreshes, power cuts and short internet outages.
- **Parents** see released results and report cards and get an SMS when they are ready.
- **Applicants** apply and pay online, then sit the entrance exam on the same engine.

## How it is built

| Part | Technology |
| --- | --- |
| Website | React 18, Vite, TypeScript (strict), Tailwind, shadcn/ui, TanStack Query and Table; hosted on Vercel |
| Database and auth | Supabase: Postgres with row-level security, Supabase Auth (TOTP two-step sign-in for staff), Storage |
| Exam engine, grading, results | Postgres functions in `supabase/migrations` (the browser never receives answer keys and cannot change the clock) |
| Server tasks | Supabase Edge Functions in `supabase/functions`: account creation, entrance applications, Paystack, SMS and email |

Permissions are checked in the database. Roles (`admin`, `exam_officer`, `teacher`, `student`, `parent`, `applicant`) are bundles of permissions in the `role_permissions` table; teachers are further limited to the classes and subjects assigned to them.

### Sign-in

| Who | Signs in with |
| --- | --- |
| Staff | Email and password (two-step sign-in optional) |
| Students | Admission number and password |
| Parents | Phone number and password |
| Entrance candidates | Application number (ENT/2026/0001) and the password on their exam slip |

Public sign-up is off. Administrators create accounts (one at a time or from Excel); everyone gets a temporary password and chooses their own at first sign-in.

## Working on it

```sh
npm install
cp .env.example .env     # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:8080
```

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests, plus database tests that run every migration in PGlite (Postgres in WebAssembly) and check permissions, grading and timing |
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | ESLint |
| `npm run check:functions` | Type-checks the edge functions with Deno |

CI runs all of these on every pull request (`.github/workflows/ci.yml`).

## Deploying

1. Fill in `.env` (see the comments in it): the Supabase keys, database password and access token, plus Paystack, Termii and Resend keys if you use them.
2. Deploy the backend (migrations, auth settings, edge functions and their secrets, and the 5-minute SMS/email schedule):
   ```sh
   ./scripts/deploy-backend.sh
   ```
3. Create the first administrator:
   ```sh
   node --env-file=.env scripts/create-admin.mjs
   ```
4. In Vercel, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production, then deploy.
5. In Paystack, set the webhook URL to `https://<project-ref>.supabase.co/functions/v1/paystack-webhook`.
6. Sign in as the administrator and follow the setup checklist on the overview page: session and term, classes, subjects, teachers, teaching assignments, then students and parents.

## Before the first live exam

Run the load test against a staging copy, or at a quiet time, to confirm the database copes with a whole year group starting at once:

```sh
node --env-file=.env loadtest/seed.mjs 500          # 500 test students and a 40-question exam
k6 run -e SUPABASE_URL=... -e ANON_KEY=... loadtest/exam.js
node --env-file=.env loadtest/seed.mjs --clean      # remove the test data
```

The thresholds in `loadtest/exam.js` expect 95% of paper loads under 3 seconds and answer saves under 1 second.

## Project layout

```
src/
  auth/            Sign-in state, route guard
  layouts/         Sidebar shell and navigation
  pages/           One file per screen (admin, staff, student, parent, candidate, entrance, exam)
  features/        Logic and components by area (people, questions, exams, exam-session, results, entrance)
  lib/             Supabase client, login-id mapping, maths rendering, spreadsheets
supabase/
  migrations/      Schema, row-level security and all server logic, in order
  functions/       Edge functions
  tests/           Database tests (PGlite)
scripts/           Deployment and first-admin scripts
loadtest/          k6 load test
```

## Known limits

- **Offline:** a sitting keeps going through internet outages of any length once it has started: answers queue on the computer and the app reloads from its cache. Starting a new sitting needs a connection. A local exam server for running a whole hall with no internet at all is not built.
- **Lockdown** is what a browser allows: full screen, and recording when a candidate leaves the window, copies or pastes. It deters and documents; it cannot stop a determined candidate using another device.
- **Report cards** print through the browser (choose "Save as PDF" to keep a file).
