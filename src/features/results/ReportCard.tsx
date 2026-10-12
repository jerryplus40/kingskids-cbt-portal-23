import { TERM_LABELS } from '@/types/db';
import { TRAITS, ordinal, type ReportCardData } from './types';

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

/** A term report sheet laid out for A4. Shown on screen and printed as-is. */
export function ReportCard({ data }: { data: ReportCardData }) {
  const { school, term, student, subjects, overall, comments } = data;
  const traits = comments?.traits ?? {};
  const cell = 'border border-black/70 px-1.5 py-1';

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white p-6 text-[12px] leading-snug text-black print:p-0">
      <header className="flex items-center gap-4 border-b-2 border-black pb-3">
        <img src={school.logo_url ?? '/brand/logo.png'} alt="" className="h-16 w-auto max-w-[96px] object-contain" />
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold uppercase">{school.school_name}</h1>
          {school.address && <p>{school.address}</p>}
          {(school.phone || school.email) && <p>{[school.phone, school.email].filter(Boolean).join(' · ')}</p>}
          {school.motto && <p className="italic">Motto: {school.motto}</p>}
        </div>
        {student.photo_url ? (
          <img src={student.photo_url} alt="" className="h-20 w-16 border object-cover" />
        ) : (
          <div className="h-20 w-16" />
        )}
      </header>

      <h2 className="my-3 text-center text-sm font-bold uppercase">
        {TERM_LABELS[term.term]} report sheet · {term.session} session
      </h2>

      <table className="mb-3 w-full border-collapse">
        <tbody>
          <tr>
            <td className={cell}><b>Name:</b> {student.name}</td>
            <td className={cell}><b>Admission no.:</b> {student.admission_no}</td>
            <td className={cell}><b>Class:</b> {data.class?.name}</td>
          </tr>
          <tr>
            <td className={cell}><b>Gender:</b> <span className="capitalize">{student.gender ?? '—'}</span></td>
            <td className={cell}>
              <b>Attendance:</b> {comments?.days_present ?? '—'} of {comments?.days_open ?? '—'} days
            </td>
            <td className={cell}><b>No. in class:</b> {overall?.class_size ?? '—'}</td>
          </tr>
          <tr>
            <td className={cell}><b>Total score:</b> {overall ? Number(overall.grand_total) : '—'}</td>
            <td className={cell}><b>Average:</b> {overall ? `${Number(overall.average).toFixed(2)}%` : '—'} {overall?.grade && `(${overall.grade})`}</td>
            <td className={cell}><b>Position:</b> {overall ? `${ordinal(overall.position)} of ${overall.class_size}` : '—'}</td>
          </tr>
        </tbody>
      </table>

      <table className="mb-3 w-full border-collapse text-center">
        <thead className="bg-black/5">
          <tr>
            <th className={`${cell} text-left`}>Subject</th>
            <th className={cell}>CA ({school.ca_weight})</th>
            <th className={cell}>Exam ({school.exam_weight})</th>
            <th className={cell}>Total (100)</th>
            <th className={cell}>Grade</th>
            <th className={cell}>Position</th>
            <th className={cell}>Class avg.</th>
            <th className={cell}>Highest</th>
            <th className={cell}>Lowest</th>
            <th className={`${cell} text-left`}>Remark</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <tr key={s.subject}>
              <td className={`${cell} text-left`}>{s.subject}</td>
              <td className={cell}>{s.ca ?? '—'}</td>
              <td className={cell}>{s.exam ?? '—'}</td>
              <td className={`${cell} font-semibold`}>{Number(s.total)}</td>
              <td className={cell}>{s.grade}</td>
              <td className={cell}>{ordinal(s.position)}</td>
              <td className={cell}>{Number(s.class_average).toFixed(1)}</td>
              <td className={cell}>{Number(s.highest)}</td>
              <td className={cell}>{Number(s.lowest)}</td>
              <td className={`${cell} text-left`}>{s.remark}</td>
            </tr>
          ))}
          {subjects.length === 0 && (
            <tr><td colSpan={10} className={cell}>No scores recorded for this term.</td></tr>
          )}
        </tbody>
      </table>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <table className="w-full border-collapse">
          <thead className="bg-black/5">
            <tr><th className={`${cell} text-left`}>Behaviour and skills</th><th className={cell}>Rating (1–5)</th></tr>
          </thead>
          <tbody>
            {TRAITS.map((trait) => (
              <tr key={trait}><td className={cell}>{trait}</td><td className={`${cell} text-center`}>{traits[trait] ?? ''}</td></tr>
            ))}
          </tbody>
        </table>
        <table className="w-full border-collapse self-start">
          <thead className="bg-black/5">
            <tr><th className={cell} colSpan={3}>Grade key</th></tr>
          </thead>
          <tbody>
            {data.grade_scale.map((g) => (
              <tr key={g.grade}>
                <td className={`${cell} text-center font-semibold`}>{g.grade}</td>
                <td className={`${cell} text-center`}>{Number(g.min)}–{Math.floor(Number(g.max))}</td>
                <td className={cell}>{g.remark}</td>
              </tr>
            ))}
            <tr><td className={cell} colSpan={3}>Ratings: 5 excellent, 4 very good, 3 good, 2 fair, 1 poor</td></tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <p><b>Class teacher's comment:</b> {comments?.class_teacher_comment ?? ''}</p>
        <p className="text-right">{data.class?.class_teacher && <>Class teacher: {data.class.class_teacher}</>} &nbsp; Signature: ______________</p>
        <p><b>Principal's comment:</b> {comments?.principal_comment ?? ''}</p>
        <p className="text-right">Signature and stamp: ______________</p>
        <p><b>Next term begins:</b> {formatDate(term.next_term_begins)}</p>
      </div>
      {!data.released && <p className="mt-3 text-center text-[10px] uppercase tracking-wide text-red-700">Draft — not yet released</p>}
    </article>
  );
}
