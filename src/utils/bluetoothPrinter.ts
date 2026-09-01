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
    // Format address across lines cleanly if long
    const addr = settings.address.trim();
    if (addr.length > 32) {
      const parts = addr.split(',');
      if (parts.length > 1) {
        let curLine = '';
        parts.forEach((p, idx) => {
          const piece = p.trim() + (idx < parts.length - 1 ? ',' : '');
          if ((curLine + ' ' + piece).trim().length <= 32) {
            curLine = (curLine + ' ' + piece).trim();
          } else {
            if (curLine) receipt += `${curLine}\n`;
            curLine = piece;
          }
        });
        if (curLine) receipt += `${curLine}\n`;
      } else {
        receipt += `${addr.substring(0, 32)}\n${addr.substring(32)}\n`;
      }
    } else {
      receipt += `${addr}\n`;
    }
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
  if (bill.hotelName) {
    receipt += `Hotel/Cust: ${bill.hotelName}\n`;
  }
  receipt += `${line}\n`;

  // Table header
  receipt += `ITEM               QTY    AMOUNT\n`;
  receipt += `${line}\n`;

  // Items - clear 2-line layout per item so full details and quantities are always visible
  bill.items.forEach((item, index) => {
    const rawName = (language === 'ta' && item.productNameTa ? item.productNameTa : (item.productNameEn || item.productName)) || 'Chicken';
    const num = `${index + 1}. `;
    receipt += `${num}${rawName}\n`;
    const qtyStr = `   ${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}`;
    const amtStr = `Rs.${Math.round(item.amount)}`;
    const spaces = Math.max(1, 32 - qtyStr.length - amtStr.length);
    receipt += `${qtyStr}${' '.repeat(spaces)}${amtStr}\n`;
  });

  // Totals
  receipt += `${line}\n`;
  receipt += `TOTAL WEIGHT :  ${bill.totalKg.toFixed(3)} KG\n`;
  receipt += `${line}\n`;
  receipt += `GRAND TOTAL  :  Rs. ${Math.round(bill.totalAmount)}\n`;
  receipt += `${dLine}\n`;

  if (settings.upiId) {
    receipt += `UPI: ${settings.upiId}\n`;
  }
  receipt += `*** THANK YOU! VISIT AGAIN ***\n\n\n\n\n`;
  return receipt;
}

