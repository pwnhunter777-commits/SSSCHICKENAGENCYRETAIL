import React, { useState } from 'react';
import { Globe, Calendar, Store, Download } from 'lucide-react';
import { Language, ShopSettings } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../utils/translations';
import { formatDisplayDate } from '../utils/storage';

interface HeaderProps {
  settings: ShopSettings;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onInstallClick?: () => void;
  onFontSizeChange?: (newScale: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentLanguage,
  onLanguageChange,
  onInstallClick,
  onFontSizeChange,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [fontToast, setFontToast] = useState<string | null>(null);
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  const todayFormatted = formatDisplayDate(undefined, currentLanguage);
  const logoSrc = settings.logoUrl || '/logo.png';
  const currentScale = settings.fontSizeScale !== undefined ? settings.fontSizeScale : 1.0;

  const handleIncreaseScale = () => {
    // Stepping up: 1.0 -> 1.15 -> 1.30 -> 1.45 -> 1.0
    let nextScale: number;
    if (currentScale >= 1.4) {
      nextScale = 1.0;
    } else {
      nextScale = Number((currentScale + 0.15).toFixed(2));
    }
    if (onFontSizeChange) {
      onFontSizeChange(nextScale);
    }
    setFontToast(`${Math.round(nextScale * 100)}%`);
    setTimeout(() => setFontToast(null), 1800);
  };

  const handleDecreaseScale = () => {
    const nextScale = Math.max(0.85, Number((currentScale - 0.15).toFixed(2)));
    if (onFontSizeChange) {
      onFontSizeChange(nextScale);
    }
    setFontToast(`${Math.round(nextScale * 100)}%`);
    setTimeout(() => setFontToast(null), 1800);
  };

  return (
    <header className="bg-emerald-800 text-white rounded-b-3xl shadow-lg px-4 pt-3 pb-4 sticky top-0 z-30 transition-all relative">
      {/* Quick Font Size Toast */}
      {fontToast && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white border border-emerald-500/80 px-3 py-1 rounded-full text-xs font-black shadow-xl animate-in fade-in zoom-in-95 flex items-center gap-1.5 pointer-events-none">
          <span>{currentLanguage === 'ta' ? 'எழுத்து அளவு:' : 'Text Size:'}</span>
          <span className="text-emerald-300 font-black">{fontToast}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Company Name & Chicken Mascot Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-emerald-300 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
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
          </div>
          <div className="truncate">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight truncate">
              {settings.shopName || 'SSS CHICKEN AGENCY'}
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-emerald-100 font-medium">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{todayFormatted}</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Text Size Button, Install App & Language Selector */}
        <div className="relative shrink-0 flex items-center gap-1.5">
          {/* Quick Font Size Increase Button (Full App Accessibility) */}
          <div className="flex items-center bg-emerald-950/70 p-0.5 rounded-full border border-emerald-600/60 shadow-xs shrink-0">
            <button
              type="button"
              onClick={handleDecreaseScale}
              disabled={currentScale <= 0.85}
              title={t.decreaseTextSize || 'Decrease text size'}
              aria-label="Decrease text size"
              className="w-6 h-6 flex items-center justify-center rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 disabled:opacity-30 transition-all font-black text-xs"
            >
              A-
            </button>
            <button
              type="button"
              onClick={handleIncreaseScale}
              title={t.increaseTextSize || 'Increase text size'}
              aria-label="Increase text size for full app"
              className="h-6 px-2 flex items-center justify-center gap-1 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white shadow font-black text-xs transition-all active:scale-95"
            >
              <span>A+</span>
              <span className="text-[10px] opacity-85 font-bold">
                {Math.round(currentScale * 100)}%
              </span>
            </button>
          </div>

          {/* Quick Install PWA Button */}
          {onInstallClick && (
            <button
              type="button"
              onClick={onInstallClick}
              title={t.installApp}
              className="p-1.5 rounded-full bg-emerald-900/80 hover:bg-emerald-950 text-emerald-200 hover:text-white border border-emerald-600/70 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
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
