export type Language = 'en' | 'zh';

export type Theme = 'light' | 'dark';

export type MatchPhase =
  | 'scheduled'
  | 'live'
  | 'halftime'
  | 'extraTime'
  | 'extraTimeHalftime'
  | 'penalties'
  | 'finished'
  | 'finishedAET'
  | 'finishedPenalties';

export interface ApiGame {
  _id: string;
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string;
  away_scorers: string;
  group: string;
  matchday: string;
  local_date: string;
  persian_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  home_team_name_fa?: string;
  away_team_name_en?: string;
  away_team_name_fa?: string;
  home_team_label?: string;
  away_team_label?: string;
  /** Optional penalty-shootout scores when provided by the live API. */
  home_pen_score?: string;
  away_pen_score?: string;
  home_penalty_score?: string;
  away_penalty_score?: string;
  home_score_penalties?: string;
  away_score_penalties?: string;
  home_penalties?: string;
  away_penalties?: string;
  /** Regulation / ET score before penalties, when split out by the API. */
  home_score_regulation?: string;
  away_score_regulation?: string;
  home_score_90?: string;
  away_score_90?: string;
}

export interface ApiTeam {
  _id: string;
  id: string;
  name_en: string;
  name_fa: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
}

export interface ApiStadium {
  _id: string;
  id: string;
  name_en: string;
  name_fa: string;
  fifa_name: string;
  city_en: string;
  city_fa: string;
  country_en: string;
  country_fa: string;
  capacity: number;
  region: string;
}

export interface SelectedTeam {
  id: string;
  name: string;
  flag?: string;
}

export interface SelectedStadium {
  id: string;
  name: string;
  city?: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore: number;
  awayScore: number;
  homeFlag?: string;
  awayFlag?: string;
  dateKey: string;
  time: string;
  kickoff: Date;
  group: string;
  type: string;
  stadiumId?: string;
  stadium: string;
  city: string;
  finished: boolean;
  live: boolean;
  timeElapsed: string;
  phase: MatchPhase;
  homePenScore?: number;
  awayPenScore?: number;
  showPenaltyScores: boolean;
}

export interface DateGroup {
  dateKey: string;
  matches: Match[];
}
