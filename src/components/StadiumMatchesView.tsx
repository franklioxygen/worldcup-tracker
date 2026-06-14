import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import type { Match, SelectedStadium, SelectedTeam } from '../types';
import { FilteredMatchesView } from './FilteredMatchesView';

interface StadiumMatchesViewProps {
  stadium: SelectedStadium;
  matches: Match[];
  columns?: 1 | 2;
  onBack: () => void;
  onTeamSelect: (team: SelectedTeam) => void;
  onStadiumSelect?: (stadium: SelectedStadium) => void;
}

function StadiumIcon() {
  return (
    <div className="flex h-8 w-10 shrink-0 items-center justify-center rounded-sm bg-wc-green/10 text-wc-green dark:bg-wc-green/20">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"
        />
      </svg>
    </div>
  );
}

export function StadiumMatchesView({
  stadium,
  matches,
  columns = 2,
  onBack,
  onTeamSelect,
  onStadiumSelect,
}: StadiumMatchesViewProps) {
  const { language } = useLanguage();
  const matchCount = `${matches.length} ${t(language, 'teamMatches')}`;
  const subtitle = stadium.city ? `${stadium.city} · ${matchCount}` : matchCount;

  return (
    <FilteredMatchesView
      title={stadium.name}
      subtitle={subtitle}
      leading={<StadiumIcon />}
      matches={matches}
      columns={columns}
      onBack={onBack}
      onTeamSelect={onTeamSelect}
      onStadiumSelect={onStadiumSelect}
    />
  );
}
