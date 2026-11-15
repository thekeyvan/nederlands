import {redirect} from 'react-router';

// The resource collection moved into the app (the hash is kept by the browser on redirects).
export const loader = () => redirect('/leren.html#bronnen', 301);
