import React, { useState, useEffect, useMemo } from 'react';
import { Scale, IndianRupee } from 'lucide-react';
import { Product, Bill, Language, getProductName } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { loadBills, getTodayKey } from '../utils/storage';

interface TotalPageProps {
  products: Product[];
  language: Language;
}

export const TotalPage: React.FC<TotalPageProps> = ({
  products,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [bills, setBills] = useState<Bill[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today'>('all');
  const todayKey = getTodayKey();

  useEffect(() => {
    setBills(loadBills());
  }, []);

  // Filtered bills based on selected filter
  const relevantBills = useMemo(() => {
    if (timeFilter === 'today') {
      return bills.filter((b) => b.date === todayKey);
    }
    return bills;
  }, [bills, timeFilter, todayKey]);

  // Overall totals
  const overallTotalKg = useMemo(() => {
    return relevantBills.reduce((sum, b) => sum + (b.totalKg || 0), 0);
  }, [relevantBills]);

  const overallTotalAmount = useMemo(() => {
    return relevantBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [relevantBills]);

  // Product-wise breakdown for ALL products
  const productTotals = useMemo(() => {
    const map: {
      [productIdOrName: string]: {
        product?: Product;
        name: string;
        nameEn?: string;
        nameTa?: string;
        totalKg: number;
        totalAmount: number;
        billsCount: number;
      };
    } = {};

    products.forEach((p) => {
      map[p.id] = {
        product: p,
        name: getProductName(p, language),
        nameEn: p.nameEn || p.name,
        nameTa: p.nameTa || p.name,
        totalKg: 0,
        totalAmount: 0,
        billsCount: 0,
      };
    });

    // Aggregate from saved bills
    relevantBills.forEach((bill) => {
      bill.items.forEach((item) => {
        const prodId = item.productId;
        const matchingProd = products.find((p) => p.id === prodId);
        const key = prodId && map[prodId] ? prodId : item.productName;
        if (!map[key]) {
          map[key] = {
            product: matchingProd,
            name: matchingProd ? getProductName(matchingProd, language) : (item.productNameTa && language === 'ta' ? item.productNameTa : item.productName),
            nameEn: item.productNameEn || item.productName,
            nameTa: item.productNameTa || item.productName,
            totalKg: 0,
            totalAmount: 0,
            billsCount: 0,
          };
        }
        map[key].totalKg += item.kg || 0;
        map[key].totalAmount += item.amount || 0;
        map[key].billsCount += 1;
      });
    });

    return Object.values(map);
  }, [products, relevantBills, language]);

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto min-h-screen">
      {/* Page Header Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-200 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {t.salesSummary}
          </div>
          <h2 className="text-lg font-extrabold text-emerald-950 mt-0.5">
            {t.total}
          </h2>
        </div>

        {/* Filter Toggle: All vs Today */}
        <div className="flex bg-emerald-50 p-1 rounded-xl border border-emerald-200">
          <button
            type="button"
            onClick={() => setTimeFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            {t.allTime}
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('today')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'today'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-emerald-800'
            }`}
          >
            {t.today}
          </button>
        </div>
      </div>

      {/* Main Totals Card: Total KG Sold & Total Amount */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {/* Total KG Sold */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-emerald-600/30 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
            <Scale className="w-4 h-4" />
            <span className="text-[11px] font-extrabold uppercase tracking-wide">
              {t.totalKgSold}
            </span>
          </div>
          <div className="text-xl font-black text-gray-900 tracking-tight">
            {overallTotalKg.toFixed(3)}
            <span className="text-xs font-bold text-emerald-700 ml-1">
              {language === 'ta' ? 'கிலோ' : 'KG'}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 font-medium mt-1">
            {relevantBills.length} {language === 'ta' ? 'பில்கள்' : 'bills'}
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-emerald-700 text-white rounded-2xl p-4 shadow-md border border-emerald-800 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-emerald-200 mb-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-[11px] font-extrabold uppercase tracking-wide">
              {t.totalRevenue}
            </span>
          </div>
          <div className="text-xl font-black text-white tracking-tight">
            ₹ {overallTotalAmount.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-100 font-medium mt-1">
            {t.totalRevenue}
          </div>
        </div>
      </div>

      {/* Product-wise Totals Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
            {t.productWiseReport}
          </span>
          <span className="text-[11px] font-bold text-emerald-700">
            {products.length} {t.products}
          </span>
        </div>

        {productTotals.map((prod, idx) => {
          const hasSales = prod.totalKg > 0;
          const displayTitle = prod.product ? getProductName(prod.product, language) : prod.name;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-3.5 shadow-sm border transition-all ${
                hasSales
                  ? 'border-emerald-300 hover:border-emerald-500'
                  : 'border-emerald-100 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-bold text-gray-900 text-sm truncate max-w-[180px]">
                  {displayTitle}
                </div>
                <div className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                  ₹ {prod.totalAmount.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 pt-1 border-t border-gray-100">
                <span className="flex items-center gap-1 font-semibold text-gray-800">
                  <Scale className="w-3.5 h-3.5 text-emerald-700" />
                  {prod.totalKg.toFixed(3)} {language === 'ta' ? 'கிலோ' : 'KG sold'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {prod.billsCount} {language === 'ta' ? 'விற்பனை' : prod.billsCount === 1 ? 'sale' : 'sales'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
