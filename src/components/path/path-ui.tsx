import {useCallback, useEffect, useRef} from 'react';
import {ArrowRight, Check, ChevronRight, Layers, MessageSquareText, MessagesSquare, Play, Puzzle, Trophy, type LucideIcon} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {ThemeArt} from '@/components/game/theme-art';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {usePractice} from '@/hooks/use-practice';
import {useProgress} from '@/hooks/use-progress';
import {navigate} from '@/hooks/use-route';
import {nextStep, pathSections, stepRound, themeSteps, themesForIrregular, themesForRule, type PathStep, type PathTheme, type StepId} from '@/core/path.js';
import {themes} from '@/core/learning-data.js';
import type {Theme} from '@/core/types';

const stepIcons: Record<StepId, LucideIcon> = {woorden: Layers, zinnen: MessageSquareText, grammatica: Puzzle, gesprek: MessagesSquare, eindspel: Trophy};

/** Starts what a step of a situation is: a round, an Onregelmatig round or the conversation game. */
export function useStepLauncher() {
  const {start, playGame} = usePractice();
  const {reviews} = useProgress();
  return useCallback((theme: Theme, stepId: StepId) => {
    const round = stepRound(theme.id, stepId, reviews);
    if (!round) return;
    const label = `${theme.title} · ${themeSteps(theme.id, reviews).find((step) => step.id === stepId)?.title ?? ''}`;
    if (round.kind === 'game') playGame(round.game, theme.id);
    else if (round.kind === 'irregular') start({irregular: round.set, label});
    else if (round.queue.length) start({queue: round.queue, drill: round.drill, label});
  }, [reviews, start, playGame]);
}

/** Five dots: done, the current one, still to come. */
export function StepDots({steps, className, active = false}: {steps: PathStep[]; className?: string; active?: boolean}) {
  // The next step is marked only on the situation you are on, or one you have started.
  const current = active || steps.some((step) => step.done > 0) ? nextStep(steps) : null;
  return (
    <span className={cn('flex items-center gap-1', className)} aria-label={`${steps.filter((step) => step.complete).length} van ${steps.length} stappen klaar`} role="img">
      {steps.map((step) => (
        <span key={step.id} className={cn('h-1.5 w-4 rounded-full', step.complete ? 'bg-success' : step.id === current?.id ? 'bg-primary' : 'bg-border')} />
      ))}
    </span>
  );
}

