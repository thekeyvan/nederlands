import {useMemo, useState} from 'react';
import {Badge} from '@/components/ui/badge';
import {ListenButton} from '@/components/listen-button';
import {Translation} from '@/components/translation';
import {useAudio} from '@/hooks/use-audio';
import {clozeItem, pick, roundPool, verbItems, verbQuestion, type ClozeItem} from '@/core/games.js';
import {seededRandom, shuffle} from '@/core/practice.js';
import {vocabulary} from '@/core/learning-data.js';
import {phrases} from '@/core/phrase-data.js';
import {sentences} from '@/core/sentence-data.js';
import {ChoiceGrid, FeedbackBar, GameBar, GameFrame, GameOver, newRoundId, type Choice, type Miss} from '@/games/shell';
import type {GameInfo} from '@/games/registry';
import type {Card} from '@/core/types';

interface Props {game: GameInfo; theme: string; onAgain: () => void}

interface Question {key: string; card: Card; options: Choice[]; prompt: React.ReactNode; explain: React.ReactNode; answer: string; meaning?: string; listen?: string}

/** Runs a list of multiple-choice questions: right answers move on quickly, wrong ones explain. */
function QuestionRun({game, theme, onAgain, roundId, questions}: Props & {roundId: string; questions: Question[]}) {
  const audio = useAudio();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);
  if (index >= questions.length) return <GameOver game={game} roundId={roundId} score={score} total={questions.length} misses={misses} theme={theme} onAgain={onAgain} />;
  const question = questions[index];
  const next = () => { setPicked(null); setIndex((value) => value + 1); };
  const choose = (choice: number) => {
    if (picked !== null) return;
    setPicked(choice);
    if (question.listen) audio.play(question.listen);
    if (question.options[choice].correct) {
      setScore((value) => value + 1);
      setTimeout(next, 900);
    } else {
      setMisses((list) => [...list, {key: question.key, nl: question.answer, meaning: question.meaning, card: question.card}]);
    }
  };
  const wrong = picked !== null && !question.options[picked].correct;
  return (
    <GameFrame>
      <GameBar game={game} progress={index / questions.length} score={score} theme={theme} />
      <p className="mt-2 text-center text-xs text-muted-foreground tabular-nums">{index + 1} / {questions.length}</p>
      <div key={question.key} className="mt-6 flex animate-pop flex-col gap-6 sm:mt-10">
        {question.prompt}
        <ChoiceGrid options={question.options} picked={picked} onPick={choose} />
      </div>
      {wrong && <FeedbackBar tone="wrong" title="Bijna! Zo is het goed:" onNext={next}>{question.explain}</FeedbackBar>}
    </GameFrame>
  );
}

/** Werkwoorden: imperfectum or perfectum, with realistic mistakes as wrong answers. */
export function VerbGame(props: Props) {
  const [roundId] = useState(() => newRoundId(props.game.id));
  const questions = useMemo<Question[]>(() => {
    const random = seededRandom(roundId);
    const {items} = roundPool(verbItems(vocabulary), props.theme, 6);
    return pick(items, 10, random).map((item, index) => {
      const kind = index % 2 === 0 ? 'perfect' : 'past';
      const question = verbQuestion(item, kind, `${roundId}:${index}`);
      return {
        key: `${item.card.id}:${kind}`, card: item.card, options: question.options, answer: `${item.card.nl}: ${item.past} · ${item.perfect}`, meaning: item.card.meaning,
        prompt: (
          <div>
            <Badge variant={kind === 'perfect' ? 'lavender' : 'info'}>{kind === 'perfect' ? 'Voltooid deelwoord (perfectum)' : 'Verleden tijd (imperfectum)'}</Badge>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl" lang="nl">{item.card.nl}</h1>
            <Translation className="mt-1 text-muted-foreground">{item.card.meaning}</Translation>
            <p className="mt-4 text-lg" lang="nl">{kind === 'perfect' ? 'Ik ___ (al gedaan).' : 'Gisteren ___ ik … (verleden tijd).'}</p>
          </div>
        ),
        explain: (
          <div className="mt-1 text-sm">
            <p className="text-base font-semibold" lang="nl">{question.answer}</p>
            <p lang="nl">{item.card.nl} · {item.past} · {item.perfect}</p>
            <p className="opacity-80">{item.note}</p>
          </div>
        ),
      };
    });
  }, [roundId, props.theme]);
  return <QuestionRun {...props} roundId={roundId} questions={questions} />;
}

/** Zinnen aanvullen: practical sentences and grammar patterns with one word missing. */
export function ClozeGame(props: Props) {
  const [roundId] = useState(() => newRoundId(props.game.id));
  const questions = useMemo<Question[]>(() => {
    const random = seededRandom(roundId);
    const {items: themed} = roundPool(phrases, props.theme, 5);
    const phraseItems = shuffle(themed, random).map((card) => clozeItem(card, phrases, `${roundId}:${card.id}`)).filter(Boolean) as ClozeItem[];
    const grammarItems = shuffle(sentences, random).map((card) => clozeItem({...card, themeId: 'zinsbouw'}, sentences, `${roundId}:${card.id}`)).filter(Boolean) as ClozeItem[];
    const chosen = shuffle([...phraseItems.slice(0, 7), ...grammarItems.slice(0, 3)], random).slice(0, 10);
    return chosen.map((item) => {
      const grammar = item.card.id.startsWith('zin:');
      const full = grammar ? item.card.example! : item.card.nl!;
      return {
        key: item.card.id, card: item.card, options: item.options, answer: full, meaning: grammar ? item.card.translation : item.card.meaning, listen: full,
        prompt: (
          <div>
            <Badge variant={grammar ? 'success' : 'lavender'}>{grammar ? item.card.title : 'Welk woord past?'}</Badge>
            <h1 className="mt-4 text-2xl leading-relaxed font-bold sm:text-3xl" lang="nl">
              {item.before}<span className="mx-1 inline-block min-w-20 rounded-md border-b-4 border-primary px-2 text-center text-primary">…</span>{item.after}
            </h1>
            {!grammar && <Translation className="mt-2 text-muted-foreground">{item.card.meaning}</Translation>}
          </div>
        ),
        explain: (
          <div className="mt-1 flex items-start gap-2 text-sm">
            <div className="min-w-0">
              <p className="text-base font-semibold" lang="nl">{item.before}<u>{item.answer}</u>{item.after}</p>
              <Translation className="opacity-80">{grammar ? item.card.rule : item.card.meaning}</Translation>
            </div>
            <ListenButton text={full} className="-mt-1 shrink-0" />
          </div>
        ),
      };
    });
  }, [roundId, props.theme]);
  return <QuestionRun {...props} roundId={roundId} questions={questions} />;
}
