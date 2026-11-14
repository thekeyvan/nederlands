import {useCallback, useState} from 'react';
import {recordScore, validRecords, type GameRecord} from '@/core/games.js';

const KEY = 'nederlands-game-records';
const read = (): Record<string, GameRecord> => {
  try {
    return validRecords(JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch {
    return {};
  }
};

/** Personal bests per game, kept in this browser. They are real scores, never shared or synced. */
export function useGameRecords() {
  const [records, setRecords] = useState(read);
  const record = useCallback((id: string, score: number) => {
    const result = recordScore(read(), id, score);
    try {
      localStorage.setItem(KEY, JSON.stringify(result.records));
    } catch {
      /* The score still shows for this round. */
    }
    setRecords(result.records);
    return result;
  }, []);
  return {records, record};
}
