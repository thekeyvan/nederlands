import {useState} from 'react';
import {Check, ChevronDown, Trophy} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {StopMarker} from '@/components/game/route-strip';
import {Mascot} from '@/components/game/mascot';
import {practiceScene, sceneFor} from '@/lib/illustrations';
import {ScreenTitle} from '@/components/app/list';
import {LearnTabs} from '@/components/app/learn-tabs';
import {Page} from '@/components/page';
import {cn} from '@/lib/utils';
import {useGame} from '@/hooks/use-progress';
import {usePractice} from '@/hooks/use-practice';
import {navigate} from '@/hooks/use-route';
import {sentences} from '@/core/sentence-data.js';
import {themes} from '@/core/learning-data.js';

/** The eight stops as a path. Tapping a stop opens it right there, with what you do and one Start button. */
export function RouteScreen({step}: {step: number | null}) {
  const game = useGame();
  const {start} = usePractice();
  const {route} = game;
  const [open, setOpen] = useState<number | null>(step && step <= route.steps.length ? step - 1 : route.current);
  return (
    <Page>
      <ScreenTitle title="Leren" />
      <LearnTabs active="route" />
      <div className="mb-3 flex items-center gap-4 rounded-2xl border bg-card p-3 sm:max-w-2xl">
        <img src={sceneFor('route')} alt="" className="size-20 shrink-0 rounded-xl bg-[#fcfaf6] object-cover" draggable={false} />
        <div className="min-w-0">
          <p className="text-lg font-bold">A2 → B1</p>
          <p className="text-sm text-muted-foreground tabular-nums">{route.completed} van {route.steps.length} haltes · acht stappen uit je lessen</p>
        </div>
      </div>
      <ol className="relative sm:max-w-2xl">
        <span aria-hidden className="absolute top-7 bottom-7 left-[21px] border-l-[3px] border-dashed border-border" />
        {route.steps.map((item, index) => {
          const state = item.complete ? 'done' : index === route.current ? 'now' : 'open';
          const last = index === route.steps.length - 1;
          const expanded = open === index;
          const lesson = item.lesson;
          const grammar = lesson.grammarIds.map((id) => sentences.find((card) => card.id === id)).filter(Boolean);
          return (
            <li key={lesson.id} className="relative py-1.5">
              <button type="button" onClick={() => setOpen(expanded ? null : index)} aria-expanded={expanded}
                className="flex w-full items-center gap-3 rounded-xl py-1 text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                {state === 'now' ? <Mascot mood="wave" className="size-11 shrink-0 ring-[3px] ring-primary" label={`Je bent bij halte ${index + 1}`} /> : <StopMarker state={state} className="size-11 shrink-0 border-[3px] text-base" label={item.complete ? <Check className="size-5" /> : last ? <Trophy className="size-5" /> : index + 1} />}
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-[15px] leading-tight', expanded || state === 'now' ? 'font-bold' : 'font-semibold')}>{lesson.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">{item.done} van {item.total} geoefend</span>
                </span>
                <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} aria-hidden />
              </button>
              {expanded && (
                <div className="mt-2 ml-14 flex animate-in flex-col gap-3 rounded-xl border bg-card p-3.5 fade-in slide-in-from-top-1">
                  <Progress value={(item.done / item.total) * 100} className="h-1.5" indicatorClassName={item.complete ? 'bg-success' : undefined} aria-label={`${item.done} van ${item.total} geoefend`} />
                  <ul className="flex flex-col gap-2 text-sm">
                    <li className="flex items-center gap-2.5"><img src={practiceScene('woorden')} alt="" className="size-9 shrink-0 rounded-lg bg-[#fcfaf6]" />{item.total} kaartjes herhalen</li>
                    {grammar.length > 0 && (
                      <li className="flex items-start gap-2.5"><img src={sceneFor('zinsbouw')} alt="" className="size-9 shrink-0 rounded-lg bg-[#fcfaf6]" />
                        <span className="flex flex-wrap gap-1.5 pt-1.5">{grammar.map((card) => <button key={card!.id} type="button" onClick={() => navigate('zinnen', {rule: card!.id})} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium hover:bg-muted/70">{card!.title}</button>)}</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2.5"><img src={sceneFor('spreken')} alt="" className="size-9 shrink-0 rounded-lg bg-[#fcfaf6]" /><span className="pt-1.5">{lesson.task}</span></li>
                  </ul>
                  <div className="flex flex-wrap gap-1.5">
                    {lesson.themeIds.map((id) => {
                      const theme = themes.find((item) => item.id === id);
                      return theme ? <button key={id} type="button" onClick={() => navigate('woorden', {theme: id})} className="rounded-full border px-2.5 py-1 text-xs font-medium hover:bg-muted">{theme.title}</button> : null;
                    })}
                  </div>
                  <Button size="lg" game onClick={() => start({cardIds: lesson.cardIds, theme: 'all', type: 'all', limit: 10, label: `Halte ${index + 1}`})}>
                    {item.complete ? 'Herhaal halte' : `Start halte ${index + 1}`}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Page>
  );
}
