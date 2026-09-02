import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  Bluetooth,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] overflow-hidden animate-in zoom-in-95 my-auto">
        {/* Modal Header */}
        <div className="bg-[#0f3d2e] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700/80 flex items-center justify-center text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Bill #{bill.billNumber}
              </h3>
              <span className="text-[11px] text-emerald-300 font-semibold">
                {bill.date} {bill.time || ''} • 17cm × 7cm Box Bill
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-800 flex items-center justify-center text-white active:scale-95 transition-all ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - 17cm Width × 7cm Height Big Box View */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-100/80 flex-1 flex flex-col items-center justify-center">
          <div className="w-full flex flex-col items-center max-w-4xl lg:max-w-5xl">
            {/* The Full Bill in a Big Box */}
            <div
              id="printable-receipt"
              className="w-full bg-white rounded-xl sm:rounded-2xl shadow-xl border-2 sm:border-[3px] border-black overflow-hidden relative"
              style={{
                aspectRatio: '17 / 7',
                width: '100%',
              }}
            >
              <div className="w-full h-full flex flex-col p-[2.2%] text-slate-900 justify-between select-none">
                {/* Top Header Box: Shop Name & Details */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 pt-[0.2%] pb-[0.8%] border-b-2 border-black/80">
                  <div className="w-[clamp(28px,4vw,52px)] h-[clamp(28px,4vw,52px)] rounded-xl bg-white border-2 border-emerald-600 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                    <img
                      src={settings.logoUrl || '/logo.png'}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-center min-w-0 flex-1 px-1">
                    <h1 className="text-[clamp(15px,2.8vw,34px)] font-black tracking-wide uppercase text-slate-950 leading-tight">
                      {settings.shopName || 'SSS CHICKEN AGENCY'}
                    </h1>
                    {settings.address && (
                      <p className="text-[clamp(8px,1.2vw,14px)] text-slate-700 font-bold leading-tight mt-[0.2%] uppercase">
                        {settings.address}
                      </p>
                    )}
                    <div className="flex items-center justify-center flex-wrap gap-x-3 text-[clamp(8px,1.1vw,13px)] text-slate-800 font-bold mt-[0.2%]">
                      {settings.phoneNumber && <span>Ph: {settings.phoneNumber}</span>}
                      {settings.gstNumber && <span className="text-emerald-900">GST: {settings.gstNumber}</span>}
                      <span>Bill #{bill.billNumber}</span>
                      <span>{bill.date} {bill.time || ''}</span>
                    </div>
                  </div>
                </div>

                {/* Main Grid: Left Box (Items List) + Right Box (Big Total Amount) */}
                <div className="grid grid-cols-12 gap-[2%] flex-1 items-stretch py-[1%]">
                  {/* Left Box: Green Item List Box with crisp border */}
                  <div className="col-span-6 bg-[#48bb17] rounded-[12px] sm:rounded-[16px] border-2 border-black p-[2.8%] flex flex-col justify-between text-slate-900 shadow-sm overflow-hidden">
                    <div>
                      <h2 className="text-[clamp(13px,2.2vw,24px)] font-black text-[#0a2205] tracking-tight leading-none mb-[2%]">
                        {t.itemList}
                      </h2>
                      {/* Items Table */}
                      <div className="space-y-[1.6%]">
                        {bill.items.slice(0, 5).map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-md sm:rounded-lg px-[3%] py-[1.8%] flex items-center justify-between text-[clamp(9.5px,1.35vw,15px)] font-bold text-slate-900 shadow-2xs border border-emerald-800/20"
                          >
                            <span className="truncate max-w-[42%] font-extrabold">
                              {item.productName}
                            </span>
                            <span className="text-slate-800">
                              {item.kg.toFixed(2)} kg
                            </span>
                            <span className="text-slate-600 font-semibold">
                              ₹{item.pricePerKg}
                            </span>
                            <span className="font-black text-emerald-950 text-[clamp(10px,1.45vw,16px)]">
                              ₹{Math.round(item.amount)}
                            </span>
                          </div>
                        ))}
                        {bill.items.length > 5 && (
                          <div className="text-center text-[clamp(8px,1vw,12px)] font-bold text-[#0a2205] pt-0.5">
                            + {bill.items.length - 5} more item(s)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Item count bottom hint */}
                    <div className="text-[clamp(8.5px,1vw,12px)] font-bold text-[#0a2205] flex items-center justify-between pt-0.5 border-t border-[#389e0f]/60">
                      <span>{t.totalItems}: {bill.items.length}</span>
                      {bill.hotelName && <span>Hotel: {bill.hotelName}</span>}
                    </div>
                  </div>

                  {/* Right Box: Big Total Amount, Total KG & Price with crisp border */}
                  <div className="col-span-6 bg-slate-50/90 rounded-[12px] sm:rounded-[16px] border-2 border-black p-[2.8%] flex flex-col justify-between shadow-sm overflow-hidden">
                    {/* Top: total amount */}
                    <div>
                      <h3 className="text-[clamp(15px,2.6vw,32px)] font-black text-slate-950 tracking-tight leading-none">
                        {t.totalAmountHeader}
                      </h3>
                      <div className="h-[2px] bg-black/80 w-full mt-[1.5%]" />
                    </div>

                    {/* Middle: kg : 5kg in bold display size */}
                    <div className="flex items-baseline gap-[3%] text-slate-900 my-auto bg-white/80 p-[2%] rounded-lg border border-slate-200">
                      <span className="text-[clamp(13px,2.3vw,26px)] font-bold text-slate-800">
                        {t.kgLabel}
                      </span>
                      <span className="text-[clamp(16px,3.1vw,38px)] font-black text-slate-950">
                        {bill.totalKg.toFixed(2)}kg
                      </span>
                    </div>

                    {/* Bottom: price : ₹ 1000 in BIG BOLD SIZE */}
                    <div className="flex items-baseline gap-[3%] text-slate-900 bg-emerald-50/80 p-[2%] rounded-lg border border-emerald-200">
                      <span className="text-[clamp(13px,2.3vw,26px)] font-bold text-slate-800">
                        {t.priceLabel}
                      </span>
                      <span className="text-[clamp(18px,3.8vw,48px)] font-black text-emerald-900">
                        ₹ {Math.round(bill.totalAmount)}
                      </span>
                    </div>

                    {/* Footer UPI / Thank you */}
                    <div className="text-[clamp(8px,1vw,12px)] text-slate-600 font-semibold flex items-center justify-between pt-[1.2%] border-t border-slate-300">
                      {settings.upiId ? (
                        <span className="truncate max-w-[65%] font-bold text-slate-800">UPI: {settings.upiId}</span>
                      ) : (
                        <span className="font-bold text-slate-800">Cash / Paid</span>
                      )}
                      <span className="italic font-bold text-slate-500 shrink-0 ml-1">
                        {t.thankYou}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="mt-3.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-1.5 max-w-md w-full">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Action Buttons - Primary Bluetooth Print & Secondary Print/Copy */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5 shrink-0">
          {/* Main Primary Bluetooth Print Button */}
          <button
            type="button"
            onClick={handleBluetoothPrint}
            disabled={printing}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all disabled:opacity-50 text-sm sm:text-base cursor-pointer"
          >
            <Bluetooth className="w-5 h-5 text-white animate-pulse" />
            <span>{printing ? t.connecting : t.printBluetooth}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSystemPrint}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{t.systemPrint}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>{copied ? t.copied : t.copyText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

