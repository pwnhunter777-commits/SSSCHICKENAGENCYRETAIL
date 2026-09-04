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
  applyFontScale,
  saveShopSettings,
} from './utils/storage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DailyPricePage } from './pages/DailyPricePage';
import { BillingPage } from './pages/BillingPage';
import { RegisterPage } from './pages/RegisterPage';
import { TotalPage } from './pages/TotalPage';
import { SettingsPage } from './pages/SettingsPage';
import { InstallAppModal } from './components/InstallAppModal';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('daily-price');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'SSS CHICKEN AGENCY',
    phoneNumber: '8680000003',
    gstNumber: '34AQPN8846J2ZF',
    address: 'NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110',
    upiId: 'NAZIRAHAMED0003@okhdfcbank',
    logoUrl: '/logo.png',
  });
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Initialize all persisted state
  useEffect(() => {
    const loadedProds = loadProducts();
    const loadedSettings = loadShopSettings();
    const loadedLang = loadLanguage();

    // Ensure only Chicken (and any user-created custom products) exist
    const onlyChicken = loadedProds.filter((p) => {
      const isChicken = p.id === 'p0' || (p.nameEn || p.name || '').trim().toLowerCase() === 'chicken';
      const isOldDefaultCut = /^p(1[0-2]|[1-9])$/.test(p.id);
      return isChicken && !isOldDefaultCut;
    });
    if (onlyChicken.length === 0) {
      onlyChicken.push({
        id: 'p0',
        name: 'Chicken',
        nameEn: 'Chicken',
        nameTa: 'கோழி இறைச்சி',
        defaultPrice: 220,
      });
    }

    setProducts(onlyChicken);
    setSettings(loadedSettings);
    setLanguage(loadedLang);

    // If today's prices are already set, default to Billing (Page 2), else Daily Price (Page 1)
    if (isPriceSetForToday()) {
      setCurrentPage('billing');
    } else {
      setCurrentPage('daily-price');
    }

    setIsLoaded(true);
  }, []);

  // Ensure font scale is updated whenever settings change
  useEffect(() => {
    if (settings?.fontSizeScale !== undefined) {
      applyFontScale(settings.fontSizeScale);
    }
  }, [settings?.fontSizeScale]);

  const handleFontSizeChange = (newScale: number) => {
    const clamped = Math.min(1.5, Math.max(0.85, Number(newScale.toFixed(2))));
    applyFontScale(clamped);
    const updated = { ...settings, fontSizeScale: clamped };
    setSettings(updated);
    saveShopSettings(updated);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    saveLanguage(newLang);
  };

  const handlePageNavigation = (targetPage: Page) => {
    setCurrentPage(targetPage);
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
          onInstallClick={() => setShowInstallModal(true)}
          onFontSizeChange={handleFontSizeChange}
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

        {/* PWA App Install Modal */}
        <InstallAppModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          language={language}
          settings={settings}
        />
      </div>
    </div>
  );
}
