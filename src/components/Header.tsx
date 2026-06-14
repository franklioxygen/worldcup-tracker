import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { HeaderMobileMenu } from './HeaderMobileMenu';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { UpdateButton } from './UpdateButton';

interface HeaderProps {
  onOpenCodeOfConduct?: () => void;
}

export function Header({ onOpenCodeOfConduct }: HeaderProps) {
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
        <div className="hidden items-center gap-2 md:flex">
          {onOpenCodeOfConduct && (
            <button
              type="button"
              onClick={onOpenCodeOfConduct}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label={t(language, 'codeOfConductTitle')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
          )}
          <UpdateButton />
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <HeaderMobileMenu onOpenCodeOfConduct={onOpenCodeOfConduct} />
      </div>
    </header>
  );
}
