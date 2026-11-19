import {useCallback, useEffect, useMemo, useState} from 'react';
import {BarChart3, Bug, ExternalLink, Heart, Lightbulb, LogIn, MessageSquare, RefreshCw} from 'lucide-react';
import type {Route} from './+types/beheer';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

/* Admin dashboard: learners, activity and feedback. Only accounts in FEEDBACK_ADMINS get data from /api/admin and /api/feedback;
   everyone else sees "Geen toegang". It renders in the browser because it uses the session cookie of /leren. */

export const meta: Route.MetaFunction = () => [
  {title: 'Nedfa — beheer'},
  {name: 'robots', content: 'noindex, nofollow'},
];

const STATUSES = ['nieuw', 'gezien', 'gepland', 'opgelost', 'niet doen'] as const;
type Status = (typeof STATUSES)[number];
const label = (status: string) => status[0].toUpperCase() + status.slice(1);
type Overview = {
  users: {total: number; week: number; month: number};
  providers: {provider: string; count: number}[];
  active: {day: number; week: number; month: number; reviews_week: number};
  days: {day: string; reviews: number; learners: number}[];
  signups: {day: string; count: number}[];
  feedback: Partial<Record<Status, number>>;
};
type Report = {
  id: string; created_at: string; kind: string; message: string; screen: string | null; context: Record<string, unknown>;
  platform: string | null; app_version: string | null; status: Status; has_screenshot: boolean; signed_in: boolean; email: string | null;
};
type State = {phase: 'loading' | 'signed-out' | 'forbidden' | 'error'} | {phase: 'ready'; overview: Overview};

