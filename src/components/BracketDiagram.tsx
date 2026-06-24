import { useMemo } from 'react';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { useLanguage } from '../context/LanguageContext';
import { translateMatchType } from '../i18n/translations';
import type { Match, SelectedTeam } from '../types';

// Round order left → right in the bracket
const BRACKET_ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final'] as const;
// Number of R32 slots (always 16 for WC2026)
const N_SLOTS = 16;

function colX(roundIdx: number, colW: number, colGap: number): number {
  return roundIdx * (colW + colGap);
}

function totalW(colW: number, colGap: number): number {
  return BRACKET_ROUNDS.length * colW + (BRACKET_ROUNDS.length - 1) * colGap;
}

// Vertical centre of a match card in the bracket canvas
function matchCenterY(matchIdx: number, roundIdx: number, unit: number): number {
  const spacing = unit * Math.pow(2, roundIdx);
  return matchIdx * spacing + spacing / 2;
}

function matchTopY(matchIdx: number, roundIdx: number, unit: number, matchH: number): number {
  return matchCenterY(matchIdx, roundIdx, unit) - matchH / 2;
}

// ─── Small team row inside a bracket card ───────────────────────────────────
interface TeamRowProps {
  flag?: string;
  name: string;
  score?: number;
  showScore: boolean;
  bold: boolean;
  teamId?: string;
  onTeamSelect?: (team: SelectedTeam) => void;
}

