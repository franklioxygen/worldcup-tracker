import { createContext, useContext, type ReactNode } from 'react';
import { useMatches } from '../hooks/useMatches';
import { useLanguage } from './LanguageContext';

type MatchesContextValue = ReturnType<typeof useMatches>;

const MatchesContext = createContext<MatchesContextValue | null>(null);

export function MatchesProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const matches = useMatches(language);

  return (
    <MatchesContext.Provider value={matches}>
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatchesContext(): MatchesContextValue {
  const ctx = useContext(MatchesContext);
  if (!ctx) throw new Error('useMatchesContext must be used within MatchesProvider');
  return ctx;
}
