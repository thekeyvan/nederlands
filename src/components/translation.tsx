import type {ElementType, ReactNode} from 'react';
import {cn} from '@/lib/utils';
import {locale} from '@/core/i18n.js';

/** Text in the learner's own language, with its language code, direction and font. */
export function Translation({children, as: Tag = 'p', className}: {children?: ReactNode; as?: ElementType; className?: string}) {
  if (!children) return null;
  // Block translations hug their text so RTL lines sit with the layout instead of floating to the far edge.
  const block = typeof Tag === 'string' && ['p', 'h1', 'h2', 'h3', 'div'].includes(Tag);
  return <Tag lang={locale.code} dir={locale.dir} className={cn('translation', block && 'w-fit max-w-full', className)}>{children}</Tag>;
}
