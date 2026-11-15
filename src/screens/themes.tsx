import {useEffect, useMemo, useState} from 'react';
import {ArrowRight, ChevronLeft, ChevronRight, Eye, EyeOff, Gamepad2, Search, Zap} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Mascot} from '@/components/game/mascot';
import {Stars} from '@/components/game/stars';
import {ThemeArt} from '@/components/game/theme-art';
import {ListenButton} from '@/components/listen-button';
import {Page} from '@/components/page';
import {ResponsiveSheet} from '@/components/responsive-sheet';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {plural} from '@/lib/text';
import {useProgress} from '@/hooks/use-progress';
import {usePractice} from '@/hooks/use-practice';
import {type Route} from '@/hooks/use-route';
import {themes, vocabulary, searchVocabulary} from '@/core/learning-data.js';
import {dialogues, phrases} from '@/core/phrase-data.js';
import {themeStats} from '@/core/learning-model.js';
import {themeStars} from '@/core/game.js';
import {progressStatus} from '@/core/srs.js';
import {locale} from '@/core/i18n.js';
import {LearnTabs} from '@/components/app/learn-tabs';
import {ScreenTitle} from '@/components/app/list';
import {ThemeGamesSheet} from '@/screens/games';
import type {Card, Review, Theme} from '@/core/types';
import {usePreferences} from '@/hooks/use-preferences';
import {currentTheme} from '@/core/path.js';
import {PathList, StepList} from '@/components/path/path-ui';


export function ThemesScreen({themeId, topic}: {themeId: string | null; topic: Route['topic']}) {
  const theme = themes.find((item) => item.id === themeId);
  return theme ? <ThemeDetail key={theme.id} theme={theme} initialTopic={topic} /> : <ThemeLibrary />;
}

/** Leren › Pad: every situation in order from A0 to B1, with where you are. */
function ThemeLibrary() {
  const {reviews, events} = useProgress();
  const [query, setQuery] = useState('');
  const [preferences] = usePreferences();
  const current = currentTheme(reviews, events, preferences.level);
  return (
    <Page>
      <ScreenTitle title="Leren" />
      <LearnTabs active="woorden" />
      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">Elke situatie heeft vijf stappen: woorden, zinnen, de grammatica die je erbij nodig hebt, een gesprek en een eindspel.</p>
      <label className="relative mb-4 block sm:max-w-md">
        <span className="sr-only">Zoek een situatie</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek bijvoorbeeld huisarts" className="h-10 border-0 bg-muted pl-9 text-[15px]" dir="auto" />
      </label>
      <PathList current={current} query={query} />
    </Page>
  );
}

function ThemeDetail({theme, initialTopic}: {theme: Theme; initialTopic: Route['topic']}) {
  const {reviews} = useProgress();
  const [playing, setPlaying] = useState(false);
  const [topic, setTopic] = useState<string>(initialTopic);
  const stats = themeStats(theme.id, reviews);
  const stars = themeStars(stats);
  const words = vocabulary.filter((card) => card.themeId === theme.id);
  const themePhrases = phrases.filter((card) => card.themeId === theme.id);
  useEffect(() => setTopic(initialTopic), [initialTopic]);
  return (
    <Page wide>
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-4">
          <ThemeArt theme={theme} className="size-20 shrink-0 rounded-2xl border md:size-36" />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-[26px] leading-tight font-extrabold tracking-tight sm:text-4xl">{theme.title}</h1>
            <Translation className="text-muted-foreground">{theme.meaning}</Translation>
            <div className="flex items-center gap-2 text-sm"><Stars count={stars} /><span className="text-muted-foreground tabular-nums">{stats.done}/{stats.total}</span></div>
          </div>
        </div>
      </header>
      <div className="mb-8 max-w-2xl">
        <StepList theme={theme} />
        <button type="button" onClick={() => setPlaying(true)} className="mt-3 flex items-center gap-1.5 px-1 text-sm font-semibold text-primary"><Gamepad2 className="size-4" />Meer spellen met deze situatie</button>
      </div>
      <ThemeGamesSheet theme={theme} open={playing} onOpenChange={setPlaying} />
      <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">Alles om te lezen en te luisteren</h2>
      <Tabs value={topic} onValueChange={setTopic}>
        <TabsList className="mb-4 h-11 w-full sm:w-fit">
          <TabsTrigger value="words" className="px-4">Woorden <Badge variant="secondary" className="ml-1 bg-muted text-muted-foreground">{words.length}</Badge></TabsTrigger>
          <TabsTrigger value="phrases" className="px-4">Zinnen <Badge variant="secondary" className="ml-1 bg-muted text-muted-foreground">{themePhrases.length}</Badge></TabsTrigger>
          <TabsTrigger value="dialogue" className="px-4">Gesprek</TabsTrigger>
        </TabsList>
        <TabsContent value="words"><WordsTab theme={theme} reviews={reviews} /></TabsContent>
        <TabsContent value="phrases"><PhrasesTab theme={theme} cards={themePhrases} /></TabsContent>
        <TabsContent value="dialogue"><DialogueTab theme={theme} /></TabsContent>
      </Tabs>
    </Page>
  );
}

