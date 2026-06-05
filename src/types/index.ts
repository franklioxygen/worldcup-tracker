export type Language = 'en' | 'zh';

export type Theme = 'light' | 'dark';

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

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeFlag?: string;
  awayFlag?: string;
  dateKey: string;
  time: string;
  kickoff: Date;
  group: string;
  type: string;
  stadium: string;
  city: string;
  finished: boolean;
  live: boolean;
}

export interface DateGroup {
  dateKey: string;
  matches: Match[];
}
