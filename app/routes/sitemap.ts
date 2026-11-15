import {sitemap, text} from '../site/crawl.server';

export const loader = () => text(sitemap(), 'application/xml');
