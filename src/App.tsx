import { useCallback, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { NavTabs, type TopTab } from './components/NavTabs';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DesktopSchedule } from './components/DesktopSchedule';
import { MobileSchedule } from './components/MobileSchedule';
import { CodeOfConductView } from './components/CodeOfConductView';
import { StadiumMatchesView } from './components/StadiumMatchesView';
import { TeamMatchesView } from './components/TeamMatchesView';
import { GroupStandingsView } from './components/GroupStandingsView';
import { KnockoutBracketView } from './components/KnockoutBracketView';
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

function AppContent() {
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

  const [activeTab, setActiveTab] = useState<TopTab>('schedule');
  const [detailView, setDetailView] = useState<DetailView | null>(null);

  const handleTabChange = useCallback((tab: TopTab) => {
    setActiveTab(tab);
    setDetailView(null);
  }, []);

  const handleTeamSelect = useCallback((team: SelectedTeam) => {
    setDetailView({ kind: 'team', entity: team });
  }, []);

  const handleStadiumSelect = useCallback((stadium: SelectedStadium) => {
    setDetailView({ kind: 'stadium', entity: stadium });
  }, []);

  const handleBack = useCallback(() => {
    setDetailView(null);
  }, []);

  const filteredMatches = useMemo(() => {
    if (!detailView) return [];
    if (detailView.kind === 'team') return filterMatchesByTeam(allMatches, detailView.entity.id);
    if (detailView.kind === 'stadium') return filterMatchesByStadium(allMatches, detailView.entity.id);
    return [];
  }, [allMatches, detailView]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div>
            <LoadingSpinner />
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              {t(language, 'loading')}
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-slate-600 dark:text-slate-300">{t(language, 'error')}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg bg-wc-green px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-wc-green/90"
          >
            {t(language, 'retry')}
          </button>
        </div>
      );
    }

    if (detailView?.kind === 'codeOfConduct') {
      return <CodeOfConductView onBack={handleBack} />;
    }

    if (detailView?.kind === 'team') {
      return (
        <TeamMatchesView
          team={detailView.entity}
          matches={filteredMatches}
          columns={isDesktop ? 2 : 1}
          onBack={handleBack}
          onTeamSelect={handleTeamSelect}
          onStadiumSelect={handleStadiumSelect}
        />
      );
    }

    if (detailView?.kind === 'stadium') {
      return (
        <StadiumMatchesView
          stadium={detailView.entity}
          matches={filteredMatches}
          columns={isDesktop ? 2 : 1}
          onBack={handleBack}
          onTeamSelect={handleTeamSelect}
          onStadiumSelect={handleStadiumSelect}
        />
      );
    }

    if (activeTab === 'standings') {
      return <GroupStandingsView onTeamSelect={handleTeamSelect} />;
    }

    if (activeTab === 'knockout') {
      return (
        <KnockoutBracketView
          onTeamSelect={handleTeamSelect}
          onStadiumSelect={handleStadiumSelect}
        />
      );
    }

    return isDesktop ? (
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
    );
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header onOpenCodeOfConduct={() => setDetailView({ kind: 'codeOfConduct' })} />
      <NavTabs activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        {renderContent()}
      </main>
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
