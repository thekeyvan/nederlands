import {Compass, Map, Puzzle} from 'lucide-react';
import {cn} from '@/lib/utils';
import {hrefFor, navigate, type Panel} from '@/hooks/use-route';

const tabs: {panel: Panel; label: string; icon: typeof Compass}[] = [
  {panel: 'woorden', label: 'Thema’s', icon: Compass},
  {panel: 'zinnen', label: 'Zinsbouw', icon: Puzzle},
  {panel: 'route', label: 'De route', icon: Map},
];

/** The three parts of "Leren", switched in place like tabs. */
export function LearnTabs({active}: {active: Panel}) {
  return (
    <nav aria-label="Leren" className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 sm:inline-grid sm:w-auto">
      {tabs.map(({panel, label, icon: Icon}) => {
        const current = panel === active;
        return (
          <a key={panel} href={hrefFor(panel)} aria-current={current ? 'page' : undefined}
            onClick={(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); navigate(panel, {replace: true}); }}
            className={cn('flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:px-4',
              current ? 'bg-card font-semibold text-foreground shadow-sm' : 'hover:text-foreground')}>
            <Icon className="size-4" aria-hidden />{label}
          </a>
        );
      })}
    </nav>
  );
}
