import { useEffect, useState } from 'react';
import { AddToCalendarModal } from './AddToCalendarModal';
import { useLanguage } from '../context/LanguageContext';
import { t, translateMatchType } from '../i18n/translations';
import type { Match, SelectedStadium, SelectedTeam } from '../types';
import { getFinishedBadgeKey } from '../utils/matchPhase';
import { formatMatchElapsedTime } from '../utils/matchTime';

interface MatchCardProps {
  match: Match;
  onTeamSelect?: (team: SelectedTeam) => void;
  onStadiumSelect?: (stadium: SelectedStadium) => void;
}

function Flag({ flag }: { flag?: string }) {
  if (flag) {
    return (
      <img
        src={flag}
        alt=""
        className="h-6 w-8 shrink-0 rounded-sm object-cover shadow-sm"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-6 w-8 shrink-0 items-center justify-center rounded-sm bg-slate-200 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
      ?
    </div>
  );
}

function TeamName({
  name,
  teamId,
  flag,
  align = 'left',
  onTeamSelect,
}: {
  name: string;
  teamId?: string;
  flag?: string;
  align?: 'left' | 'right';
  onTeamSelect?: (team: SelectedTeam) => void;
}) {
  const isClickable = Boolean(teamId && onTeamSelect);
  const alignClass = align === 'right' ? 'text-right' : 'text-left';

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={() => onTeamSelect!({ id: teamId!, name, flag })}
        className={`group min-w-0 break-words text-sm font-medium leading-snug text-balance text-slate-800 transition-colors hover:text-wc-green hover:underline dark:text-slate-100 ${alignClass}`}
      >
        {name}
      </button>
    );
  }

  return (
    <span className={`min-w-0 break-words text-sm font-medium leading-snug text-balance text-slate-800 dark:text-slate-100 ${alignClass}`}>
      {name}
    </span>
  );
}

function ScoreBlock({
  score,
  penScore,
  showPenaltyScores,
}: {
  score: number;
  penScore?: number;
  showPenaltyScores: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center leading-none">
      <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
        {score}
      </span>
      {showPenaltyScores && penScore !== undefined && (
        <span className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          ({penScore})
        </span>
      )}
    </div>
  );
}

function StatusBadge({
  match,
  onTimeClick,
}: {
  match: Match;
  onTimeClick?: () => void;
}) {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!match.live) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [match.live]);

  if (match.live) {
    const elapsed = formatMatchElapsedTime(match.timeElapsed, language, {
      kickoff: match.kickoff,
      now,
      matchType: match.type,
      phase: match.phase,
    });

    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          {t(language, 'live')}
        </span>
        {elapsed && (
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {elapsed}
          </span>
        )}
      </span>
    );
  }

  if (match.finished) {
    const badgeKey = getFinishedBadgeKey(match.phase);
    return (
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        {t(language, badgeKey)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onTimeClick}
      className="rounded-full bg-wc-green/10 px-2 py-0.5 text-[10px] font-semibold text-wc-green transition-colors hover:bg-wc-green/20"
      aria-label={t(language, 'addToCalendar')}
    >
      {match.time}
    </button>
  );
}

export function MatchCard({ match, onTeamSelect, onStadiumSelect }: MatchCardProps) {
  const { language } = useLanguage();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const showScore = match.finished || match.live;
  const canAddToCalendar = !match.live && !match.finished;
  const canSelectStadium = Boolean(match.stadiumId && match.stadium && onStadiumSelect);

  return (
    <>
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-wc-green">
            {match.group.length <= 2 ? `${t(language, 'group')} ${match.group}` : match.group}
          </span>
          <span>·</span>
          <span>{translateMatchType(match.type, language)}</span>
        </div>
        <StatusBadge
          match={match}
          onTimeClick={canAddToCalendar ? () => setShowCalendarModal(true) : undefined}
        />
      </div>

      <div
        className={`grid items-center gap-x-2 py-3 sm:gap-x-3 sm:py-4 ${
          showScore
            ? 'grid-cols-[auto_minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)_auto]'
            : 'grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto]'
        }`}
      >
        <Flag flag={match.homeFlag} />
        <TeamName
          name={match.homeTeam}
          teamId={match.homeTeamId}
          flag={match.homeFlag}
          onTeamSelect={onTeamSelect}
        />
        {showScore && (
          <ScoreBlock
            score={match.homeScore}
            penScore={match.homePenScore}
            showPenaltyScores={match.showPenaltyScores}
          />
        )}

        <span className="px-0.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          vs
        </span>

        {showScore && (
          <ScoreBlock
            score={match.awayScore}
            penScore={match.awayPenScore}
            showPenaltyScores={match.showPenaltyScores}
          />
        )}
        <TeamName
          name={match.awayTeam}
          teamId={match.awayTeamId}
          flag={match.awayFlag}
          align="right"
          onTeamSelect={onTeamSelect}
        />
        <Flag flag={match.awayFlag} />
      </div>

      <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-700">
        {canSelectStadium ? (
          <button
            type="button"
            onClick={() =>
              onStadiumSelect!({
                id: match.stadiumId!,
                name: match.stadium,
                city: match.city || undefined,
              })
            }
            className="max-w-full truncate text-left text-xs text-slate-500 transition-colors hover:text-wc-green hover:underline dark:text-slate-400"
          >
            {match.stadium}
            {match.city && ` · ${match.city}`}
          </button>
        ) : (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {match.stadium}
            {match.city && ` · ${match.city}`}
          </p>
        )}
      </div>
    </article>

    {showCalendarModal && (
      <AddToCalendarModal match={match} onClose={() => setShowCalendarModal(false)} />
    )}
    </>
  );
}
