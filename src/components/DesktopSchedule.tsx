import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMatchesContext } from '../context/MatchesContext';
import { t } from '../i18n/translations';
import type { DateGroup, SelectedStadium, SelectedTeam } from '../types';
import { DateTabs } from './DateTabs';
import { MatchGrid } from './MatchGrid';

interface DesktopScheduleProps {
  dateGroups: DateGroup[];
  dateKeys: string[];
  activeDateKey: string;
  onDateChange: (dateKey: string) => void;
  onTeamSelect?: (team: SelectedTeam) => void;
  onStadiumSelect?: (stadium: SelectedStadium) => void;
}

export function DesktopSchedule({
  dateGroups,
  dateKeys,
  activeDateKey,
  onDateChange,
  onTeamSelect,
  onStadiumSelect,
}: DesktopScheduleProps) {
  const { language } = useLanguage();
  const { fetchWinChancesForDates } = useMatchesContext();
  const activeGroup = dateGroups.find((g) => g.dateKey === activeDateKey);

  useEffect(() => {
    if (activeDateKey) fetchWinChancesForDates([activeDateKey]);
  }, [activeDateKey, fetchWinChancesForDates]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DateTabs
        dateKeys={dateKeys}
        activeDateKey={activeDateKey}
        onSelect={onDateChange}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {activeGroup ? (
            <MatchGrid
              matches={activeGroup.matches}
              columns={2}
              onTeamSelect={onTeamSelect}
              onStadiumSelect={onStadiumSelect}
            />
          ) : (
            <p className="py-12 text-center text-slate-500 dark:text-slate-400">
              {t(language, 'noMatches')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
