import {cn} from '@/lib/utils';
import {logo} from '@/lib/illustrations';
import {hrefFor, navigate} from '@/hooks/use-route';

export function Brand({className, showName = true}: {className?: string; showName?: boolean}) {
  return (
    <a href={hrefFor('oefenen')} onClick={(event) => { event.preventDefault(); navigate('oefenen', {root: true}); }}
      className={cn('flex items-center gap-2.5 rounded-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none', className)} aria-label="Nedfa, naar Oefenen">
      <img src={logo} alt="" className="size-10 rounded-xl" draggable={false} />
      {showName && <span className="text-base leading-tight font-bold">nedfa</span>}
    </a>
  );
}
