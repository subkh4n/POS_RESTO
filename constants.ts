import { Product } from "./types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "DON-001",
    name: "Donasi Sosial",
    price: 0,
    category: "Donasi",
    stock: 0,
    stockType: "NON_STOK",
    priceType: "FLEXIBLE",
    available: true,
    image:
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "1",
    name: "Nasi Goreng Special",
    price: 25000,
    category: "Food",
    stock: 45,
    stockType: "STOK_FISIK",
    available: true,
    image:
      "https://images.unsplash.com/photo-1603133872878-684f208fb74b?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "2",
    name: "Ayam Bakar Madu",
    price: 30000,
    category: "Food",
    stock: 20,
    stockType: "STOK_FISIK",
    available: true,
    image:
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "3",
    name: "Cheese Burger",
    price: 35000,
    category: "Food",
    stock: 15,
    stockType: "STOK_FISIK",
    available: true,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "5",
    name: "Es Teh Manis",
    price: 5000,
    category: "Drinks",
    stock: 100,
    stockType: "STOK_FISIK",
    available: true,
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80",
  },
];
export const GOOGLE_SCRIPT_URL =
  import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbzkXQJE319YC4flmt00jtYZLCQhuYQ4k6jzD6SU97ny3RdMfk0OM23VwRjGlK8uLLV8/exec";
