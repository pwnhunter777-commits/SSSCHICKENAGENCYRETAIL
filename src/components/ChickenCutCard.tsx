import React, { useState } from 'react';
import {
  ShoppingBag,
  Scale,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Check,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { Product, ChickenVariant, Language, getProductName } from '../types';
import { TRANSLATIONS } from '../utils/translations';

export interface ChickenCutItemData {
  productId: string;
  variant: ChickenVariant;
  baseRate: number;
  adjustedRate: number;
  kg: string;
  price: string;
  numericKg: number;
  numericAmount: number;
  isExpanded: boolean;
}

interface ChickenCutCardProps {
  product: Product;
  baseRate: number;
  withoutSkinOffset: number;
  data: ChickenCutItemData;
  language?: Language;
  onUpdate: (data: Partial<ChickenCutItemData>) => void;
  onRemove: () => void;
  onSaveWithoutSkinOffset?: (newOffset: number) => void;
}

export const ChickenCutCard: React.FC<ChickenCutCardProps> = ({
  product,
  baseRate,
  withoutSkinOffset = 50,
  data,
  language = 'en',
  onUpdate,
  onRemove,
  onSaveWithoutSkinOffset,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isEditingOffset, setIsEditingOffset] = useState(false);
  const [tempOffset, setTempOffset] = useState(String(withoutSkinOffset));
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // With Skin: Base price entered first (e.g. ₹170/Kg)
  const rateWithSkin = baseRate;
  // Without Skin: Base rate + custom increase (e.g. ₹170 + ₹50 = ₹220/Kg)
  const rateWithoutSkin = Math.max(1, baseRate + withoutSkinOffset);

  // Variant is either 'with_skin' or 'without_skin'
  const activeVariant: 'with_skin' | 'without_skin' =
    data.variant === 'with_skin' ? 'with_skin' : 'without_skin';
  const currentAdjustedRate =
    activeVariant === 'with_skin' ? rateWithSkin : rateWithoutSkin;

  // Handle Variant Selection
  const handleSelectVariant = (variant: 'with_skin' | 'without_skin') => {
    const nextRate = variant === 'with_skin' ? rateWithSkin : rateWithoutSkin;
    let newPrice = data.price;
    let numericAmt = data.numericAmount;
    if (data.numericKg > 0) {
      numericAmt = Math.round(data.numericKg * nextRate);
      newPrice = String(numericAmt);
    }
    onUpdate({
      variant,
      adjustedRate: nextRate,
      price: newPrice,
      numericAmount: numericAmt,
    });
  };

  // Handle saving the custom Without Skin increase amount
  const handleSaveOffset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = Math.max(0, parseFloat(tempOffset) || 0);
    if (onSaveWithoutSkinOffset) {
      onSaveWithoutSkinOffset(num);
    }
    setIsEditingOffset(false);
    setSaveToast(
      language === 'ta'
        ? `தோல் இல்லாதது + ₹${num}/கிலோ சேமிக்கப்பட்டது`
        : `Saved Without Skin + ₹${num}/Kg`
    );
    setTimeout(() => setSaveToast(null), 2500);

    // If currently 'without_skin', recalculate price immediately
    if (activeVariant === 'without_skin') {
      const nextRate = Math.max(1, baseRate + num);
      let newPrice = data.price;
      let numericAmt = data.numericAmount;
      if (data.numericKg > 0) {
        numericAmt = Math.round(data.numericKg * nextRate);
        newPrice = String(numericAmt);
      }
      onUpdate({
        adjustedRate: nextRate,
        price: newPrice,
        numericAmount: numericAmt,
      });
    }
  };

  // Handle KG Input Change
  const handleKgChange = (rawKg: string) => {
    const num = parseFloat(rawKg);
    if (!isNaN(num) && num > 0) {
      const amt = Math.round(num * currentAdjustedRate);
      onUpdate({
        kg: rawKg,
        price: String(amt),
        numericKg: num,
        numericAmount: amt,
      });
    } else {
      onUpdate({
        kg: rawKg,
        price: '',
        numericKg: 0,
        numericAmount: 0,
      });
    }
  };

  // Handle Price Input Change
  const handlePriceChange = (rawPrice: string) => {
    const priceNum = parseFloat(rawPrice);
    if (!isNaN(priceNum) && priceNum > 0 && currentAdjustedRate > 0) {
      const kgCalculated = Number((priceNum / currentAdjustedRate).toFixed(3));
      onUpdate({
        price: rawPrice,
        kg: String(kgCalculated),
        numericKg: kgCalculated,
        numericAmount: priceNum,
      });
    } else {
      onUpdate({
        price: rawPrice,
        kg: '',
        numericKg: 0,
        numericAmount: 0,
      });
    }
  };

  // Quick KG preset click
  const handleQuickKg = (kgVal: number) => {
    handleKgChange(String(kgVal));
  };

  // Quick Amount preset click
  const handleQuickAmount = (amtVal: number) => {
    handlePriceChange(String(amtVal));
  };

  // Stepper buttons for KG
  const handleStepKg = (delta: number) => {
    const current = parseFloat(data.kg) || 0;
    const next = Math.max(0, Number((current + delta).toFixed(3)));
    if (next === 0) {
      handleKgChange('');
    } else {
      handleKgChange(String(next));
    }
  };

  // Stepper buttons for Price
  const handleStepPrice = (delta: number) => {
    const current = parseFloat(data.price) || 0;
    const next = Math.max(0, Math.round(current + delta));
    if (next === 0) {
      handlePriceChange('');
    } else {
      handlePriceChange(String(next));
    }
  };

  const isExpanded = data.isExpanded ?? true;
  const displayName = getProductName(product, language);
  const secondaryName = language === 'ta' ? (product.nameEn || product.name) : product.nameTa;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-3.5 transition-all">
      {/* Toast message for saving offset */}
      {saveToast && (
        <div className="bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 flex items-center justify-between animate-in fade-in">
          <span>{saveToast}</span>
          <Check className="w-3.5 h-3.5 text-emerald-300" />
        </div>
      )}

      {/* Top Header Row */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Dark Green Square with Shopping Bag Icon */}
          <div className="w-12 h-12 rounded-2xl bg-[#0f3d2e] flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
            <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-gray-900 leading-snug truncate">
                {displayName}
              </h3>
              {secondaryName && secondaryName !== displayName && (
                <span className="text-xs text-slate-400 font-normal truncate">
                  ({secondaryName})
                </span>
              )}
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                {activeVariant === 'with_skin' ? t.withSkin : t.withoutSkin}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 tracking-tight mt-0.5">
              {data.numericKg > 0
                ? `${data.numericKg.toFixed(3)} ${language === 'ta' ? 'கிலோ' : 'Kg'} × ₹${currentAdjustedRate.toFixed(2)}`
                : `${t.rateWithSkin}: ₹${baseRate.toFixed(2)} / ${language === 'ta' ? 'கிலோ' : 'Kg'}`}
            </p>
          </div>
        </div>

        {/* Right Header: Item Total & Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            ₹{data.numericAmount > 0 ? data.numericAmount.toFixed(2) : '0.00'}
          </span>
          <button
            type="button"
            onClick={() => onUpdate({ isExpanded: !isExpanded })}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-gray-600 rounded-lg transition-colors active:scale-95"
            aria-label="Toggle details"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
          {/* Chicken Type (With Skin vs Without Skin) */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-800">
                {t.chickenType}
              </label>
              {/* Toggle Edit for Without Skin Increase */}
              <button
                type="button"
                onClick={() => {
                  setTempOffset(String(withoutSkinOffset));
                  setIsEditingOffset(!isEditingOffset);
                }}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
              >
                <Edit2 className="w-3 h-3 text-emerald-700" />
                <span>
                  {isEditingOffset ? t.close : `${t.editWithoutSkin} (+₹${withoutSkinOffset})`}
                </span>
              </button>
            </div>

            {/* 2-Column Variant Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. With Skin */}
              <button
                type="button"
                onClick={() => handleSelectVariant('with_skin')}
                className={`py-2.5 px-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                  activeVariant === 'with_skin'
                    ? 'border-2 border-emerald-700 bg-emerald-50/30 ring-2 ring-emerald-600/15 shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    activeVariant === 'with_skin'
                      ? 'text-emerald-950 font-extrabold'
                      : 'text-slate-700'
                  }`}
                >
                  {t.withSkin}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md mt-1 max-w-full truncate text-center">
                  ₹{rateWithSkin.toFixed(2)} / {language === 'ta' ? 'கிலோ' : 'Kg'}
                </span>
              </button>

              {/* 2. Without Skin */}
              <button
                type="button"
                onClick={() => handleSelectVariant('without_skin')}
                className={`py-2.5 px-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                  activeVariant === 'without_skin'
                    ? 'border-2 border-emerald-700 bg-emerald-50/30 ring-2 ring-emerald-600/15 shadow-xs'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <span
                    className={`text-xs font-bold ${
                      activeVariant === 'without_skin'
                        ? 'text-emerald-950 font-extrabold'
                        : 'text-slate-700'
                    }`}
                  >
                    {t.withoutSkin}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    (+₹{withoutSkinOffset})
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md mt-1 max-w-full truncate text-center">
                  ₹{rateWithoutSkin.toFixed(2)} / {language === 'ta' ? 'கிலோ' : 'Kg'}
                </span>
              </button>
            </div>

            {/* Editable Without Skin Increase Panel with Save Button */}
            {isEditingOffset && (
              <form
                onSubmit={handleSaveOffset}
                className="mt-2.5 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 animate-in fade-in slide-in-from-top-1"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t.withoutSkinOffsetTitle}</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {t.addedToWithSkin}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-800">
                      + ₹
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={tempOffset}
                      onChange={(e) => setTempOffset(e.target.value)}
                      placeholder="50"
                      className="w-full bg-white border border-emerald-300 rounded-xl pl-9 pr-14 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600/20"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      / {language === 'ta' ? 'கிலோ' : 'Kg'}
                    </span>
                  </div>
                  {/* Save Button */}
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.save}</span>
                  </button>
                </div>
                {/* Quick Increase Preset Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">
                    {t.quick}
                  </span>
                  {[20, 30, 40, 50, 60].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTempOffset(String(val))}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                        tempOffset === String(val)
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-100/60'
                      }`}
                    >
                      + ₹{val}
                    </button>
                  ))}
                </div>
              </form>
            )}
          </div>

          {/* Base Rate & Adjusted Rate Strip */}
          <div className="bg-slate-100/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between mt-3 text-xs">
            <span className="font-semibold text-slate-600">
              {t.withSkin}: ₹{rateWithSkin.toFixed(2)}
            </span>
            <span className="font-extrabold text-emerald-900">
              {t.selectedRate}: ₹{currentAdjustedRate.toFixed(2)} / {language === 'ta' ? 'கிலோ' : 'Kg'}
            </span>
          </div>

          {/* Enter Weight (Kg) OR Amount (₹) */}
          <div className="mt-3.5">
            <label className="block text-xs font-bold text-gray-800 mb-2">
              {t.enterWeightOrPrice}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Weight Card */}
              <div className="bg-white border-2 border-slate-200 focus-within:border-emerald-600 rounded-xl p-2.5 min-h-[4.25rem] flex items-center justify-between transition-colors shadow-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-emerald-700 shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                      {t.weightKg}
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={data.kg}
                      onChange={(e) => handleKgChange(e.target.value)}
                      placeholder="0.000"
                      className="w-full text-base font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-300"
                    />
                  </div>
                </div>
                {/* Weight Steppers */}
                <div className="flex flex-col gap-1 shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={() => handleStepKg(0.25)}
                    className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-600 rounded-md transition-colors active:scale-90"
                    aria-label="Increase weight"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepKg(-0.25)}
                    className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-900 text-slate-600 rounded-md transition-colors active:scale-90"
                    aria-label="Decrease weight"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Amount Card */}
              <div className="bg-white border-2 border-slate-200 focus-within:border-emerald-600 rounded-xl p-2.5 min-h-[4.25rem] flex items-center justify-between transition-colors shadow-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-emerald-700 font-extrabold text-base shrink-0">
                    ₹
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                      {t.priceRs}
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={data.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="0"
                      className="w-full text-base font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-300"
                    />
                  </div>
                </div>
                {/* Price Steppers */}
                <div className="flex flex-col gap-1 shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={() => handleStepPrice(10)}
                    className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-600 rounded-md transition-colors active:scale-90"
                    aria-label="Increase price"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepPrice(-10)}
                    className="p-1.5 bg-slate-100 hover:bg-red-100 hover:text-red-900 text-slate-600 rounded-md transition-colors active:scale-90"
                    aria-label="Decrease price"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick KG Selector Chips */}
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-500 block mb-1.5">
              {t.quickWeightPresets}
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[0.25, 0.5, 1, 1.5, 2, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickKg(val)}
                  className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all border text-center whitespace-nowrap ${
                    parseFloat(data.kg) === val
                      ? 'bg-[#0f3d2e] text-white border-[#0f3d2e] shadow-xs'
                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {val >= 1 ? `${val} ${language === 'ta' ? 'கிலோ' : 'Kg'}` : `${val * 1000}${language === 'ta' ? 'கி' : 'g'}`}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Amount Selector Chips */}
          <div className="mt-2.5">
            <span className="text-xs font-bold text-slate-500 block mb-1.5">
              {t.quickPricePresets}
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[50, 100, 150, 200, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all border text-center whitespace-nowrap ${
                    parseFloat(data.price) === val
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Card Footer: Remove Cut & Item Total */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearRemove}</span>
            </button>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t.itemTotal}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
                ₹{data.numericAmount > 0 ? data.numericAmount.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
