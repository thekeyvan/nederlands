import {useCallback, useEffect, useMemo, useState} from 'react';
import {BarChart3, Bug, ExternalLink, Heart, Lightbulb, LogIn, MessageSquare, RefreshCw} from 'lucide-react';
import type {Route} from './+types/beheer';
import type {Card} from '@/core/types';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

/* Admin dashboard: learners, activity, themes, retention and feedback. Only accounts in ADMINS get data from /api/admin and /api/feedback;
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
  retention: {days: number; eligible: number; returned: number}[];
  cohorts: {week: string; starters: number; day1: number; day1_eligible: number; day7: number; day7_eligible: number; active: number}[];
  cards: {id: string; answers: number; wrong: number; learners: number}[];
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

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Retention retention={overview.retention} cohorts={overview.cohorts} />
        <Topics cards={overview.cards} />
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

const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '–');

/** Of the learners who started at least N days ago, how many practised again N or more days after their first day. */
function Retention({retention, cohorts}: {retention: Overview['retention']; cohorts: Overview['cohorts']}) {
  const names: Record<number, string> = {1: 'Na 1 dag', 7: 'Na 7 dagen', 30: 'Na 30 dagen'};
  const weekLabel = (week: string) => shortDay.format(new Date(`${week}T00:00:00Z`));
  return (
    <Panel title="Retentie">
      <div className="grid grid-cols-3 gap-2">
        {retention.map((row) => (
          <div key={row.days} className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">{names[row.days] ?? `Na ${row.days} dagen`}</p>
            <p className="text-2xl font-extrabold tabular-nums">{percent(row.returned, row.eligible)}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{row.returned} van {row.eligible}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Leerders die minstens zo lang geleden begonnen en daarna nog eens oefenden; – betekent nog te vroeg om te meten. Alleen ingelogde leerders: zonder account blijft de voortgang op het toestel.</p>
      <table className="mt-4 w-full text-sm">
        <caption className="mb-1 text-left text-xs font-semibold text-muted-foreground">Per startweek (laatste 8 weken)</caption>
        <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-medium">Week van</th><th className="py-1 text-right font-medium">Gestart</th><th className="py-1 text-right font-medium">Na 1 dag</th><th className="py-1 text-right font-medium">Na 7 dagen</th><th className="py-1 text-right font-medium">Deze week actief</th></tr></thead>
        <tbody className="tabular-nums">
          {cohorts.map((row) => (
            <tr key={row.week} className="border-t">
              <td className="py-1.5">{weekLabel(row.week)}</td>
              <td className="py-1.5 text-right font-semibold">{row.starters}</td>
              <td className="py-1.5 text-right">{percent(row.day1, row.day1_eligible)}</td>
              <td className="py-1.5 text-right">{percent(row.day7, row.day7_eligible)}</td>
              <td className="py-1.5 text-right">{percent(row.active, row.starters)}</td>
            </tr>
          ))}
          {cohorts.length === 0 && <tr><td colSpan={5} className="py-3 text-muted-foreground">Nog geen nieuwe leerders.</td></tr>}
        </tbody>
      </table>
    </Panel>
  );
}

type Topic = {key: string; title: string; kind: 'thema' | 'grammatica'; answers: number; wrong: number; cards: number};

/** Which theme or grammar rule a card belongs to; card ids carry the theme (werk:…, phrase:werk:01, dialogue:werk:1, onr:…). */
function topicOf(id: string, byId: Map<string, Card>, themeTitles: Map<string, string>): Pick<Topic, 'key' | 'title' | 'kind'> {
  const card = byId.get(id);
  if (id.startsWith('zin:')) return {key: id, title: card?.title ?? id.slice(4), kind: 'grammatica'};
  if (id.startsWith('onr:') || card?.set) return {key: 'onregelmatig', title: 'Onregelmatige vormen', kind: 'grammatica'};
  const parts = id.split(':');
  const theme = card?.themeId ?? (parts[0] === 'phrase' || parts[0] === 'dialogue' ? parts[1] : parts[0]);
  return {key: theme, title: themeTitles.get(theme) ?? theme, kind: 'thema'};
}

/** Answers per theme and grammar rule over the last 30 days, with the share answered wrong. */
function Topics({cards}: {cards: Overview['cards']}) {
  const [content, setContent] = useState<Card[] | null>(null);
  const [kind, setKind] = useState<Topic['kind']>('thema');
  const [all, setAll] = useState(false);
  useEffect(() => {
    void Promise.all([import('@/core/learning-model'), import('@/core/irregular')]).then(([model, irregular]) => setContent([...model.cards, ...irregular.irregularCards]));
  }, []);
  const topics = useMemo(() => {
    if (!content) return [];
    const byId = new Map(content.map((card) => [card.id, card]));
    const themeTitles = new Map(content.filter((card) => card.themeTitle).map((card) => [card.themeId, card.themeTitle!]));
    const totals = new Map<string, Topic>();
    for (const row of cards) {
      const topic = topicOf(row.id, byId, themeTitles);
      const total = totals.get(topic.key) ?? {...topic, answers: 0, wrong: 0, cards: 0};
      total.answers += row.answers; total.wrong += row.wrong; total.cards += 1;
      totals.set(topic.key, total);
    }
    return [...totals.values()].sort((a, b) => b.answers - a.answers);
  }, [cards, content]);
  const list = topics.filter((topic) => topic.kind === kind);
  const shown = all ? list : list.slice(0, 10);
  const max = Math.max(1, ...list.map((topic) => topic.answers));
  return (
    <Panel title="Wat wordt geoefend (30 dagen)">
      <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Soort">
        {(['thema', 'grammatica'] as const).map((id) => (
          <button key={id} type="button" role="tab" aria-selected={kind === id} onClick={() => { setKind(id); setAll(false); }}
            className={cn('h-8 rounded-full border px-3 text-sm font-medium transition-colors', kind === id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}>
            {id === 'thema' ? "Thema's" : 'Grammatica'}
          </button>
        ))}
      </div>
      {!content ? <p className="text-sm text-muted-foreground">Laden…</p> : list.length === 0 ? <p className="text-sm text-muted-foreground">Nog niets geoefend.</p> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-medium">{kind === 'thema' ? 'Thema' : 'Regel'}</th><th className="w-2/5 py-1 font-medium">Antwoorden</th><th className="py-1 text-right font-medium">Fout</th></tr></thead>
          <tbody className="tabular-nums">
            {shown.map((topic) => (
              <tr key={topic.key} className="border-t">
                <td className="max-w-0 truncate py-1.5 pr-2" title={topic.title}>{topic.title}</td>
                <td className="py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 rounded-r-[4px] bg-primary" style={{width: `${Math.max(2, (topic.answers / max) * 100)}%`}} aria-hidden />
                    <span className="shrink-0">{topic.answers}</span>
                  </div>
                </td>
                <td className="py-1.5 text-right">{percent(topic.wrong, topic.answers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {list.length > 10 && <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAll(!all)}>{all ? 'Minder tonen' : `Alle ${list.length} tonen`}</Button>}
      <p className="mt-2 text-xs text-muted-foreground">Fout = antwoorden met ‘Nog niet’. Een hoog percentage wijst op een lastig onderwerp.</p>
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
