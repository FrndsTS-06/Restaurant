import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCart as getCartApi,
  addItemToCart as addItemToCartApi,
  updateCartItem as updateCartItemApi,
  removeCartItem as removeCartItemApi,
  updateCartOrderType as updateCartOrderTypeApi,
  applyCoupon as applyCouponApi,
  clearCart as clearCartApi
} from '../../services/cartService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('savoria_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [orderType, setOrderTypeState] = useState('delivery');
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to map backend cart document to client state
  const syncFromBackendCart = (cart) => {
    if (!cart) return;
    if (cart.items) {
      const mappedItems = cart.items.map(item => ({
        _id: item.menuItem?._id || item.menuItem || item._id,
        cartItemId: item._id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.menuItem?.image || '',
        category: item.menuItem?.category || '',
        specialInstructions: item.specialInstructions || ''
      }));
      setCartItems(mappedItems);
      localStorage.setItem('savoria_cart', JSON.stringify(mappedItems));
    }
    if (cart.orderType) setOrderTypeState(cart.orderType);
    if (cart.subtotal !== undefined) setSubtotal(cart.subtotal);
    if (cart.tax !== undefined) setTax(cart.tax);
    if (cart.deliveryFee !== undefined) setDeliveryFee(cart.deliveryFee);
    if (cart.discount !== undefined) setDiscount(cart.discount);
    if (cart.couponCode !== undefined) setCouponCode(cart.couponCode);
    if (cart.totalAmount !== undefined) setTotal(cart.totalAmount);
  };

  // Sync with backend on mount
  const refreshCart = useCallback(async () => {
    try {
      const res = await getCartApi();
      if (res && res.data) {
        syncFromBackendCart(res.data);
      }
    } catch (err) {
      console.warn('Initial cart sync notice:', err.message);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Fallback recalculation for offline or local preview
  useEffect(() => {
    const calcSubtotal = Math.round(
      cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0) * 100
    ) / 100;
    const calcTax = Math.round(calcSubtotal * 0.0825 * 100) / 100;
    const calcDeliveryFee = orderType === 'delivery' && calcSubtotal > 0
      ? (calcSubtotal >= 100 ? 0 : 5.00)
      : 0;
    const calcTotal = Math.max(
      0,
      Math.round((calcSubtotal + calcTax + calcDeliveryFee - discount) * 100) / 100
    );

    setSubtotal(calcSubtotal);
    setTax(calcTax);
    setDeliveryFee(calcDeliveryFee);
    setTotal(calcTotal);
    localStorage.setItem('savoria_cart', JSON.stringify(cartItems));
  }, [cartItems, orderType, discount]);

  const addToCart = async (dish, quantity = 1, specialInstructions = '') => {
    const dishId = dish._id || dish.menuItemId;
    // Optimistic update
    setCartItems(prev => {
      const existing = prev.find(item => item._id === dishId);
      if (existing) {
        return prev.map(item =>
          item._id === dishId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        _id: dishId,
        name: dish.name,
        price: Number(dish.price),
        image: dish.image || '',
        category: dish.category || '',
        quantity,
        specialInstructions
      }];
    });

    try {
      const res = await addItemToCartApi(dishId, quantity, specialInstructions);
      if (res && res.data) {
        syncFromBackendCart(res.data);
      }
    } catch (err) {
      console.error('Failed to sync item to persistent cart:', err.message);
    }
  };

  const removeFromCart = async (dishId) => {
    const itemToRemove = cartItems.find(item => item._id === dishId);
    setCartItems(prev => prev.filter(item => item._id !== dishId));

    if (itemToRemove && itemToRemove.cartItemId) {
      try {
        const res = await removeCartItemApi(itemToRemove.cartItemId);
        if (res && res.data) {
          syncFromBackendCart(res.data);
        }
      } catch (err) {
        console.warn('Remove item backend error:', err.message);
      }
    }
  };

  const updateQuantity = async (dishId, newQty) => {
    if (newQty <= 0) {
      await removeFromCart(dishId);
      return;
    }

    const itemToUpdate = cartItems.find(item => item._id === dishId);
    setCartItems(prev =>
      prev.map(item => (item._id === dishId ? { ...item, quantity: newQty } : item))
    );

    if (itemToUpdate && itemToUpdate.cartItemId) {
      try {
        const res = await updateCartItemApi(itemToUpdate.cartItemId, newQty);
        if (res && res.data) {
          syncFromBackendCart(res.data);
        }
      } catch (err) {
        console.warn('Update quantity backend error:', err.message);
      }
    }
  };

  const updateOrderType = async (newType) => {
    setOrderTypeState(newType);
    try {
      const res = await updateCartOrderTypeApi(newType);
      if (res && res.data) {
        syncFromBackendCart(res.data);
      }
    } catch (err) {
      console.warn('Update order type error:', err.message);
    }
  };

  const applyPromoCode = async (code) => {
    setLoading(true);
    try {
      const res = await applyCouponApi(code);
      if (res && res.data) {
        syncFromBackendCart(res.data);
        return { success: true, message: `Coupon '${code}' applied successfully` };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Invalid coupon' };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    setDiscount(0);
    setCouponCode('');
    localStorage.removeItem('savoria_cart');
    try {
      await clearCartApi();
    } catch (err) {
      console.warn('Clear cart error:', err.message);
    }
  };

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateOrderType,
        setOrderType: updateOrderType,
        applyPromoCode,
        clearCart,
        refreshCart,
        totalCount,
        subtotal,
        tax,
        deliveryFee,
        discount,
        couponCode,
        total,
        orderType,
        loading,
        isDrawerOpen,
        setIsDrawerOpen,
        toggleDrawer: () => setIsDrawerOpen(prev => !prev)
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => useContext(CartContext);
