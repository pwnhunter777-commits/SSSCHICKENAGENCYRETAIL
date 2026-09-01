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
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 1984, 803);

    // 2. Company Name (Top Center)
    const companyName = (settings.shopName || 'SSS CHICKEN AGENCY').toUpperCase();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Main Company Header
    ctx.fillStyle = '#064e3b';
    ctx.font = '900 54px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillText(companyName, 1004, 30);

    // Sub-header (Address Line)
    let currentY = 92;
    if (settings.address) {
      ctx.fillStyle = '#334155';
      ctx.font = '600 22px "Inter", system-ui, sans-serif';
      // If address is long, render cleanly
      ctx.fillText(settings.address, 1004, currentY);
      currentY += 30;
    }

    // Phone, GST, Bill Info Line
    const metaParts: string[] = [];
    if (settings.phoneNumber) metaParts.push(`Ph: ${settings.phoneNumber}`);
    if (settings.gstNumber) metaParts.push(`GST: ${settings.gstNumber}`);
    if (bill.billNumber) metaParts.push(`Bill #${bill.billNumber}`);
    if (bill.date) metaParts.push(`${bill.date} ${bill.time || ''}`);

    if (metaParts.length > 0) {
      ctx.fillStyle = '#475569';
      ctx.font = '700 20px "Inter", system-ui, sans-serif';
      ctx.fillText(metaParts.join('   •   '), 1004, currentY);
    }

    // 3. Left Section: Green Rectangle ("item list")
    // Layout coordinates: x: 60, y: 175, width: 880, height: 600
    const greenX = 60;
    const greenY = 175;
    const greenWidth = 880;
    const greenHeight = 600;
    const radius = 24;

    // Draw rounded green container
    ctx.fillStyle = '#48bb17'; // Rich vibrant green
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
    ctx.fillStyle = '#0a2205';
    ctx.font = '900 44px "Inter", system-ui, sans-serif';
    ctx.fillText(t.itemList, greenX + 40, greenY + 30);

    // Table header inside green box
    ctx.fillStyle = '#143c0e';
    ctx.font = '800 22px "Inter", system-ui, sans-serif';
    ctx.fillText(t.itemCol, greenX + 40, greenY + 95);
    ctx.textAlign = 'right';
    ctx.fillText(t.weightCol, greenX + greenWidth - 360, greenY + 95);
    ctx.fillText(t.rateCol, greenX + greenWidth - 210, greenY + 95);
    ctx.fillText(t.priceCol, greenX + greenWidth - 40, greenY + 95);

    // Separator line
    ctx.strokeStyle = '#389e0f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(greenX + 40, greenY + 125);
    ctx.lineTo(greenX + greenWidth - 40, greenY + 125);
    ctx.stroke();

    // Item List Rows
    let rowY = greenY + 148;
    const maxRows = Math.min(bill.items.length, 6);
    bill.items.slice(0, maxRows).forEach((item, index) => {
      // Row Card Background
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.82)';
      const cardH = 56;
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(greenX + 26, rowY - 4, greenWidth - 52, cardH, 12);
      } else {
        ctx.rect(greenX + 26, rowY - 4, greenWidth - 52, cardH);
      }
      ctx.fill();

      // Product Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 24px "Inter", system-ui, sans-serif';
      const displayName =
        item.productName.length > 18
          ? item.productName.substring(0, 16) + '..'
          : item.productName;
      ctx.fillText(displayName, greenX + 42, rowY + 10);

      // Weight
      ctx.textAlign = 'right';
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 24px "Inter", system-ui, sans-serif';
      ctx.fillText(`${item.kg.toFixed(2)} kg`, greenX + greenWidth - 360, rowY + 10);

      // Rate
      ctx.fillStyle = '#475569';
      ctx.font = '600 22px "Inter", system-ui, sans-serif';
      ctx.fillText(`₹${item.pricePerKg}`, greenX + greenWidth - 210, rowY + 10);

      // Price
      ctx.fillStyle = '#064e3b';
      ctx.font = '900 26px "Inter", system-ui, sans-serif';
      ctx.fillText(`₹${Math.round(item.amount)}`, greenX + greenWidth - 42, rowY + 10);

      rowY += 66;
    });

    if (bill.items.length > 6) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f2409';
      ctx.font = '700 20px "Inter", system-ui, sans-serif';
      ctx.fillText(`+ ${bill.items.length - 6} more item(s)`, greenX + greenWidth / 2, rowY + 10);
    }

    // 4. Right Section: Total Amount, KG, Price
    const rightX = 1040;
    const rightWidth = 900;

    // Top: total amount
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 64px "Inter", system-ui, sans-serif';
    ctx.fillText(t.totalAmountHeader, rightX + 40, 200);

    // Thin accent divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightX + 40, 280);
    ctx.lineTo(rightX + rightWidth - 40, 280);
    ctx.stroke();

    // Middle: kg : 5kg
    ctx.fillStyle = '#1e293b';
    ctx.font = '800 60px "Inter", system-ui, sans-serif';
    ctx.fillText(t.kgLabel, rightX + 40, 390);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 70px "Inter", system-ui, sans-serif';
    ctx.fillText(`${bill.totalKg.toFixed(2)}kg`, rightX + 330, 390);

    // Bottom: price : 1000
    ctx.fillStyle = '#1e293b';
    ctx.font = '800 60px "Inter", system-ui, sans-serif';
    ctx.fillText(t.priceLabel, rightX + 40, 560);
    ctx.fillStyle = '#064e3b';
    ctx.font = '900 82px "Inter", system-ui, sans-serif';
    ctx.fillText(`₹ ${Math.round(bill.totalAmount)}`, rightX + 330, 560);

    // Footer info on bottom-right (UPI and Thank You)
    ctx.textAlign = 'left';
    if (settings.upiId) {
      ctx.fillStyle = '#475569';
      ctx.font = '700 24px "Inter", system-ui, sans-serif';
      ctx.fillText(`UPI: ${settings.upiId}`, rightX + 40, 700);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 26px "Inter", system-ui, sans-serif';
    ctx.fillText(t.thankYou, rightX + rightWidth - 40, 700);
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
        <div className="p-3 sm:p-5 overflow-y-auto bg-slate-100/70 flex-1 flex flex-col items-center justify-center">
          {viewFormat === 'banner' ? (
            /* 2008 × 827 Responsive Bill Display */
            <div className="w-full flex flex-col items-center max-w-3xl">
              <div
                id="printable-receipt"
                className="w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden relative"
                style={{
                  aspectRatio: '2008 / 827',
                  maxWidth: '100%',
                }}
              >
                <div className="w-full h-full flex flex-col p-[2%] text-slate-900 justify-between select-none">
                  {/* Top Company Name Header */}
                  <div className="flex items-center justify-center gap-2.5 pt-[0.2%] pb-[0.8%] border-b border-slate-100">
                    <div className="w-[clamp(24px,3.8vw,48px)] h-[clamp(24px,3.8vw,48px)] rounded-xl bg-white border-2 border-emerald-500 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
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
                      <h1 className="text-[clamp(13px,2.6vw,32px)] font-black tracking-wide uppercase text-slate-900 leading-tight">
                        {settings.shopName || 'SSS CHICKEN AGENCY'}
                      </h1>
                      {settings.address && (
                        <p className="text-[clamp(7.5px,1.1vw,13px)] text-slate-600 font-semibold leading-tight mt-[0.3%] uppercase">
                          {settings.address}
                        </p>
                      )}
                      <div className="flex items-center justify-center flex-wrap gap-x-2 text-[clamp(7.5px,1.05vw,12px)] text-slate-500 font-bold mt-[0.2%]">
                        {settings.phoneNumber && <span>Ph: {settings.phoneNumber}</span>}
                        {settings.gstNumber && <span className="text-emerald-800">GST: {settings.gstNumber}</span>}
                        <span>Bill #{bill.billNumber}</span>
                        <span>{bill.date} {bill.time || ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Left Green 'item list' + Right 'total amount / kg / price' */}
                  <div className="grid grid-cols-12 gap-[2.5%] flex-1 items-stretch py-[1%]">
                    {/* Left: Green Item List Box */}
                    <div className="col-span-6 bg-[#48bb17] rounded-[14px] sm:rounded-[20px] p-[3%] flex flex-col justify-between text-slate-900 shadow-sm overflow-hidden">
                      <div>
                        <h2 className="text-[clamp(12px,2.2vw,26px)] font-black text-[#0a2205] tracking-tight leading-none mb-[2%]">
                          {t.itemList}
                        </h2>
                        {/* Items Table */}
                        <div className="space-y-[1.5%]">
                          {bill.items.slice(0, 5).map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white/95 backdrop-blur-xs rounded-md sm:rounded-lg px-[2.5%] py-[1.5%] flex items-center justify-between text-[clamp(8.5px,1.2vw,14px)] font-bold text-slate-900 shadow-2xs"
                            >
                              <span className="truncate max-w-[42%] font-extrabold">
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
                            <div className="text-center text-[clamp(7.5px,0.95vw,11px)] font-bold text-[#0a2205] pt-0.5">
                              + {bill.items.length - 5} more item(s)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Item count bottom hint */}
                      <div className="text-[clamp(7.5px,0.95vw,11px)] font-bold text-[#0a2205] flex items-center justify-between pt-0.5 border-t border-[#389e0f]/50">
                        <span>{t.totalItems}: {bill.items.length}</span>
                        {bill.hotelName && <span>Hotel: {bill.hotelName}</span>}
                      </div>
                    </div>

                    {/* Right: Total Amount, KG, Price */}
                    <div className="col-span-6 flex flex-col justify-between py-[1%] pl-[1.5%] pr-[0.5%]">
                      {/* Top: total amount */}
                      <div>
                        <h3 className="text-[clamp(13px,2.5vw,32px)] font-black text-slate-900 tracking-tight leading-none">
                          {t.totalAmountHeader}
                        </h3>
                        <div className="h-[2px] bg-slate-200 w-full mt-[1.5%]" />
                      </div>

                      {/* Middle: kg : 5kg */}
                      <div className="flex items-baseline gap-[3%] text-slate-900 my-auto">
                        <span className="text-[clamp(12px,2.4vw,28px)] font-bold text-slate-800">
                          {t.kgLabel}
                        </span>
                        <span className="text-[clamp(14px,2.8vw,36px)] font-black text-slate-950">
                          {bill.totalKg.toFixed(2)}kg
                        </span>
                      </div>

                      {/* Bottom: price : 1000 */}
                      <div className="flex items-baseline gap-[3%] text-slate-900">
                        <span className="text-[clamp(12px,2.4vw,28px)] font-bold text-slate-800">
                          {t.priceLabel}
                        </span>
                        <span className="text-[clamp(16px,3.4vw,42px)] font-black text-emerald-800">
                          ₹ {Math.round(bill.totalAmount)}
                        </span>
                      </div>

                      {/* Footer UPI / Thank you */}
                      <div className="text-[clamp(7px,0.95vw,12px)] text-slate-500 font-semibold flex items-center justify-between pt-[1.5%] border-t border-slate-100">
                        {settings.upiId ? (
                          <span className="truncate max-w-[65%]">UPI: {settings.upiId}</span>
                        ) : (
                          <span>Cash / Paid</span>
                        )}
                        <span className="italic font-medium text-slate-400 shrink-0 ml-1">
                          {t.thankYou}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pixel size notice pill */}
              <div className="mt-2.5 text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-white px-3.5 py-1 rounded-full border border-slate-200 shadow-2xs">
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
              <div className="text-center font-black text-base text-emerald-950 uppercase">
                {settings.shopName || 'SSS CHICKEN AGENCY'}
              </div>
              {settings.address && (
                <div className="text-center text-gray-600 text-[11px] uppercase mt-1 leading-snug">
                  {settings.address}
                </div>
              )}
              {settings.phoneNumber && (
                <div className="text-center text-gray-700 text-[11px] font-bold mt-0.5">
                  Ph: {settings.phoneNumber}
                </div>
              )}
              {settings.gstNumber && (
                <div className="text-center text-emerald-800 text-[11px] font-black">
                  GST: {settings.gstNumber}
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
              <div className="flex justify-between font-black text-sm text-emerald-950 mt-1">
                <span>GRAND TOTAL:</span>
                <span>₹ {Math.round(bill.totalAmount)}</span>
              </div>
              {settings.upiId && (
                <div className="text-center text-[10px] text-gray-500 mt-2 font-medium">
                  UPI: {settings.upiId}
                </div>
              )}
              <div className="text-center text-[10px] text-gray-400 italic mt-1">
                *** THANK YOU! VISIT AGAIN ***
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
