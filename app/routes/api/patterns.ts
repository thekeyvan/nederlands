import {json, patternSummary, patterns} from '../../api/content.server';

export const loader = () => json({patterns: patterns.map(patternSummary)});
