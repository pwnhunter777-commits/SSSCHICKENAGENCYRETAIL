import { Product, DailyPriceMap, ShopSettings, Bill, Language } from '../types';

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p0', name: 'Chicken', nameEn: 'Chicken', nameTa: 'கோழி இறைச்சி', defaultPrice: 220 },
  { id: 'p1', name: 'Curry Cut', nameEn: 'Curry Cut', nameTa: 'குழம்பு வெட்டு', defaultPrice: 220 },
  { id: 'p2', name: 'Biriyani piece', nameEn: 'Biriyani piece', nameTa: 'பிரியாணி துண்டு', defaultPrice: 220 },
  { id: 'p3', name: '65 piece', nameEn: '65 piece', nameTa: '65 பீஸ்', defaultPrice: 240 },
  { id: 'p4', name: 'Boneless', nameEn: 'Boneless', nameTa: 'எலும்பில்லாதது', defaultPrice: 280 },
  { id: 'p5', name: 'Wings', nameEn: 'Wings', nameTa: 'இறக்கை', defaultPrice: 210 },
  { id: 'p6', name: 'Lever', nameEn: 'Lever', nameTa: 'ஈரல்', defaultPrice: 180 },
  { id: 'p7', name: 'Leg boneless', nameEn: 'Leg boneless', nameTa: 'லெக் போன்லெஸ்', defaultPrice: 300 },
  { id: 'p8', name: 'Leg Skinless chicken', nameEn: 'Leg Skinless chicken', nameTa: 'லெக் ஸ்கின்லெஸ்', defaultPrice: 260 },
  { id: 'p9', name: 'Skin chicken', nameEn: 'Skin chicken', nameTa: 'தோல் கோழி', defaultPrice: 190 },
  { id: 'p10', name: 'Bone', nameEn: 'Bone', nameTa: 'எலும்பு', defaultPrice: 120 },
  { id: 'p11', name: 'Grave piece', nameEn: 'Grave piece', nameTa: 'கிரேவி பீஸ்', defaultPrice: 230 },
  { id: 'p12', name: 'Fry piece', nameEn: 'Fry piece', nameTa: 'வறுவல் பீஸ்', defaultPrice: 250 },
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'SSS CHICKEN AGENCY',
  phoneNumber: '8680000003',
  gstNumber: '34AQPN8846J2ZF',
  address: 'NO 6, PONDY MAIN ROAD, SULTHANPET, VILLIANUR, PUDUCHERRY - 605 110',
  upiId: 'NAZIRAHAMED0003@okhdfcbank',
  billPrintWidth: 17,
  printerPaperWidth: '80mm',
  printerColumns: 48,
  printerFeedLines: 8,
  printerAutoCut: false,
  withoutSkinOffset: 50,
  securityPin: '1234',
  pinProtectionEnabled: false,
  protectDailyPrice: true,
  protectSettings: true,
  protectBillDelete: true,
  protectAppLock: false,
  logoUrl: '/logo.png',
};

export const DEFAULT_AROMAKE_HOTELS: string[] = [
  'Aromake Biriyani & Fast Food',
  'Aromake Star Hotel',
  'Aromake Family Restaurant',
  'Aromake Mess & Catering',
  'Aromake Dhaba',
];

const STORAGE_KEYS = {
  PRODUCTS: 'chicken_shop_products_v1',
  DAILY_PRICES: 'chicken_shop_daily_prices_v1',
  SETTINGS: 'chicken_shop_settings_v1',
  BILLS: 'chicken_shop_bills_v1',
  LANGUAGE: 'chicken_shop_lang_v1',
  HOTELS: 'chicken_shop_hotels_v1',
};

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr?: string, lang: Language = 'en'): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Built-in map to resolve Tamil names for default cuts
const KNOWN_CUTS_TAMIL: Record<string, string> = {
  chicken: 'கோழி இறைச்சி',
  'curry cut': 'குழம்பு வெட்டு',
  'biriyani piece': 'பிரியாணி துண்டு',
  '65 piece': '65 பீஸ்',
  boneless: 'எலும்பில்லாதது',
  wings: 'இறக்கை',
  lever: 'ஈரல்',
  liver: 'ஈரல்',
  'leg boneless': 'லெக் போன்லெஸ்',
  'leg skinless chicken': 'லெக் ஸ்கின்லெஸ்',
  'skin chicken': 'தோல் கோழி',
  bone: 'எலும்பு',
  'grave piece': 'கிரேவி பீஸ்',
  'gravy piece': 'கிரேவி பீஸ்',
  'fry piece': 'வறுவல் பீஸ்',
};

