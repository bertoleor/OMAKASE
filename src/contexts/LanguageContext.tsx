"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Language, Dictionary } from "../i18n/types";
import { dictionaries, defaultDictionary } from "../i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dictionary: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  // Lazy initialization - read from localStorage once on initial render
  const getInitialLanguage = (): Language => {
    if (globalThis.window === undefined) return "es";
    const saved = localStorage.getItem("language") as Language;
    return saved && dictionaries[saved] ? saved : "es";
  };

  const getInitialDictionary = (): Dictionary => {
    if (globalThis.window === undefined) return defaultDictionary;
    const saved = localStorage.getItem("language") as Language;
    return saved && dictionaries[saved] ? dictionaries[saved] : defaultDictionary;
  };

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [dictionary, setDictionary] = useState<Dictionary>(getInitialDictionary);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    setDictionary(dictionaries[lang]);
    localStorage.setItem("language", lang);
  }, []);

  const t = useCallback(
    (path: string): string => {
      const keys = path.split(".");
      let current: unknown = dictionary;

      for (const key of keys) {
        if (typeof current !== "object" || current === null || !(key in current)) {
          console.warn(`Translation missing for key: ${path}`);
          return path;
        }
        current = (current as Record<string, unknown>)[key];
      }

      return typeof current === "string" ? current : path;
    },
    [dictionary],
  );

  const contextValue = useMemo(
    () => ({ language, setLanguage: handleSetLanguage, t, dictionary }),
    [language, handleSetLanguage, t, dictionary],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
