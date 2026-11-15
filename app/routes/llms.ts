import {llms, text} from '../site/crawl.server';

export const loader = () => text(llms(), 'text/plain');
