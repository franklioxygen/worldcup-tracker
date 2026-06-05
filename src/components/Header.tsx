import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { UpdateButton } from './UpdateButton';

export function Header() {
  const { language } = useLanguage();

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}wc2026-logo.webp`}
            alt="FIFA World Cup 2026"
            className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
          />
          <div className="text-left">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              {t(language, 'title')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {t(language, 'subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UpdateButton />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
