import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import type { Match, SelectedStadium, SelectedTeam } from '../types';
import { formatDateLabel, isToday } from '../utils/dates';
import { MatchGrid } from './MatchGrid';

interface DateSectionProps {
  dateKey: string;
  matches: Match[];
  id?: string;
  columns?: 1 | 2;
  onTeamSelect?: (team: SelectedTeam) => void;
  onStadiumSelect?: (stadium: SelectedStadium) => void;
}

export function DateSection({
  dateKey,
  matches,
  id,
  columns = 1,
  onTeamSelect,
  onStadiumSelect,
}: DateSectionProps) {
  const { language } = useLanguage();
  const today = isToday(dateKey);

  return (
    <section id={id} className="scroll-mt-32">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {formatDateLabel(dateKey, language)}
        </h2>
        {today && (
          <span className="rounded-full bg-wc-green/10 px-2.5 py-0.5 text-xs font-semibold text-wc-green">
            {t(language, 'today')}
          </span>
        )}
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {matches.length} {t(language, 'match')}{matches.length !== 1 && language === 'en' ? 'es' : ''}
        </span>
      </div>
      <MatchGrid
        matches={matches}
        columns={columns}
        onTeamSelect={onTeamSelect}
        onStadiumSelect={onStadiumSelect}
      />
    </section>
  );
}
