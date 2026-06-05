import type { Match, SelectedTeam } from '../types';
import { MatchCard } from './MatchCard';

interface MatchGridProps {
  matches: Match[];
  columns?: 1 | 2;
  onTeamSelect?: (team: SelectedTeam) => void;
}

export function MatchGrid({ matches, columns = 2, onTeamSelect }: MatchGridProps) {
  if (matches.length === 0) return null;

  return (
    <div
      className={
        columns === 2
          ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
          : 'flex flex-col gap-4'
      }
    >
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} onTeamSelect={onTeamSelect} />
      ))}
    </div>
  );
}
