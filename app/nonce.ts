import {createContext} from 'react';

/** The CSP nonce of the current server response (undefined in the browser). */
export const NonceContext = createContext<string | undefined>(undefined);
