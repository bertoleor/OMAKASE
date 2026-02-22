"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, Dictionary } from "../i18n/types";
import { dictionaries, defaultDictionary } from "../i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dictionary: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("es");
  const [dictionary, setDictionary] = useState<Dictionary>(defaultDictionary);

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("language") as Language;
    if (saved && dictionaries[saved]) {
      setLanguage(saved);
      setDictionary(dictionaries[saved]);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    setDictionary(dictionaries[lang]);
    localStorage.setItem("language", lang);
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let current: any = dictionary;

    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation missing for key: ${path}`);
        return path;
      }
      current = current[key];
    }

    return current as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dictionary }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