const kindLabels: Record<string, string> = {woord: 'Woord', werkwoord: 'Werkwoord', uitdrukking: 'Uitdrukking'};
const statusStyles = {new: 'bg-border', learning: 'bg-xp', known: 'bg-success'};
const statusLabels = {new: 'Nog niet geoefend', learning: 'Aan het leren', known: 'Goed onthouden'};

function WordsTab({theme, reviews}: {theme: Theme; reviews: Record<string, Review>}) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [limit, setLimit] = useState(24);
  const [open, setOpen] = useState<number | null>(null);
  const searching = query.trim().length > 0;
  const list = useMemo(() => searchVocabulary(query, searching ? 'all' : theme.id, kind), [query, searching, theme.id, kind]);
  const visible = list.slice(0, limit);
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1 sm:max-w-sm">
          <span className="sr-only">Zoek in het Nederlands of {locale.dutchName}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(24); }} placeholder={`Nederlands / ${locale.name}`} className="h-10 bg-card pl-9" dir="auto" />
        </label>
        <Select value={kind} onValueChange={(value) => { setKind(value); setLimit(24); }}>
          <SelectTrigger className="h-10 w-full bg-card sm:w-48" aria-label="Soort woord"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle soorten</SelectItem>
            <SelectItem value="woord">Woorden</SelectItem>
            <SelectItem value="werkwoord">Werkwoorden</SelectItem>
            <SelectItem value="uitdrukking">Uitdrukkingen</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="mb-3 text-sm text-muted-foreground" role="status">{plural(list.length, 'woord', 'woorden & uitdrukkingen')}{searching ? ' · uit alle thema’s' : ' · tik voor betekenis en voorbeeld'}</p>
      {list.length ? (
        <>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((word, index) => {
              const status = progressStatus(reviews[word.id]);
              return (
                <li key={word.id}>
                  <button type="button" onClick={() => setOpen(index)} className="group flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                    <span className={cn('size-2.5 shrink-0 rounded-full', statusStyles[status])} aria-label={statusLabels[status]} role="img" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{word.nl}</span>
                      <span className="block text-xs text-muted-foreground">{searching ? word.themeTitle : kindLabels[word.kind ?? 'woord']}</span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          {list.length > limit && <div className="mt-4 flex justify-center"><Button variant="outline" onClick={() => setLimit(limit + 24)}>Toon meer woorden</Button></div>}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {(['new', 'learning', 'known'] as const).map((status) => <span key={status} className="flex items-center gap-1.5"><span className={cn('size-2 rounded-full', statusStyles[status])} />{statusLabels[status]}</span>)}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <Mascot mood="think" className="size-20" />
          <h2 className="font-bold">Geen woorden gevonden.</h2>
          <Button variant="outline" onClick={() => { setQuery(''); setKind('all'); }}>Zoek opnieuw</Button>
        </div>
      )}
      <WordSheet list={list} index={open} onIndex={setOpen} reviews={reviews} />
    </div>
  );
}

function WordSheet({list, index, onIndex, reviews}: {list: Card[]; index: number | null; onIndex: (index: number | null) => void; reviews: Record<string, Review>}) {
  const {practice} = usePractice();
  const word = index === null ? null : list[index];
  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      if (event.key === 'ArrowRight' && index < list.length - 1) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, list.length, onIndex]);
  if (!word || index === null) return <ResponsiveSheet open={false} onOpenChange={() => onIndex(null)} title="">{null}</ResponsiveSheet>;
  const status = progressStatus(reviews[word.id]);
  return (
    <ResponsiveSheet open onOpenChange={(open) => !open && onIndex(null)} title={<span className="flex items-center gap-2">{word.nl}<ListenButton text={word.nl!} /></span>} description={`${kindLabels[word.kind ?? 'woord']} · ${word.themeTitle}`}>
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Translation className="text-xl font-medium">{word.meaning}</Translation>
          <Badge variant={status === 'known' ? 'success' : status === 'learning' ? 'xp' : 'outline'}>{statusLabels[status]}</Badge>
        </div>
        {word.example && (
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Zo gebruik je het</p>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium" lang="nl">{word.example}</p>
              <ListenButton text={word.example} label="Luister naar het voorbeeld" />
            </div>
            <Translation className="mt-1 text-sm text-muted-foreground">{word.translation}</Translation>
          </div>
        )}
        {word.forms && (
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {[['Infinitief', word.nl], ['Imperfectum', word.forms[0]], ['Perfectum', word.forms[1]], ['Vorm', word.forms[2]]].map(([label, value]) => (
              <div key={label} className="rounded-md border p-2"><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>
            ))}
          </dl>
        )}
        <Button game size="lg" onClick={() => { onIndex(null); practice(word); }}><Zap />Oefen dit kaartje</Button>
        <div className="flex items-center justify-between border-t pt-3">
          <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => onIndex(index - 1)} aria-label="Vorig woord"><ChevronLeft /></Button>
          <span className="text-xs text-muted-foreground tabular-nums">{index + 1} / {list.length}</span>
          <Button variant="ghost" size="icon" disabled={index === list.length - 1} onClick={() => onIndex(index + 1)} aria-label="Volgend woord"><ChevronRight /></Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}