/**
 * Generate binary ESC/POS command buffer for thermal receipt printers
 * Uses standard ESC ! and ESC E/a commands supported across 100% of 58mm/80mm printers
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

  // 1. Initialize printer (ESC @)
  pushBytes([0x1B, 0x40]);

  // 2. Header (Center Align)
  pushBytes([0x1B, 0x61, 0x01]); // Center align

  // Shop Name in BIG SIZE BOLD (ESC ! 0x38 = Double Height + Double Width + Bold)
  pushBytes([0x1B, 0x21, 0x38]);
  pushText(`${settings.shopName || 'SSS CHICKEN AGENCY'}\n`);

  // Switch back to normal font size (ESC ! 0x00)
  pushBytes([0x1B, 0x21, 0x00]);

  if (settings.address) {
    const addr = settings.address.trim();
    if (addr.length > 32) {
      const parts = addr.split(',');
      if (parts.length > 1) {
        let curLine = '';
        parts.forEach((p, idx) => {
          const piece = p.trim() + (idx < parts.length - 1 ? ',' : '');
          if ((curLine + ' ' + piece).trim().length <= 32) {
            curLine = (curLine + ' ' + piece).trim();
          } else {
            if (curLine) pushText(`${curLine}\n`);
            curLine = piece;
          }
        });
        if (curLine) pushText(`${curLine}\n`);
      } else {
        pushText(`${addr.substring(0, 32)}\n${addr.substring(32)}\n`);
      }
    } else {
      pushText(`${addr}\n`);
    }
  }

  if (settings.phoneNumber) {
    pushText(`Ph: ${settings.phoneNumber}\n`);
  }

  if (settings.gstNumber) {
    pushBytes([0x1B, 0x45, 0x01]); // Bold ON
    pushText(`GST: ${settings.gstNumber}\n`);
    pushBytes([0x1B, 0x45, 0x00]); // Bold OFF
  }

  // Divider
  pushText(`================================\n`);

  // 3. Left Align for Bill Metadata
  pushBytes([0x1B, 0x61, 0x00]); // Left Align
  pushBytes([0x1B, 0x45, 0x01]); // Bold
  pushText(`Bill No: #${bill.billNumber}\n`);
  pushBytes([0x1B, 0x45, 0x00]);
  pushText(`Date: ${bill.date}  ${bill.time || ''}\n`);
  if (bill.hotelName) {
    pushText(`Hotel: ${bill.hotelName}\n`);
  }
  pushText(`--------------------------------\n`);

  // Table header
  pushBytes([0x1B, 0x45, 0x01]);
  pushText(`ITEM               QTY    AMOUNT\n`);
  pushBytes([0x1B, 0x45, 0x00]);
  pushText(`--------------------------------\n`);

  // 4. Item List - Clearly formatted with Name, Qty, Rate, and Amount
  bill.items.forEach((item, index) => {
    const rawName = (language === 'ta' && item.productNameTa ? item.productNameTa : (item.productNameEn || item.productName)) || 'Chicken';
    // Item Name in Bold
    pushBytes([0x1B, 0x45, 0x01]);
    pushText(`${index + 1}. ${rawName}\n`);
    pushBytes([0x1B, 0x45, 0x00]);

    // Quantity, Rate and Amount line
    const qtyStr = `   ${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}`;
    const amtStr = `Rs.${Math.round(item.amount)}`;
    const spaces = Math.max(1, 32 - qtyStr.length - amtStr.length);
    pushText(`${qtyStr}${' '.repeat(spaces)}${amtStr}\n`);
  });

  pushText(`--------------------------------\n`);

  // 5. Total Weight
  pushBytes([0x1B, 0x21, 0x10]); // Double Height
  pushText(`TOTAL KG : ${bill.totalKg.toFixed(3)} KG\n`);
  pushBytes([0x1B, 0x21, 0x00]); // Reset to normal

  pushText(`--------------------------------\n`);

  // 6. GRAND TOTAL in BIG SIZE (Double Width + Double Height + Bold: ESC ! 0x38)
  pushBytes([0x1B, 0x21, 0x38]); // BIG SIZE
  pushText(`TOTAL: Rs. ${Math.round(bill.totalAmount)}\n`);
  pushBytes([0x1B, 0x21, 0x00]); // Reset to normal size

  pushText(`================================\n`);

  // 7. Footer (Center Align)
  pushBytes([0x1B, 0x61, 0x01]); // Center
  if (settings.upiId) {
    pushText(`UPI: ${settings.upiId}\n`);
  }
  pushBytes([0x1B, 0x45, 0x01]);
  pushText(`*** THANK YOU! VISIT AGAIN ***\n`);
  pushBytes([0x1B, 0x45, 0x00]);

  // Feed lines for manual tear off (no GS V cutter command to prevent mini printer freeze)
  pushText(`\n\n\n\n\n`);

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
  const CHUNK_SIZE = 20;
  const DELAY_MS = 35; // 35ms pacing to let thermal head and MCU buffer process

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    try {
      if (characteristic.writeValueWithResponse) {
        await characteristic.writeValueWithResponse(chunk);
      } else if (characteristic.writeValue) {
        await characteristic.writeValue(chunk);
      } else if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      }
    } catch (err) {
      try {
        if (characteristic.writeValueWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk);
        } else if (characteristic.writeValue) {
          await characteristic.writeValue(chunk);
        }
      } catch (innerErr) {
        console.warn('Chunk write retry warning:', innerErr);
      }
    }

    // Pacing delay between chunks
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
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
        '0000ffe0-0000-1000-8000-00805f9b34fb', // Common BLE Serial (HC-08, PT-210, etc.)
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000ae00-0000-1000-8000-00805f9b34fb',
        '0000af00-0000-1000-8000-00805f9b34fb',
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


