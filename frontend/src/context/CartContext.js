import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({ items: [] });
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await cartService.getCart(token);
      setCart(response.data || { items: [] });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!token) {
      alert('Please login to add items to cart');
      return { success: false };
    }

    try {
      const response = await cartService.addToCart(token, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl
      });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return { success: false, error: error.response?.data?.error };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (!token) return;

    try {
      const response = await cartService.updateCartItem(token, productId, { quantity });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to update cart:', error);
    }
  };

  const removeFromCart = async (productId) => {
    if (!token) return;

    try {
      const response = await cartService.removeFromCart(token, productId);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!token) return;

    try {
      await cartService.clearCart(token);
      setCart({ items: [] });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const getCartTotal = () => {
    if (!cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    if (!cart.items) return 0;
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    fetchCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
