import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMatchesContext } from '../context/MatchesContext';
import { t } from '../i18n/translations';
import type { SelectedTeam } from '../types';
import { computeGroupStandings, type TeamStanding } from '../utils/standings';

interface GroupStandingsViewProps {
  onTeamSelect: (team: SelectedTeam) => void;
}

function TeamFlag({ flag }: { flag?: string }) {
  if (flag) {
    return (
      <img
        src={flag}
        alt=""
        className="h-4 w-6 shrink-0 rounded-sm object-cover shadow-sm"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex h-4 w-6 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-[8px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
      ?
    </div>
  );
}

function GDCell({ value }: { value: number }) {
  if (value > 0) return <span className="text-wc-green">+{value}</span>;
  if (value < 0) return <span className="text-red-500">{value}</span>;
  return <span className="text-slate-600 dark:text-slate-300">0</span>;
}

function GroupTable({
  group,
  teams,
  onTeamSelect,
}: {
  group: string;
  teams: TeamStanding[];
  onTeamSelect: (team: SelectedTeam) => void;
}) {
  const { language } = useLanguage();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <h3 className="font-semibold text-wc-green">
          {t(language, 'group')} {group}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500 dark:border-slate-700/50 dark:text-slate-400">
              <th className="py-2 pl-3 pr-1 text-left font-medium">#</th>
              <th className="py-2 pr-2 text-left font-medium">{t(language, 'teamColumn')}</th>
              <th className="px-2 py-2 text-center font-medium">{t(language, 'played')}</th>
              <th className="px-2 py-2 text-center font-medium">{t(language, 'won')}</th>
              <th className="px-2 py-2 text-center font-medium">{t(language, 'drawn')}</th>
              <th className="px-2 py-2 text-center font-medium">{t(language, 'lost')}</th>
              <th className="hidden px-2 py-2 text-center font-medium sm:table-cell">{t(language, 'goalsFor')}</th>
              <th className="hidden px-2 py-2 text-center font-medium sm:table-cell">{t(language, 'goalsAgainst')}</th>
              <th className="px-2 py-2 text-center font-medium">{t(language, 'goalDiff')}</th>
              <th className="py-2 pl-2 pr-3 text-center font-bold text-slate-700 dark:text-slate-200">
                {t(language, 'points')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {teams.map((team, idx) => {
              const qualClass =
                idx < 2
                  ? 'border-l-2 border-l-wc-green'
                  : idx === 2
                    ? 'border-l-2 border-l-amber-400'
                    : '';
              return (
                <tr
                  key={team.teamId}
                  className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 ${qualClass}`}
                >
                  <td className="py-2.5 pl-3 pr-1 tabular-nums text-slate-400 dark:text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 pr-2">
                    <button
                      type="button"
                      onClick={() =>
                        onTeamSelect({ id: team.teamId, name: team.teamName, flag: team.teamFlag })
                      }
                      className="flex min-w-[110px] items-center gap-2 text-left font-medium text-slate-800 transition-colors hover:text-wc-green dark:text-slate-100"
                    >
                      <TeamFlag flag={team.teamFlag} />
                      <span className="truncate">{team.teamName}</span>
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
                    {team.mp}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
                    {team.w}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
                    {team.d}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-slate-600 dark:text-slate-300">
                    {team.l}
                  </td>
                  <td className="hidden px-2 py-2.5 text-center tabular-nums text-slate-600 sm:table-cell dark:text-slate-300">
                    {team.gf}
                  </td>
                  <td className="hidden px-2 py-2.5 text-center tabular-nums text-slate-600 sm:table-cell dark:text-slate-300">
                    {team.ga}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">
                    <GDCell value={team.gd} />
                  </td>
                  <td className="py-2.5 pl-2 pr-3 text-center font-bold tabular-nums text-slate-900 dark:text-white">
                    {team.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GroupStandingsView({ onTeamSelect }: GroupStandingsViewProps) {
  const { language } = useLanguage();
  const { allMatches } = useMatchesContext();

  const standings = useMemo(() => computeGroupStandings(allMatches), [allMatches]);

  if (standings.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">{t(language, 'noGroupMatches')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-0.5 rounded-full bg-wc-green" />
            {language === 'en' ? 'Advance' : '晋级'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-0.5 rounded-full bg-amber-400" />
            {language === 'en' ? 'Possible advance (best 3rd)' : '可能晋级（最佳第三）'}
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {standings.map(({ group, teams }) => (
            <GroupTable key={group} group={group} teams={teams} onTeamSelect={onTeamSelect} />
          ))}
        </div>
      </div>
    </div>
  );
}
