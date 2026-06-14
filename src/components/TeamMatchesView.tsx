import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import type { Match, SelectedStadium, SelectedTeam } from '../types';
import { FilteredMatchesView } from './FilteredMatchesView';

interface TeamMatchesViewProps {
  team: SelectedTeam;
  matches: Match[];
  columns?: 1 | 2;
  onBack: () => void;
  onTeamSelect: (team: SelectedTeam) => void;
  onStadiumSelect?: (stadium: SelectedStadium) => void;
}

export function TeamMatchesView({
  team,
  matches,
  columns = 2,
  onBack,
  onTeamSelect,
  onStadiumSelect,
}: TeamMatchesViewProps) {
  const { language } = useLanguage();

  return (
    <FilteredMatchesView
      title={team.name}
      subtitle={`${matches.length} ${t(language, 'teamMatches')}`}
      leading={
        team.flag ? (
          <img
            src={team.flag}
            alt=""
            className="h-8 w-10 shrink-0 rounded-sm object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-8 w-10 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-xs font-bold text-slate-500 dark:bg-slate-700">
            ?
          </div>
        )
      }
      matches={matches}
      columns={columns}
      onBack={onBack}
      onTeamSelect={onTeamSelect}
      onStadiumSelect={onStadiumSelect}
    />
  );
}
