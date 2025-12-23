import { useState, useCallback, useEffect } from "react";
import { Product, TransactionRecord, ModifierGroup } from "../types";
import {
  getProducts,
  getCategories,
  getTransactions,
  getModifiers,
} from "../services/api";

const CACHE_KEYS = {
  PRODUCTS: "pos_cache_products",
  CATEGORIES: "pos_cache_categories",
  TRANSACTIONS: "pos_cache_transactions",
  MODIFIERS: "pos_cache_modifiers",
  TIMESTAMP: "pos_cache_timestamp",
};

export const useAppData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Cache First (Instant)
  useEffect(() => {
    const cachedProducts = localStorage.getItem(CACHE_KEYS.PRODUCTS);
    const cachedCategories = localStorage.getItem(CACHE_KEYS.CATEGORIES);
    const cachedTransactions = localStorage.getItem(CACHE_KEYS.TRANSACTIONS);
    const cachedModifiers = localStorage.getItem(CACHE_KEYS.MODIFIERS);

    if (cachedProducts) setProducts(JSON.parse(cachedProducts));
    if (cachedCategories) setCategories(JSON.parse(cachedCategories));
    if (cachedTransactions) setTransactions(JSON.parse(cachedTransactions));
    if (cachedModifiers) setModifierGroups(JSON.parse(cachedModifiers));

    // If we have cache, we are "not loading" but still validating
    if (cachedProducts) setIsLoading(false);
  }, []);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [prodData, catData, transData, modData] = await Promise.all([
        getProducts(),
        getCategories(),
        getTransactions(),
        getModifiers(),
      ]);

      // Update State
      setProducts(prodData);
      const newCats = [{ name: "All Menu" }, ...catData];
      setCategories(newCats);
      setTransactions(transData);
      setModifierGroups(modData.groups);

      // Save to Cache
      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(prodData));
      localStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(newCats));
      localStorage.setItem(CACHE_KEYS.TRANSACTIONS, JSON.stringify(transData));
      localStorage.setItem(
        CACHE_KEYS.MODIFIERS,
        JSON.stringify(modData.groups)
      );
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
    } catch (err) {
      console.error("Data fetch error", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    products,
    categories,
    transactions,
    modifierGroups,
    isLoading,
    fetchData,
    setProducts,
    setTransactions,
  };
};
