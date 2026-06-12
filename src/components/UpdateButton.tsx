import { useLanguage } from '../context/LanguageContext';
import { useMatchesContext } from '../context/MatchesContext';
import { t } from '../i18n/translations';

export function UpdateButton() {
  const { language } = useLanguage();
  const { refresh, refreshing, loading } = useMatchesContext();

  return (
    <button
      type="button"
      onClick={() => refresh()}
      disabled={loading || refreshing}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      aria-label={t(language, 'update')}
    >
      <svg
        className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
}
