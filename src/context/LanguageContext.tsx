import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Language } from '../types';

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  const stored = localStorage.getItem('wc-language');
  if (stored === 'en' || stored === 'zh') return stored;
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === 'en' ? 'zh' : 'en';
      localStorage.setItem('wc-language', next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
