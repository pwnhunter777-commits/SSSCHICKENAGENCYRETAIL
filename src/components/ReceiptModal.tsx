import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  Bluetooth,
  FileImage,
  Receipt,
  Sparkles,
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
  const [viewFormat, setViewFormat] = useState<'banner' | 'thermal'>('banner');
  const [printing, setPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Generate 2008 × 827 Canvas
  const drawBillCanvas = useCallback(() => {
    if (!bill) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 2008;
    canvas.height = 827;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 2008, 827);

    // Subtle outer border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 1988, 807);

    // 2. Company Name (Top Center)
    const companyName = (settings.shopName || 'FRESH CHICKEN CENTER').toUpperCase();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Main Company Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 56px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(companyName, 1004, 38);

    // Sub-header (Address, Phone, Bill Info)
    const subDetails: string[] = [];
    if (settings.address) subDetails.push(settings.address);
    if (settings.phoneNumber) subDetails.push(`Ph: ${settings.phoneNumber}`);
    if (bill.billNumber) subDetails.push(`Bill #${bill.billNumber}`);
    if (bill.date) subDetails.push(`${bill.date} ${bill.time || ''}`);
    if (subDetails.length > 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '500 24px "Inter", system-ui, sans-serif';
      ctx.fillText(subDetails.join('   •   '), 1004, 105);
    }

    // 3. Left Section: Green Rectangle ("item list")
    // Layout coordinates: x: 60, y: 155, width: 880, height: 620
    const greenX = 60;
    const greenY = 155;
    const greenWidth = 880;
    const greenHeight = 620;
    const radius = 24;

    // Draw rounded green container
    ctx.fillStyle = '#60cf3a'; // Vibrant green
    ctx.beginPath();
    ctx.moveTo(greenX + radius, greenY);
    ctx.lineTo(greenX + greenWidth - radius, greenY);
    ctx.quadraticCurveTo(greenX + greenWidth, greenY, greenX + greenWidth, greenY + radius);
    ctx.lineTo(greenX + greenWidth, greenY + greenHeight - radius);
    ctx.quadraticCurveTo(
      greenX + greenWidth,
      greenY + greenHeight,
      greenX + greenWidth - radius,
      greenY + greenHeight
    );
    ctx.lineTo(greenX + radius, greenY + greenHeight);
    ctx.quadraticCurveTo(greenX, greenY + greenHeight, greenX, greenY + greenHeight - radius);
    ctx.lineTo(greenX, greenY + radius);
    ctx.quadraticCurveTo(greenX, greenY, greenX + radius, greenY);
    ctx.closePath();
    ctx.fill();

    // "item list" Header
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f2409';
    ctx.font = '900 46px "Inter", system-ui, sans-serif';
    ctx.fillText(t.itemList, greenX + 40, greenY + 36);

    // Table header inside green box
    ctx.fillStyle = '#143c0e';
    ctx.font = '700 22px "Inter", system-ui, sans-serif';
    ctx.fillText(t.itemCol, greenX + 40, greenY + 105);
    ctx.textAlign = 'right';
    ctx.fillText(t.weightCol, greenX + greenWidth - 360, greenY + 105);
    ctx.fillText(t.rateCol, greenX + greenWidth - 210, greenY + 105);
    ctx.fillText(t.priceCol, greenX + greenWidth - 40, greenY + 105);

    // Separator line
    ctx.strokeStyle = '#4cb826';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(greenX + 40, greenY + 135);
    ctx.lineTo(greenX + greenWidth - 40, greenY + 135);
    ctx.stroke();

    // Item List Rows
    let rowY = greenY + 160;
    const maxRows = Math.min(bill.items.length, 7);
    bill.items.slice(0, maxRows).forEach((item, index) => {
      // Row Card Background (subtle white frosted)
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.78)';
      const cardH = 54;
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(greenX + 30, rowY - 6, greenWidth - 60, cardH, 12);
      } else {
        ctx.rect(greenX + 30, rowY - 6, greenWidth - 60, cardH);
      }
      ctx.fill();

      // Product Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 24px "Inter", system-ui, sans-serif';
      const displayName =
        item.productName.length > 18
          ? item.productName.substring(0, 16) + '..'
          : item.productName;
      ctx.fillText(displayName, greenX + 45, rowY + 6);

      // Weight
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 24px "Inter", system-ui, sans-serif';
      ctx.fillText(`${item.kg.toFixed(2)} kg`, greenX + greenWidth - 360, rowY + 6);

      // Rate
      ctx.fillStyle = '#475569';
      ctx.font = '600 22px "Inter", system-ui, sans-serif';
      ctx.fillText(`₹${item.pricePerKg}`, greenX + greenWidth - 210, rowY + 6);

      // Price
      ctx.fillStyle = '#0f5132';
      ctx.font = '800 26px "Inter", system-ui, sans-serif';
      ctx.fillText(`₹${Math.round(item.amount)}`, greenX + greenWidth - 45, rowY + 6);

      rowY += 62;
    });

    if (bill.items.length > 7) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f2409';
      ctx.font = '700 20px "Inter", system-ui, sans-serif';
      ctx.fillText(`+ ${bill.items.length - 7} more items`, greenX + greenWidth / 2, rowY + 10);
    }

    // 4. Right Section: Total Amount, KG, Price
    const rightX = 1040;
    const rightWidth = 900;

    // Top: total amount
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 64px "Inter", system-ui, sans-serif';
    ctx.fillText(t.totalAmountHeader, rightX + 60, 205);

    // Thin accent divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightX + 60, 290);
    ctx.lineTo(rightX + rightWidth - 60, 290);
    ctx.stroke();

    // Middle: kg : 5kg
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 60px "Inter", system-ui, sans-serif';
    ctx.fillText(t.kgLabel, rightX + 60, 395);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 68px "Inter", system-ui, sans-serif';
    ctx.fillText(`${bill.totalKg.toFixed(2)}kg`, rightX + 320, 395);

    // Bottom: price : 1000
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 60px "Inter", system-ui, sans-serif';
    ctx.fillText(t.priceLabel, rightX + 60, 595);
    ctx.fillStyle = '#0f5132';
    ctx.font = '900 78px "Inter", system-ui, sans-serif';
    ctx.fillText(`₹ ${Math.round(bill.totalAmount)}`, rightX + 320, 595);

    // Footer info on bottom-right (UPI or Thank You)
    if (settings.upiId) {
      ctx.fillStyle = '#64748b';
      ctx.font = '600 24px "Inter", system-ui, sans-serif';
      ctx.fillText(`UPI: ${settings.upiId}`, rightX + 60, 715);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 24px "Inter", system-ui, sans-serif';
    ctx.fillText(t.thankYou, rightX + rightWidth - 60, 715);
  }, [bill, settings, t]);

  useEffect(() => {
    drawBillCanvas();
  }, [drawBillCanvas]);

  if (!bill) return null;

  // Download high-resolution 2008 × 827 image
  const handleDownload2008x827 = () => {
    setDownloading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        drawBillCanvas();
      }
      const activeCanvas = canvasRef.current;
      if (activeCanvas) {
        const url = activeCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Bill_${bill.billNumber}_2008x827.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatusMessage('2008 × 827 Bill image downloaded!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (e: any) {
      setStatusMessage('Failed to download image: ' + (e?.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      {/* Hidden 2008 × 827 Canvas for high-res rendering and export */}
      <canvas
        ref={canvasRef}
        width={2008}
        height={827}
        className="hidden"
      />

      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 my-auto">
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
                Size: 2008 × 827 px format
              </span>
            </div>
          </div>

          {/* Format Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#09261c] p-1 rounded-xl border border-emerald-800">
            <button
              type="button"
              onClick={() => setViewFormat('banner')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewFormat === 'banner'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>{t.banner2008}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewFormat('thermal')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewFormat === 'thermal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t.thermalTape}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-800 flex items-center justify-center text-white active:scale-95 transition-all ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/70 flex-1 flex flex-col items-center justify-center">
          {viewFormat === 'banner' ? (
            /* 2008 × 827 Responsive Bill Display */
            <div className="w-full flex flex-col items-center">
              <div
                id="printable-receipt"
                className="w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden relative"
                style={{
                  aspectRatio: '2008 / 827',
                  maxWidth: '100%',
                }}
              >
                <div className="w-full h-full flex flex-col p-[2.5%] text-slate-900 justify-between select-none">
                  {/* Top Company Name Header with Mascot Logo */}
                  <div className="flex items-center justify-center gap-3 pt-[0.5%] pb-[1%] border-b border-slate-100">
                    <div className="w-[clamp(28px,4.5vw,52px)] h-[clamp(28px,4.5vw,52px)] rounded-full bg-white border-2 border-emerald-400 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                      <img
                        src={settings.logoUrl || '/logo.png'}
                        alt="Logo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <h1 className="text-[clamp(14px,3.2vw,36px)] font-black tracking-wide uppercase text-slate-900 leading-none">
                        {settings.shopName || 'FRESH CHICKEN CENTER'}
                      </h1>
                      {(settings.address || settings.phoneNumber || bill.billNumber) && (
                        <p className="text-[clamp(9px,1.3vw,16px)] text-slate-500 font-medium mt-[0.6%] truncate">
                          {[
                            settings.address,
                            settings.phoneNumber ? `Ph: ${settings.phoneNumber}` : null,
                            `Bill #${bill.billNumber}`,
                            `${bill.date} ${bill.time || ''}`,
                          ]
                            .filter(Boolean)
                            .join('   •   ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Main Grid: Left Green 'item list' + Right 'total amount / kg / price' */}
                  <div className="grid grid-cols-12 gap-[3%] flex-1 items-stretch py-[1.5%]">
                    {/* Left: Green Item List Box */}
                    <div className="col-span-6 bg-[#60cf3a] rounded-[16px] sm:rounded-[22px] p-[3.5%] flex flex-col justify-between text-slate-900 shadow-sm overflow-hidden">
                      <div>
                        <h2 className="text-[clamp(13px,2.6vw,30px)] font-black text-[#0f2409] tracking-tight leading-none mb-[2.5%]">
                          {t.itemList}
                        </h2>
                        {/* Items Table */}
                        <div className="space-y-[1.8%]">
                          {bill.items.slice(0, 5).map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white/90 backdrop-blur-xs rounded-lg sm:rounded-xl px-[3%] py-[2%] flex items-center justify-between text-[clamp(9px,1.35vw,16px)] font-bold text-slate-900 shadow-2xs"
                            >
                              <span className="truncate max-w-[45%] font-extrabold">
                                {item.productName}
                              </span>
                              <span className="text-slate-700">
                                {item.kg.toFixed(2)} kg
                              </span>
                              <span className="text-slate-500 font-semibold">
                                ₹{item.pricePerKg}
                              </span>
                              <span className="font-black text-emerald-950">
                                ₹{Math.round(item.amount)}
                              </span>
                            </div>
                          ))}
                          {bill.items.length > 5 && (
                            <div className="text-center text-[clamp(8px,1.1vw,13px)] font-bold text-[#0f2409] pt-1">
                              + {bill.items.length - 5} more item(s)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Item count bottom hint */}
                      <div className="text-[clamp(8px,1.1vw,13px)] font-bold text-[#143c0e] flex items-center justify-between pt-1 border-t border-[#4cb826]">
                        <span>{t.totalItems}: {bill.items.length}</span>
                        {bill.hotelName && <span>Hotel: {bill.hotelName}</span>}
                      </div>
                    </div>

                    {/* Right: Total Amount, KG, Price */}
                    <div className="col-span-6 flex flex-col justify-between py-[1.5%] pl-[2%] pr-[1%]">
                      {/* Top: total amount */}
                      <div>
                        <h3 className="text-[clamp(14px,3.2vw,38px)] font-black text-slate-900 tracking-tight leading-none">
                          {t.totalAmountHeader}
                        </h3>
                        <div className="h-[2px] bg-slate-200 w-full mt-[2%]" />
                      </div>

                      {/* Middle: kg : 5kg */}
                      <div className="flex items-baseline gap-[4%] text-slate-900 my-auto">
                        <span className="text-[clamp(14px,3vw,36px)] font-bold text-slate-800">
                          {t.kgLabel}
                        </span>
                        <span className="text-[clamp(16px,3.6vw,44px)] font-black text-slate-950">
                          {bill.totalKg.toFixed(2)}kg
                        </span>
                      </div>

                      {/* Bottom: price : 1000 */}
                      <div className="flex items-baseline gap-[4%] text-slate-900">
                        <span className="text-[clamp(14px,3vw,36px)] font-bold text-slate-800">
                          {t.priceLabel}
                        </span>
                        <span className="text-[clamp(18px,4.2vw,50px)] font-black text-emerald-800">
                          ₹ {Math.round(bill.totalAmount)}
                        </span>
                      </div>

                      {/* Footer UPI / Thank you */}
                      <div className="text-[clamp(8px,1.15vw,14px)] text-slate-500 font-semibold flex items-center justify-between pt-[2%] border-t border-slate-100">
                        {settings.upiId ? (
                          <span>UPI: {settings.upiId}</span>
                        ) : (
                          <span>Cash / Paid</span>
                        )}
                        <span className="italic font-medium text-slate-400">
                          {t.thankYou}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pixel size notice pill */}
              <div className="mt-3 text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.exactResolution}</span>
              </div>
            </div>
          ) : (
            /* Classic Thermal Tape View */
            <div
              id="printable-receipt"
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 text-gray-800 font-mono text-xs leading-relaxed w-full max-w-sm"
            >
              <div className="text-center font-bold text-sm text-emerald-900 uppercase">
                {settings.shopName || 'FRESH CHICKEN CENTER'}
              </div>
              {settings.address && (
                <div className="text-center text-gray-500 text-[11px] mt-0.5">
                  {settings.address}
                </div>
              )}
              {settings.phoneNumber && (
                <div className="text-center text-gray-600 text-[11px]">
                  Ph: {settings.phoneNumber}
                </div>
              )}
              <div className="border-t border-dashed border-gray-300 my-2.5" />
              <div className="flex justify-between text-[11px] text-gray-700">
                <span className="font-bold">Bill: #{bill.billNumber}</span>
                <span>
                  {bill.date} {bill.time}
                </span>
              </div>
              <div className="border-t border-dashed border-gray-300 my-2.5" />
              <div className="grid grid-cols-12 font-bold text-gray-800 text-[11px] pb-1 border-b border-gray-200">
                <span className="col-span-5">Item</span>
                <span className="col-span-3 text-right">Qty/KG</span>
                <span className="col-span-2 text-right">Rate</span>
                <span className="col-span-2 text-right">Amt</span>
              </div>
              <div className="divide-y divide-gray-100 my-1">
                {bill.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 py-1 text-[11px] text-gray-800"
                  >
                    <span className="col-span-5 font-sans font-medium truncate">
                      {item.productName}
                    </span>
                    <span className="col-span-3 text-right">
                      {item.kg.toFixed(2)} kg
                    </span>
                    <span className="col-span-2 text-right">₹{item.pricePerKg}</span>
                    <span className="col-span-2 text-right font-semibold">
                      ₹{Math.round(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-dashed border-gray-400 my-2.5" />
              <div className="flex justify-between font-bold text-xs text-gray-900">
                <span>TOTAL WEIGHT:</span>
                <span className="text-emerald-800">{bill.totalKg.toFixed(3)} KG</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-emerald-900 mt-1">
                <span>GRAND TOTAL:</span>
                <span>₹ {bill.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="mt-3.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5 shrink-0">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Download 2008x827 Image Button */}
            <button
              type="button"
              onClick={handleDownload2008x827}
              disabled={downloading}
              className="w-full bg-[#0f3d2e] hover:bg-emerald-900 text-white font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>{t.downloadPng}</span>
            </button>
            {/* Print Bluetooth */}
            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={printing}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all disabled:opacity-50 text-xs sm:text-sm"
            >
              <Bluetooth className="w-4 h-4 text-white" />
              <span>{printing ? t.connecting : t.printBluetooth}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSystemPrint}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>{t.systemPrint}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors"
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
