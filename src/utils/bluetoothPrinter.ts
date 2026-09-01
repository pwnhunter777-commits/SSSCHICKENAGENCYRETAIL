import { Bill, ShopSettings, Language } from '../types';

/**
 * Format plain text receipt with clean 32-column alignment for 58mm / 80mm thermal printers
 */
export function formatBillReceiptText(bill: Bill, settings: ShopSettings, language: Language = 'en'): string {
  const line = '--------------------------------';
  const dLine = '================================';

  let receipt = '';
  // Header
  receipt += `${(settings.shopName || 'SSS CHICKEN AGENCY').toUpperCase()}\n`;
  if (settings.address) {
    receipt += `${settings.address}\n`;
  }
  if (settings.phoneNumber) {
    receipt += `Ph: ${settings.phoneNumber}\n`;
  }
  if (settings.gstNumber) {
    receipt += `GST: ${settings.gstNumber}\n`;
  }
  receipt += `${dLine}\n`;

  // Bill metadata
  receipt += `Bill No: #${bill.billNumber}\n`;
  receipt += `Date: ${bill.date}  ${bill.time || ''}\n`;
  receipt += `${line}\n`;

  // Table header (32 chars: Item 14, Qty 6, Rate 5, Amt 7)
  receipt += `Item          Qty/Kg  Rate   Amt\n`;
  receipt += `${line}\n`;

  // Items
  bill.items.forEach((item) => {
    const rawName = (language === 'ta' && item.productNameTa ? item.productNameTa : (item.productNameEn || item.productName)) || 'Chicken';
    const name = rawName.length > 13 ? rawName.slice(0, 13) : rawName.padEnd(13, ' ');
    const kg = `${item.kg.toFixed(2)}k`.padStart(6, ' ');
    const rate = `${item.pricePerKg}`.padStart(5, ' ');
    const amt = `${Math.round(item.amount)}`.padStart(6, ' ');
    receipt += `${name} ${kg} ${rate} ${amt}\n`;
  });

  // Totals
  receipt += `${line}\n`;
  receipt += `TOTAL KG    :  ${bill.totalKg.toFixed(3)} KG\n`;
  receipt += `GRAND TOTAL :  Rs. ${Math.round(bill.totalAmount)}\n`;
  receipt += `${dLine}\n`;

  if (settings.upiId) {
    receipt += `UPI: ${settings.upiId}\n`;
  }
  receipt += `*** THANK YOU! VISIT AGAIN ***\n\n\n\n`;
  return receipt;
}

/**
 * Generate binary ESC/POS command buffer for thermal receipt printers
 */
