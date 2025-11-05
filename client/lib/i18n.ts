import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { en } from '../locales/en';
import { vi } from '../locales/vi';

type Language = 'en' | 'vi';
type Translations = typeof en;

const translations: Record<Language, Translations> = { en, vi };

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  // FIX: Update t function to support interpolation
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // FIX: Update t function to support interpolation, fixing the "Expected 1 arguments, but got 2" error.
  const t = (key: string, options?: { [key: string]: string | number }): string => {
    const findTranslation = (lang: Language, translationKey: string): string | undefined => {
      const keys = translationKey.split('.');
      let result: any = translations[lang];
      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
          return undefined;
        }
      }
      return result;
    };

    let translatedString = findTranslation(language, key);

    // Fallback to English if translation is missing
    if (translatedString === undefined) {
      translatedString = findTranslation('en', key) || key;
    }
    
    if (options && typeof translatedString === 'string') {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translatedString = (translatedString as string).replace(regex, String(options[optionKey]));
      });
    }

    return translatedString;
  };

  // Fix: Replaced JSX with React.createElement to be compatible with the .ts file extension, as JSX is not allowed in .ts files by default.
  return React.createElement(LanguageContext.Provider, { value: { language, setLanguage, t } }, children);
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};