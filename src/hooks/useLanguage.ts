import { useLanguage as useContextLanguage } from "../contexts/LanguageContext";

export const useLanguage = () => {
  return useContextLanguage();
};