const ZONE = 'Europe/Amsterdam';
const dateTime = new Intl.DateTimeFormat('nl-NL', {timeZone: ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
const shortDay = new Intl.DateTimeFormat('nl-NL', {timeZone: 'UTC', day: 'numeric', month: 'short'});
const longDay = new Intl.DateTimeFormat('nl-NL', {timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long'});

/** The last `count` calendar days in Amsterdam as YYYY-MM-DD, oldest first. */
function lastDays(count: number) {
  const today = new Intl.DateTimeFormat('en-CA', {timeZone: ZONE}).format(new Date());
  const end = Date.parse(`${today}T00:00:00Z`);
  return Array.from({length: count}, (_, index) => new Date(end - (count - 1 - index) * 86_400_000).toISOString().slice(0, 10));
}

async function getJson<T>(url: string): Promise<{status: number; data?: T}> {
  const response = await fetch(url, {credentials: 'same-origin', headers: {Accept: 'application/json'}});
  return response.ok ? {status: response.status, data: (await response.json()) as T} : {status: response.status};
}

export default function Beheer() {
  const [state, setState] = useState<State>({phase: 'loading'});
  const [filter, setFilter] = useState<Status | 'alles'>('nieuw');
  const [reports, setReports] = useState<Report[] | null>(null);

  const load = useCallback(async () => {
    try {
      const {status, data} = await getJson<Overview>('/api/admin/overview');
      if (status === 401) return setState({phase: 'signed-out'});
      if (status === 404 || status === 403) return setState({phase: 'forbidden'});
      if (!data) return setState({phase: 'error'});
      setState({phase: 'ready', overview: data});
    } catch {
      setState({phase: 'error'});
    }
  }, []);

  const loadReports = useCallback(async (which: Status | 'alles') => {
    setReports(null);
    const {data} = await getJson<{feedback: Report[]}>(`/api/feedback${which === 'alles' ? '' : `?status=${encodeURIComponent(which)}`}`).catch(() => ({data: undefined}));
    setReports(data?.feedback ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);
  const ready = state.phase === 'ready';
  useEffect(() => { if (ready) void loadReports(filter); }, [ready, filter, loadReports]);

  const setStatus = async (report: Report, status: Status) => {
    const before = report.status;
    setReports((list) => list?.map((item) => (item.id === report.id ? {...item, status} : item)) ?? null);
    const response = await fetch(`/api/feedback/${report.id}`, {
      method: 'PATCH', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status}),
    }).catch(() => null);
    if (!response?.ok) {
      setReports((list) => list?.map((item) => (item.id === report.id ? {...item, status: before} : item)) ?? null);
      return;
    }
    void load();
  };

  if (state.phase !== 'ready') return <Gate phase={state.phase} />;
  const {overview} = state;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wider text-primary uppercase">Nedfa</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Beheer</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><a href="https://umami.nedfa.nl" target="_blank" rel="noreferrer"><BarChart3 />Bezoekers (Umami)<ExternalLink className="size-3.5 opacity-60" /></a></Button>
          <Button variant="outline" onClick={() => { void load(); void loadReports(filter); }}><RefreshCw />Vernieuwen</Button>
        </div>
      </header>

      <section aria-label="Kerncijfers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Accounts" value={overview.users.total} note={`+${overview.users.week} deze week`} />
        <Tile label="Actief vandaag" value={overview.active.day} note="laatste 24 uur" />
        <Tile label="Actief deze week" value={overview.active.week} note="laatste 7 dagen" />
        <Tile label="Actief deze maand" value={overview.active.month} note="laatste 30 dagen" />
        <Tile label="Antwoorden" value={overview.active.reviews_week} note="laatste 7 dagen" />
        <Tile label="Nieuwe feedback" value={overview.feedback.nieuw ?? 0} note={`${Object.values(overview.feedback).reduce((a, b) => a + (b ?? 0), 0)} in totaal`} highlight={(overview.feedback.nieuw ?? 0) > 0} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <ActivityChart days={overview.days} />
        <div className="flex flex-col gap-4">
          <Panel title="Nieuwe accounts">
            <p className="text-sm text-muted-foreground"><strong className="text-foreground tabular-nums">{overview.users.month}</strong> in de laatste 30 dagen</p>
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {overview.signups.slice(-5).reverse().map((row) => (
                <li key={row.day} className="flex justify-between"><span className="text-muted-foreground">{longDay.format(new Date(`${row.day}T00:00:00Z`))}</span><span className="font-semibold tabular-nums">{row.count}</span></li>
              ))}
              {overview.signups.length === 0 && <li className="text-muted-foreground">Nog geen.</li>}
            </ul>
          </Panel>
          <Panel title="Inloggen met">
            <ul className="flex flex-col gap-1 text-sm">
              {overview.providers.map((row) => (
                <li key={row.provider} className="flex justify-between"><span className="text-muted-foreground">{row.provider === 'apple' ? 'Apple' : 'Google'}</span><span className="font-semibold tabular-nums">{row.count}</span></li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Een account kan beide hebben.</p>
          </Panel>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="feedback-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="feedback-title" className="text-xl font-bold tracking-tight">Feedback</h2>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Status">
            {[...STATUSES, 'alles' as const].map((status) => (
              <button key={status} type="button" role="tab" aria-selected={filter === status} onClick={() => setFilter(status)}
                className={cn('h-8 rounded-full border px-3 text-sm font-medium transition-colors', filter === status ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}>
                {label(status)}{status !== 'alles' && <span className="ml-1.5 tabular-nums opacity-70">{overview.feedback[status] ?? 0}</span>}
              </button>
            ))}
          </div>
        </div>
        {reports === null ? <p className="py-8 text-center text-sm text-muted-foreground">Laden…</p>
          : reports.length === 0 ? <p className="rounded-2xl border bg-card py-10 text-center text-sm text-muted-foreground">Geen feedback met deze status.</p>
          : <ul className="flex flex-col gap-3">{reports.map((report) => <ReportCard key={report.id} report={report} onStatus={(status) => void setStatus(report, status)} />)}</ul>}
      </section>
    </main>
  );
}

function Gate({phase}: {phase: 'loading' | 'signed-out' | 'forbidden' | 'error'}) {
  const text = {
    loading: ['Even laden…', ''],
    'signed-out': ['Log in om verder te gaan', 'Log in met een beheerdersaccount. Ben je al ingelogd op /leren, dan werkt dat hier ook.'],
    forbidden: ['Geen toegang', 'Dit account is geen beheerder.'],
    error: ['Laden lukt nu niet', 'Probeer het zo nog eens.'],
  }[phase];
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center" role={phase === 'loading' ? 'status' : undefined}>
      <img src="/img/logo.png" alt="" width={72} height={72} className="size-18 rounded-3xl" />
      <h1 className="text-2xl font-extrabold">{text[0]}</h1>
      {text[1] && <p className="text-muted-foreground">{text[1]}</p>}
      {phase === 'signed-out' && (
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="xl" asChild><a href="/api/auth/google?return=/beheer"><LogIn />Inloggen met Google</a></Button>
          <Button size="xl" variant="outline" asChild><a href="/leren#instellingen">Via de app</a></Button>
        </div>
      )}
      {phase === 'error' && <Button size="xl" onClick={() => location.reload()}><RefreshCw />Opnieuw</Button>}
    </main>
  );
}

function Panel({title, children, className}: {title: string; children: React.ReactNode; className?: string}) {
  return (
    <div className={cn('rounded-2xl border bg-card p-4', className)}>
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Tile({label, value, note, highlight = false}: {label: string; value: number; note: string; highlight?: boolean}) {
  return (
    <div className={cn('rounded-2xl border bg-card p-4', highlight && 'border-primary')}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value.toLocaleString('nl-NL')}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

/** Answers per day over the last 30 days: one series, so no legend; hover or focus a day for its numbers. */
function ActivityChart({days}: {days: Overview['days']}) {
  const series = useMemo(() => {
    const byDay = new Map(days.map((row) => [row.day, row]));
    return lastDays(30).map((day) => byDay.get(day) ?? {day, reviews: 0, learners: 0});
  }, [days]);
  const max = Math.max(1, ...series.map((row) => row.reviews));
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover === null ? null : series[hover];
  const dayLabel = (day: string) => shortDay.format(new Date(`${day}T00:00:00Z`));

  return (
    <Panel title="Antwoorden per dag (30 dagen)" className="lg:col-span-2">
      <div className="mb-2 h-10 text-sm" aria-live="polite">
        {shown ? <p><strong>{longDay.format(new Date(`${shown.day}T00:00:00Z`))}</strong><br /><span className="text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{shown.reviews}</span> antwoorden · <span className="font-semibold text-foreground tabular-nums">{shown.learners}</span> {shown.learners === 1 ? 'leerder' : 'leerders'}</span></p>
          : <p className="text-muted-foreground">Wijs een dag aan voor de cijfers.</p>}
      </div>
      <div className="relative">
        <span className="absolute -top-1 left-0 text-[11px] text-muted-foreground tabular-nums">{max}</span>
        <div className="flex h-40 items-end gap-[2px] border-b border-border pt-4" onMouseLeave={() => setHover(null)}>
          {series.map((row, index) => (
            <button key={row.day} type="button" className="group flex h-full flex-1 items-end outline-none" aria-label={`${dayLabel(row.day)}: ${row.reviews} antwoorden, ${row.learners} leerders`}
              onMouseEnter={() => setHover(index)} onFocus={() => setHover(index)} onBlur={() => setHover(null)}>
              <span className={cn('w-full rounded-t-[4px] bg-primary transition-opacity', hover !== null && hover !== index && 'opacity-40', 'group-focus-visible:ring-2 group-focus-visible:ring-ring')}
                style={{height: row.reviews ? `${Math.max(2, (row.reviews / max) * 100)}%` : '0'}} />
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>{dayLabel(series[0].day)}</span><span>{dayLabel(series[15].day)}</span><span>vandaag</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Antwoorden en leerders per dag</caption>
        <thead><tr><th>Dag</th><th>Antwoorden</th><th>Leerders</th></tr></thead>
        <tbody>{series.map((row) => <tr key={row.day}><td>{row.day}</td><td>{row.reviews}</td><td>{row.learners}</td></tr>)}</tbody>
      </table>
    </Panel>
  );
}

const kindLook: Record<string, {icon: typeof Bug; variant: 'destructive' | 'xp' | 'success' | 'secondary'}> = {
  probleem: {icon: Bug, variant: 'destructive'},
  idee: {icon: Lightbulb, variant: 'xp'},
  compliment: {icon: Heart, variant: 'success'},
  anders: {icon: MessageSquare, variant: 'secondary'},
};

function ReportCard({report, onStatus}: {report: Report; onStatus: (status: Status) => void}) {
  const look = kindLook[report.kind] ?? kindLook.anders;
  const Icon = look.icon;
  const context = Object.entries(report.context || {});
  const screenshot = `/api/feedback/${report.id}/screenshot`;
  return (
    <li className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant={look.variant} className="capitalize"><Icon />{report.kind}</Badge>
        <span className="text-sm text-muted-foreground">{dateTime.format(new Date(report.created_at))}</span>
        <span className="text-sm text-muted-foreground">{[report.platform, report.app_version].filter(Boolean).join(' ') || 'onbekend'}</span>
        <span className="min-w-0 truncate text-sm text-muted-foreground">{report.email || (report.signed_in ? 'ingelogd, geen e-mail' : 'niet ingelogd')}</span>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="sr-only">Status</span>
          <select value={report.status} onChange={(event) => onStatus(event.target.value as Status)}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] whitespace-pre-wrap break-words">{report.message}</p>
          {report.screen && <p className="mt-2 text-sm text-muted-foreground">Scherm: <span className="text-foreground">{report.screen}</span></p>}
          {context.length > 0 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-muted-foreground">Details</summary>
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                {context.map(([key, value]) => (
                  <div key={key} className="contents"><dt className="text-muted-foreground">{key}</dt><dd className="break-all">{typeof value === 'string' ? value : JSON.stringify(value)}</dd></div>
                ))}
              </dl>
            </details>
          )}
        </div>
        {report.has_screenshot && (
          <a href={screenshot} target="_blank" rel="noreferrer" className="shrink-0" aria-label="Screenshot openen">
            <img src={screenshot} alt="Screenshot bij de feedback" loading="lazy" className="h-40 w-auto rounded-lg border object-contain" />
          </a>
        )}
      </div>
    </li>
  );
}
