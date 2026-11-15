import type {ReactNode} from 'react';
import {ChevronRight} from 'lucide-react';
import {cn} from '@/lib/utils';

/** The large title that opens every tab, like iOS: the screen's name, with one optional action on the right. */
export function ScreenTitle({title, action, className}: {title: ReactNode; action?: ReactNode; className?: string}) {
  return (
    <header className={cn('mb-4 flex items-end justify-between gap-3 pt-2 lg:pt-0', className)}>
      <h1 className="text-[32px] leading-tight font-extrabold tracking-tight lg:text-4xl">{title}</h1>
      {action}
    </header>
  );
}

/** A small uppercase label above a group of rows. */
export function GroupLabel({children, action, className}: {children: ReactNode; action?: ReactNode; className?: string}) {
  return (
    <div className={cn('mt-6 mb-1.5 flex items-center justify-between gap-3 px-1', className)}>
      <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{children}</h2>
      {action}
    </div>
  );
}

/** Rows grouped in one rounded block (an inset grouped list). */
export function Group({children, className}: {children: ReactNode; className?: string}) {
  return <ul className={cn('overflow-hidden rounded-xl border bg-card', className)}>{children}</ul>;
}

/** One tappable row: leading icon or picture, title and detail, a value, and a chevron. */
export function Row({leading, title, detail, trailing, onClick, chevron = true, className, titleClassName, label}: {
  leading?: ReactNode; title: ReactNode; detail?: ReactNode; trailing?: ReactNode; onClick?: () => void; chevron?: boolean; className?: string; titleClassName?: string; label?: string;
}) {
  const body = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[15px] leading-tight font-semibold', titleClassName)}>{title}</span>
        {detail && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{detail}</span>}
      </span>
      {trailing}
      {onClick && chevron && <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />}
    </>
  );
  const classes = cn('flex min-h-[52px] w-full items-center gap-3 px-3.5 py-2.5 text-left', className);
  return (
    <li className="border-b last:border-b-0">
      {onClick
        ? <button type="button" onClick={onClick} aria-label={label} className={cn(classes, 'transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none active:bg-muted')}>{body}</button>
        : <div className={classes}>{body}</div>}
    </li>
  );
}

/** A rounded square icon at the start of a row. */
export function RowIcon({children, className}: {children: ReactNode; className?: string}) {
  return <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-[18px]', className)} aria-hidden>{children}</span>;
}
