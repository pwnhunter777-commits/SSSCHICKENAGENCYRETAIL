import { Bill, ShopSettings, Language } from '../types';

/**
 * Format plain text receipt with clean 32-column alignment for 58mm / 80mm thermal printers
 * Uses strictly standard ASCII characters and CRLF line breaks to ensure 100% printer compatibility.
 */
export function formatBillReceiptText(bill: Bill, settings: ShopSettings, language: Language = 'en'): string {
  const line = '--------------------------------\r\n';
  const dLine = '================================\r\n';

  let receipt = '';
  receipt += dLine;

  // TOP: Hotel Name & Phone Number
  const hotel = (bill.hotelName || settings.shopName || 'HOTEL').toUpperCase();
  const phone = bill.hotelPhone || settings.phoneNumber || '';

  const padHotel = Math.max(0, Math.floor((32 - hotel.length) / 2));
  receipt += `${' '.repeat(padHotel)}${hotel}\r\n`;

  if (phone) {
    const phStr = `Ph: ${phone}`;
    const padPh = Math.max(0, Math.floor((32 - phStr.length) / 2));
    receipt += `${' '.repeat(padPh)}${phStr}\r\n`;
  }
  receipt += dLine;

  // Left side: ITEM, Right side: TOTAL
  receipt += `ITEM                       TOTAL\r\n`;
  receipt += line;

  bill.items.forEach((item, index) => {
    const rawName = item.productNameEn || item.productName || 'Chicken';
    const cleanName = rawName.replace(/[^\x20-\x7E]/g, '').trim() || 'Chicken';
    const itemTitle = `${index + 1}. ${cleanName}`;
    const amtStr = `Rs.${Math.round(item.amount)}`;

    if (itemTitle.length + amtStr.length + 1 <= 32) {
      const spaces = 32 - itemTitle.length - amtStr.length;
      receipt += `${itemTitle}${' '.repeat(spaces)}${amtStr}\r\n`;
    } else {
      receipt += `${itemTitle}\r\n`;
      const spaces = 32 - amtStr.length;
      receipt += `${' '.repeat(spaces)}${amtStr}\r\n`;
    }
    const qtyStr = `   ${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}`;
    receipt += `${qtyStr}\r\n`;
  });

  receipt += line;

  // Total: Left side TOTAL, Right side Total Amount
  const totalLeft = 'TOTAL:';
  const totalVal = `Rs. ${Math.round(bill.totalAmount)}`;
  const totalSpaces = Math.max(1, 32 - totalLeft.length - totalVal.length);
  receipt += `${totalLeft}${' '.repeat(totalSpaces)}${totalVal}\r\n`;
  receipt += dLine;

  // 17cm slip feed
  receipt += '\r\n\r\n\r\n\r\n\r\n';
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

  // 2. TOP: Hotel Name and Phone Number (Center Align: ESC a 1)
  pushBytes(0x1B, 0x61, 0x01);
  pushText(`================================\r\n`);

  const hotel = (bill.hotelName || settings.shopName || 'HOTEL').toUpperCase();
  const phone = bill.hotelPhone || settings.phoneNumber || '';

  // Hotel Name in Double-Height Bold
  pushBytes(0x1B, 0x21, 0x10); // Double height
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushText(`${hotel}\r\n`);
  pushBytes(0x1B, 0x21, 0x00); // Normal size
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF

  if (phone) {
    pushBytes(0x1B, 0x45, 0x01); // Bold ON
    pushText(`Ph: ${phone}\r\n`);
    pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  }
  pushText(`================================\r\n`);

  // 3. TABLE HEADER: Left side ITEM, Right side TOTAL (Left Align: ESC a 0)
  pushBytes(0x1B, 0x61, 0x00);
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushText(`ITEM                       TOTAL\r\n`);
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  pushText(`--------------------------------\r\n`);

  // 4. ITEMS: Left side item, Right side amount
  bill.items.forEach((item, index) => {
    const rawName = item.productNameEn || item.productName || 'Chicken';
    const cleanName = rawName.replace(/[^\x20-\x7E]/g, '').trim() || 'Chicken';
    const itemTitle = `${index + 1}. ${cleanName}`;
    const amtStr = `Rs.${Math.round(item.amount)}`;

    pushBytes(0x1B, 0x45, 0x01); // Bold ON
    if (itemTitle.length + amtStr.length + 1 <= 32) {
      const spaces = 32 - itemTitle.length - amtStr.length;
      pushText(`${itemTitle}${' '.repeat(spaces)}${amtStr}\r\n`);
    } else {
      pushText(`${itemTitle}\r\n`);
      const spaces = 32 - amtStr.length;
      pushText(`${' '.repeat(spaces)}${amtStr}\r\n`);
    }
    pushBytes(0x1B, 0x45, 0x00); // Bold OFF

    // Quantity / Rate
    pushText(`   ${item.kg.toFixed(2)} kg x Rs.${item.pricePerKg}\r\n`);
  });

  pushText(`--------------------------------\r\n`);

  // 5. TOTAL: Left side TOTAL, Right side Total Amount in BIG FONT
  pushBytes(0x1B, 0x45, 0x01); // Bold ON
  pushBytes(0x1D, 0x21, 0x11); // GS ! 0x11 (2x width + 2x height)
  const totalVal = `Rs. ${Math.round(bill.totalAmount)}`;
  const totalLeft = 'TOTAL:';
  const spacesDouble = Math.max(1, 16 - totalLeft.length - totalVal.length);
  pushText(`${totalLeft}${' '.repeat(spacesDouble)}${totalVal}\r\n`);
  pushBytes(0x1D, 0x21, 0x00); // Reset font size
  pushBytes(0x1B, 0x45, 0x00); // Bold OFF
  pushText(`================================\r\n`);

  // 6. Feed to approx 17cm length and cut
  pushText(`\r\n\r\n\r\n\r\n\r\n\r\n`);
  pushBytes(0x1D, 0x56, 0x42, 0x00); // GS V 66 0 (Partial paper cut)

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



