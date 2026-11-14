import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

export function Page({children, className, wide = false}: {children: ReactNode; className?: string; wide?: boolean}) {
  return <div className={cn('mx-auto w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-8', wide ? 'max-w-7xl' : 'max-w-6xl', className)}>{children}</div>;
}

export function PageHeader({eyebrow, title, description, action, className}: {eyebrow?: string; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string}) {
  return (
    <header className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="mb-1.5 text-xs font-semibold tracking-wider text-primary uppercase">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({title, action, className}: {title: ReactNode; action?: ReactNode; className?: string}) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-3', className)}>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}
