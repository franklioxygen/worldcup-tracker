import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import type { Match } from '../types';
import {
  buildCalendarEventDetails,
  buildGoogleCalendarUrl,
  downloadIcsFile,
} from '../utils/calendar';

interface AddToCalendarModalProps {
  match: Match;
  onClose: () => void;
}

export function AddToCalendarModal({ match, onClose }: AddToCalendarModalProps) {
  const { language } = useLanguage();
  const details = buildCalendarEventDetails(match, language);
  const googleCalendarUrl = buildGoogleCalendarUrl(match, language);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-calendar-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="add-to-calendar-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {t(language, 'addToCalendar')}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {details.title}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t(language, 'close')}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t(language, 'matchDetails')}
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">{t(language, 'date')}</dt>
                <dd className="text-right font-medium text-slate-800 dark:text-slate-100">
                  {details.dateLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">{t(language, 'kickoff')}</dt>
                <dd className="text-right font-medium text-slate-800 dark:text-slate-100">
                  {match.time}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">{t(language, 'duration')}</dt>
                <dd className="text-right font-medium text-slate-800 dark:text-slate-100">
                  {details.durationHours} {t(language, 'hours')}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500 dark:text-slate-400">{t(language, 'stage')}</dt>
                <dd className="text-right font-medium text-slate-800 dark:text-slate-100">
                  {match.type === 'group' ? details.groupLabel : details.stageLabel}
                </dd>
              </div>
              {match.stadium && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">{t(language, 'stadium')}</dt>
                  <dd className="text-right font-medium text-slate-800 dark:text-slate-100">
                    {match.stadium}
                    {match.city && ` · ${match.city}`}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="space-y-2">
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-wc-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-wc-green/90"
            >
              {t(language, 'addToGoogleCalendar')}
            </a>
            <button
              type="button"
              onClick={() => downloadIcsFile(match, language)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t(language, 'downloadIcs')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
