export interface ModifierGroup {
  id: string;
  name: string;
  type: "SINGLE" | "MULTIPLE";
  required: boolean;
  minSelect: number;
  maxSelect: number;
  items: ModifierItem[];
}

export interface ModifierItem {
  id: string;
  groupId: string;
  name: string;
  priceAdjust: number;
  available: boolean;
}

export interface SelectedModifier {
  id: string;
  name: string;
  priceAdjust: number;
  groupId: string;
  groupName: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  stockType: "STOK_FISIK" | "NON_STOK" | "JASA";
  available: boolean;
  priceType?: "FIXED" | "FLEXIBLE";
  modifierGroupIds?: string[]; // IDs of modifier groups for this product
}

export interface CartItem extends Product {
  qty: number;
  note?: string;
  selectedModifiers?: SelectedModifier[]; // Selected modifiers for this cart item
  modifierTotal?: number; // Total price adjustment from modifiers
}

export enum PaymentMethod {
  TUNAI = "Tunai",
  PIUTANG = "Piutang",
  QRIS = "QRIS",
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
    allocation: string;
    modifiers?: SelectedModifier[]; // Selected modifiers
    modifierTotal?: number;
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

export type ViewState =
  | "dashboard"
  | "pos"
  | "reports"
  | "items"
  | "settings"
  | "finance";
