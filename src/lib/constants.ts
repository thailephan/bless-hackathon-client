
export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'vi', label: 'Vietnamese' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['value'];
export type Language = typeof LANGUAGES[number];

