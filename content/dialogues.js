// One short conversation per theme, read from content/themes/*.json.
import {themeFiles} from './index.js';
import {lineId} from './ids.js';

export const baseDialogues = themeFiles.filter((theme) => theme.dialogue.length > 0).map((theme) => ({
  id: `dialogue:${theme.id}`,
  themeId: theme.id,
  lines: theme.dialogue.map((line, index) => ({speaker: line.speaker, nl: line.nl, id: lineId(theme, line, index)})),
}));
