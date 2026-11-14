import {Check, Trophy} from 'lucide-react';
import {Mascot} from '@/components/game/mascot';
import {cn} from '@/lib/utils';
import {navigate} from '@/hooks/use-route';
import type {Route} from '@/core/game.js';

const short = ['Een zin die klopt', 'Vertellen', 'Activiteit', 'Je huis', 'Vrije tijd', 'Vragen', 'Verwijzen', 'Een verhaal'];

export function StopMarker({state, label, className}: {state: 'done' | 'now' | 'open'; label: React.ReactNode; className?: string}) {
  return (
    <span className={cn('grid place-items-center rounded-full border-2 font-bold tabular-nums transition',
      state === 'done' && 'border-success bg-success text-white shadow-[0_3px_0_var(--success-edge)]',
      state === 'now' && 'border-primary bg-primary text-primary-foreground shadow-[0_3px_0_var(--primary-edge)] ring-4 ring-primary/25',
      state === 'open' && 'border-input bg-card text-muted-foreground', className)}>
      {label}
    </span>
  );
}

/** The eight classroom steps as a horizontal route. Scrolls sideways on small screens. */
export function RouteStrip({route, className}: {route: Route; className?: string}) {
  return (
    <div className={cn('no-scrollbar -mx-1 overflow-x-auto px-1 pt-10 pb-1', className)}>
      <ol className="relative grid min-w-[560px] grid-cols-8 gap-1 text-center">
        <span aria-hidden className="absolute top-6 right-[6%] left-[6%] border-t-4 border-dashed border-border" />
        {route.steps.map((step, index) => {
          const state = step.complete ? 'done' : index === route.current ? 'now' : 'open';
          const last = index === route.steps.length - 1;
          return (
            <li key={step.lesson.id} className="relative">
              <button type="button" onClick={() => navigate('route', {step: index + 1})} className="group flex w-full flex-col items-center gap-2 rounded-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label={`Halte ${index + 1}: ${step.lesson.title}, ${step.done} van ${step.total} geoefend`}>
                {state === 'now' && <Mascot mood="wave" className="absolute -top-10 size-10 animate-pop" />}
                <StopMarker state={state} className="size-12 group-hover:scale-105" label={step.complete ? <Check className="size-5" /> : last ? <Trophy className="size-5" /> : index + 1} />
                <span className={cn('text-[11px] leading-tight', state === 'open' ? 'text-muted-foreground' : 'font-semibold')}>{short[index] ?? step.lesson.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
