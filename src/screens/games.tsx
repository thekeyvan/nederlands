import {useState} from 'react';
import {ChevronDown, Play, Timer, Trophy, X} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger} from '@/components/ui/select';
import {Group, GroupLabel, Row, ScreenTitle} from '@/components/app/list';
import {Page} from '@/components/page';
import {ResponsiveSheet} from '@/components/responsive-sheet';
import {usePractice, type OpenGame} from '@/hooks/use-practice';
import {useGameRecords} from '@/hooks/use-game-records';
import {themes} from '@/core/learning-data.js';
import {gameInfo, type GameId, type GameInfo} from '@/games/registry';
import {ArticleGame, RaceGame} from '@/games/timed';
import {ClozeGame, VerbGame} from '@/games/questions';
import {BuilderGame, ConversationGame, DictationGame} from '@/games/language';

const components: Record<GameId, (props: {game: GameInfo; theme: string; onAgain: () => void}) => React.ReactNode> = {
  lidwoord: ArticleGame, tijdrace: RaceGame, werkwoorden: VerbGame, aanvullen: ClozeGame, zinsbouwer: BuilderGame, dictee: DictationGame, gesprek: ConversationGame,
};

const sections: {title: string; ids: GameId[]}[] = [
  {title: 'Woorden', ids: ['lidwoord', 'tijdrace']},
  {title: 'Zinnen', ids: ['zinsbouwer', 'aanvullen', 'werkwoorden']},
  {title: 'Luisteren & spreken', ids: ['dictee', 'gesprek']},
];

