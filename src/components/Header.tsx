import React, { useState } from 'react';
import { Globe, Calendar, Store } from 'lucide-react';
import { Language, ShopSettings } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../utils/translations';
import { formatDisplayDate } from '../utils/storage';

interface HeaderProps {
  settings: ShopSettings;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentLanguage,
  onLanguageChange,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const todayFormatted = formatDisplayDate(undefined, currentLanguage);

  return (
    <header className="bg-emerald-800 text-white rounded-b-3xl shadow-lg px-4 pt-3 pb-4 sticky top-0 z-30 transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Company Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="truncate">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight truncate">
              {settings.shopName || 'Fresh Chicken Center'}
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-emerald-100 font-medium">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* Language Selector (English / தமிழ் Quick Toggle & Dropdown) */}
        <div className="relative shrink-0 flex items-center gap-1.5">
          {/* Direct Tamil / English 2-way toggle pills */}
          <div className="flex items-center bg-emerald-950/60 p-0.5 rounded-full border border-emerald-600/60">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                currentLanguage === 'en'
                  ? 'bg-white text-emerald-900 shadow'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('ta')}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                currentLanguage === 'ta'
                  ? 'bg-white text-emerald-900 shadow'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-1.5 rounded-full bg-emerald-700/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40 active:scale-95 transition-all"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-emerald-100 py-1.5 z-50 text-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider border-b border-gray-100">
                    {t.selectLanguage}
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-colors ${
                        currentLanguage === lang.code
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-semibold">{lang.native}</span>
                      <span className="text-[11px] text-gray-400 font-normal">
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
