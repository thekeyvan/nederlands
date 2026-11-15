import {cn} from '@/lib/utils';
import {hrefFor, navigate, type Panel} from '@/hooks/use-route';

const parts: {panel: Panel; label: string}[] = [
  {panel: 'woorden', label: 'Pad'},
  {panel: 'zinnen', label: 'Grammatica'},
];

/** The two parts of Leren (the path of situations, and grammar to look things up), switched in place. */
export function LearnTabs({active}: {active: Panel}) {
  return (
    <nav aria-label="Leren" className="mb-4 grid grid-cols-2 rounded-lg bg-muted p-0.5 sm:max-w-md">
      {parts.map(({panel, label}) => {
        const current = panel === active;
        return (
          <a key={panel} href={hrefFor(panel)} aria-current={current ? 'page' : undefined}
            onClick={(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); if (!current) navigate(panel, {replace: true}); }}
            className={cn('rounded-md py-1.5 text-center text-[13px] font-semibold text-muted-foreground transition focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
              current ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground')}>
            {label}
          </a>
        );
      })}
    </nav>
  );
}
