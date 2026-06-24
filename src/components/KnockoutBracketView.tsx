import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMatchesContext } from '../context/MatchesContext';
import { t, translateMatchType } from '../i18n/translations';
import type { SelectedStadium, SelectedTeam } from '../types';
import { groupKnockoutMatches } from '../utils/standings';
import { BracketDiagram } from './BracketDiagram';
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
      {/* ── Bracket diagram ─────────────────────────────────────────────── */}
      <div className="py-6">
        <BracketDiagram allMatches={allMatches} onTeamSelect={onTeamSelect} />
      </div>

      {/* ── Match details by round ───────────────────────────────────────── */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {language === 'en' ? 'Match Details' : '比赛详情'}
          </p>
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
                    showDate
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
