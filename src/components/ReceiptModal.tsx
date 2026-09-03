import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  Phone,
  ListChecks,
  Edit2,
  Save,
} from 'lucide-react';
import { Bill, ShopSettings, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { printBillViaBluetooth, formatBillReceiptText } from '../utils/bluetoothPrinter';
import { updateBill, loadHotels } from '../utils/storage';

interface ReceiptModalProps {
  bill: Bill | null;
  settings: ShopSettings;
  language: Language;
  onClose: () => void;
  onBillUpdated?: (updatedBill: Bill) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  bill: initialBill,
  settings,
  language,
  onClose,
  onBillUpdated,
}) => {
  const [bill, setBill] = useState<Bill | null>(initialBill);
  const [printing, setPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingHotel, setIsEditingHotel] = useState(false);
  const [editHotelName, setEditHotelName] = useState(initialBill?.hotelName || '');
  const [editHotelPhone, setEditHotelPhone] = useState(initialBill?.hotelPhone || settings.phoneNumber || '');

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const hotelList = loadHotels();

  if (!bill) return null;

  const handleSaveHotelInfo = () => {
    const updated: Bill = {
      ...bill,
      hotelName: editHotelName.trim() || undefined,
      hotelPhone: editHotelPhone.trim() || undefined,
    };
    setBill(updated);
    updateBill(updated);
    if (onBillUpdated) onBillUpdated(updated);
    setIsEditingHotel(false);
    setStatusMessage('Hotel info updated');
    setTimeout(() => setStatusMessage(null), 2000);
  };

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

  const displayHotelName = bill.hotelName || settings.shopName || 'HOTEL & CHICKEN AGENCY';
  const displayPhone = bill.hotelPhone || settings.phoneNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      {/* Outer Modal Frame */}
      <div className="relative w-full max-w-4xl my-auto animate-in zoom-in-95 flex flex-col items-center">
        {/* Top Control Bar with Badge and Close */}
        <div className="w-full max-w-[17cm] flex items-center justify-between mb-2 px-1 text-white no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black bg-emerald-700 px-3 py-1 rounded-full text-white tracking-wide border border-emerald-500">
              17cm × 7cm Bill
            </span>
            <span className="text-xs text-slate-300 font-semibold">
              Bill #{bill.billNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingHotel(!isEditingHotel)}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20 cursor-pointer active:scale-95 transition-all"
            >
              <Edit2 className="w-3 h-3 text-emerald-300" />
              <span>{isEditingHotel ? 'Cancel Edit' : 'Edit Hotel / Phone'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hotel & Phone Editor Card (Shown when user clicks Edit Hotel) */}
        {isEditingHotel && (
          <div className="w-full max-w-[17cm] bg-slate-900 border border-emerald-500/50 p-3 sm:p-4 rounded-2xl mb-3 text-white shadow-xl no-print animate-in slide-in-from-top-2">
            <div className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-2">
              Edit Hotel Name & Phone for this Bill
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-0.5">
                  Hotel Name:
                </label>
                <input
                  type="text"
                  value={editHotelName}
                  onChange={(e) => setEditHotelName(e.target.value)}
                  placeholder="e.g. Hotel Ananda Bhavan"
                  list="hotel-modal-suggestions"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-400"
                />
                <datalist id="hotel-modal-suggestions">
                  {hotelList.map((h, i) => (
                    <option key={i} value={h} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-0.5">
                  Phone Number:
                </label>
                <input
                  type="text"
                  value={editHotelPhone}
                  onChange={(e) => setEditHotelPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-emerald-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2.5">
              <button
                type="button"
                onClick={handleSaveHotelInfo}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Bill</span>
              </button>
            </div>
          </div>
        )}

        {/* 17cm × 7cm Bill Outer Presentation Box */}
        <div className="w-full max-w-[17cm] bg-white rounded-2xl shadow-2xl overflow-hidden p-2 sm:p-3">
          {/* THE 17CM × 7CM PRINTABLE RECEIPT */}
          <div
            id="printable-receipt"
            className="w-full bg-white rounded-xl border-2 border-black overflow-hidden relative flex flex-col justify-between"
            style={{
              aspectRatio: '17 / 7',
              width: '100%',
              padding: '2% 2.5% 1.8% 2.5%',
              boxSizing: 'border-box',
            }}
          >
            {/* TOP HEADER: Hotel Name & Phone Number */}
            <div className="flex items-center gap-2 sm:gap-3 pb-[1%] border-b-2 border-black">
              {/* Logo / Badge */}
              <div className="w-[clamp(28px,3.8vw,46px)] h-[clamp(28px,3.8vw,46px)] rounded-xl bg-white border border-emerald-600 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={settings.logoUrl || '/logo.png'}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Hotel Name & Phone & Metadata */}
              <div className="flex-1 text-center min-w-0 px-1">
                {/* Hotel Name Prominent at Top */}
                <h1 className="text-[clamp(13px,2.2vw,24px)] font-black uppercase text-slate-950 tracking-wide leading-tight truncate">
                  {displayHotelName}
                </h1>
                
                {/* Secondary Shop Name attribution if bill has a specific hotel name */}
                {bill.hotelName && settings.shopName && (
                  <p className="text-[clamp(7.5px,1vw,11.5px)] font-bold text-slate-700 uppercase tracking-tight leading-none">
                    Supplied by: {settings.shopName}
                  </p>
                )}

                {/* Phone Number & Bill Meta Row */}
                <div className="flex items-center justify-center flex-wrap gap-x-2 sm:gap-x-3 text-[clamp(8px,1.05vw,12px)] font-bold text-slate-900 mt-[0.3%]">
                  {displayPhone && (
                    <span className="flex items-center gap-1 font-extrabold text-slate-950">
                      <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-700 fill-emerald-700 shrink-0" />
                      <span>Ph: {displayPhone}</span>
                    </span>
                  )}
                  {displayPhone && <span className="text-slate-400 font-normal">|</span>}
                  {settings.gstNumber && (
                    <>
                      <span className="text-[#0d733a] font-extrabold">GST: {settings.gstNumber}</span>
                      <span className="text-slate-400 font-normal">|</span>
                    </>
                  )}
                  <span className="font-extrabold">Bill #{bill.billNumber}</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span>{bill.date} {bill.time || ''}</span>
                </div>
              </div>
            </div>

            {/* MAIN BODY: Left Side (The Item) & Right Side (The Total) */}
            <div className="grid grid-cols-12 gap-[2%] flex-1 items-stretch pt-[1.2%] overflow-hidden">
              {/* LEFT SIDE: The Item List Box */}
              <div className="col-span-6 md:col-span-7 flex flex-col justify-between border-2 border-[#0e4e2d] rounded-lg sm:rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Green Header Bar */}
                  <div className="bg-[#0e4e2d] text-white px-2 py-0.5 sm:px-2.5 sm:py-1 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1">
                      <ListChecks className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <span className="font-black text-[clamp(9.5px,1.25vw,14px)] tracking-wide lowercase">
                        item list
                      </span>
                    </div>
                    <span className="text-[clamp(7.5px,0.95vw,11px)] font-bold text-emerald-200">
                      Items: {bill.items.length}
                    </span>
                  </div>

                  {/* Table Column Headers */}
                  <div className="bg-[#e2f0e7] grid grid-cols-12 px-2 py-0.5 text-[clamp(8px,1vw,11px)] font-black text-[#0e4e2d] uppercase tracking-wider border-b border-[#c6e2d0] shrink-0">
                    <span className="col-span-5">ITEM</span>
                    <span className="col-span-2 text-center">QTY</span>
                    <span className="col-span-2 text-right">RATE</span>
                    <span className="col-span-3 text-right">AMOUNT</span>
                  </div>

                  {/* Items Rows */}
                  <div className="divide-y divide-slate-100 px-2 py-0.5 flex-1 overflow-hidden flex flex-col justify-around">
                    {bill.items.slice(0, 4).map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 items-center py-[0.5%] text-[clamp(8px,1.1vw,12.5px)] font-bold leading-tight"
                      >
                        <div className="col-span-5 pr-0.5 truncate">
                          <span className="font-black text-slate-950">
                            {idx + 1}. {item.productName}
                          </span>
                          <div className="text-[clamp(7px,0.9vw,10px)] text-slate-500 font-semibold leading-none truncate">
                            {item.kg.toFixed(2)} kg x Rs.{item.pricePerKg}
                          </div>
                        </div>
                        <div className="col-span-2 text-center font-black text-slate-800">
                          1
                        </div>
                        <div className="col-span-2 text-right font-bold text-slate-700">
                          ₹{item.pricePerKg}
                        </div>
                        <div className="col-span-3 text-right font-black text-slate-950 text-[clamp(9px,1.2vw,14px)]">
                          ₹{Math.round(item.amount)}
                        </div>
                      </div>
                    ))}
                    {bill.items.length > 4 && (
                      <div className="text-center text-[clamp(7px,0.85vw,9.5px)] font-bold text-[#0e4e2d]">
                        + {bill.items.length - 4} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer of Left Item Box */}
                <div className="bg-[#e2f0e7] px-2 py-0.5 text-[clamp(7.5px,0.95vw,11px)] font-black text-[#0e4e2d] uppercase border-t border-[#c6e2d0] flex items-center justify-between shrink-0">
                  <span>TOTAL ITEMS: {bill.items.length}</span>
                  {bill.hotelName && (
                    <span className="truncate max-w-[50%] font-bold text-slate-700">
                      HOTEL: {bill.hotelName}
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: The Total Box */}
              <div className="col-span-6 md:col-span-5 flex flex-col justify-between border-2 border-black/80 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 bg-white shadow-2xs gap-[2%]">
                {/* Header Title */}
                <div className="flex items-center justify-between pb-[1%] border-b border-slate-200 shrink-0">
                  <h3 className="font-black text-[clamp(10px,1.35vw,16px)] text-slate-950 tracking-tight lowercase">
                    total amount
                  </h3>
                  <span className="text-[clamp(7.5px,0.9vw,10.5px)] font-bold text-slate-600">
                    Cash / Paid
                  </span>
                </div>

                {/* KG Highlight Box */}
                <div className="bg-[#f0f9f4] border border-[#d2ecdc] rounded-md sm:rounded-lg px-2 py-1 flex items-baseline justify-between my-auto">
                  <span className="text-[clamp(10px,1.3vw,15px)] font-bold text-slate-800">
                    kg :
                  </span>
                  <span className="text-[clamp(13px,1.9vw,22px)] font-black text-slate-950">
                    {bill.totalKg.toFixed(2)}kg
                  </span>
                </div>

                {/* Price Highlight Box */}
                <div className="bg-[#f0f9f4] border border-[#d2ecdc] rounded-md sm:rounded-lg px-2 py-1 flex items-baseline justify-between my-auto">
                  <span className="text-[clamp(10px,1.3vw,15px)] font-bold text-slate-800">
                    price :
                  </span>
                  <span className="text-[clamp(15px,2.4vw,28px)] font-black text-[#0d733a]">
                    ₹ {Math.round(bill.totalAmount)}
                  </span>
                </div>

                {/* Bottom Total Banner */}
                <div className="bg-[#0e4e2d] text-white rounded-md sm:rounded-lg py-1 px-2 text-center font-black text-[clamp(11px,1.55vw,18px)] tracking-wider uppercase shadow-2xs shrink-0">
                  TOTAL : RS. {Math.round(bill.totalAmount)}
                </div>

                {/* Footer: UPI & Visit Again */}
                <div className="flex items-center justify-between text-[clamp(7px,0.85vw,10px)] text-slate-600 font-semibold pt-[0.8%] border-t border-dashed border-slate-300 shrink-0">
                  {settings.upiId ? (
                    <span className="truncate max-w-[60%] font-bold text-slate-900">
                      UPI: {settings.upiId}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900">Paid Bill</span>
                  )}
                  <span className="italic font-bold text-[#0d733a] shrink-0 ml-1">
                    Thank You! Visit Again
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Status Feedback */}
        {statusMessage && (
          <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-100 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-1.5 w-full max-w-[17cm] no-print">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Modal Action Buttons at Bottom */}
        <div className="w-full max-w-[17cm] grid grid-cols-2 gap-2 sm:gap-3 mt-3 no-print">
          <button
            type="button"
            onClick={handleBluetoothPrint}
            disabled={printing}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer text-xs sm:text-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>{printing ? t.connecting : 'Print via Bluetooth'}</span>
          </button>
          <button
            type="button"
            onClick={handleSystemPrint}
            className="bg-white hover:bg-slate-100 text-slate-900 font-black py-3 px-3 rounded-2xl border border-slate-300 flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer text-xs sm:text-sm"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Print 17cm × 7cm</span>
          </button>
        </div>

        <div className="w-full max-w-[17cm] flex items-center justify-between mt-2 px-2 no-print">
          <button
            type="button"
            onClick={handleCopyReceipt}
            className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{copied ? t.copied : 'Copy Receipt Text'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};



