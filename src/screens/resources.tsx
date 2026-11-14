import {useEffect, useMemo, useRef, useState} from 'react';
import {AlignLeft, ArrowUpRight, BookMarked, BookOpen, Bookmark, Ear, Mic, PenLine, RotateCcw, Search, Shuffle, SpellCheck, Timer, Type, Puzzle} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';
import {Progress} from '@/components/ui/progress';
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {Page, PageHeader, SectionTitle} from '@/components/page';
import {ResponsiveSheet} from '@/components/responsive-sheet';
import {Mascot} from '@/components/game/mascot';
import {cn} from '@/lib/utils';
import {plural} from '@/lib/text';
import {sceneFor} from '@/lib/illustrations';
import {usePreferences} from '@/hooks/use-preferences';
import {ideas, prompts, resources, weekTasks} from '@/core/data.js';
import {matchingResources} from '@/core/state.js';
import type {Resource} from '@/core/types';
import {toast} from 'sonner';

const categories = ['start', 'all', 'Luisteren', 'Lezen', 'Spreken', 'Uitspraak', 'Grammatica', 'Schrijven', 'Woorden', 'Boeken', 'saved'];
const categoryLabels: Record<string, string> = {start: 'Begin hier', all: 'Alles', saved: 'Bewaard'};
const categoryIcons: Record<string, typeof Ear> = {Luisteren: Ear, Lezen: AlignLeft, Spreken: Mic, Uitspraak: Type, Grammatica: Puzzle, Schrijven: PenLine, Woorden: SpellCheck, Boeken: BookOpen};
const notes: Record<string, string> = {
  start: 'Zes fijne plekken om te beginnen. Je hoeft ze niet allemaal te gebruiken.',
  Boeken: 'Eén goed boek is genoeg. Kies een hoofdboek dat bij je niveau past.',
  saved: 'Jouw bewaarde bronnen. Tik op het bladwijzertje om iets te bewaren.',
  all: 'De hele verzameling. Kies een vaardigheid of zoek iets dat je nodig hebt.',
};

