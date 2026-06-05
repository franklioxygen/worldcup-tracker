import { t, translateMatchType } from '../i18n/translations';
import type { Language, Match } from '../types';
import { formatDateLabel } from './dates';

export function getMatchDurationHours(match: Match): number {
  return match.type === 'group' ? 2 : 3;
}

export function getMatchEndTime(match: Match): Date {
  const end = new Date(match.kickoff);
  end.setTime(end.getTime() + getMatchDurationHours(match) * 60 * 60 * 1000);
  return end;
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export interface CalendarEventDetails {
  title: string;
  location: string;
  description: string;
  stageLabel: string;
  groupLabel: string;
  dateLabel: string;
  durationHours: number;
}

export function buildCalendarEventDetails(match: Match, lang: Language): CalendarEventDetails {
  const stageLabel = translateMatchType(match.type, lang);
  const groupLabel =
    match.group.length <= 2 ? `${t(lang, 'group')} ${match.group}` : match.group;
  const title = `${match.homeTeam} vs ${match.awayTeam}`;
  const location = [match.stadium, match.city].filter(Boolean).join(', ');
  const durationHours = getMatchDurationHours(match);

  const descriptionLines = [
    `${match.homeTeam} vs ${match.awayTeam}`,
    match.type === 'group'
      ? `${t(lang, 'group')}: ${match.group}`
      : `${t(lang, 'stage')}: ${stageLabel}`,
    `${t(lang, 'kickoff')}: ${match.time}`,
    `${t(lang, 'duration')}: ${durationHours} ${t(lang, 'hours')}`,
    location ? `${t(lang, 'stadium')}: ${location}` : '',
    'FIFA World Cup 2026',
  ].filter(Boolean);

  return {
    title,
    location,
    description: descriptionLines.join('\n'),
    stageLabel,
    groupLabel,
    dateLabel: formatDateLabel(match.dateKey, lang),
    durationHours,
  };
}

export function buildGoogleCalendarUrl(match: Match, lang: Language): string {
  const { title, location, description } = buildCalendarEventDetails(match, lang);
  const start = formatIcsDate(match.kickoff);
  const end = formatIcsDate(getMatchEndTime(match));

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(match: Match, lang: Language): string {
  const { title, location, description } = buildCalendarEventDetails(match, lang);
  const start = formatIcsDate(match.kickoff);
  const end = formatIcsDate(getMatchEndTime(match));
  const now = formatIcsDate(new Date());
  const uid = `wc2026-${match.id}@worldcup-tracker`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//World Cup Tracker//WC 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(match: Match, lang: Language): void {
  const content = buildIcsContent(match, lang);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `wc2026-${match.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
