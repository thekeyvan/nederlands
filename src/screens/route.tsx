import {ArrowRight, Check, ChevronRight, Mic, Puzzle, RotateCcw, Trophy} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Mascot} from '@/components/game/mascot';
import {StopMarker} from '@/components/game/route-strip';
import {Page, PageHeader} from '@/components/page';
import {cn} from '@/lib/utils';
import {routeMap} from '@/lib/illustrations';
import {useGame} from '@/hooks/use-progress';
import {usePractice} from '@/hooks/use-practice';
import {navigate} from '@/hooks/use-route';
import {sentences} from '@/core/sentence-data.js';
import {themes} from '@/core/learning-data.js';

// Stop positions on the illustrated map (percent of width/height), from the bottom up.
const positions: [number, number][] = [[32.7, 93.8], [63.5, 83.3], [31.3, 71.9], [63, 58.3], [32.2, 43.3], [66.4, 29.9], [39.6, 18.9], [63.5, 6.2]];

export function RouteScreen({step}: {step: number | null}) {
  const game = useGame();
  const {start} = usePractice();
  const {route} = game;
  const selected = step && step <= route.steps.length ? step - 1 : route.current;
  const current = route.steps[selected];
  const {lesson} = current;
  return (
    <Page wide>
      <PageHeader eyebrow="Verder na je taalcursus" title="De route." description="Acht haltes uit je lessen, van A2 naar B1. Per halte: 5 minuten herhalen, 5 minuten zinsbouw en 5 minuten hardop spreken."
        action={<Badge variant="xp" className="h-8 px-3 text-sm">{route.completed} / {route.steps.length} haltes</Badge>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border bg-[#fcfaf6]">
          <img src={routeMap} alt="Een speelse kaart met een kronkelende route langs grachten, een molen en tulpen" className="w-full" draggable={false} />
          {route.steps.map((item, index) => {
            const [x, y] = positions[index] ?? [50, 50];
            const state = item.complete ? 'done' : index === route.current ? 'now' : 'open';
            const last = index === route.steps.length - 1;
            return (
              <button key={item.lesson.id} type="button" onClick={() => navigate('route', {step: index + 1, replace: true})}
                className={cn('absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none', selected === index && 'ring-4 ring-secondary/40')}
                style={{left: `${x}%`, top: `${y}%`, width: '12.5%'}} aria-label={`Halte ${index + 1}: ${item.lesson.title}, ${item.done} van ${item.total} geoefend`} aria-current={selected === index ? 'step' : undefined}>
                {state === 'now' && <Mascot mood="wave" className="absolute bottom-[85%] left-1/2 size-12 -translate-x-1/2 animate-pop border-2 border-secondary" />}
                <StopMarker state={state} className="aspect-square w-full border-[3px] text-base sm:text-lg" label={item.complete ? <Check className="size-5" /> : last ? <Trophy className="size-5" /> : index + 1} />
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={current.complete ? 'success' : selected === route.current ? 'streak' : 'outline'}>Halte {selected + 1} · {lesson.level}</Badge>
                {current.complete && <span className="flex items-center gap-1 text-sm font-medium text-success-foreground"><Check className="size-4" />Geoefend</span>}
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{lesson.title}</h2>
              <p className="text-muted-foreground">{lesson.goal}</p>
              <div>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">Kaartjes geoefend</span><span className="text-muted-foreground tabular-nums">{current.done}/{current.total} · {current.known} onthouden</span></div>
                <Progress value={(current.done / current.total) * 100} className="h-2.5" indicatorClassName={current.complete ? 'bg-success' : undefined} aria-label={`${current.done} van ${current.total} geoefend`} />
              </div>
              <ol className="grid gap-2.5 sm:grid-cols-3">
                <li className="flex flex-col gap-2 rounded-lg bg-success-soft p-3 text-success-foreground">
                  <span className="flex items-center gap-2 font-semibold"><RotateCcw className="size-4" />5 min herhalen</span>
                  <span className="text-sm opacity-90">{current.total} kaartjes uit deze halte.</span>
                </li>
                <li className="flex flex-col gap-2 rounded-lg bg-lavender p-3 text-lavender-foreground">
                  <span className="flex items-center gap-2 font-semibold"><Puzzle className="size-4" />5 min zinsbouw</span>
                  <span className="flex flex-wrap gap-1.5">
                    {lesson.grammarIds.map((id) => {
                      const card = sentences.find((item) => item.id === id);
                      return card ? <button key={id} type="button" onClick={() => navigate('zinnen', {rule: id})} className="rounded-md bg-card/70 px-2 py-0.5 text-left text-xs font-medium hover:bg-card">{card.title}</button> : null;
                    })}
                  </span>
                </li>
                <li className="flex flex-col gap-2 rounded-lg bg-accent p-3 text-accent-foreground">
                  <span className="flex items-center gap-2 font-semibold"><Mic className="size-4" />5 min hardop</span>
                  <span className="text-sm opacity-90">{lesson.task}</span>
                </li>
              </ol>
              <div className="flex flex-wrap gap-2">
                {lesson.themeIds.map((id) => {
                  const theme = themes.find((item) => item.id === id);
                  return theme ? <Button key={id} variant="outline" size="sm" onClick={() => navigate('woorden', {theme: id})}>{theme.title}<ChevronRight /></Button> : null;
                })}
              </div>
              <Button size="xl" game className="sm:self-start" onClick={() => start({cardIds: lesson.cardIds, theme: 'all', type: 'all', limit: 10, label: `Halte ${selected + 1}`})}>
                {current.complete ? 'Herhaal deze halte' : `Ga verder bij halte ${selected + 1}`}<ArrowRight />
              </Button>
              <p className="text-xs text-muted-foreground">Moeilijk? Blijf gerust langer bij dezelfde halte. De teller toont wat je hebt geoefend; het is geen niveautoets.</p>
            </CardContent>
          </Card>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {route.steps.map((item, index) => (
              <li key={item.lesson.id}>
                <button type="button" onClick={() => navigate('route', {step: index + 1, replace: true})}
                  className={cn('flex w-full items-center gap-2 rounded-lg border bg-card p-2.5 text-left text-xs transition hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none', selected === index && 'border-primary bg-accent/50')}>
                  <StopMarker state={item.complete ? 'done' : index === route.current ? 'now' : 'open'} className="size-7 shrink-0 text-xs ring-0" label={item.complete ? <Check className="size-3.5" /> : index + 1} />
                  <span className="line-clamp-2 font-medium">{item.lesson.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Page>
  );
}
