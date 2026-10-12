import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MonitorCheck,
  Phone,
  School,
  Shuffle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSchoolSettings } from '@/hooks/useReferenceData';
import { useOpenCycles } from '@/features/entrance/api';

const ROLES = [
  {
    icon: GraduationCap,
    title: 'Students',
    body: 'Sit tests and exams on any school computer, see released scores and review answers when the teacher allows it.',
  },
  {
    icon: BookOpenCheck,
    title: 'Teachers',
    body: 'Build question banks, import papers from Word or Excel, set exams, mark theory answers and enter CA scores.',
  },
  {
    icon: Users,
    title: 'Parents',
    body: "Sign in with your phone number to see your child's results and report cards, with an SMS when they are ready.",
  },
  {
    icon: School,
    title: 'Administrators',
    body: 'Manage classes, staff and pupils, release results by class, print report cards and run entrance admissions.',
  },
];

const STEPS = [
  { title: 'Sign in', body: 'Students use their admission number and password.' },
  { title: 'Start the paper', body: 'The timer is kept by the server, so a refresh never resets it.' },
  { title: 'Answer and move on', body: 'Each answer saves the moment it is chosen. Flag questions to come back to.' },
  { title: 'Submit', body: 'Papers are marked straight away; theory answers go to the teacher.' },
];

const INTEGRITY = [
  { icon: Clock, title: 'Timed by the server', body: 'Every candidate gets exactly their time, wherever they sit.' },
  { icon: Shuffle, title: 'Shuffled papers', body: 'Question and option order differ from candidate to candidate.' },
  { icon: Lock, title: 'Answers stay private', body: 'Answer keys never reach a candidate’s computer.' },
  { icon: MonitorCheck, title: 'Live supervision', body: 'Invigilators see progress, add time and resolve problems.' },
];

function Logo({ className = 'h-14' }: { className?: string }) {
  return <img src="/brand/logo.png" alt="King's Kids Christian Schools" className={`${className} w-auto`} />;
}

export default function LandingPage() {
  const { data: settings } = useSchoolSettings();
  const cycles = useOpenCycles();
  const openRounds = cycles.data ?? [];
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" aria-label="King's Kids CBT Portal home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#for-you" className="hover:text-primary">Who it's for</a>
            <a href="#how" className="hover:text-primary">How it works</a>
            <a href="#admissions" className="hover:text-primary">Admissions</a>
          </nav>
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:py-20 lg:grid-cols-2">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-brand-green" />
              CBT portal · Study to excel
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Tests, exams and report cards, all in one place.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              {settings?.school_name ?? "King's Kids Christian Schools"} runs its tests and examinations on computer. Students write in a calm,
              familiar exam screen; teachers mark and report in minutes; parents see results as soon as they are released.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link to="/login">
                  Sign in to the portal <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="h-12 bg-brand-green px-7 text-base text-brand-green-foreground hover:bg-brand-green/90">
                <Link to="/entrance">Apply for admission</Link>
              </Button>
            </div>
            <ul className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              {['Every answer saved as it is chosen', 'Keeps going through power cuts', 'Report cards parents can open', 'Works on school computers and phones'].map(
                (point) => (
                  <li key={point} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
                    {point}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -bottom-4 -right-4 hidden h-full w-full rounded-3xl bg-primary sm:block" aria-hidden />
            <img
              src="/images/students-at-computers.jpg"
              alt="King's Kids students taking a computer-based test"
              className="relative aspect-[3/2] w-full rounded-3xl object-cover"
              width={1400}
              height={931}
            />
            <div className="absolute -left-3 bottom-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg sm:-left-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white">
                <ClipboardList className="h-5 w-5" />
              </span>
              <span className="text-sm">
                <span className="block font-semibold">Answers saved</span>
                <span className="text-slate-500">as each one is chosen</span>
              </span>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section id="for-you" className="scroll-mt-20 bg-slate-50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight">One portal for the whole school</h2>
              <p className="mt-3 text-slate-600">Everyone signs in at the same address and sees only what is theirs.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((role) => (
                <div key={role.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <role.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{role.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{role.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How a sitting works */}
        <section id="how" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold tracking-tight">How a computer-based exam works</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && <span className="absolute left-14 top-5 hidden h-0.5 w-[calc(100%-3.5rem)] bg-slate-200 md:block" aria-hidden />}
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Integrity */}
        <section className="bg-primary py-16 text-primary-foreground md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight">Fair exams, every time</h2>
              <p className="mt-3 text-primary-foreground/80">
                The same safeguards a national examination body would expect, built into every school test.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {INTEGRITY.map((item) => (
                <div key={item.title} className="rounded-2xl bg-white/10 p-6">
                  <item.icon className="h-7 w-7 text-brand-green" strokeWidth={2.25} />
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-primary-foreground/80">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Admissions */}
        <section id="admissions" className="scroll-mt-20 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid items-center gap-8 rounded-3xl bg-brand-green px-6 py-10 text-white md:grid-cols-[1.4fr_1fr] md:px-12">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Applying to King's Kids?</h2>
                <p className="mt-3 text-white/90">
                  {openRounds.length
                    ? `Applications are open for ${openRounds.map((c) => c.title).join(', ')}. Apply online, pay the form fee, then sit the entrance examination on computer.`
                    : 'Apply online, pay the form fee, then sit the entrance examination on computer. Check back here when admissions open.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row md:justify-end">
                <Button asChild size="lg" className="h-12 bg-white text-base text-slate-900 hover:bg-white/90">
                  <Link to="/entrance">
                    Apply now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-white bg-transparent text-base text-white hover:bg-white/10 hover:text-white">
                  <Link to="/entrance/status">Check an application</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
          <div className="space-y-3">
            <Logo className="h-14" />
            {settings?.motto && <p className="text-sm italic text-slate-600">{settings.motto}</p>}
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <h3 className="mb-3 font-semibold text-slate-900">Contact</h3>
            {settings?.address && (
              <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{settings.address}</p>
            )}
            {settings?.phone && (
              <p className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" /><a href={`tel:${settings.phone}`} className="hover:text-primary">{settings.phone}</a></p>
            )}
            {settings?.email && (
              <p className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${settings.email}`} className="hover:text-primary">{settings.email}</a></p>
            )}
            {!settings?.address && !settings?.phone && !settings?.email && <p>Contact the school office.</p>}
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="mb-3 font-semibold text-slate-900">Portal</h3>
            <Link to="/login" className="flex items-center gap-2 text-slate-600 hover:text-primary"><KeyRound className="h-4 w-4" />Sign in</Link>
            <Link to="/entrance" className="flex items-center gap-2 text-slate-600 hover:text-primary"><GraduationCap className="h-4 w-4" />Apply for admission</Link>
            <Link to="/privacy" className="flex items-center gap-2 text-slate-600 hover:text-primary"><FileText className="h-4 w-4" />Privacy notice</Link>
          </div>
        </div>
        <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-500">
          © {year} {settings?.school_name ?? "King's Kids Christian Schools"}
        </div>
      </footer>
    </div>
  );
}
