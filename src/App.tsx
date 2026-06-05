import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DesktopSchedule } from './components/DesktopSchedule';
import { MobileSchedule } from './components/MobileSchedule';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { useIsDesktop } from './hooks/useMediaQuery';
import { useMatches } from './hooks/useMatches';
import { t } from './i18n/translations';

function ScheduleContent() {
  const { language } = useLanguage();
  const isDesktop = useIsDesktop();
  const {
    dateGroups,
    dateKeys,
    activeDateKey,
    setActiveDateKey,
    loading,
    error,
    retry,
  } = useMatches(language);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div>
          <LoadingSpinner />
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t(language, 'loading')}
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-600 dark:text-slate-300">{t(language, 'error')}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-wc-green px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-wc-green/90"
        >
          {t(language, 'retry')}
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {isDesktop ? (
        <DesktopSchedule
          dateGroups={dateGroups}
          dateKeys={dateKeys}
          activeDateKey={activeDateKey}
          onDateChange={setActiveDateKey}
        />
      ) : (
        <MobileSchedule
          dateGroups={dateGroups}
          initialDateKey={activeDateKey}
        />
      )}
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <Header />
          <ScheduleContent />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
