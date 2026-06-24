import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMatchesContext } from '../context/MatchesContext';
import { t, translateMatchType } from '../i18n/translations';
import type { SelectedStadium, SelectedTeam } from '../types';
import { groupKnockoutMatches } from '../utils/standings';
import { MatchCard } from './MatchCard';

interface KnockoutBracketViewProps {
  onTeamSelect: (team: SelectedTeam) => void;
  onStadiumSelect: (stadium: SelectedStadium) => void;
}

export function KnockoutBracketView({ onTeamSelect, onStadiumSelect }: KnockoutBracketViewProps) {
  const { language } = useLanguage();
  const { allMatches } = useMatchesContext();

  const rounds = useMemo(() => groupKnockoutMatches(allMatches), [allMatches]);

  if (rounds.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">{t(language, 'noKnockoutMatches')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-6">
        {rounds.map(({ round, matches }) => (
          <section key={round}>
            <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
              {translateMatchType(round, language)}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onTeamSelect={onTeamSelect}
                  onStadiumSelect={onStadiumSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
