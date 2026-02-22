import { es } from "./locales/es";
import { en } from "./locales/en";
import { pt } from "./locales/pt";
import { Dictionary } from "./types";

export const dictionaries: Record<string, Dictionary> = {
  es,
  en,
  pt,
};

export const defaultDictionary = es;
