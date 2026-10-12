import { Link } from 'react-router-dom';
import { useSchoolSettings } from '@/hooks/useReferenceData';

/** Privacy notice for pupils', parents' and applicants' data (Nigeria Data Protection Act 2023). */
export default function Privacy() {
  const { data: settings } = useSchoolSettings();
  const school = settings?.school_name ?? 'The school';
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <article className="prose prose-sm mx-auto max-w-2xl">
        <h1>Privacy notice</h1>
        <p>{school} uses this portal to run computer-based tests and examinations, keep results and issue report cards. This notice explains what we collect and why.</p>
        <h2>What we collect</h2>
        <ul>
          <li>Pupils: name, admission number, class, date of birth, gender, photo, answers to tests and exams, scores, teachers' comments and attendance.</li>
          <li>Parents and guardians: name, phone number, email and relationship to the pupil.</li>
          <li>Entrance applicants: the details on the application form and, if paid online, a payment reference (card details are handled by Paystack, never by us).</li>
          <li>Staff: name, email, phone and a record of the changes they make.</li>
          <li>During exams: the times a candidate leaves the exam window or full screen, for exam integrity.</li>
        </ul>
        <h2>Why we use it</h2>
        <p>To teach and assess pupils, report progress to parents, process admissions and keep exams fair. We do not sell data or use it for advertising.</p>
        <h2>Who can see it</h2>
        <p>Pupils see their own results; parents see their own children's; teachers see the classes and subjects they teach; a small number of administrators see all records. Every change to records is logged.</p>
        <h2>Where it is kept and for how long</h2>
        <p>
          Data is stored with our hosting provider (Supabase) and protected by encryption in transit and access controls. Results and report cards are kept while
          the pupil is at the school and for up to 6 years after they leave, as school records. Entrance applications that do not lead to admission are deleted after
          one year.
        </p>
        <h2>Your rights</h2>
        <p>
          You may ask to see the data we hold about you or your child, have it corrected, or have it deleted where we are not required to keep it. Contact the school
          office{settings?.email && <> at <a href={`mailto:${settings.email}`}>{settings.email}</a></>}{settings?.phone && <> or {settings.phone}</>}.
          You may also complain to the Nigeria Data Protection Commission.
        </p>
        <p><Link to="/">Back to the home page</Link></p>
      </article>
    </div>
  );
}
