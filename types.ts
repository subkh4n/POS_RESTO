
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  stockType: 'STOK_FISIK' | 'NON_STOK' | 'JASA';
  available: boolean;
  // Added priceType to support flexible pricing models such as donations or open-price items
  priceType?: 'FIXED' | 'FLEXIBLE';
}

export interface CartItem extends Product {
  qty: number;
  note?: string;
}

export enum PaymentMethod {
  TUNAI = 'Tunai',
  PIUTANG = 'Piutang',
  QRIS = 'QRIS',
}

export type Category = string;

export interface OrderPayload {
  orderId: string;
  tableNumber: string;
  orderType: string;
  items: {
    id: string;
    name: string;
    qty: number;
    price: number;
    note: string;
    allocation: string; // Baru: Donasi ke Sosial, lainnya ke Metode Bayar
  }[];
  subtotal: number;
  tax: number;
  total: number;
  cashReceived: number;
  change: number;
  paymentMethod: string;
  timestamp: string;
  debtorName?: string;
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  subtotal: number;
  tax: number;
  total: number;
  cashReceived: number;
  change: number;
  orderType: string;
  tableNumber: string;
  cashier: string;
  paymentMethod?: string;
  items?: any[];
}

export type ViewState = 'dashboard' | 'pos' | 'reports' | 'items' | 'settings' | 'finance';