// Storage helpers
export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Hydrate bilingual names
        const hydrated = parsed.map((p) => {
          const lowerName = (p.name || '').trim().toLowerCase();
          const defaultTa = KNOWN_CUTS_TAMIL[lowerName] || p.name || '';
          return {
            ...p,
            nameEn: p.nameEn || p.name || 'Chicken Cut',
            nameTa: p.nameTa || defaultTa || 'கோழி வகை',
          };
        });
        // Ensure 'Chicken' is at index 0 (main cut)
        const chickenIdx = hydrated.findIndex(
          (p) => (p.nameEn || p.name || '').trim().toLowerCase() === 'chicken'
        );
        if (chickenIdx > 0) {
          const [chicken] = hydrated.splice(chickenIdx, 1);
          hydrated.unshift(chicken);
        } else if (chickenIdx === -1) {
          hydrated.unshift({
            id: 'p0',
            name: 'Chicken',
            nameEn: 'Chicken',
            nameTa: 'கோழி இறைச்சி',
            defaultPrice: 220,
          });
        }
        saveProducts(hydrated);
        return hydrated;
      }
    }
  } catch (e) {
    console.error('Error loading products from localStorage', e);
  }
  saveProducts(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage', e);
  }
}

export function loadDailyPrices(): DailyPriceMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_PRICES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading daily prices from localStorage', e);
  }
  return {};
}

export function saveDailyPrices(prices: DailyPriceMap): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_PRICES, JSON.stringify(prices));
  } catch (e) {
    console.error('Error saving daily prices to localStorage', e);
  }
}

export function getTodayPrices(products: Product[]): { [productId: string]: number } {
  const allPrices = loadDailyPrices();
  const todayKey = getTodayKey();
  const savedToday = allPrices[todayKey];
  if (savedToday && Object.keys(savedToday).length > 0) {
    return savedToday;
  }
  // Fallback: check previous day or default prices
  const fallbackPrices: { [productId: string]: number } = {};
  const dates = Object.keys(allPrices).sort().reverse();
  const latestSaved = dates.length > 0 ? allPrices[dates[0]] : null;
  products.forEach((p) => {
    if (latestSaved && latestSaved[p.id] !== undefined) {
      fallbackPrices[p.id] = latestSaved[p.id];
    } else {
      fallbackPrices[p.id] = p.defaultPrice || 200;
    }
  });
  return fallbackPrices;
}

export function isPriceSetForToday(): boolean {
  const allPrices = loadDailyPrices();
  const todayKey = getTodayKey();
  return !!(allPrices[todayKey] && Object.keys(allPrices[todayKey]).length > 0);
}

