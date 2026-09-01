/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Page, Product, ShopSettings, Language } from './types';
import {
  loadProducts,
  loadShopSettings,
  loadLanguage,
  saveLanguage,
  isPriceSetForToday,
} from './utils/storage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DailyPricePage } from './pages/DailyPricePage';
import { BillingPage } from './pages/BillingPage';
import { RegisterPage } from './pages/RegisterPage';
import { TotalPage } from './pages/TotalPage';
import { SettingsPage } from './pages/SettingsPage';
import { PinPromptModal } from './components/PinPromptModal';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('daily-price');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'Fresh Chicken Center',
    phoneNumber: '',
    gstNumber: '',
    address: '',
    upiId: '',
    logoUrl: '/logo.png',
  });
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Security Lock & PIN State
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [pinPromptInfo, setPinPromptInfo] = useState<{
    isOpen: boolean;
    title?: string;
    subtitle?: string;
    targetPage?: Page;
    isAppUnlock?: boolean;
  }>({
    isOpen: false,
  });

  // Initialize all persisted state
  useEffect(() => {
    const loadedProds = loadProducts();
    const loadedSettings = loadShopSettings();
    const loadedLang = loadLanguage();

    setProducts(loadedProds);
    setSettings(loadedSettings);
    setLanguage(loadedLang);

    // If app lock is enabled, start locked
    if (loadedSettings.pinProtectionEnabled && loadedSettings.protectAppLock) {
      setIsAppLocked(true);
      setPinPromptInfo({
        isOpen: true,
        title: loadedLang === 'ta' ? 'பாதுகாப்பு பூட்டு' : 'Security Lock',
        subtitle: loadedLang === 'ta' ? 'தொடர 4-இலக்க பின் உள்ளிடவும்' : 'Enter 4-digit PIN to unlock',
        isAppUnlock: true,
      });
    }

    // If today's prices are already set, default to Billing (Page 2), else Daily Price (Page 1)
    if (isPriceSetForToday()) {
      setCurrentPage('billing');
    } else {
      setCurrentPage('daily-price');
    }

    setIsLoaded(true);
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  };

  const handlePageNavigation = (targetPage: Page) => {
    // Check if target page is protected by PIN
    if (settings.pinProtectionEnabled) {
      if (targetPage === 'daily-price' && settings.protectDailyPrice) {
        setPinPromptInfo({
          isOpen: true,
          title: language === 'ta' ? 'தினசரி விலை பூட்டப்பட்டுள்ளது' : 'Daily Price Locked',
          subtitle: language === 'ta' ? 'விலை நிர்ணயிக்க பின் உள்ளிடவும்' : 'Enter PIN to edit daily rates',
          targetPage,
        });
        return;
      }
      if (targetPage === 'settings' && settings.protectSettings) {
        setPinPromptInfo({
          isOpen: true,
          title: language === 'ta' ? 'அமைப்புகள் பூட்டப்பட்டுள்ளது' : 'Settings Locked',
          subtitle: language === 'ta' ? 'அமைப்புகளை மாற்ற பின் உள்ளிடவும்' : 'Enter PIN to open store settings',
          targetPage,
        });
        return;
      }
    }
    setCurrentPage(targetPage);
  };

  const handleManualLock = () => {
    setIsAppLocked(true);
    setPinPromptInfo({
      isOpen: true,
      title: language === 'ta' ? 'டெர்மினல் பூட்டப்பட்டுள்ளது' : 'Terminal Locked',
      subtitle: language === 'ta' ? 'திறக்க 4-இலக்க பின் உள்ளிடவும்' : 'Enter 4-digit PIN to unlock',
      isAppUnlock: true,
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-gray-900 font-sans antialiased select-none">
      {/* Centered Mobile Container */}
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative flex flex-col border-x border-slate-200">
        {/* Top Header - Every Page */}
        <Header
          settings={settings}
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
          onLockClick={handleManualLock}
        />

        {/* Main Body - Exactly 5 Pages */}
        <main className="flex-1 overflow-x-hidden">
          {currentPage === 'daily-price' && (
            <DailyPricePage
              products={products}
              setProducts={setProducts}
              language={language}
              onPricesSaved={() => setCurrentPage('billing')}
            />
          )}

          {currentPage === 'billing' && (
            <BillingPage
              products={products}
              setProducts={setProducts}
              settings={settings}
              language={language}
            />
          )}

          {currentPage === 'register' && (
            <RegisterPage
              settings={settings}
              language={language}
            />
          )}

          {currentPage === 'total' && (
            <TotalPage
              products={products}
              language={language}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              settings={settings}
              setSettings={setSettings}
              language={language}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation - Every Page */}
        <BottomNav
          currentPage={currentPage}
          onPageChange={handlePageNavigation}
          language={language}
        />

        {/* Security PIN / PWD Lock Prompt Modal */}
        <PinPromptModal
          isOpen={pinPromptInfo.isOpen}
          title={pinPromptInfo.title}
          subtitle={pinPromptInfo.subtitle}
          settings={settings}
          language={language}
          isDismissable={!pinPromptInfo.isAppUnlock}
          onSuccess={() => {
            if (pinPromptInfo.isAppUnlock) {
              setIsAppLocked(false);
            }
            if (pinPromptInfo.targetPage) {
              setCurrentPage(pinPromptInfo.targetPage);
            }
            setPinPromptInfo({ isOpen: false });
          }}
          onCancel={() => {
            setPinPromptInfo({ isOpen: false });
          }}
        />
      </div>
    </div>
  );
}
