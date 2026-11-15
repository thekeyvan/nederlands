import {useState} from 'react';
import {Bug, Heart, Lightbulb, Send} from 'lucide-react';
import {toast} from 'sonner';
import {trackEvent} from '@/lib/stats';
import {Button} from '@/components/ui/button';
import {ResponsiveSheet} from '@/components/responsive-sheet';
import {cn} from '@/lib/utils';

/* Feedback from the website: the same /api/feedback as the iPhone app (where you shake the phone). */
const kinds = [
  {id: 'probleem', title: 'Probleem', icon: Bug, prompt: 'Wat ging er mis? Wat verwachtte je?', tone: 'text-destructive'},
  {id: 'idee', title: 'Idee', icon: Lightbulb, prompt: 'Wat zou de site beter of leuker maken?', tone: 'text-xp'},
  {id: 'compliment', title: 'Compliment', icon: Heart, prompt: 'Wat vind je fijn?', tone: 'text-primary'},
] as const;

export function FeedbackSheet({open, onOpenChange}: {open: boolean; onOpenChange: (open: boolean) => void}) {
  const [kind, setKind] = useState<(typeof kinds)[number]['id']>('idee');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const current = kinds.find((item) => item.id === kind)!;
  const screen = `Website ${location.pathname}${location.hash}`;

  const send = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({kind, message: message.trim(), screen, platform: 'web', context: {browser: navigator.userAgent.slice(0, 200), width: String(window.innerWidth), locale: navigator.language}}),
      });
      if (!response.ok) throw new Error(String(response.status));
      trackEvent('feedback', {soort: kind});
      toast('Dank je wel! We lezen alles.');
      setMessage('');
      onOpenChange(false);
    } catch {
      toast('Versturen lukt nu niet. Probeer het later opnieuw.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="Feedback" description="Een probleem, een idee of iets wat je fijn vindt: alles helpt.">
      <div className="flex flex-col gap-4 pb-4">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Soort feedback">
          {kinds.map(({id, title, icon: Icon, tone}) => (
            <button key={id} type="button" role="radio" aria-checked={kind === id} onClick={() => setKind(id)}
              className={cn('flex flex-col items-center gap-1.5 rounded-xl border-2 bg-card py-3 text-sm font-semibold transition-colors', kind === id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted')}>
              <Icon className={cn('size-5', tone)} aria-hidden />{title}
            </button>
          ))}
        </div>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} rows={5} placeholder={current.prompt} aria-label="Je feedback"
          className="w-full resize-none rounded-xl border bg-card p-3 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" />
        <p className="text-xs text-muted-foreground">We sturen ook mee: deze pagina en je browser. Ben je ingelogd, dan weten we bij welk account het hoort.</p>
        <Button size="xl" disabled={busy || !message.trim()} onClick={() => void send()}><Send />{busy ? 'Versturen…' : 'Verstuur'}</Button>
      </div>
    </ResponsiveSheet>
  );
}
