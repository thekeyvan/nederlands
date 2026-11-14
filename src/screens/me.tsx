import {useState} from 'react';
import {Flame, Library, LogIn, LogOut, Moon, Puzzle, Shield, Sun, Laptop, Trophy, Volume2} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {Progress} from '@/components/ui/progress';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {LevelCard, StampsCard, StreakCard} from '@/components/game/cards';
import {Stars} from '@/components/game/stars';
import {ThemeArt} from '@/components/game/theme-art';
import {Avatar} from '@/components/app/account-chip';
import {Page, PageHeader} from '@/components/page';
import {Translation} from '@/components/translation';
import {cn} from '@/lib/utils';
import {useAudio} from '@/hooks/use-audio';
import {syncMessages, useCloud} from '@/hooks/use-cloud';
import {useGame} from '@/hooks/use-progress';
import {usePreferences} from '@/hooks/use-preferences';
import {navigate} from '@/hooks/use-route';
import {useTheme, type ThemePreference} from '@/hooks/use-theme';
import {signIn, signOut} from '@/core/cloud.js';
import {dailyGoals} from '@/core/state.js';
import {chooseLocale, locale, locales, t} from '@/core/i18n.js';
import {cards} from '@/core/learning-model.js';
import {ratings} from '@/core/srs.js';

