import React, { useState } from 'react';
import { Globe, Calendar, Store, Lock } from 'lucide-react';
import { Language, ShopSettings } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../utils/translations';
import { formatDisplayDate } from '../utils/storage';

interface HeaderProps {
  settings: ShopSettings;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onLockClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentLanguage,
  onLanguageChange,
  onLockClick,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const todayFormatted = formatDisplayDate(undefined, currentLanguage);
  const logoSrc = settings.logoUrl || '/logo.png';

  return (
    <header className="bg-emerald-800 text-white rounded-b-3xl shadow-lg px-4 pt-3 pb-4 sticky top-0 z-30 transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Company Name & Chicken Mascot Logo (Clicking Logo locks/prompts PWD) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onLockClick}
            title={t.lockAppNow || 'Security PIN / PWD Lock'}
            className="w-10 h-10 rounded-full bg-white border-2 border-emerald-300 flex items-center justify-center shrink-0 overflow-hidden shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
          >
            {!imgError ? (
              <img
                src={logoSrc}
                alt="Chicken Mascot Logo"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Store className="w-5 h-5 text-emerald-800" />
            )}
            <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Lock className="w-3.5 h-3.5 text-white drop-shadow" />
            </div>
          </button>
          <div className="truncate">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight truncate">
              {settings.shopName || 'Fresh Chicken Center'}
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-emerald-100 font-medium">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Lock button & Language Selector */}
        <div className="relative shrink-0 flex items-center gap-1.5">
          {/* Quick Lock Button */}
          {onLockClick && (
            <button
              type="button"
              onClick={onLockClick}
              title={t.lockAppNow}
              className="p-1.5 rounded-full bg-emerald-900/80 hover:bg-emerald-950 text-emerald-200 hover:text-white border border-emerald-600/70 active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Direct Tamil / English 2-way toggle pills */}
          <div className="flex items-center bg-emerald-950/60 p-0.5 rounded-full border border-emerald-600/60">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 text-xs font-bold rounded-full transition-all ${
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
              className={`px-2 py-0.5 text-xs font-bold rounded-full transition-all ${
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