export function loadShopSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      const isOldPlaceholder =
        !parsed.shopName ||
        parsed.shopName === 'Fresh Chicken Center' ||
        parsed.phoneNumber === '9876543210';

      const upgradedSettings: ShopSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        shopName: isOldPlaceholder ? DEFAULT_SETTINGS.shopName : (parsed.shopName || DEFAULT_SETTINGS.shopName),
        phoneNumber: isOldPlaceholder ? DEFAULT_SETTINGS.phoneNumber : (parsed.phoneNumber || DEFAULT_SETTINGS.phoneNumber),
        gstNumber: isOldPlaceholder ? DEFAULT_SETTINGS.gstNumber : (parsed.gstNumber || DEFAULT_SETTINGS.gstNumber),
        address: isOldPlaceholder ? DEFAULT_SETTINGS.address : (parsed.address || DEFAULT_SETTINGS.address),
        upiId: isOldPlaceholder ? DEFAULT_SETTINGS.upiId : (parsed.upiId || DEFAULT_SETTINGS.upiId),
        billPrintWidth: parsed.billPrintWidth ? Number(parsed.billPrintWidth) : 17,
        printerPaperWidth: parsed.printerPaperWidth || '80mm',
        printerColumns: parsed.printerColumns ? Number(parsed.printerColumns) : 48,
        printerFeedLines:
          localStorage.getItem('printer_feed_upgraded_v3') !== 'true'
            ? 8
            : parsed.printerFeedLines !== undefined
            ? Number(parsed.printerFeedLines)
            : 8,
        printerAutoCut: parsed.printerAutoCut ?? false,
        securityPin: parsed.securityPin || '1234',
        pinProtectionEnabled: parsed.pinProtectionEnabled ?? false,
        protectDailyPrice: parsed.protectDailyPrice ?? true,
        protectSettings: parsed.protectSettings ?? true,
        protectBillDelete: parsed.protectBillDelete ?? true,
        protectAppLock: parsed.protectAppLock ?? false,
        logoUrl: parsed.logoUrl || '/logo.png',
        withoutSkinOffset:
          parsed.withoutSkinOffset !== undefined
            ? Number(parsed.withoutSkinOffset)
            : 50,
      };

      const needsUpgrade = isOldPlaceholder || localStorage.getItem('printer_feed_upgraded_v3') !== 'true';
      if (needsUpgrade) {
        localStorage.setItem('printer_feed_upgraded_v3', 'true');
        saveShopSettings(upgradedSettings);
      }
      return upgradedSettings;
    }
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
  }
  saveShopSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function saveShopSettings(settings: ShopSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}

export function loadWithoutSkinOffset(): number {
  const settings = loadShopSettings();
  return typeof settings.withoutSkinOffset === 'number' && !isNaN(settings.withoutSkinOffset)
    ? settings.withoutSkinOffset
    : 50;
}

export function saveWithoutSkinOffset(offset: number): void {
  const settings = loadShopSettings();
  settings.withoutSkinOffset = offset;
  saveShopSettings(settings);
}

export function loadBills(): Bill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading bills from localStorage', e);
  }
  return [];
}

export function saveBills(bills: Bill[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  } catch (e) {
    console.error('Error saving bills to localStorage', e);
  }
}

export function addBill(bill: Bill): void {
  const bills = loadBills();
  bills.unshift(bill);
  saveBills(bills);
}

export function updateBill(updatedBill: Bill): void {
  const bills = loadBills();
  const idx = bills.findIndex((b) => b.id === updatedBill.id);
  if (idx !== -1) {
    bills[idx] = updatedBill;
  } else {
    bills.unshift(updatedBill);
  }
  saveBills(bills);
}

export function deleteBillById(id: string): Bill[] {
  const bills = loadBills().filter((b) => b.id !== id);
  saveBills(bills);
  return bills;
}

export function generateNextBillNumber(): string {
  const bills = loadBills();
  if (bills.length === 0) {
    return '1001';
  }
  const maxNum = bills.reduce((max, b) => {
    const num = parseInt(b.billNumber.replace(/\D/g, ''), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 1000);
  return String(maxNum + 1);
}

export function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language;
    if (saved && (saved === 'en' || saved === 'ta')) {
      return saved;
    }
  } catch (e) {
    console.error('Error loading language', e);
  }
  return 'en';
}

export function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch (e) {
    console.error('Error saving language', e);
  }
}

export function loadHotels(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOTELS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading hotels', e);
  }
  return DEFAULT_AROMAKE_HOTELS;
}

export function saveHotels(hotels: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
  } catch (e) {
    console.error('Error saving hotels', e);
  }
}
