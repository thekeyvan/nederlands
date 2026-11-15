import {robots, text} from '../site/crawl.server';

export const loader = () => text(robots(), 'text/plain');