export function MeScreen() {
  const game = useGame();
  const cloud = useCloud();
  const [showAll, setShowAll] = useState(false);
  const {events} = game.progress;
  const week = game.activity.week;
  const max = Math.max(5, ...week.map((day) => day.count));
  const themeRows = game.themes.filter((item) => showAll || item.stats.done > 0);
  const stats = [
    {label: 'dagen op rij', value: game.streak.count, icon: <Flame className="size-4 text-primary" />},
    {label: 'langste reeks', value: game.bestStreak, icon: <Trophy className="size-4 text-xp-foreground" />},
    {label: 'kaartjes geoefend', value: game.practisedCards},
    {label: 'goed onthouden', value: game.knownCards},
    {label: 'vandaag herhalen', value: game.dueCards},
  ];
  return (
    <Page>
      <PageHeader eyebrow="Kijk eens hoever je bent" title={cloud.user?.name ? `Hoi ${cloud.user.name.split(' ')[0]}!` : 'Je ziet het groeien.'} description={syncMessages[cloud.status]}
        action={cloud.user ? <Avatar name={cloud.user.name} className="size-14 text-lg" /> : undefined} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <LevelCard stats={game} />
        <StreakCard stats={game} week={week} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-3 text-center">
            <dd className="flex items-center justify-center gap-1 text-2xl font-extrabold tabular-nums">{stat.icon}{stat.value}</dd>
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        <StampsCard stats={game} labels />
        <Card className="gap-3 py-4">
          <CardHeader className="px-4"><CardTitle className="text-sm">De laatste 7 dagen</CardTitle><CardDescription>Geoefende kaartjes per dag</CardDescription></CardHeader>
          <CardContent className="px-4">
            <div className="flex h-40 items-end justify-between gap-2" role="list">
              {week.map((day, index) => (
                <div key={index} role="listitem" className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" aria-label={`${day.date.toLocaleDateString('nl-NL')}: ${day.count} kaartjes`}>
                  <span className="text-xs font-semibold tabular-nums">{day.count || ''}</span>
                  <span className={cn('w-full max-w-10 rounded-t-md', day.count ? 'bg-primary' : 'bg-muted')} style={{height: `${Math.max(6, (day.count / max) * 100)}%`}} />
                  <span className="text-[11px] text-muted-foreground">{day.label.replace('.', '')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        <Card className="gap-3 py-4">
          <CardHeader className="flex items-center justify-between px-4">
            <CardTitle className="text-sm">Jouw thema’s</CardTitle>
            <Label className="flex items-center gap-2 text-xs font-normal text-muted-foreground"><Checkbox checked={showAll} onCheckedChange={(value) => setShowAll(value === true)} />Ook nieuwe thema’s</Label>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4">
            {themeRows.length ? themeRows.map(({theme, stats: themeStats, stars}) => (
              <button key={theme.id} type="button" onClick={() => navigate('woorden', {theme: theme.id})} className="flex items-center gap-3 rounded-lg border p-2 text-left transition hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                <ThemeArt theme={theme} className="size-12 shrink-0 rounded-md" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{theme.title}</span><Stars count={stars} /></span>
                  <Progress value={(themeStats.done / themeStats.total) * 100} className="mt-1.5 h-1.5" aria-label={`${themeStats.done} van ${themeStats.total} geoefend`} />
                  <span className="mt-1 block text-[11px] text-muted-foreground tabular-nums">{themeStats.done}/{themeStats.total} · {themeStats.known} onthouden</span>
                </span>
              </button>
            )) : <p className="py-4 text-center text-sm text-muted-foreground">Nog een leeg begin. Na je eerste kaartje zie je hier je thema’s.</p>}
          </CardContent>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4"><CardTitle className="text-sm">De laatste keer</CardTitle></CardHeader>
          <CardContent className="flex flex-col divide-y px-4">
            {events.length ? [...events].slice(-8).reverse().map((event) => {
              const card = cards.find((item) => item.id === event.cardId);
              const rating = ratings.find((item) => item.grade === event.grade);
              return (
                <div key={event.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate font-medium" lang="nl">{card?.nl || card?.title || event.cardId}</span>
                  <span className="shrink-0 text-xs text-muted-foreground"><Badge variant={event.grade >= 3 ? 'success' : 'outline'} className="mr-1.5">{rating?.label}</Badge>{new Date(event.at).toLocaleDateString('nl-NL', {day: 'numeric', month: 'short'})}</span>
                </div>
              );
            }) : <p className="py-4 text-center text-sm text-muted-foreground">Hier komen je laatste oefeningen. Begin met een klein rondje.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <SettingsCard />
        <AccountCard />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => navigate('zinnen')}><Puzzle />Zinsbouw</Button>
        <Button variant="outline" onClick={() => navigate('bronnen')}><Library />Websites & boeken</Button>
        <Button variant="outline" asChild><a href="./privacy.html"><Shield />Privacy</a></Button>
      </div>
    </Page>
  );
}

function SettingsCard() {
  const [preferences, update] = usePreferences();
  const audio = useAudio();
  const {preference, setPreference} = useTheme();
  const packs = Object.values(locales);
  return (
    <Card>
      <CardHeader><CardTitle>Instellingen</CardTitle><CardDescription>Je dagdoel reist mee met je account.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>Dagdoel</Label>
          <ToggleGroup type="single" variant="outline" value={String(preferences.goal)} onValueChange={(value) => value && update((current) => ({...current, goal: Number(value)}))} className="w-full">
            {dailyGoals.map((goal) => <ToggleGroupItem key={goal} value={String(goal)} className="flex-1">{goal} kaartjes</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Weergave</Label>
          <ToggleGroup type="single" variant="outline" value={preference} onValueChange={(value) => value && setPreference(value as ThemePreference)} className="w-full">
            <ToggleGroupItem value="system" className="flex-1"><Laptop />Apparaat</ToggleGroupItem>
            <ToggleGroupItem value="light" className="flex-1"><Sun />Licht</ToggleGroupItem>
            <ToggleGroupItem value="dark" className="flex-1"><Moon />Donker</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-medium">Nederlandse audio</p><p className="text-xs text-muted-foreground">{audio.voiceName} · {String(audio.speed).replace('.', ',')}×</p></div>
          <Button variant="outline" onClick={() => audio.setSettingsOpen(true)}><Volume2 />Stem en snelheid</Button>
        </div>
        {packs.length > 1 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="translation-language">Vertaling</Label>
            <Select value={locale.code} onValueChange={chooseLocale}>
              <SelectTrigger id="translation-language" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{packs.map((pack) => <SelectItem key={pack.code} value={pack.code}>{pack.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccountCard() {
  const cloud = useCloud();
  const available = !['local-only', 'unavailable', 'starting'].includes(cloud.status);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{cloud.user ? 'Je bent ingelogd.' : available ? 'Neem je voortgang mee.' : 'Je oefent op dit apparaat.'}</CardTitle>
        <CardDescription>{cloud.user ? 'Je oefeningen worden bij je Google-account bewaard.' : available ? 'Log in met Google om op je telefoon en computer verder te gaan.' : 'Deze versie werkt zonder account. Je voortgang blijft in deze browser.'}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {available && <Translation className="text-sm text-muted-foreground">{t(cloud.user ? 'accountSignedIn' : 'accountGuest')}</Translation>}
        <p className="text-sm" role="status">{syncMessages[cloud.status]}</p>
        {available && (cloud.user
          ? <Button variant="outline" className="self-start" onClick={() => void signOut()}><LogOut />Uitloggen</Button>
          : <Button game className="self-start" onClick={() => void signIn()}><LogIn />Inloggen met Google</Button>)}
      </CardContent>
    </Card>
  );
}
