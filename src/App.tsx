import { useCallback, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DesktopSchedule } from './components/DesktopSchedule';
import { MobileSchedule } from './components/MobileSchedule';
import { TeamMatchesView } from './components/TeamMatchesView';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { MatchesProvider, useMatchesContext } from './context/MatchesContext';
import { ThemeProvider } from './context/ThemeContext';
import { useIsDesktop } from './hooks/useMediaQuery';
import { t } from './i18n/translations';
import type { SelectedTeam } from './types';
import { filterMatchesByTeam } from './utils/matches';

function ScheduleContent() {
  const { language } = useLanguage();
  const isDesktop = useIsDesktop();
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeam | null>(null);
  const {
    dateGroups,
    allMatches,
    dateKeys,
    activeDateKey,
    setActiveDateKey,
    loading,
    error,
    retry,
  } = useMatchesContext();

  const handleTeamSelect = useCallback((team: SelectedTeam) => {
    setSelectedTeam(team);
  }, []);

  const teamMatches = useMemo(() => {
    if (!selectedTeam) return [];
    return filterMatchesByTeam(allMatches, selectedTeam.id);
  }, [allMatches, selectedTeam]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div>
          <LoadingSpinner />
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t(language, 'loading')}
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-600 dark:text-slate-300">{t(language, 'error')}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-wc-green px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-wc-green/90"
        >
          {t(language, 'retry')}
        </button>
      </main>
    );
  }

  if (selectedTeam) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <TeamMatchesView
          team={selectedTeam}
          matches={teamMatches}
          columns={isDesktop ? 2 : 1}
          onBack={() => setSelectedTeam(null)}
          onTeamSelect={handleTeamSelect}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {isDesktop ? (
        <DesktopSchedule
          dateGroups={dateGroups}
          dateKeys={dateKeys}
          activeDateKey={activeDateKey}
          onDateChange={setActiveDateKey}
          onTeamSelect={handleTeamSelect}
        />
      ) : (
        <MobileSchedule
          dateGroups={dateGroups}
          initialDateKey={activeDateKey}
          onTeamSelect={handleTeamSelect}
        />
      )}
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MatchesProvider>
          <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Header />
            <ScheduleContent />
          </div>
        </MatchesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
