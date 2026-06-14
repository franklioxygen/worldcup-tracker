import type { ReactNode } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import type { Match, SelectedStadium, SelectedTeam } from '../types';
import { groupMatchesByDate } from '../utils/matches';
import { DateSection } from './DateSection';

interface FilteredMatchesViewProps {
  title: string;
  subtitle: string;
  leading?: ReactNode;
  matches: Match[];
  columns?: 1 | 2;
  onBack: () => void;
  onTeamSelect: (team: SelectedTeam) => void;
  onStadiumSelect?: (stadium: SelectedStadium) => void;
}

export function FilteredMatchesView({
  title,
  subtitle,
  leading,
  matches,
  columns = 2,
  onBack,
  onTeamSelect,
  onStadiumSelect,
}: FilteredMatchesViewProps) {
  const { language } = useLanguage();
  const dateGroups = groupMatchesByDate(matches);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label={t(language, 'backToSchedule')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {leading}
            <div className="min-w-0 text-left">
              <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
          {dateGroups.map((group) => (
            <DateSection
              key={group.dateKey}
              dateKey={group.dateKey}
              matches={group.matches}
              columns={columns}
              onTeamSelect={onTeamSelect}
              onStadiumSelect={onStadiumSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
