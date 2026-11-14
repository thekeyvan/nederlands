import type {ReactNode} from 'react';
import {ChevronLeft, Flame, Laptop, Moon, Star, Sun, Zap} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {Brand} from '@/components/app/brand';
import {AccountChip} from '@/components/app/account-chip';
import {InstallButton} from '@/components/pwa';
import {AccountButton} from '@/components/app/sign-in';
import {extraNav, mainNav, mobileTabs, parentOf, tabOf, type NavItem} from '@/components/app/nav';
import {cn} from '@/lib/utils';
import {hrefFor, navigate, type Panel, type Route} from '@/hooks/use-route';
import {useTheme, type ThemePreference} from '@/hooks/use-theme';
import {useGame} from '@/hooks/use-progress';

function SideLink({item, active, count}: {item: NavItem; active: boolean; count?: number}) {
  const Icon = item.icon;
  return (
    <a href={hrefFor(item.panel)} aria-current={active ? 'page' : undefined}
      onClick={(event) => { if (event.metaKey || event.ctrlKey) return; event.preventDefault(); navigate(item.panel); }}
      className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        active && 'bg-accent font-semibold text-accent-foreground hover:bg-accent hover:text-accent-foreground')}>
      <Icon className="size-[18px]" aria-hidden />
      {item.label}
      {count ? <Badge className="ml-auto bg-destructive text-white">{count}</Badge> : null}
    </a>
  );
}

export function ThemeMenuItems() {
  const {preference, setPreference} = useTheme();
  return (
    <DropdownMenuRadioGroup value={preference} onValueChange={(value) => setPreference(value as ThemePreference)}>
      <DropdownMenuRadioItem value="system"><Laptop />Zoals mijn apparaat</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="light"><Sun />Licht</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark"><Moon />Donker</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  );
}

function ThemeToggle() {
  const {resolved} = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Licht of donker">{resolved === 'dark' ? <Moon /> : <Sun />}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top"><ThemeMenuItems /></DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar({panel}: {panel: Panel}) {
  const game = useGame();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-4 lg:flex">
      <Brand className="mb-6 px-2" />
      <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Leren · A2 → B1</p>
      <nav aria-label="Leren" className="flex flex-col gap-0.5">
        {mainNav.map((item) => <SideLink key={item.panel} item={item} active={panel === item.panel} count={item.panel === 'oefenen' ? game.dueCards : undefined} />)}
      </nav>
      <p className="mt-6 px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Verder leren</p>
      {extraNav.map((item) => <SideLink key={item.panel} item={item} active={panel === item.panel} />)}
      <div className="flex-1" />
      <InstallButton variant="ghost" className="mb-1 w-full justify-start text-muted-foreground" />
      <AccountChip />
      <div className="mt-2 flex items-center gap-1 px-1 text-xs text-muted-foreground">
        <ThemeToggle />
        <a href="./privacy.html" className="rounded px-1.5 py-1 hover:text-foreground">Privacy</a>
        <a href="https://github.com/thekeyvan/nederlands" target="_blank" rel="noopener noreferrer" className="rounded px-1.5 py-1 hover:text-foreground">Open source ↗</a>
      </div>
    </aside>
  );
}

/** Sub-screens show a back button to their parent; tab screens show the brand, streak, XP and account. */
function MobileTopBar({route}: {route: Route}) {
  const game = useGame();
  const parent = parentOf(route);
  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b bg-background/90 px-3 py-2 backdrop-blur lg:hidden" style={{paddingTop: 'max(0.5rem, env(safe-area-inset-top))'}}>
      {parent ? (
        <Button variant="ghost" className="-ml-1 h-10 gap-1 px-2 text-base font-semibold" onClick={() => navigate(parent.panel)}>
          <ChevronLeft className="size-6" />{parent.label}
        </Button>
      ) : (
        <Brand showName={false} className="ml-1" />
      )}
      <div className="flex items-center gap-1.5">
        <Badge variant="streak" className="h-7 px-2.5 text-sm" aria-label={`Reeks: ${game.streak.count} dagen`}><Flame />{game.streak.count}</Badge>
        <Badge variant="xp" className="h-7 px-2.5 text-sm" aria-label={`${game.xp} XP`}><Star />{game.xp}</Badge>
        <span className="ml-1"><AccountButton /></span>
      </div>
    </header>
  );
}


function MobileNav({panel}: {panel: Panel}) {
  const tab = tabOf(panel);
  return (
    <nav aria-label="Snel naar" className="fixed inset-x-0 bottom-0 z-30 flex items-start justify-around border-t bg-card/95 px-2 pt-2 backdrop-blur pb-safe lg:hidden">
      {mobileTabs.map((item) => {
        const Icon = item.icon;
        const active = tab === item.panel;
        const fab = item.panel === 'oefenen';
        return (
          <a key={item.panel} href={hrefFor(item.panel)} aria-current={active ? 'page' : undefined}
            onClick={(event) => { event.preventDefault(); navigate(item.panel); }}
            className={cn('flex w-16 flex-col items-center gap-1 rounded-lg text-[11px] font-medium text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none', active && 'font-semibold text-primary', fab && '-mt-7')}>
            {fab ? (
              <span className="grid size-[58px] place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-edge),0_0_0_6px_var(--background)] transition active:translate-y-[3px] active:shadow-[0_1px_0_var(--primary-edge),0_0_0_6px_var(--background)]">
                <Zap className="size-7" aria-hidden />
              </span>
            ) : (
              <Icon className="size-6" aria-hidden />
            )}
            {fab ? 'Oefen' : item.label}
          </a>
        );
      })}
    </nav>
  );
}

/** Laptop: sidebar + content. Phone: top bar, content and a bottom bar. Focus mode hides navigation. */
export function AppShell({route, focus, children}: {route: Route; focus: boolean; children: ReactNode}) {
  const {panel} = route;
  return (
    <div className="flex min-h-dvh">
      {!focus && <Sidebar panel={panel} />}
      <div className="flex min-w-0 flex-1 flex-col">
        {!focus && <MobileTopBar route={route} />}
        <main id="main" tabIndex={-1} className={cn('flex-1 outline-none', !focus && 'pb-28 lg:pb-10')} style={focus ? {paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'} : undefined}>{children}</main>
      </div>
      {!focus && <MobileNav panel={panel} />}
    </div>
  );
}
