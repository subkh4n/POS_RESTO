
import { useState, useCallback, useEffect } from 'react';
import { CartItem, Product } from '../types';

export const useCart = (products: Product[], orderType: string) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Utility to generate a consistent unique key for items
  const getUniqueKey = (item: Product | CartItem, price?: number) => {
    const p = price !== undefined ? price : item.price;
    return `${item.id}-${p}`;
  };

  const addToCart = useCallback((product: Product, customPrice?: number) => {
    setCart(prev => {
      const priceToUse = customPrice !== undefined ? customPrice : product.price;
      const targetKey = getUniqueKey(product, priceToUse);
      
      const existingIndex = prev.findIndex(item => getUniqueKey(item) === targetKey);

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          qty: newCart[existingIndex].qty + 1
        };
        return newCart;
      }

      return [...prev, { ...product, price: priceToUse, qty: 1, note: '' }];
    });
  }, []);

  const updateQty = (id: string, delta: number, uniqueKey: string) => {
    setCart(prev => prev.map((item) => {
      if (getUniqueKey(item) === uniqueKey) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const updatePrice = (id: string, newPrice: number, uniqueKey: string) => {
    setCart(prev => prev.map((item) => {
      if (getUniqueKey(item) === uniqueKey) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const removeItem = (uniqueKey: string) => {
    setCart(prev => prev.filter(item => getUniqueKey(item) !== uniqueKey));
  };

  const clearCart = () => setCart([]);

  // Reactive Logic: Auto-Bungkus (Packaging Fee) management
  useEffect(() => {
    if (products.length === 0) return;

    // Define the identifier for the bungkus item
    const bungkusId = 'V-BUNGKUS';
    
    if (orderType === 'Take Away') {
      // Check if it's already in the cart
      const hasBungkus = cart.some(item => 
        item.id === bungkusId || item.name.toLowerCase().includes('bungkus')
      );
      
      if (!hasBungkus) {
        // Find existing bungkus product or create dummy one
        const bungkusProduct = products.find(p => p.name.toLowerCase().includes('bungkus'));
        if (bungkusProduct) {
          addToCart(bungkusProduct);
        } else {
          // Add default fallback if not found in list
          addToCart({
            id: bungkusId,
            name: 'Biaya Bungkus (TA)',
            price: 2000,
            category: 'Service',
            stock: 0,
            stockType: 'NON_STOK',
            available: true,
            image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=500&q=80'
          });
        }
      }
    } else if (orderType === 'Dine In') {
      // Automatically remove bungkus when switching back to Dine In
      setCart(prev => prev.filter(item => 
        item.id !== bungkusId && !item.name.toLowerCase().includes('bungkus')
      ));
    }
  }, [orderType, products, addToCart]);

  return { cart, addToCart, updateQty, updatePrice, removeItem, clearCart, setCart };
};