/** The challenge of the week: one game in the spotlight, the same one as in the iPhone app (ISO week number). */
const weeklyOrder: GameId[] = ['lidwoord', 'tijdrace', 'zinsbouwer', 'aanvullen', 'werkwoorden', 'dictee', 'gesprek'];
export function weeklyGame(date = new Date()): GameId {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const week = Math.ceil(((day.getTime() - Date.UTC(day.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
  return weeklyOrder[week % weeklyOrder.length];
}

/** Rows of games, grouped by skill. Shared by the Arcade tab and a theme's "Spelen" sheet. */
export function GameList({theme, onPick, exclude}: {theme: string; onPick?: () => void; exclude?: GameId}) {
  const {records} = useGameRecords();
  const {playGame} = usePractice();
  return (
    <>
      {sections.map((section, index) => (
        <div key={section.title}>
          <GroupLabel className={index === 0 ? 'mt-0' : undefined}>{section.title}</GroupLabel>
          <Group>
            {section.ids.filter((id) => id !== exclude).map((id) => {
              const game = gameInfo(id)!;
              const record = records[id];
              return (
                <Row key={id} onClick={() => { onPick?.(); playGame(id, theme); }} chevron={false} label={`${game.title} spelen`}
                  leading={<img src={game.image} alt="" className="size-12 shrink-0 rounded-xl bg-[#fcfaf6] object-cover" draggable={false} loading="lazy" />}
                  title={game.title} detail={`${game.length} · ${record ? `record ${record.best}` : 'nog niet gespeeld'}`}
                  trailing={<Play className="size-4 shrink-0 fill-current text-primary" aria-hidden />} />
              );
            })}
          </Group>
        </div>
      ))}
    </>
  );
}

export function GamesScreen() {
  const [theme, setTheme] = useState('all');
  const themeTitle = themes.find((item) => item.id === theme)?.title;
  const weekly = weeklyGame();
  return (
    <Page>
      <ScreenTitle title="Arcade" action={
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger size="sm" className="h-8 max-w-48 gap-1 rounded-full bg-card px-3 text-xs [&>svg:last-child]:hidden" aria-label="Speel met woorden uit">
            <span className="truncate">{themeTitle ?? 'Alle thema’s'}</span><ChevronDown className="size-3.5 opacity-60" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="all">Alle thema’s</SelectItem>
            {themes.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}
          </SelectContent>
        </Select>
      } />
      <div className="max-w-2xl">
        <WeeklyCard id={weekly} theme={theme} />
        <GameList theme={theme} exclude={weekly} />
      </div>
    </Page>
  );
}

/** The big orange card for the challenge of the week. */
function WeeklyCard({id, theme}: {id: GameId; theme: string}) {
  const {records} = useGameRecords();
  const {playGame} = usePractice();
  const game = gameInfo(id)!;
  const record = records[id];
  return (
    <button type="button" onClick={() => playGame(id, theme)}
      className="mb-2 flex w-full items-start gap-3 rounded-3xl bg-primary p-5 text-left text-primary-foreground shadow-[0_5px_0_var(--primary-edge)] transition active:translate-y-1 active:shadow-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
      <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <span className="rounded-full bg-white/22 px-2.5 py-1 text-[11px] font-extrabold tracking-wide uppercase">Uitdaging van de week</span>
        <span className="text-[26px] leading-tight font-black">{game.title}</span>
        <span className="text-sm font-semibold opacity-90">{game.length}</span>
        <span className="mt-2 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 font-black text-primary shadow-[0_4px_0_#f7c9a3]">
          <Play className="size-4 fill-current" aria-hidden />{record ? `Speel · record ${record.best}` : 'Speel'}
        </span>
      </span>
      <img src={game.image} alt="" className="mt-6 size-28 shrink-0 rotate-[4deg] rounded-[28px] bg-[#fcfaf6] object-cover sm:size-32" draggable={false} />
    </button>
  );
}

/** "Spelen" on a theme: the same games, played with that theme's words. You stay in the theme. */
export function ThemeGamesSheet({theme, open, onOpenChange}: {theme: {id: string; title: string}; open: boolean; onOpenChange: (open: boolean) => void}) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={`Spelen · ${theme.title}`} description="Met de woorden en zinnen uit dit thema.">
      <div className="pb-4"><GameList theme={theme.id} onPick={() => onOpenChange(false)} /></div>
    </ResponsiveSheet>
  );
}

/** A game, shown as a layer over the screen it was opened from: first the intro, then the game. */
export function GameLayer({open}: {open: OpenGame}) {
  const {startGame, replayGame} = usePractice();
  const info = gameInfo(open.id);
  const theme = themes.some((item) => item.id === open.theme) ? open.theme : 'all';
  if (!info) return null;
  if (!open.started) return <GameIntro game={info} theme={theme} onStart={startGame} />;
  const Game = components[info.id];
  return <Game key={`${info.id}:${theme}:${open.round}`} game={info} theme={theme} onAgain={replayGame} />;
}

function GameIntro({game, theme, onStart}: {game: GameInfo; theme: string; onStart: () => void}) {
  const {records} = useGameRecords();
  const {close} = usePractice();
  const record = records[game.id];
  const themeTitle = themes.find((item) => item.id === theme)?.title;
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-4 pt-3 pb-8 sm:px-6 lg:pt-8" style={{minHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))'}}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="-ml-2" onClick={() => close()} aria-label="Sluiten"><X className="size-6" /></Button>
        {record && <Badge variant="xp" className="h-7 px-2.5 text-sm"><Trophy />Record {record.best}</Badge>}
      </div>
      <img src={game.image} alt="" className="mx-auto mt-2 aspect-square w-full max-w-64 rounded-3xl bg-[#fcfaf6] object-cover" draggable={false} />
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge className={game.tint}>{game.skill}</Badge>
        <Badge variant="outline"><Timer />{game.length}</Badge>
        {themeTitle && <Badge variant="outline">{themeTitle}</Badge>}
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{game.title}</h1>
      <ol className="mt-4 flex flex-col gap-2.5">
        {game.howTo.map((line, index) => (
          <li key={line} className="flex items-start gap-3 text-[15px]"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span><span className="pt-0.5">{line}</span></li>
        ))}
      </ol>
      <div className="flex-1" />
      <Button size="xl" game className="mt-6 w-full" onClick={onStart}><Play className="fill-current" />Start</Button>
    </div>
  );
}
