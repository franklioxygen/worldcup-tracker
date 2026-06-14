import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMatchesContext } from '../context/MatchesContext';
import { useTheme } from '../context/ThemeContext';
import { t } from '../i18n/translations';

interface HeaderMobileMenuProps {
  onOpenCodeOfConduct?: () => void;
}

interface MenuItem {
  key: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
}

export function HeaderMobileMenu({ onOpenCodeOfConduct }: HeaderMobileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { refresh, refreshing, loading } = useMatchesContext();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const items: MenuItem[] = [
    ...(onOpenCodeOfConduct
      ? [{
          key: 'code-of-conduct',
          label: t(language, 'codeOfConductTitle'),
          onClick: () => {
            onOpenCodeOfConduct();
            close();
          },
          icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
        }]
      : []),
    {
      key: 'refresh',
      label: t(language, 'update'),
      disabled: loading || refreshing,
      onClick: () => {
        refresh();
        close();
      },
      icon: (
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
      ),
    },
    {
      key: 'language',
      label: language === 'en' ? t(language, 'chinese') : t(language, 'english'),
      onClick: () => {
        toggleLanguage();
        close();
      },
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
    },
    {
      key: 'theme',
      label: theme === 'light' ? t(language, 'darkMode') : t(language, 'lightMode'),
      onClick: () => {
        toggleTheme();
        close();
      },
      icon: theme === 'light' ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div ref={menuRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label={t(language, 'menu')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={item.onClick}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-700/60"
            >
              <span className="shrink-0 text-slate-500 dark:text-slate-400">{item.icon}</span>
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
