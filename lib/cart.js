'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('designbaju_cart');
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    try {
      const minimalItems = cartItems.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        preview_image: item.preview_image,
        category: item.category || item.category_name || '',
        quantity: item.quantity || 1
      }));
      localStorage.setItem('designbaju_cart', JSON.stringify(minimalItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cartItems]);

  const addToCart = (design) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.id === design.id);
      if (exists) return prev; // Digital products - no duplicates
      
      const cartItem = {
        id: design.id,
        title: design.title,
        price: design.price,
        preview_image: design.preview_image,
        category: design.category || design.category_name || '',
        quantity: 1
      };
      return [...prev, cartItem];
    });
  };

  const removeFromCart = (designId) => {
    setCartItems(prev => prev.filter(item => item.id !== designId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (designId) => {
    return cartItems.some(item => item.id === designId);
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
  const totalItems = cartItems.length;

  return (
    <CartContext.Provider value={{
      cartItems, isCartOpen, setIsCartOpen,
      addToCart, removeFromCart, clearCart, isInCart,
      totalPrice, totalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