function PhrasesTab({theme, cards}: {theme: Theme; cards: Card[]}) {
  const {practice, start} = usePractice();
  const [showAll, setShowAll] = useState(false);
  const [shown, setShown] = useState<Set<string>>(new Set());
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Zo zeg je dat.</h2>
          <p className="text-sm text-muted-foreground">{plural(cards.length, 'handige zin', 'handige zinnen')} voor dit thema.</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="flex items-center gap-2 text-sm"><Switch checked={showAll} onCheckedChange={setShowAll} />Toon vertalingen</Label>
          <Button game onClick={() => start({theme: theme.id, type: 'praktisch', label: `${theme.title} · zinnen`})}>Oefen deze zinnen<ArrowRight /></Button>
        </div>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => {
          const visible = showAll || shown.has(card.id);
          return (
            <li key={card.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{card.level}</Badge>
                <div className="flex items-center gap-1">
                  <ListenButton text={card.nl!} />
                  <Button variant="ghost" size="sm" className="text-primary" onClick={() => practice(card)}>Oefenen</Button>
                </div>
              </div>
              <p className="text-lg font-medium" lang="nl">{card.nl}</p>
              {visible ? (
                <Translation className="text-muted-foreground">{card.meaning}</Translation>
              ) : (
                <Button variant="link" size="sm" className="h-auto self-start p-0 text-muted-foreground" onClick={() => setShown(new Set(shown).add(card.id))}><Eye />Toon de betekenis</Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DialogueTab({theme}: {theme: Theme}) {
  const dialogue = dialogues.find((item) => item.themeId === theme.id);
  const [hideMine, setHideMine] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [translations, setTranslations] = useState(false);
  if (!dialogue) return null;
  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Jij bent aan de beurt.</h2>
          <p className="text-sm text-muted-foreground">Lees hardop. Verberg daarna jouw zinnen en bedenk ze zelf.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="flex items-center gap-2 text-sm"><Switch checked={translations} onCheckedChange={setTranslations} />Vertaling</Label>
          <Button variant={hideMine ? 'default' : 'outline'} game={hideMine} onClick={() => { setHideMine(!hideMine); setRevealed(new Set()); }}>{hideMine ? <Eye /> : <EyeOff />}{hideMine ? 'Toon mijn zinnen' : 'Verberg mijn zinnen'}</Button>
        </div>
      </div>
      <ol className="flex flex-col gap-3">
        {dialogue.lines.map((line) => {
          const mine = line.speaker === 'Jij';
          const hidden = mine && hideMine && !revealed.has(line.id);
          return (
            <li key={line.id} className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
              <span className="px-1 text-xs font-semibold text-muted-foreground">{line.speaker}</span>
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-3', mine ? 'rounded-br-md bg-primary/12 dark:bg-primary/20' : 'rounded-bl-md border bg-card')}>
                {hidden ? (
                  <Button variant="outline" size="sm" className="border-dashed" onClick={() => setRevealed(new Set(revealed).add(line.id))}>Wat zeg jij? Toon jouw zin</Button>
                ) : (
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-medium" lang="nl">{line.nl}</p>
                      {translations && <Translation className="mt-1 text-sm text-muted-foreground">{line.translation}</Translation>}
                    </div>
                    <ListenButton text={line.nl} className="-mt-1 -mr-2" />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
