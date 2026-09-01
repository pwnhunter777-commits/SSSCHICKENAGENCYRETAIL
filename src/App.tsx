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

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('daily-price');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'Fresh Chicken Center',
    phoneNumber: '',
    gstNumber: '',
    address: '',
    upiId: '',
  });
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize all persisted state
  useEffect(() => {
    const loadedProds = loadProducts();
    const loadedSettings = loadShopSettings();
    const loadedLang = loadLanguage();

    setProducts(loadedProds);
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

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    saveLanguage(newLang);
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
          onPageChange={setCurrentPage}
          language={language}
        />
      </div>
    </div>
  );
}
