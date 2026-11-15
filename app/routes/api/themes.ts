import {json, themeSummary, themes} from '../../api/content.server';

export const loader = () => json({themes: themes.map(themeSummary)});
