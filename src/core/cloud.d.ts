export type CloudStatus = 'starting' | 'local-only' | 'unavailable' | 'guest' | 'syncing' | 'saved' | 'retry' | 'load-failed';
export interface CloudState {status: CloudStatus; user: {id: string; name: string; email: string} | null}
export function getCloud(): CloudState;
export function subscribeCloud(listener: (state: CloudState) => void): () => void;
export function initCloud(): Promise<void>;
export function signIn(): Promise<void>;
export function signOut(): Promise<void>;
export function sync(): Promise<void>;
