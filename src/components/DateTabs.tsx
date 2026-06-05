import { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { formatShortDate, isToday } from '../utils/dates';
import { t } from '../i18n/translations';

interface DateTabsProps {
  dateKeys: string[];
  activeDateKey: string;
  onSelect: (dateKey: string) => void;
}

export function DateTabs({ dateKeys, activeDateKey, onSelect }: DateTabsProps) {
  const { language } = useLanguage();
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeDateKey]);

  return (
    <div className="shrink-0 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="tab-scroll mx-auto max-w-6xl overflow-x-auto px-4">
        <nav className="flex gap-1 py-2" role="tablist" aria-label="Match dates">
          {dateKeys.map((dateKey) => {
            const isActive = dateKey === activeDateKey;
            const today = isToday(dateKey);

            return (
              <button
                key={dateKey}
                ref={isActive ? activeRef : undefined}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect(dateKey)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-wc-green text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {today && (
                  <span className="mr-1 text-[10px] font-bold uppercase opacity-80">
                    {t(language, 'today')}
                  </span>
                )}
                {formatShortDate(dateKey, language)}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
