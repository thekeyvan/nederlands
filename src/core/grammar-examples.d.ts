export interface GrammarExample {nl: string; gap: string; hint?: string; translation: string}
export function examplesFor(id: string): GrammarExample[];
export const grammarExampleTexts: string[];
