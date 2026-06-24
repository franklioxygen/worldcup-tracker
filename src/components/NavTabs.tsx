import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';

export type TopTab = 'schedule' | 'standings' | 'knockout';

interface NavTabsProps {
  activeTab: TopTab;
  onTabChange: (tab: TopTab) => void;
}

const TABS: { id: TopTab; key: 'tabSchedule' | 'tabStandings' | 'tabKnockout' }[] = [
  { id: 'schedule', key: 'tabSchedule' },
  { id: 'standings', key: 'tabStandings' },
  { id: 'knockout', key: 'tabKnockout' },
];

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  const { language } = useLanguage();

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl px-2">
        {TABS.map(({ id, key }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === id
                ? 'border-wc-green text-wc-green'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t(language, key)}
          </button>
        ))}
      </div>
    </div>
  );
}
