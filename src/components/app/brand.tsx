import {cn} from '@/lib/utils';
import {hrefFor, navigate} from '@/hooks/use-route';

export function Brand({className, showName = true}: {className?: string; showName?: boolean}) {
  return (
    <a href={hrefFor('oefenen')} onClick={(event) => { event.preventDefault(); navigate('oefenen', {root: true}); }}
      className={cn('flex items-center gap-2.5 rounded-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none', className)} aria-label="Nedfa, naar Oefenen">
      <span className="grid size-9 place-items-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground shadow-[0_3px_0_var(--primary-edge)]">n.</span>
      {showName && <span className="text-sm leading-tight font-bold">nedfa</span>}
    </a>
  );
}
