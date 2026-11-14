import {gameScene} from '@/lib/illustrations';

export type GameId = 'lidwoord' | 'zinsbouwer' | 'werkwoorden' | 'aanvullen' | 'dictee' | 'gesprek' | 'tijdrace';
export interface GameInfo {id: GameId; title: string; skill: string; description: string; length: string; image: string; tint: string; howTo: string[]}

export const games: GameInfo[] = [
  {id: 'lidwoord', title: 'De of het?', skill: 'Woorden', description: 'Zo snel als je kunt: de of het?', length: '60 seconden', image: gameScene('lidwoord'), tint: 'bg-success-soft text-success-foreground', howTo: ['Je ziet een zelfstandig naamwoord.', 'Tik op de of het, zo snel als je kunt.', 'Je hebt 60 seconden. Elke goede keuze is een punt.']},
  {id: 'zinsbouwer', title: 'Zinnen bouwen', skill: 'Zinsbouw', description: 'Zet de woorden in de goede volgorde.', length: '8 zinnen', image: gameScene('zinsbouwer'), tint: 'bg-info-soft text-info-foreground', howTo: ['Het eerste woord staat er al.', 'Tik de andere woorden in de goede volgorde.', 'Tik op een gekozen woord om het terug te leggen.']},
  {id: 'werkwoorden', title: 'Werkwoorden', skill: 'Grammatica', description: 'Kies de goede verleden tijd of het voltooid deelwoord.', length: '10 vragen', image: gameScene('werkwoorden'), tint: 'bg-xp-soft text-xp-foreground', howTo: ['Je ziet een werkwoord en een vraag.', 'Kies de verleden tijd of het voltooid deelwoord.', 'Let op hebben of zijn, en op t of d.']},
  {id: 'aanvullen', title: 'Zinnen aanvullen', skill: 'Zinnen', description: 'Welk woord past in het gat?', length: '10 zinnen', image: gameScene('aanvullen'), tint: 'bg-lavender text-lavender-foreground', howTo: ['Je ziet een zin met een gat.', 'Kies het woord dat past.', 'Luister daarna naar de hele zin.']},
  {id: 'dictee', title: 'Luisterdictee', skill: 'Luisteren & spelling', description: 'Luister en typ wat je hoort.', length: '8 opnames', image: gameScene('dictee'), tint: 'bg-accent text-accent-foreground', howTo: ['Tik op de luidspreker en luister.', 'Typ wat je hoort. Je mag vaker luisteren.', 'Een kleine typfout telt ook als goed.']},
  {id: 'gesprek', title: 'Gesprekken', skill: 'Spreken', description: 'Kies wat jij zegt in een echt gesprek.', length: '3 gesprekken', image: gameScene('gesprek'), tint: 'bg-secondary text-secondary-foreground', howTo: ['Lees of luister wat de ander zegt.', 'Kies wat jij zou zeggen.', 'Zo oefen je drie korte gesprekken.']},
  {id: 'tijdrace', title: 'Tijdrace', skill: 'Woorden', description: 'Zo veel mogelijk vertalingen in één minuut.', length: '60 seconden', image: gameScene('tijdrace'), tint: 'bg-destructive-soft text-destructive-foreground', howTo: ['Je ziet een Nederlands woord.', 'Kies de goede vertaling.', 'Zo veel mogelijk in 60 seconden.']},
];

export const gameInfo = (id: string | null) => games.find((game) => game.id === id) ?? null;
