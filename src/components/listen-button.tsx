import {Volume2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {useAudio} from '@/hooks/use-audio';

/** Plays the bundled Dutch clip for this exact text. */
export function ListenButton({text, className, size = 'icon-sm', variant = 'ghost', label = 'Luister', showLabel = false}: {
  text: string; className?: string; size?: 'icon-sm' | 'icon' | 'icon-lg' | 'sm' | 'default'; variant?: 'ghost' | 'outline' | 'info'; label?: string; showLabel?: boolean;
}) {
  const audio = useAudio();
  const active = audio.current === text && (audio.state === 'playing' || audio.state === 'loading');
  return (
    <Button type="button" variant={variant} size={size} className={cn(active && 'text-primary', className)} aria-label={`${label}: ${text}`} title={`${audio.voiceName} · Nederlands`}
      onClick={(event) => {
        event.stopPropagation();
        audio.play(text);
      }}>
      <Volume2 className={cn(active && 'animate-pulse')} aria-hidden />
      {showLabel && label}
    </Button>
  );
}