export function generateEscPosBytes(bill: Bill, settings: ShopSettings, language: Language = 'en'): Uint8Array {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const pushBytes = (bytes: number[]) => {
    for (let i = 0; i < bytes.length; i++) buffer.push(bytes[i]);
  };

  const pushText = (text: string) => {
    const encoded = encoder.encode(text);
    for (let i = 0; i < encoded.length; i++) buffer.push(encoded[i]);
  };

  // 1. Initialize printer
  pushBytes([0x1B, 0x40]); // ESC @

  // 2. Center Align + Double Size + Bold for Shop Name
  pushBytes([0x1B, 0x61, 0x01]); // Center
  pushBytes([0x1B, 0x45, 0x01]); // Bold ON
  pushBytes([0x1D, 0x21, 0x11]); // Double width & height
  pushText(`${settings.shopName || 'SSS CHICKEN AGENCY'}\n`);

  // Normal text + Center for Address, Phone & GST
  pushBytes([0x1D, 0x21, 0x00]); // Normal font size
  pushBytes([0x1B, 0x45, 0x00]); // Bold OFF
  if (settings.address) {
    pushText(`${settings.address}\n`);
  }
  if (settings.phoneNumber) {
    pushText(`Ph: ${settings.phoneNumber}\n`);
  }
  if (settings.gstNumber) {
    pushBytes([0x1B, 0x45, 0x01]); // Bold for GST
    pushText(`GST: ${settings.gstNumber}\n`);
    pushBytes([0x1B, 0x45, 0x00]);
  }

  // Divider
  pushText(`================================\n`);

  // 3. Left Align for Bill Info & Item Table
  pushBytes([0x1B, 0x61, 0x00]); // Left Align
  pushBytes([0x1B, 0x45, 0x01]); // Bold
  pushText(`Bill No: #${bill.billNumber}\n`);
  pushBytes([0x1B, 0x45, 0x00]);
  pushText(`Date: ${bill.date}   ${bill.time || ''}\n`);
  pushText(`--------------------------------\n`);

  // Table header
  pushBytes([0x1B, 0x45, 0x01]);
  pushText(`Item          Qty/Kg  Rate   Amt\n`);
  pushBytes([0x1B, 0x45, 0x00]);
  pushText(`--------------------------------\n`);

  // Items
  bill.items.forEach((item) => {
    const rawName = (language === 'ta' && item.productNameTa ? item.productNameTa : (item.productNameEn || item.productName)) || 'Chicken';
    const name = rawName.length > 13 ? rawName.slice(0, 13) : rawName.padEnd(13, ' ');
    const kg = `${item.kg.toFixed(2)}k`.padStart(6, ' ');
    const rate = `${item.pricePerKg}`.padStart(5, ' ');
    const amt = `${Math.round(item.amount)}`.padStart(6, ' ');
    pushText(`${name} ${kg} ${rate} ${amt}\n`);
  });

  pushText(`--------------------------------\n`);

  // Total Weight
  pushText(`TOTAL KG    :  ${bill.totalKg.toFixed(3)} KG\n`);

  // Grand Total in Bold & Double Height
  pushBytes([0x1B, 0x45, 0x01]); // Bold ON
  pushBytes([0x1D, 0x21, 0x01]); // Double height
  pushText(`GRAND TOTAL :  Rs. ${Math.round(bill.totalAmount)}\n`);
  pushBytes([0x1D, 0x21, 0x00]); // Normal
  pushBytes([0x1B, 0x45, 0x00]); // Bold OFF

  pushText(`================================\n`);

  // 4. Center align for footer
  pushBytes([0x1B, 0x61, 0x01]); // Center
  if (settings.upiId) {
    pushText(`UPI: ${settings.upiId}\n`);
  }
  pushBytes([0x1B, 0x45, 0x01]);
  pushText(`*** THANK YOU! VISIT AGAIN ***\n`);
  pushBytes([0x1B, 0x45, 0x00]);

  // Feed lines and cut paper
  pushText(`\n\n\n\n`);
  pushBytes([0x1D, 0x56, 0x41, 0x10]); // Partial cut

  return new Uint8Array(buffer);
}

export interface BluetoothPrintResult {
  success: boolean;
  message: string;
  isSimulated?: boolean;
}

/**
 * Send bytes safely to Bluetooth LE printer with 20-byte MTU chunking and pacing
 */
async function sendBytesToCharacteristic(characteristic: any, data: Uint8Array): Promise<void> {
  // 20 bytes is the standard safe MTU payload for Bluetooth Low Energy characteristics
  const CHUNK_SIZE = 20;
  const DELAY_MS = 25;

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    try {
      if (characteristic.writeValueWithResponse) {
        await characteristic.writeValueWithResponse(chunk);
      } else if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
    } catch (err) {
      // Fallback to standard writeValue
      await characteristic.writeValue(chunk);
    }

    // Delay between chunks to prevent thermal printer receive buffer overflow
    if (i + CHUNK_SIZE < data.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }
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
        ? 'வலை புளூடூத் ஆதரிக்கப்படவில்லை. ரசீது மாதிரியைப் பார்க்கவும் அல்லது அச்சிடவும்.'
        : 'Web Bluetooth is not supported on this browser/platform. Please use Print / PDF.',
      isSimulated: true,
    };
  }

  try {
    const bluetooth = (navigator as any).bluetooth;
    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Print Service
        'e7810a06-73ae-499d-8c15-faa9aef0c3f2',
        '0000ffe0-0000-1000-8000-00805f9b34fb', // Common BLE Serial (HC-08, etc.)
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000ae00-0000-1000-8000-00805f9b34fb',
      ],
    });

    if (!device.gatt) {
      throw new Error('Device does not support GATT connection.');
    }

    const server = await device.gatt.connect();
    const services = await server.getPrimaryServices();
    if (services.length === 0) {
      throw new Error('No compatible printer services found.');
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
    await sendBytesToCharacteristic(writableChar, data);

    return {
      success: true,
      message: language === 'ta'
        ? `பில் #${bill.billNumber} புளூடூத் பிரிண்டரில் அச்சிடப்பட்டது!`
        : `Bill #${bill.billNumber} printed successfully on ${device.name || 'Bluetooth printer'}!`,
    };
  } catch (error: any) {
    console.warn('Bluetooth print error:', error);
    return {
      success: false,
      message: error?.message || (language === 'ta' ? 'புளூடூத் அச்சிடுதல் தோல்வியடைந்தது.' : 'Bluetooth print cancelled or failed.'),
      isSimulated: true,
    };
  }
}