/** The five steps of a situation, on its page. The next step is highlighted; every step can be played. */
export function StepList({theme}: {theme: Theme}) {
  const {reviews} = useProgress();
  const launch = useStepLauncher();
  const steps = themeSteps(theme.id, reviews);
  const current = nextStep(steps);
  return (
    <ol className="flex flex-col gap-2" aria-label="Stappen">
      {steps.map((step) => {
        const Icon = stepIcons[step.id];
        const active = step.id === current?.id;
        return (
          <li key={step.id}>
            <button type="button" onClick={() => launch(theme, step.id)}
              className={cn('flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-3 text-left transition active:translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                active ? 'border-primary shadow-[0_4px_0_var(--primary-edge)]' : 'shadow-[0_3px_0_var(--border)]')}>
              <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', step.complete ? 'bg-success text-white' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {step.complete ? <Check className="size-5" aria-label="Klaar" /> : <Icon className="size-5" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">{step.number}</span>
                  <span className="text-[15px] font-bold">{step.title}</span>
                  {active && <Badge variant="streak" className="ml-auto shrink-0">Volgende</Badge>}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground" lang="nl">{step.detail}</span>
                {step.total > 1 && !step.complete && step.done > 0 && (
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{width: `${(step.done / step.total) * 100}%`}} /></span>
                )}
              </span>
              <Play className={cn('size-4 shrink-0 fill-current', active ? 'text-primary' : 'text-muted-foreground/60')} aria-hidden />
            </button>
            {step.id === 'grammatica' && (step.rules?.length || step.irregular) ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5 pl-14">
                {step.rules?.map((rule) => (
                  <button key={rule.id} type="button" onClick={() => navigate('zinnen', {rule: rule.id})} className="rounded-full border bg-card px-2.5 py-1 text-xs font-medium hover:bg-muted" lang="nl">{rule.title}</button>
                ))}
                {step.irregular && (
                  <button type="button" onClick={() => navigate('zinnen', {rule: `onregelmatig:${step.irregular!.id}`})} className="rounded-full border border-xp/50 bg-xp-soft px-2.5 py-1 text-xs font-medium text-xp-foreground" lang="nl">Onregelmatig: {step.irregular.title}</button>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Vandaag's main card: the next step on your path, one button. */
export function NextStepCard({themeId, today, goal}: {themeId: string; today: number; goal: number}) {
  const {reviews} = useProgress();
  const launch = useStepLauncher();
  const theme = themes.find((item) => item.id === themeId)!;
  const steps = themeSteps(theme.id, reviews);
  const step = nextStep(steps) ?? steps[steps.length - 1];
  return (
    <section aria-labelledby="next-step-title" className="rounded-2xl bg-secondary p-4 text-secondary-foreground shadow-[0_4px_0_var(--secondary-edge)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-extrabold tracking-wider uppercase opacity-80">Volgende stap</p>
        <p className="text-xs font-semibold tabular-nums opacity-80">Dagdoel {Math.min(today, goal)}/{goal}</p>
      </div>
      <button type="button" onClick={() => navigate('woorden', {theme: theme.id})} className="mt-2 flex w-full items-center gap-3 rounded-xl text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
        <ThemeArt theme={theme} className="size-16 shrink-0 rounded-2xl sm:size-20" />
        <span className="min-w-0 flex-1">
          <span id="next-step-title" className="block text-xl leading-tight font-extrabold sm:text-2xl">{theme.title}</span>
          <span className="mt-0.5 block text-sm opacity-80">Stap {step.number} van {steps.length} · {step.title}</span>
          <StepDots steps={steps} className="mt-2" active />
        </span>
        <ChevronRight className="size-5 shrink-0 opacity-60" aria-hidden />
      </button>
      <Button size="xl" game className="mt-4 w-full" onClick={() => launch(theme, step.id)}>
        {steps.some((item) => item.done > 0) ? 'Ga verder' : 'Begin'}<ArrowRight />
      </Button>
    </section>
  );
}

/** Leren › Pad: all situations in order, grouped, with your place on it. */
export function PathList({current, query = ''}: {current: string; query?: string}) {
  const {reviews} = useProgress();
  const needle = query.trim().toLocaleLowerCase('nl');
  const sections = pathSections.map((section) => ({...section, themes: section.themes.filter((theme) => !needle || `${theme.title} ${theme.meaning} ${theme.intro}`.toLocaleLowerCase('nl').includes(needle))})).filter((section) => section.themes.length);
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`path-${section.id}`}>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <h2 id={`path-${section.id}`} className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{section.nl}</h2>
            <Badge variant="outline">{section.level}</Badge>
          </div>
          <ol className="relative flex flex-col gap-2 before:absolute before:top-6 before:bottom-6 before:left-[33px] before:w-0.5 before:bg-border">
            {section.themes.map((theme) => <PathNode key={theme.id} theme={theme} steps={themeSteps(theme.id, reviews)} current={theme.id === current} />)}
          </ol>
        </section>
      ))}
    </div>
  );
}

function PathNode({theme, steps, current}: {theme: PathTheme; steps: PathStep[]; current: boolean}) {
  const complete = steps.every((step) => step.complete);
  const started = steps.some((step) => step.done > 0);
  const step = nextStep(steps);
  const ref = useRef<HTMLLIElement>(null);
  // Opening the path shows where you are.
  useEffect(() => { if (current) ref.current?.scrollIntoView({block: 'center'}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <li ref={ref} className="relative">
      <button type="button" onClick={() => navigate('woorden', {theme: theme.id})}
        className={cn('flex w-full items-center gap-3 rounded-2xl border-2 bg-card p-2.5 text-left transition active:translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
          current ? 'border-primary shadow-[0_4px_0_var(--primary-edge)]' : 'border-transparent')}>
        <span className="relative shrink-0">
          <ThemeArt theme={theme} className={cn('size-12 rounded-xl', !started && !current && 'opacity-70')} />
          {complete && <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-success text-white ring-2 ring-card"><Check className="size-3" aria-label="Klaar" /></span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold">{theme.title}</span>
          <Translation className="block truncate text-xs text-muted-foreground">{theme.meaning}</Translation>
          <StepDots steps={steps} className="mt-1.5" active={current} />
        </span>
        {current ? <Badge variant="streak" className="shrink-0">Hier ben je</Badge>
          : complete ? <span className="shrink-0 text-xs font-semibold text-success-foreground">Klaar</span>
            : started && step ? <span className="shrink-0 text-xs text-muted-foreground">Stap {step.number}</span> : null}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
      </button>
    </li>
  );
}

/** "Nodig bij": the situations a rule or Onregelmatig set belongs to, as links. */
export function NeededIn({ruleId, irregularId}: {ruleId?: string; irregularId?: string}) {
  const list = ruleId ? themesForRule(ruleId) : irregularId ? themesForIrregular(irregularId) : [];
  if (!list.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Nodig bij</p>
      <div className="flex flex-wrap gap-2">
        {list.map((theme) => (
          <button key={theme.id} type="button" onClick={() => navigate('woorden', {theme: theme.id})} className="flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 text-sm font-medium hover:bg-muted">
            <ThemeArt theme={theme} className="size-7 rounded-full" />{theme.title}
          </button>
        ))}
      </div>
    </div>
  );
}
