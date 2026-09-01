import { Bill, ShopSettings, Language } from '../types';

/**
 * Format plain text receipt with clean 32-column alignment for 58mm / 80mm thermal printers
 * Uses strictly standard ASCII characters and CRLF line breaks to ensure 100% printer compatibility.
 */
export function formatBillReceiptText(bill: Bill, settings: ShopSettings, language: Language = 'en'): string {
  const line = '--------------------------------\r\n';
  const dLine = '================================\r\n';

  let receipt = '';
  // Header (Centered where possible)
  const shop = (settings.shopName || 'SSS CHICKEN AGENCY').toUpperCase();
  receipt += `${shop}\r\n`;

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
            if (curLine) receipt += `${curLine}\r\n`;
            curLine = piece;
          }
        });
        if (curLine) receipt += `${curLine}\r\n`;
      } else {
        receipt += `${addr.substring(0, 32)}\r\n${addr.substring(32)}\r\n`;
      }
    } else {
      receipt += `${addr}\r\n`;
    }
  }

  if (settings.phoneNumber) {
    receipt += `Ph: ${settings.phoneNumber}\r\n`;
  }
  if (settings.gstNumber) {
    receipt += `GST: ${settings.gstNumber}\r\n`;
  }
  receipt += dLine;

  // Bill metadata
  receipt += `Bill No: #${bill.billNumber}\r\n`;
  receipt += `Date: ${bill.date}  ${bill.time || ''}\r\n`;
  if (bill.hotelName) {
    receipt += `Hotel: ${bill.hotelName}\r\n`;
  }
  receipt += line;

  // Table header
  receipt += `ITEM               QTY    AMOUNT\r\n`;
  receipt += line;

  // Items - 2-line layout per item
  bill.items.forEach((item, index) => {
    // Standard ASCII name
    const rawName = item.productNameEn || item.productName || 'Chicken';
    const cleanName = rawName.replace(/[^\x20-\x7E]/g, '').trim() || 'Chicken';
    receipt += `${index + 1}. ${cleanName}\r\n`;
    const qtyStr = `   ${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}`;
    const amtStr = `Rs.${Math.round(item.amount)}`;
    const spaces = Math.max(1, 32 - qtyStr.length - amtStr.length);
    receipt += `${qtyStr}${' '.repeat(spaces)}${amtStr}\r\n`;
  });

  // Totals
  receipt += line;
  receipt += `TOTAL WEIGHT :  ${bill.totalKg.toFixed(3)} KG\r\n`;
  receipt += line;
  receipt += `GRAND TOTAL  :  Rs. ${Math.round(bill.totalAmount)}\r\n`;
  receipt += dLine;

  if (settings.upiId) {
    receipt += `UPI: ${settings.upiId}\r\n`;
  }
  receipt += `*** THANK YOU! VISIT AGAIN ***\r\n\r\n\r\n\r\n\r\n`;
  return receipt;
}

/**
 * Generate binary ESC/POS command buffer for thermal receipt printers
 * Safe commands supported across 100% of 58mm & 80mm mini POS printers.
 */
