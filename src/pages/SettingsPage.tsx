import React, { useState } from 'react';
import {
  Store,
  Phone,
  FileText,
  MapPin,
  QrCode,
  Save,
  CheckCircle2,
  Building,
  Lock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react';
import { ShopSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { saveShopSettings } from '../utils/storage';

interface SettingsPageProps {
  settings: ShopSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings>>;
  language: Language;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  setSettings,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate PIN if enabled
    if (formData.pinProtectionEnabled) {
      if (!formData.securityPin || formData.securityPin.length < 4) {
        setPinError(t.pinInvalid);
        return;
      }
    }
    setPinError(null);

    setSettings(formData);
    saveShopSettings(formData);
    setToastMessage(t.settingsSaved);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto bg-emerald-700 text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Shop Logo Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-200 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-emerald-500 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
            <img
              src={formData.logoUrl || '/logo.png'}
              alt="Chicken Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              {t.shopInfo}
            </div>
            <h2 className="text-lg font-extrabold text-emerald-950 mt-0.5">
              {t.settings}
            </h2>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* 1. Shop Name */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 focus-within:border-emerald-600 transition-all">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
            <Building className="w-4 h-4 text-emerald-700" />
            <span>1. {t.shopName}</span>
          </label>
          <input
            type="text"
            required
            value={formData.shopName}
            onChange={(e) => handleChange('shopName', e.target.value)}
            placeholder="e.g. Fresh Chicken Center"
            className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-bold text-sm py-2 px-3 rounded-xl outline-none transition-all"
          />
        </div>

        {/* 2. Phone Number */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 focus-within:border-emerald-600 transition-all">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
            <Phone className="w-4 h-4 text-emerald-700" />
            <span>2. {t.phoneNumber}</span>
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-bold text-sm py-2 px-3 rounded-xl outline-none transition-all"
          />
        </div>

        {/* 3. GST Number */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 focus-within:border-emerald-600 transition-all">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>3. {t.gstNumber}</span>
          </label>
          <input
            type="text"
            value={formData.gstNumber}
            onChange={(e) => handleChange('gstNumber', e.target.value)}
            placeholder="e.g. 33AAAAA0000A1Z5"
            className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-bold text-sm py-2 px-3 rounded-xl outline-none transition-all uppercase"
          />
        </div>

        {/* 4. Address */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 focus-within:border-emerald-600 transition-all">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>4. {t.address}</span>
          </label>
          <textarea
            rows={2}
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="e.g. Main Bazaar Road, Market Area"
            className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-medium text-sm py-2 px-3 rounded-xl outline-none transition-all resize-none"
          />
        </div>

        {/* 5. UPI ID */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 focus-within:border-emerald-600 transition-all">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
            <QrCode className="w-4 h-4 text-emerald-700" />
            <span>5. {t.upiId}</span>
          </label>
          <input
            type="text"
            value={formData.upiId}
            onChange={(e) => handleChange('upiId', e.target.value)}
            placeholder="e.g. chickenstore@upi"
            className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-bold text-sm py-2 px-3 rounded-xl outline-none transition-all"
          />
        </div>

        {/* 6. Without Skin Rate Increase */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-200 focus-within:border-emerald-600 transition-all">
          <label className="flex items-center justify-between text-xs font-bold text-gray-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-700" />
              <span>6. {t.withoutSkinOffsetTitle} (+ ₹ / {language === 'ta' ? 'கிலோ' : 'Kg'})</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {t.addedToWithSkin}
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-800">
              + ₹
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.withoutSkinOffset !== undefined ? formData.withoutSkinOffset : 50}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  withoutSkinOffset: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
              placeholder="50"
              className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-bold text-sm py-2 pl-9 pr-14 rounded-xl outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              / {language === 'ta' ? 'கிலோ' : 'Kg'}
            </span>
          </div>
        </div>

        {/* 7. Password & Security PIN (PWD) Protection */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  7. {t.securityPinSettings}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">
                  {t.securityPinDesc}
                </p>
              </div>
            </div>

            {/* Master Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.pinProtectionEnabled}
                onChange={(e) => handleChange('pinProtectionEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
            </label>
          </div>

          {formData.pinProtectionEnabled && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
              {/* 4-digit PIN Field */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>{t.enterNewPin} (PWD)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Default: <strong>1234</strong>
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={formData.securityPin || '1234'}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      handleChange('securityPin', val);
                      setPinError(null);
                    }}
                    placeholder="1234"
                    className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-slate-900 font-black tracking-widest text-base py-2 pl-9 pr-12 rounded-xl outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-red-600 text-xs font-bold mt-1">
                    {pinError}
                  </p>
                )}
              </div>

              {/* Protection Granular Options */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.protectDailyPrice ?? true}
                    onChange={(e) => handleChange('protectDailyPrice', e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>{t.protectDailyPriceOpt}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.protectSettings ?? true}
                    onChange={(e) => handleChange('protectSettings', e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>{t.protectSettingsOpt}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.protectBillDelete ?? true}
                    onChange={(e) => handleChange('protectBillDelete', e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>{t.protectBillDeleteOpt}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.protectAppLock ?? false}
                    onChange={(e) => handleChange('protectAppLock', e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>{t.protectAppLockOpt}</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Save className="w-5 h-5" />
            <span>{t.saveSettings}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
