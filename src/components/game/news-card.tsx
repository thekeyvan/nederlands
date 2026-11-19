import {useState} from 'react';
import {Check, ExternalLink, Tv} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {trackEvent} from '@/lib/stats';
import {newsFor, newsLink, newsMark, newsShows, newsState, newsTip} from '@/core/news.js';
import type {NewsMark, NewsShow, NewsState} from '@/core/news.js';

const KEY = 'nedfa-news';

function readMark(): NewsMark | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

function saveMark(mark: NewsMark) {
  try {
    localStorage.setItem(KEY, JSON.stringify(mark));
  } catch {
    // Without storage the card simply starts fresh next time.
  }
}

/** Het nieuws van vandaag: one short news video on YouTube, matched to the learner's level, ticked off by the learner. */
export function NewsCard({level, className}: {level: string | null; className?: string}) {
  const [state, setState] = useState<NewsState>(() => newsState(readMark()));
  const show = newsFor(level);
  const others = newsShows.filter((item) => item.id !== show.id);
  const mark = (next: NewsState) => {
    saveMark(newsMark(next));
    setState(next);
  };
  const opened = (item: NewsShow) => {
    trackEvent('nieuws', {journaal: item.id});
    if (state !== 'done') mark('asked');
  };

  return (
    <Card className={cn('gap-3 py-4', className)}>
      <CardHeader className="px-4">
        <CardTitle className="text-sm">Nieuws van vandaag</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-center gap-3">
          <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', state === 'done' ? 'bg-success/15 text-success' : 'bg-[#24416a] text-[#ffc53d]')} aria-hidden>
            {state === 'done' ? <Check className="size-5" /> : <Tv className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            {state === 'idle' && <><p className="text-sm font-semibold">{show.title}</p><p className="text-xs text-muted-foreground">{show.detail} · {show.minutes} min</p></>}
            {state === 'asked' && <><p className="text-sm font-semibold">Heb je het gekeken?</p><p className="text-xs text-muted-foreground">Vertel in 3 zinnen wat er gebeurde.</p></>}
            {state === 'done' && <><p className="text-sm font-semibold">Gekeken</p><p className="text-xs text-muted-foreground">Twee keer kijken helpt. Morgen is er weer nieuw nieuws.</p></>}
          </div>
        </div>
        {state === 'idle' && (
          <>
            <p dir="rtl" lang="fa" className="rounded-lg bg-[#fff5dc] px-3 py-1.5 text-sm text-[#a06e00] dark:bg-[#3a3016] dark:text-[#ffcf5c]">{newsTip}</p>
            <Button asChild size="lg" game className="w-full">
              <a href={newsLink(show)} target="_blank" rel="noopener noreferrer" onClick={() => opened(show)}>Kijk het nieuws<ExternalLink aria-hidden /></a>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Ook:{' '}
              {others.map((item, index) => (
                <span key={item.id}>
                  {index > 0 && ' · '}
                  <a href={newsLink(item)} target="_blank" rel="noopener noreferrer" onClick={() => opened(item)} className="font-medium underline-offset-2 hover:text-foreground hover:underline">{item.short}</a>
                </span>
              ))}
            </p>
          </>
        )}
        {state === 'asked' && (
          <div className="flex gap-2">
            <Button variant="success" size="lg" game className="flex-1" onClick={() => mark('done')}>Ja, gekeken</Button>
            <Button variant="ghost" size="lg" className="flex-1 text-muted-foreground" onClick={() => mark('idle')}>Nog niet</Button>
          </div>
        )}
        {state === 'done' && (
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href={newsLink(show)} target="_blank" rel="noopener noreferrer" onClick={() => opened(show)}>Nog een keer kijken<ExternalLink aria-hidden /></a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
