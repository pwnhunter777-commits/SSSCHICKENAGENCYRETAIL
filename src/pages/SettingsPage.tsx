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
  Smartphone,
  WifiOff,
  Printer,
} from 'lucide-react';
import { ShopSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { saveShopSettings } from '../utils/storage';
import { InstallAppModal } from '../components/InstallAppModal';

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
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

      {/* Top Store Badge Card (Matching Screenshot) */}
      <div className="bg-[#064e3b] text-white rounded-3xl p-4 shadow-lg mb-4 flex items-center gap-3.5 border border-emerald-700/50">
        <div className="w-14 h-14 rounded-2xl bg-white p-1 border-2 border-emerald-400 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
          <img
            src={formData.logoUrl || '/logo.png'}
            alt="Chicken Logo"
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase truncate">
            {formData.shopName || 'SSS CHICKEN AGENCY'}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-bold mt-0.5">
            <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{formData.phoneNumber || '8680000003'}</span>
          </div>
          {formData.gstNumber && (
            <div className="text-[11px] font-extrabold text-amber-300 tracking-wider mt-0.5">
              GST: {formData.gstNumber}
            </div>
          )}
        </div>
      </div>

      {/* App Installation / PWA Quick Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-2xl p-3.5 shadow-md mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="truncate">
            <div className="text-xs font-black text-white leading-tight">
              {t.installApp}
            </div>
            <div className="text-[10px] text-emerald-200 font-medium truncate flex items-center gap-1 mt-0.5">
              <WifiOff className="w-3 h-3 text-emerald-300" />
              <span>{t.pwaOfflineReady}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInstallModal(true)}
          className="bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs px-3 py-2 rounded-xl shrink-0 shadow-xs active:scale-95 transition-all"
        >
          {t.howToInstall}
        </button>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* 1. Shop Name */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 focus-within:border-emerald-600 transition-all">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1">
            <Building className="w-4 h-4 text-emerald-700" />
            <span>1. {t.shopName}</span>
          </label>
          <input
            type="text"
            required
            value={formData.shopName}
            onChange={(e) => handleChange('shopName', e.target.value)}
            placeholder="e.g. SSS CHICKEN AGENCY"
            className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-extrabold text-sm py-2 px-3 rounded-xl outline-none transition-all uppercase"
          />
          <p className="text-[11px] text-gray-500 italic mt-1 font-medium">
            {t.shopNameSubtitle || 'This name appears at the top header and on printed bills.'}
          </p>
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
            placeholder="e.g. 8680000003"
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
            placeholder="e.g. 34AQPN8846J2ZF"
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
            placeholder="e.g. NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110"
            className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-semibold text-xs uppercase py-2 px-3 rounded-xl outline-none transition-all resize-none"
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
            placeholder="e.g. NAZIRAHAMED0003@okhdfcbank"
            className="w-full bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-bold text-sm py-2 px-3 rounded-xl outline-none transition-all"
          />
        </div>

        {/* 6. Bill Print Width & Thermal Roll Size */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-100 focus-within:border-emerald-600 transition-all space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-1.5">
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>6. {t.billPrintWidth || 'Bill Print Width'}</span>
            </label>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={formData.billPrintWidth || 17}
                  onChange={(e) =>
                    handleChange('billPrintWidth', parseInt(e.target.value) || 17)
                  }
                  className="w-24 bg-emerald-50/40 border-2 border-emerald-200 focus:border-emerald-600 focus:bg-white text-gray-900 font-black text-center text-sm py-2 px-2 rounded-xl outline-none transition-all"
                />
                <span className="text-xs font-bold text-emerald-900">
                  {t.billPrintWidthUnit || 'cm (செ.மீ)'}
                </span>
              </div>
              <span className="text-xs text-slate-500 italic">
                {t.defaultPrintWidth || 'Default: 17 cm'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              {t.thermalPaperWidth || 'Thermal Printer Paper Size'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    printerPaperWidth: '80mm',
                    printerColumns: 48,
                  }))
                }
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  (formData.printerPaperWidth ?? '80mm') === '80mm'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.thermalPaper80mm || '80mm Roll (48 Columns)'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    printerPaperWidth: '58mm',
                    printerColumns: 32,
                  }))
                }
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  formData.printerPaperWidth === '58mm'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.thermalPaper58mm || '58mm Roll (32 Columns)'}
              </button>
            </div>
          </div>

          {/* Bottom Paper Feed / Space after total */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              {t.printerFeedTitle || 'Bottom Paper Feed (Space after Total)'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    printerFeedLines: 0,
                  }))
                }
                className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                  (formData.printerFeedLines ?? 4) === 0
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.printerFeedZero || '0 Lines'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    printerFeedLines: 2,
                  }))
                }
                className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                  formData.printerFeedLines === 2
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.printerFeed2 || '2 Lines'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    printerFeedLines: 4,
                  }))
                }
                className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                  (formData.printerFeedLines ?? 4) === 4
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.printerFeed4 || '4 Lines'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    printerFeedLines: 6,
                  }))
                }
                className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                  formData.printerFeedLines === 6
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.printerFeed6 || '6 Lines'}
              </button>
            </div>
          </div>

          {/* Paper Cut Mode */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-gray-700 mb-2">
              {t.printerCutTitle || 'Paper Cut Mode'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    printerAutoCut: false,
                  }))
                }
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  !formData.printerAutoCut
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.printerCutManual || 'Manual Tear (Zero Feed)'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    printerAutoCut: true,
                  }))
                }
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  formData.printerAutoCut
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.printerCutAuto || 'Auto Cut'}
              </button>
            </div>
          </div>
        </div>

        {/* 7. Without Skin Rate Increase */}
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-200 focus-within:border-emerald-600 transition-all">
          <label className="flex items-center justify-between text-xs font-bold text-gray-800 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Store className="w-4 h-4 text-emerald-700" />
              <span>7. {t.withoutSkinOffsetTitle} (+ ₹ / {language === 'ta' ? 'கிலோ' : 'Kg'})</span>
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

      {/* PWA Install Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        language={language}
        settings={formData}
      />
    </div>
  );
};