function TeamRow({ flag, name, score, showScore, bold, teamId, onTeamSelect }: TeamRowProps) {
  if (!teamId && name === 'TBD') {
    return (
      <div className="flex items-center gap-1 px-1.5" style={{ height: 20 }}>
        <div className="h-[10px] w-[14px] shrink-0 rounded-[1px] bg-slate-300 dark:bg-slate-600" />
        <span className="flex-1 text-center text-[10px] text-slate-400 dark:text-slate-600">TBD</span>
      </div>
    );
  }

  const content = (
    <>
      {flag ? (
        <img
          src={flag}
          alt=""
          className="h-[10px] w-[14px] shrink-0 rounded-[1px] object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-[10px] w-[14px] shrink-0 rounded-[1px] bg-slate-300 dark:bg-slate-600" />
      )}
      <span
        className={`min-w-0 flex-1 truncate text-[10px] leading-tight ${
          bold ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
        }`}
        title={name}
      >
        {name}
      </span>
      {showScore && (
        <span
          className={`shrink-0 pl-0.5 text-[10px] tabular-nums ${
            bold
              ? 'font-bold text-slate-900 dark:text-white'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {score}
        </span>
      )}
    </>
  );

  const cls = `flex min-w-0 items-center gap-1 px-1.5 ${bold ? 'font-semibold' : ''}`;

  if (teamId && onTeamSelect) {
    return (
      <button
        type="button"
        onClick={() => onTeamSelect({ id: teamId, name, flag })}
        className={`${cls} transition-colors hover:text-wc-green`}
        style={{ height: 20 }}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cls} style={{ height: 20 }}>
      {content}
    </div>
  );
}

// ─── Individual match card inside the bracket ────────────────────────────────
interface BracketCardProps {
  match: Match | null;
  matchH: number;
  onTeamSelect?: (team: SelectedTeam) => void;
}

function BracketCard({ match, matchH, onTeamSelect }: BracketCardProps) {
  if (!match) {
    return (
      <div
        className="flex w-full flex-col justify-center overflow-hidden rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/80"
        style={{ height: matchH }}
      >
        <div className="flex items-center gap-1 px-1.5" style={{ height: 20 }}>
          <div className="h-[10px] w-[14px] shrink-0 rounded-[1px] bg-slate-200 dark:bg-slate-700" />
          <span className="text-[10px] text-slate-400 dark:text-slate-600">TBD</span>
        </div>
        <div className="mx-1.5 border-t border-slate-100 dark:border-slate-700/40" />
        <div className="flex items-center gap-1 px-1.5" style={{ height: 20 }}>
          <div className="h-[10px] w-[14px] shrink-0 rounded-[1px] bg-slate-200 dark:bg-slate-700" />
          <span className="text-[10px] text-slate-400 dark:text-slate-600">TBD</span>
        </div>
      </div>
    );
  }

  const showScore = match.finished || match.live;
  const homeWins = showScore && match.homeScore > match.awayScore;
  const awayWins = showScore && match.awayScore > match.homeScore;

  const borderCls = match.live
    ? 'border-red-400/60 dark:border-red-500/50'
    : match.finished
      ? 'border-slate-300 dark:border-slate-600'
      : 'border-slate-200 dark:border-slate-700';

  return (
    <div
      className={`flex w-full flex-col justify-center overflow-hidden rounded border bg-white shadow-sm dark:bg-slate-800/90 ${borderCls}`}
      style={{ height: matchH }}
    >
      <TeamRow
        flag={match.homeTeamId ? match.homeFlag : undefined}
        name={match.homeTeamId ? (match.homeCode ?? match.homeTeam) : 'TBD'}
        score={match.homeScore}
        showScore={showScore}
        bold={!!homeWins}
        teamId={match.homeTeamId}
        onTeamSelect={onTeamSelect}
      />
      <div className="mx-1.5 border-t border-slate-100 dark:border-slate-700/40" />
      <TeamRow
        flag={match.awayTeamId ? match.awayFlag : undefined}
        name={match.awayTeamId ? (match.awayCode ?? match.awayTeam) : 'TBD'}
        score={match.awayScore}
        showScore={showScore}
        bold={!!awayWins}
        teamId={match.awayTeamId}
        onTeamSelect={onTeamSelect}
      />
    </div>
  );
}

// ─── Main bracket diagram ────────────────────────────────────────────────────
interface BracketDiagramProps {
  allMatches: Match[];
  onTeamSelect?: (team: SelectedTeam) => void;
}

export function BracketDiagram({ allMatches, onTeamSelect }: BracketDiagramProps) {
  const { language } = useLanguage();
  const isDesktop = useIsDesktop();

  // Responsive sizing
  const unit   = isDesktop ? 60 : 52;
  const matchH = isDesktop ? 48 : 40;
  const colW   = isDesktop ? 108 : 68;
  const colGap = isDesktop ? 24  : 10;
  const headerH = 24;

  const tw = totalW(colW, colGap);
  const totalH = unit * N_SLOTS;

  // Group and sort matches per round
  const roundMatches = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const round of [...BRACKET_ROUNDS, 'third'] as const) {
      map.set(
        round,
        allMatches
          .filter((m) => m.type === round)
          .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime()),
      );
    }
    return map;
  }, [allMatches]);

  // SVG connector lines between consecutive rounds
  const connectorLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    for (let ri = 0; ri < BRACKET_ROUNDS.length - 1; ri++) {
      const matches = roundMatches.get(BRACKET_ROUNDS[ri]) ?? [];
      const pairCount = Math.floor(matches.length / 2);

      const rightEdge = colX(ri, colW, colGap) + colW;
      const midX = rightEdge + colGap * 0.45;
      const nextLeft = colX(ri + 1, colW, colGap);

      for (let pi = 0; pi < pairCount; pi++) {
        const yA   = matchCenterY(pi * 2,     ri,     unit);
        const yB   = matchCenterY(pi * 2 + 1, ri,     unit);
        const yNext = matchCenterY(pi,          ri + 1, unit);

        lines.push(
          { x1: rightEdge, y1: yA,    x2: midX,     y2: yA    }, // from match A
          { x1: rightEdge, y1: yB,    x2: midX,     y2: yB    }, // from match B
          { x1: midX,      y1: yA,    x2: midX,     y2: yB    }, // vertical join
          { x1: midX,      y1: yNext, x2: nextLeft, y2: yNext }, // to next round
        );
      }
    }

    return lines;
  }, [roundMatches, unit, colW, colGap]);

  const thirdMatch = roundMatches.get('third')?.[0] ?? null;
  const finalColX  = colX(BRACKET_ROUNDS.length - 1, colW, colGap);

  return (
    <div className="overflow-x-auto pb-2">
      {/* Horizontal scroll hint on mobile */}
      <p className="mb-2 px-4 text-center text-[11px] text-slate-400 dark:text-slate-500 md:hidden">
        {language === 'en' ? '← swipe to see full bracket →' : '← 左右滑动查看完整对阵图 →'}
      </p>

      <div className="flex min-w-max justify-center">
      <div className="px-4" style={{ width: tw + 32 }}>
        {/* Round column headers */}
        <div className="flex" style={{ gap: colGap }}>
          {BRACKET_ROUNDS.map((round) => (
            <div
              key={round}
              className="shrink-0 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              style={{ width: colW, height: headerH, lineHeight: `${headerH}px` }}
            >
              {translateMatchType(round, language)}
            </div>
          ))}
        </div>

        {/* Bracket canvas */}
        <div className="relative" style={{ width: tw, height: totalH }}>
          {/* SVG connecting lines */}
          <svg
            className="pointer-events-none absolute inset-0 text-slate-300 dark:text-slate-600"
            width={tw}
            height={totalH}
            aria-hidden="true"
          >
            {connectorLines.map((l, i) => (
              <line
                key={i}
                x1={l.x1} y1={l.y1}
                x2={l.x2} y2={l.y2}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}
          </svg>

          {/* Match cards for each round */}
          {BRACKET_ROUNDS.map((round, ri) =>
            (roundMatches.get(round) ?? []).map((match, mi) => (
              <div
                key={match.id}
                className="absolute"
                style={{
                  left:   colX(ri, colW, colGap),
                  top:    matchTopY(mi, ri, unit, matchH),
                  width:  colW,
                  height: matchH,
                }}
              >
                <BracketCard match={match} matchH={matchH} onTeamSelect={onTeamSelect} />
              </div>
            )),
          )}
        </div>

        {/* 3rd Place — placed below bracket, right-aligned with Final column */}
        {thirdMatch && (
          <div
            className="relative mt-3"
            style={{ width: tw, height: matchH + headerH }}
          >
            <div
              className="absolute"
              style={{ left: finalColX }}
            >
              <p
                className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                style={{ width: colW }}
              >
                {translateMatchType('third', language)}
              </p>
              <div style={{ width: colW, height: matchH }}>
                <BracketCard match={thirdMatch} matchH={matchH} onTeamSelect={onTeamSelect} />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
