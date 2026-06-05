import { useLanguage } from '../context/LanguageContext';
import { t, translateMatchType } from '../i18n/translations';
import type { Match } from '../types';

interface MatchCardProps {
  match: Match;
}

function TeamRow({
  flag,
  name,
  score,
  showScore,
  finished,
}: {
  flag?: string;
  name: string;
  score: number;
  showScore: boolean;
  finished: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {flag ? (
          <img
            src={flag}
            alt=""
            className="h-6 w-8 shrink-0 rounded-sm object-cover shadow-sm"
            loading="lazy"
          />
        ) : (
          <div className="flex h-6 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            ?
          </div>
        )}
        <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
          {name}
        </span>
      </div>
      {showScore && (
        <span
          className={`shrink-0 text-xl font-bold tabular-nums ${
            finished ? 'text-slate-900 dark:text-white' : 'text-red-500'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ match }: { match: Match }) {
  const { language } = useLanguage();

  if (match.live) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        {t(language, 'live')}
      </span>
    );
  }

  if (match.finished) {
    return (
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        {t(language, 'finished')}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-wc-green/10 px-2 py-0.5 text-[10px] font-semibold text-wc-green">
      {match.time}
    </span>
  );
}

export function MatchCard({ match }: MatchCardProps) {
  const { language } = useLanguage();
  const showScore = match.finished || match.live;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-wc-green">
            {match.group.length <= 2 ? `${t(language, 'group')} ${match.group}` : match.group}
          </span>
          <span>·</span>
          <span>{translateMatchType(match.type, language)}</span>
        </div>
        <StatusBadge match={match} />
      </div>

      <div className="space-y-3">
        <TeamRow
          flag={match.homeFlag}
          name={match.homeTeam}
          score={match.homeScore}
          showScore={showScore}
          finished={match.finished}
        />
        <TeamRow
          flag={match.awayFlag}
          name={match.awayTeam}
          score={match.awayScore}
          showScore={showScore}
          finished={match.finished}
        />
      </div>

      {!showScore && (
        <p className="mt-3 text-center text-lg font-semibold text-slate-400 dark:text-slate-500">
          vs
        </p>
      )}

      {showScore && (
        <p className="mt-2 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
          {match.homeScore} – {match.awayScore}
        </p>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {match.stadium}
          {match.city && ` · ${match.city}`}
        </p>
      </div>
    </article>
  );
}
