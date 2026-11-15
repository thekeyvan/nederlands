import {llmsFull, text} from '../site/crawl.server';

export const loader = () => text(llmsFull(), 'text/plain');
