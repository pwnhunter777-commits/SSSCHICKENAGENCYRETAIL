import { Bill, ShopSettings, Language } from '../types';

export function formatBillReceiptText(bill: Bill, settings: ShopSettings, language: Language = 'en'): string {
  const line = '--------------------------------';
  const dLine = '================================';

  let receipt = '';
  receipt += `${settings.shopName || 'FRESH CHICKEN CENTER'}\n`;
  if (settings.address) receipt += `${settings.address}\n`;
  if (settings.phoneNumber) receipt += `Ph: ${settings.phoneNumber}\n`;
  if (settings.gstNumber) receipt += `GST: ${settings.gstNumber}\n`;
  receipt += `${dLine}\n`;
  receipt += `Bill No: #${bill.billNumber}\n`;
  receipt += `Date: ${bill.date}  Time: ${bill.time}\n`;
  receipt += `${line}\n`;
  receipt += `Item          Qty/Kg   Rate   Amt\n`;
  receipt += `${line}\n`;

  bill.items.forEach((item) => {
    const itemName = (language === 'ta' && item.productNameTa ? item.productNameTa : (item.productNameEn || item.productName)).slice(0, 13);
    const name = itemName.padEnd(13, ' ');
    const kg = `${item.kg.toFixed(2)}k`.padEnd(7, ' ');
    const rate = `${item.pricePerKg}`.padEnd(5, ' ');
    const amt = `Rs.${Math.round(item.amount)}`.padStart(7, ' ');
    receipt += `${name} ${kg} ${rate} ${amt}\n`;
  });

  receipt += `${line}\n`;
  receipt += `TOTAL KG   : ${bill.totalKg.toFixed(3)} KG\n`;
  receipt += `TOTAL AMT  : Rs. ${bill.totalAmount.toFixed(2)}\n`;
  receipt += `${dLine}\n`;
  if (settings.upiId) {
    receipt += `UPI ID: ${settings.upiId}\n`;
  }
  receipt += `*** THANK YOU! VISIT AGAIN ***\n\n\n`;
  return receipt;
}

export function generateEscPosBytes(bill: Bill, settings: ShopSettings, language: Language = 'en'): Uint8Array {
  const text = formatBillReceiptText(bill, settings, language);
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);

  // ESC @ (Initialize printer) + text + GS V 66 0 (Cut paper)
  const initCmd = new Uint8Array([0x1b, 0x40]);
  const alignCenter = new Uint8Array([0x1b, 0x61, 0x01]);
  const cutCmd = new Uint8Array([0x1d, 0x56, 0x42, 0x00]);

  const combined = new Uint8Array(initCmd.length + alignCenter.length + rawBytes.length + cutCmd.length);
  combined.set(initCmd, 0);
  combined.set(alignCenter, initCmd.length);
  combined.set(rawBytes, initCmd.length + alignCenter.length);
  combined.set(cutCmd, initCmd.length + alignCenter.length + rawBytes.length);

  return combined;
}

export interface BluetoothPrintResult {
  success: boolean;
  message: string;
  isSimulated?: boolean;
}

export async function printBillViaBluetooth(
  bill: Bill,
  settings: ShopSettings,
  language: Language = 'en'
): Promise<BluetoothPrintResult> {
  if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
    return {
      success: false,
      message: language === 'ta'
        ? 'வலை புளூடூத் ஆதரிக்கப்படவில்லை. ரசீது மாதிரியைப் பார்க்கவும்.'
        : 'Web Bluetooth is not supported on this browser/platform. Opening Thermal Receipt.',
      isSimulated: true,
    };
  }

  try {
    const bluetooth = (navigator as any).bluetooth;
    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a06-73ae-499d-8c15-faa9aef0c3f2',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      ],
    });

    if (!device.gatt) {
      throw new Error('Device does not support GATT connection.');
    }

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    if (services.length === 0) {
      throw new Error('No compatible printer service found.');
    }

    let writableChar: any = null;
    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writableChar = char;
            break;
          }
        }
        if (writableChar) break;
      } catch (e) {
        // continue search
      }
    }

    if (!writableChar) {
      throw new Error('No writable printer characteristic found on connected Bluetooth device.');
    }

    const data = generateEscPosBytes(bill, settings, language);
    // Send in chunks of 512 bytes for bluetooth stability
    const chunkSize = 512;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await writableChar.writeValue(chunk);
    }

    return {
      success: true,
      message: language === 'ta'
        ? `பில் #${bill.billNumber} புளூடூத் பிரிண்டருக்கு அனுப்பப்பட்டது!`
        : `Bill #${bill.billNumber} successfully sent to Bluetooth printer ${device.name || ''}`,
    };
  } catch (error: any) {
    console.warn('Bluetooth print interaction:', error);
    return {
      success: false,
      message: error?.message || (language === 'ta' ? 'புளூடூத் இணைப்பு ரத்து செய்யப்பட்டது.' : 'Bluetooth connection cancelled or failed.'),
      isSimulated: true,
    };
  }
}
