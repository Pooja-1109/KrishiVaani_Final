import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { mr } from '../locales/mr';
import { hi } from '../locales/hi';

export type SupportedLanguage = 'en' | 'mr' | 'hi';

type Translations = typeof en;

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  getCropName: (crop: { name_en?: string; name_mr?: string; name_hi?: string; name?: string }) => string;
}

const translations: Record<SupportedLanguage, Translations> = {
  en,
  mr,
  hi,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('krishivaani_lang');
    if (saved === 'en' || saved === 'mr' || saved === 'hi') {
      return saved;
    }
    return 'mr'; // Default to Marathi for Maharashtra agricultural base
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('krishivaani_lang', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language] || translations.en;

  const getCropName = (crop: { name_en?: string; name_mr?: string; name_hi?: string; name?: string }) => {
    if (!crop) return '';
    if (language === 'mr' && crop.name_mr) return crop.name_mr;
    if (language === 'hi' && crop.name_hi) return crop.name_hi;
    return crop.name_en || crop.name || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getCropName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
