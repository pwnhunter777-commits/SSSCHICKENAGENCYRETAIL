import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  Phone,
  ListChecks,
} from 'lucide-react';
import { Bill, ShopSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { printBillViaBluetooth, formatBillReceiptText } from '../utils/bluetoothPrinter';

interface ReceiptModalProps {
  bill: Bill | null;
  settings: ShopSettings;
  language: Language;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  bill,
  settings,
  language,
  onClose,
}) => {
  const [printing, setPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!bill) return null;

  const handleBluetoothPrint = async () => {
    setPrinting(true);
    setStatusMessage(null);
    try {
      const result = await printBillViaBluetooth(bill, settings, language);
      setStatusMessage(result.message);
    } catch (e: any) {
      setStatusMessage(e?.message || 'Bluetooth printing failed');
    } finally {
      setPrinting(false);
    }
  };

  const handleSystemPrint = () => {
    window.print();
  };

  const handleCopyReceipt = () => {
    const text = formatBillReceiptText(bill, settings, language);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      {/* Outer Big Box Dialog Matching Design */}
      <div className="relative w-full max-w-4xl my-auto animate-in zoom-in-95">
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3.5 -right-2.5 z-20 w-9 h-9 rounded-full bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* The Big Box Bill Container */}
        <div className="bg-white rounded-[24px] sm:rounded-[32px] border-[3px] sm:border-[3.5px] border-black shadow-2xl p-3.5 sm:p-6 md:p-7 flex flex-col select-none">
          {/* Printable Receipt Section */}
          <div id="printable-receipt" className="flex flex-col w-full bg-white">
            {/* Top Header */}
            <div className="flex items-center gap-3 sm:gap-5 pb-2.5 sm:pb-3 border-b-2 border-[#0e4e2d]">
              {/* Logo in rounded badge with green border */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-emerald-600 p-1 shrink-0 flex items-center justify-center shadow-xs overflow-hidden">
                <img
                  src={settings.logoUrl || '/logo.png'}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Shop Title, Address & Meta Details */}
              <div className="flex-1 text-center min-w-0">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-black uppercase text-slate-950 tracking-wide leading-none">
                  {settings.shopName || 'SSS CHICKEN AGENCY'}
                </h1>
                {settings.address && (
                  <p className="text-[9.5px] sm:text-xs font-black text-slate-800 uppercase tracking-tight mt-1 leading-snug">
                    {settings.address}
                  </p>
                )}
                <div className="flex items-center justify-center flex-wrap gap-x-2 sm:gap-x-3 text-[9.5px] sm:text-xs font-bold text-slate-900 mt-1">
                  {settings.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                      <span>Ph: {settings.phoneNumber}</span>
                    </span>
                  )}
                  {settings.phoneNumber && <span className="text-slate-400">|</span>}
                  {settings.gstNumber && (
                    <>
                      <span className="text-[#0d733a] font-black">GST: {settings.gstNumber}</span>
                      <span className="text-slate-400">|</span>
                    </>
                  )}
                  <span className="font-bold">Bill #{bill.billNumber}</span>
                  <span className="text-slate-400">|</span>
                  <span>{bill.date} {bill.time || ''}</span>
                </div>
              </div>
            </div>

            {/* Main Section: Left (item list) & Right (total amount) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-stretch mt-3 sm:mt-4">
              {/* Left Column Box: "item list" */}
              <div className="md:col-span-7 flex flex-col justify-between border-2 border-[#0e4e2d] rounded-2xl overflow-hidden bg-white shadow-xs">
                <div>
                  {/* Green Header Bar */}
                  <div className="bg-[#0e4e2d] text-white px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-white shrink-0" />
                    <span className="font-black text-base sm:text-xl tracking-wide lowercase">item list</span>
                  </div>

                  {/* Column Subheader Bar */}
                  <div className="bg-[#e2f0e7] grid grid-cols-12 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-black text-[#0e4e2d] uppercase tracking-wider border-b border-[#c6e2d0]">
                    <span className="col-span-5">ITEM</span>
                    <span className="col-span-2 text-center">QTY</span>
                    <span className="col-span-2 text-right">RATE</span>
                    <span className="col-span-3 text-right">AMOUNT</span>
                  </div>

                  {/* Items List Rows */}
                  <div className="divide-y divide-slate-100 px-3 sm:px-4 py-1 bg-white overflow-y-auto max-h-[190px]">
                    {bill.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center py-2 text-xs sm:text-sm">
                        <div className="col-span-5 pr-1">
                          <div className="font-black text-slate-900 leading-tight">
                            {idx + 1}. {item.productName}
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                            {item.kg.toFixed(2)} kg x Rs.{item.pricePerKg}
                          </div>
                        </div>
                        <div className="col-span-2 text-center font-black text-slate-800">
                          1
                        </div>
                        <div className="col-span-2 text-right font-bold text-slate-700">
                          ₹{item.pricePerKg}
                        </div>
                        <div className="col-span-3 text-right font-black text-slate-950 text-sm sm:text-base">
                          ₹{Math.round(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer of Left Box */}
                <div className="bg-[#e2f0e7] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-black text-[#0e4e2d] uppercase border-t border-[#c6e2d0] flex items-center justify-between">
                  <span>TOTAL ITEMS: {bill.items.length}</span>
                  {bill.hotelName && <span className="text-slate-700">HOTEL: {bill.hotelName}</span>}
                </div>
              </div>

              {/* Right Column Box: "total amount" */}
              <div className="md:col-span-5 flex flex-col justify-between border-2 border-slate-700 rounded-2xl p-3.5 sm:p-4 bg-white shadow-xs gap-2.5 sm:gap-3">
                {/* Header Title */}
                <h3 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight lowercase">
                  total amount
                </h3>

                {/* KG Highlight Box */}
                <div className="bg-[#f0f9f4] border border-[#d2ecdc] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-baseline justify-between">
                  <span className="text-base sm:text-xl font-bold text-slate-900">
                    kg :
                  </span>
                  <span className="text-2xl sm:text-4xl font-black text-slate-950">
                    {bill.totalKg.toFixed(2)}kg
                  </span>
                </div>

                {/* Price Highlight Box */}
                <div className="bg-[#f0f9f4] border border-[#d2ecdc] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-baseline justify-between">
                  <span className="text-base sm:text-xl font-bold text-slate-900">
                    price :
                  </span>
                  <span className="text-3xl sm:text-5xl font-black text-[#0d733a]">
                    ₹ {Math.round(bill.totalAmount)}
                  </span>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-slate-400 my-0.5" />

                {/* UPI & Store Footer */}
                <div className="text-center space-y-0.5">
                  {settings.upiId ? (
                    <div className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-tight">
                      UPI: {settings.upiId}
                    </div>
                  ) : (
                    <div className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-tight">
                      Cash / Paid
                    </div>
                  )}
                  <div className="text-[11px] sm:text-xs font-bold text-[#0d733a] italic">
                    Thank You! Visit Again
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Full-Width Banner: "TOTAL : RS. XXX" with Dot Grids */}
            <div className="bg-[#0e4e2d] rounded-2xl p-3 sm:p-4 text-white flex items-center justify-between shadow-xs mt-3 sm:mt-4">
              {/* Left 3x4 Dot Grid */}
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 opacity-60">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-200" />
                ))}
              </div>

              {/* Center Total Display */}
              <div className="text-center font-black text-2xl sm:text-4xl md:text-5xl tracking-wider uppercase text-white">
                TOTAL : RS. {Math.round(bill.totalAmount)}
              </div>

              {/* Right 3x4 Dot Grid */}
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 opacity-60">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-200" />
                ))}
              </div>
            </div>
          </div>

          {/* Action Status Feedback */}
          {statusMessage && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-1.5 w-full no-print">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Buttons inside the Box */}
          <div className="grid grid-cols-2 gap-3 mt-3.5 sm:mt-4 w-full pt-1 no-print">
            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={printing}
              className="bg-[#f1f5f9] hover:bg-slate-200 text-slate-900 font-bold py-3 px-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>{printing ? t.connecting : 'Print via Bluetooth'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="bg-[#f1f5f9] hover:bg-slate-200 text-slate-900 font-bold py-3 px-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer text-xs sm:text-sm"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-700" />
              )}
              <span>{copied ? t.copied : 'Copy Text'}</span>
            </button>
          </div>

          {/* System Print Secondary Option */}
          <div className="mt-2 text-center no-print">
            <button
              type="button"
              onClick={handleSystemPrint}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Print with System Dialog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


