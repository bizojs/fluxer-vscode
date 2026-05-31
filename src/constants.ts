import LANG from "./data/languages.json";

export const KNOWN_EXTENSIONS: { [key: string]: { image: string } } = LANG.KNOWN_EXTENSIONS;
export const KNOWN_LANGUAGES: { image: string; language: string }[] = LANG.KNOWN_LANGUAGES;

export const IDLE_EMOTE_KEY = 'idle-vscode' as const;