export function generateEscPosBytes(bill: Bill, settings: ShopSettings, language: Language = 'en'): Uint8Array {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const pushBytes = (...bytes: number[]) => {
    for (let i = 0; i < bytes.length; i++) buffer.push(bytes[i]);
  };

  const pushText = (text: string) => {
    // Ensure clean ASCII to prevent character set corruption in POS printers
    const safeText = text.replace(/[^\x00-\x7F]/g, '');
    const encoded = encoder.encode(safeText);
    for (let i = 0; i < encoded.length; i++) buffer.push(encoded[i]);
  };

  // 1. Initialize printer (ESC @)
  pushBytes(0x1B, 0x40);

  // 2. Header (Center Align: ESC a 1)
  pushBytes(0x1B, 0x61, 0x01);

  // Shop Name in Bold Double-Height (ESC ! 0x10)
  pushBytes(0x1B, 0x21, 0x10);
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushText(`${settings.shopName || 'SSS CHICKEN AGENCY'}\r\n`);
  pushBytes(0x1B, 0x21, 0x00); // Normal size
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF

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
            if (curLine) pushText(`${curLine}\r\n`);
            curLine = piece;
          }
        });
        if (curLine) pushText(`${curLine}\r\n`);
      } else {
        pushText(`${addr.substring(0, 32)}\r\n${addr.substring(32)}\r\n`);
      }
    } else {
      pushText(`${addr}\r\n`);
    }
  }

  if (settings.phoneNumber) {
    pushText(`Ph: ${settings.phoneNumber}\r\n`);
  }

  if (settings.gstNumber) {
    pushBytes(0x1B, 0x45, 0x01); // Bold ON
    pushText(`GST: ${settings.gstNumber}\r\n`);
    pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  }

  // Divider
  pushText(`================================\r\n`);

  // 3. Left Align for Bill Metadata (ESC a 0)
  pushBytes(0x1B, 0x61, 0x00);
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushText(`Bill No: #${bill.billNumber}\r\n`);
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  pushText(`Date: ${bill.date}  ${bill.time || ''}\r\n`);
  if (bill.hotelName) {
    pushText(`Hotel: ${bill.hotelName}\r\n`);
  }
  pushText(`--------------------------------\r\n`);

  // Table header
  pushBytes(0x1B, 0x45, 0x01);
  pushText(`ITEM               QTY    AMOUNT\r\n`);
  pushBytes(0x1B, 0x45, 0x00);
  pushText(`--------------------------------\r\n`);

  // 4. Item List - Clean Name & Numbers
  bill.items.forEach((item, index) => {
    const rawName = item.productNameEn || item.productName || 'Chicken';
    const cleanName = rawName.replace(/[^\x20-\x7E]/g, '').trim() || 'Chicken';
    
    // Item Name in Bold
    pushBytes(0x1B, 0x45, 0x01);
    pushText(`${index + 1}. ${cleanName}\r\n`);
    pushBytes(0x1B, 0x45, 0x00);

    // Quantity & Amount line
    const qtyStr = `   ${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}`;
    const amtStr = `Rs.${Math.round(item.amount)}`;
    const spaces = Math.max(1, 32 - qtyStr.length - amtStr.length);
    pushText(`${qtyStr}${' '.repeat(spaces)}${amtStr}\r\n`);
  });

  pushText(`--------------------------------\r\n`);

  // 5. Total Weight
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushText(`TOTAL WEIGHT : ${bill.totalKg.toFixed(3)} KG\r\n`);
  pushBytes(0x1B, 0x45, 0x00);

  pushText(`--------------------------------\r\n`);

  // 6. GRAND TOTAL in BIG SIZE (Double Width + Double Height: GS ! 0x11 or ESC ! 0x30)
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushBytes(0x1D, 0x21, 0x11); // GS ! 0x11 (2x width + 2x height)
  pushText(`TOTAL: Rs. ${Math.round(bill.totalAmount)}\r\n`);
  pushBytes(0x1D, 0x21, 0x00); // Reset character size
  pushBytes(0x1B, 0x21, 0x00); // Reset font
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF

  pushText(`================================\r\n`);

  // 7. Footer (Center Align: ESC a 1)
  pushBytes(0x1B, 0x61, 0x01);
  if (settings.upiId) {
    pushText(`UPI: ${settings.upiId}\r\n`);
  }
  pushBytes(0x1B, 0x45, 0x01);
  pushText(`*** THANK YOU! VISIT AGAIN ***\r\n`);
  pushBytes(0x1B, 0x45, 0x00);

  // Feed 4 blank lines for clean tear off
  pushText(`\r\n\r\n\r\n\r\n`);

  return new Uint8Array(buffer);
}

export interface BluetoothPrintResult {
  success: boolean;
  message: string;
  isSimulated?: boolean;
}

/**
 * Send bytes safely to Bluetooth LE printer with strict 20-byte MTU chunking,
 * reliable characteristic selection, and paced write execution.
 */
async function sendBytesToCharacteristic(characteristic: any, data: Uint8Array): Promise<void> {
  const CHUNK_SIZE = 20;
  const DELAY_MS = 45; // 45ms pacing for microcontrollers to prevent UART buffer drops

  const canWriteWithoutResp = Boolean(characteristic.properties?.writeWithoutResponse);
  const canWriteWithResp = Boolean(characteristic.properties?.write);

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    try {
      if (canWriteWithoutResp && characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else if (canWriteWithResp && characteristic.writeValueWithResponse) {
        await characteristic.writeValueWithResponse(chunk);
      } else if (characteristic.writeValue) {
        await characteristic.writeValue(chunk);
      } else if (characteristic.writeValueWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      }
    } catch (err) {
      // Fallback try with generic write
      try {
        if (characteristic.writeValue) {
          await characteristic.writeValue(chunk);
        }
      } catch (innerErr) {
        console.warn('GATT write error:', innerErr);
      }
    }

    // Pacing delay between chunks to let thermal head burn and buffer drain
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
          if (char.properties.writeWithoutResponse || char.properties.write) {
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
        ? `பில் #${bill.billNumber} புளூடூத் பிரிண்டரில் வெற்றிகரமாக அச்சிடப்பட்டது!`
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



