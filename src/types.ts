export type Page = 'daily-price' | 'billing' | 'register' | 'total' | 'settings';

export type Language = 'en' | 'ta';

export type ChickenVariant = 'with_skin' | 'without_skin' | 'boneless';

export interface Product {
  id: string;
  name: string; // legacy / primary name
  nameEn?: string; // English name
  nameTa?: string; // Tamil name
  defaultPrice?: number;
}

export function getProductName(product: Product, lang?: string): string {
  if (lang === 'ta') {
    return product.nameTa || product.name || product.nameEn || '';
  }
  return product.nameEn || product.name || product.nameTa || '';
}

export interface DailyPriceMap {
  [date: string]: {
    [productId: string]: number;
  };
}

export interface ShopSettings {
  shopName: string;
  phoneNumber: string;
  gstNumber: string;
  address: string;
  upiId: string;
  withoutSkinOffset?: number; // Extra amount added to With Skin rate for Without Skin (default +50)
}

export interface BillItem {
  productId: string;
  productName: string;
  productNameEn?: string;
  productNameTa?: string;
  variant?: ChickenVariant;
  variantLabel?: string;
  baseRate: number;
  pricePerKg: number;
  kg: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  timestamp: number;
  hotelName?: string;
  items: BillItem[];
  totalAmount: number;
  totalKg: number;
}