export function ResourcesScreen({section}: {section: 'bronnen' | 'week'}) {
  const [preferences, update] = usePreferences();
  const [category, setCategory] = useState('start');
  const [level, setLevel] = useState('all');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Resource | null>(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [ideaIndex, setIdeaIndex] = useState(() => Math.floor(Date.now() / 86_400_000) % ideas.length);
  const weekRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (section === 'week') requestAnimationFrame(() => weekRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'}));
  }, [section]);
  const selected = matchingResources(resources, {category, level, query}, preferences.saved);
  const idea = ideas[ideaIndex];
  const ideaResource = resources.find((resource) => resource.id === idea.resource);
  const toggleSaved = (id: string) => {
    const wasSaved = preferences.saved.includes(id);
    update((current) => ({...current, saved: wasSaved ? current.saved.filter((value) => value !== id) : [...current.saved, id]}));
    toast(wasSaved ? 'Bron verwijderd uit Bewaard.' : 'Bron bewaard voor later.');
  };
  return (
    <Page wide>
      <PageHeader eyebrow="Om verder te leren" title="Websites & boeken." description="Een kort nieuwsbericht. Een goed gesprek. Een paar nieuwe woorden. Kies iets en begin."
        action={<Button size="xl" variant="secondary" game onClick={() => setTimerOpen(true)}><Timer />Ik heb 20 minuten</Button>} />

      <Card className="mb-8 overflow-hidden bg-secondary py-0 text-secondary-foreground shadow-[0_5px_0_var(--secondary-edge)]">
        <CardContent className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">Een idee voor vandaag · {idea.type.toLocaleLowerCase('nl')}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">{idea.title}</h2>
            <p className="mt-1 opacity-80">{idea.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ideaResource && <Button game asChild><a href={ideaResource.url} target="_blank" rel="noopener noreferrer">Open {ideaResource.name}<ArrowUpRight /></a></Button>}
              <Button variant="ghost" className="text-secondary-foreground hover:bg-white/10 hover:text-secondary-foreground" onClick={() => setIdeaIndex((ideaIndex + 1) % ideas.length)}><Shuffle />Ander idee</Button>
            </div>
          </div>
          <img src={sceneFor('bronnen')} alt="" className="hidden size-36 rounded-2xl object-cover md:block" />
        </CardContent>
      </Card>

      <section aria-labelledby="sources-title">
        <SectionTitle title={<span id="sources-title">Bronnen</span>} action={<span className="text-sm text-muted-foreground" role="status">{plural(selected.length, 'bron', 'bronnen')}</span>} />
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block lg:w-72">
            <span className="sr-only">Zoek een bron</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input type="search" value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value.trim() && category === 'start') setCategory('all'); }} placeholder="Zoek, bijvoorbeeld podcast" className="h-10 bg-card pl-9" />
          </label>
          <ToggleGroup type="single" variant="outline" value={level} onValueChange={(value) => value && setLevel(value)} aria-label="Niveau">
            <ToggleGroupItem value="all" className="px-3">Alle niveaus</ToggleGroupItem>
            <ToggleGroupItem value="A2" className="px-3">A2–B1</ToggleGroupItem>
            <ToggleGroupItem value="B1" className="px-3">B1+</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="no-scrollbar -mx-4 mb-3 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ToggleGroup type="single" variant="outline" value={category} onValueChange={(value) => { if (value) { setCategory(value); setQuery(''); } }} aria-label="Soort bron" className="w-max">
            {categories.map((item) => (
              <ToggleGroupItem key={item} value={item} className="px-3.5 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">
                {item === 'saved' && <Bookmark />}{categoryLabels[item] ?? item}{item === 'saved' && preferences.saved.length > 0 && <span className="ml-1 tabular-nums">{preferences.saved.length}</span>}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{notes[category] ?? 'Kies één bron. Bij elke bron staat een korte opdracht.'}</p>
        {selected.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {selected.map((resource) => {
              const Icon = categoryIcons[resource.categories[0]] ?? BookMarked;
              const saved = preferences.saved.includes(resource.id);
              return (
                <li key={resource.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-[0_3px_0_var(--border)]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="size-5" aria-hidden /></span>
                    <Button variant="ghost" size="icon-sm" aria-pressed={saved} aria-label={`${saved ? 'Verwijder' : 'Bewaar'} ${resource.name}`} onClick={() => toggleSaved(resource.id)}>
                      <Bookmark className={cn(saved && 'fill-primary text-primary')} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{resource.categories[0]} · {resource.level === 'A2' ? 'A2–B1' : 'B1+'} · {resource.time}</p>
                  <h3 className="font-bold">{resource.name}</h3>
                  <p className="flex-1 text-sm text-muted-foreground">{resource.description}</p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setDetail(resource)}>Zo kun je oefenen</Button>
                    <Badge variant="outline">{resource.cost}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
            <Mascot mood="think" className="size-20" />
            <p className="font-semibold">{category === 'saved' ? 'Je hebt nog niets bewaard.' : 'Geen bron gevonden.'}</p>
            <Button variant="outline" onClick={() => { setLevel('all'); setCategory('all'); setQuery(''); }}>Toon alle bronnen</Button>
          </div>
        )}
      </section>

      <section ref={weekRef} id="week" aria-labelledby="week-title" className="mt-10 scroll-mt-20">
        <WeekPlan done={preferences.done} onChange={(done) => update((current) => ({...current, done}))} />
      </section>

      <ResponsiveSheet open={detail !== null} onOpenChange={(open) => !open && setDetail(null)} title={detail?.name ?? ''} description={detail ? `${detail.categories.join(' / ')} · ${detail.level === 'A2' ? 'A2–B1' : 'B1+'}` : undefined}>
        {detail && (
          <div className="flex flex-col gap-4 pb-2">
            <p className="text-muted-foreground">{detail.description}</p>
            <ol className="flex flex-col gap-2">
              {detail.steps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-lg bg-muted p-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>{step}</li>
              ))}
            </ol>
            {detail.note && <p className="text-sm text-muted-foreground">{detail.note}</p>}
            {detail.alternate && <a href={detail.alternate.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline-offset-4 hover:underline">{detail.alternate.label} ↗</a>}
            <Button size="lg" game asChild><a href={detail.url} target="_blank" rel="noopener noreferrer">Open {detail.name}<ArrowUpRight /></a></Button>
          </div>
        )}
      </ResponsiveSheet>
      <TimerSheet open={timerOpen} onOpenChange={setTimerOpen} />
    </Page>
  );
}

function WeekPlan({done, onChange}: {done: string[]; onChange: (done: string[]) => void}) {
  return (
    <Card>
      <CardContent className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-3">
          <img src={sceneFor('week')} alt="" className="hidden aspect-square w-full rounded-xl border object-cover md:block" />
          <div>
            <h2 id="week-title" className="text-xl font-bold tracking-tight">Mijn week</h2>
            <p className="text-sm text-muted-foreground">Vijf kleine opdrachten. Elke maandag begin je opnieuw.</p>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={(done.length / weekTasks.length) * 100} className="h-2.5 flex-1" indicatorClassName={done.length === weekTasks.length ? 'bg-success' : undefined} aria-label={`${done.length} van ${weekTasks.length} gedaan`} />
            <span className="text-sm font-semibold tabular-nums">{done.length} / {weekTasks.length}</span>
          </div>
          <Button variant="ghost" size="sm" className="self-start" onClick={() => { onChange([]); toast('Je kunt opnieuw beginnen.'); }}><RotateCcw />Opnieuw beginnen</Button>
        </div>
        <ul className="flex flex-col gap-2.5">
          {weekTasks.map((task) => {
            const checked = done.includes(task.id);
            return (
              <li key={task.id}>
                <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:bg-muted', checked && 'border-success/40 bg-success-soft hover:bg-success-soft')}>
                  <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true ? [...new Set([...done, task.id])] : done.filter((id) => id !== task.id))} className="mt-0.5 size-5" aria-label={task.title} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2"><strong className={cn(checked && 'line-through decoration-success/60')}>{task.title}</strong><Badge variant="outline" className="text-[10px]">{task.time.toLocaleLowerCase('nl')}</Badge></span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{task.copy}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function TimerSheet({open, onOpenChange}: {open: boolean; onOpenChange: (open: boolean) => void}) {
  const [remaining, setRemaining] = useState(1200);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [prompt, setPrompt] = useState(0);
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setDeadline(null);
        toast.success('Je 20 minuten zijn klaar. Goed geoefend.');
      }
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [deadline]);
  const label = useMemo(() => `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`, [remaining]);
  useEffect(() => {
    if (deadline === null) return;
    const previous = document.title;
    document.title = `${label} · Mijn Nederlands`;
    return () => { document.title = previous; };
  }, [label, deadline]);
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Twintig minuten Nederlands" description="Kies een bron, start de timer en praat daarna hardop.">
      <div className="flex flex-col items-center gap-4 pb-2 text-center">
        <p className="text-6xl font-extrabold tabular-nums" role="timer" aria-live="off">{label}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="lg" game onClick={() => (deadline === null ? setDeadline(Date.now() + (remaining || 1200) * 1000) : (setDeadline(null)))}>
            {deadline !== null ? 'Pauze' : remaining === 0 ? 'Nog een keer' : remaining < 1200 ? 'Ga verder' : 'Start de timer'}
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setDeadline(null); setRemaining(1200); }}>Opnieuw</Button>
        </div>
        <p className="text-sm text-muted-foreground">{remaining === 0 ? 'Klaar! Vertel in drie zinnen wat je hebt geleerd.' : 'De timer blijft lopen als je de bron in een nieuw tabblad opent.'}</p>
        <div className="w-full rounded-xl bg-accent p-4 text-left text-accent-foreground">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"><Mic className="size-4" />Praat even hardop</p>
          <p className="mt-1 text-lg font-semibold">{prompts[prompt]}</p>
          <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={() => setPrompt((prompt + 1) % prompts.length)}><Shuffle />Andere vraag</Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
