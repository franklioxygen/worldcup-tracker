import { useCallback, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DesktopSchedule } from './components/DesktopSchedule';
import { MobileSchedule } from './components/MobileSchedule';
import { CodeOfConductView } from './components/CodeOfConductView';
import { StadiumMatchesView } from './components/StadiumMatchesView';
import { TeamMatchesView } from './components/TeamMatchesView';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { MatchesProvider, useMatchesContext } from './context/MatchesContext';
import { ThemeProvider } from './context/ThemeContext';
import { useIsDesktop } from './hooks/useMediaQuery';
import { t } from './i18n/translations';
import type { SelectedStadium, SelectedTeam } from './types';
import { filterMatchesByStadium, filterMatchesByTeam } from './utils/matches';

type DetailView =
  | { kind: 'team'; entity: SelectedTeam }
  | { kind: 'stadium'; entity: SelectedStadium }
  | { kind: 'codeOfConduct' };

function ScheduleContent({
  detailView,
  setDetailView,
}: {
  detailView: DetailView | null;
  setDetailView: (view: DetailView | null) => void;
}) {
  const { language } = useLanguage();
  const isDesktop = useIsDesktop();
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
    setDetailView({ kind: 'team', entity: team });
  }, [setDetailView]);

  const handleStadiumSelect = useCallback((stadium: SelectedStadium) => {
    setDetailView({ kind: 'stadium', entity: stadium });
  }, [setDetailView]);

  const filteredMatches = useMemo(() => {
    if (!detailView) return [];

    if (detailView.kind === 'team') {
      return filterMatchesByTeam(allMatches, detailView.entity.id);
    }

    if (detailView.kind === 'stadium') {
      return filterMatchesByStadium(allMatches, detailView.entity.id);
    }

    return [];
  }, [allMatches, detailView]);

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

  if (detailView?.kind === 'codeOfConduct') {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <CodeOfConductView onBack={() => setDetailView(null)} />
      </main>
    );
  }

  if (detailView?.kind === 'team') {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <TeamMatchesView
          team={detailView.entity}
          matches={filteredMatches}
          columns={isDesktop ? 2 : 1}
          onBack={() => setDetailView(null)}
          onTeamSelect={handleTeamSelect}
          onStadiumSelect={handleStadiumSelect}
        />
      </main>
    );
  }

  if (detailView?.kind === 'stadium') {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <StadiumMatchesView
          stadium={detailView.entity}
          matches={filteredMatches}
          columns={isDesktop ? 2 : 1}
          onBack={() => setDetailView(null)}
          onTeamSelect={handleTeamSelect}
          onStadiumSelect={handleStadiumSelect}
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
          onStadiumSelect={handleStadiumSelect}
        />
      ) : (
        <MobileSchedule
          dateGroups={dateGroups}
          initialDateKey={activeDateKey}
          onTeamSelect={handleTeamSelect}
          onStadiumSelect={handleStadiumSelect}
        />
      )}
    </main>
  );
}

function AppContent() {
  const [detailView, setDetailView] = useState<DetailView | null>(null);

  const handleOpenCodeOfConduct = useCallback(() => {
    setDetailView({ kind: 'codeOfConduct' });
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header onOpenCodeOfConduct={handleOpenCodeOfConduct} />
      <ScheduleContent detailView={detailView} setDetailView={setDetailView} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MatchesProvider>
          <AppContent />
        </MatchesProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
