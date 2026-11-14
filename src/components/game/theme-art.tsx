import {cn} from '@/lib/utils';
import {sceneFor} from '@/lib/illustrations';
import {themeIcon} from '@/lib/icons';
import {themeMeta} from '@/core/learning-model.js';
import type {Theme} from '@/core/types';

const tints = {peach: 'bg-accent text-accent-foreground', lavender: 'bg-lavender text-lavender-foreground', mint: 'bg-success-soft text-success-foreground', blue: 'bg-info-soft text-info-foreground'};

/** The theme's illustration, or a coloured icon tile for themes without one (e.g. added by a fork). */
export function ThemeArt({theme, className}: {theme: Pick<Theme, 'id'>; className?: string}) {
  const scene = sceneFor(theme.id);
  const meta = themeMeta(theme);
  if (scene) return <img src={scene} alt="" className={cn('object-cover', className)} draggable={false} loading="lazy" />;
  const Icon = themeIcon(meta.icon);
  return (
    <span className={cn('grid place-items-center', tints[meta.color], className)}>
      <Icon className="size-1/3" aria-hidden />
    </span>
  );
}
