import React, { createContext, useContext, useState, useEffect } from 'react';
import CartService from '../API/CartService';
import { AuthContext } from './index';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const { isAuth } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  async function fetchCart() {
    try {
      const res = await CartService.getCart();
      setItems(res.data?.items || []);
    } catch {}
  }

  useEffect(() => {
    if (isAuth) fetchCart();
    else setItems([]);
  }, [isAuth]);

  async function addItem(trackId) {
    await CartService.add(trackId);
    await fetchCart();
  }

  async function removeItem(trackId) {
    await CartService.remove(trackId);
    await fetchCart();
  }

  return (
    <CartCtx.Provider value={{ items, fetchCart, addItem, removeItem }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  return useContext(CartCtx);
}
