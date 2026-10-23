import { createSlice } from '@reduxjs/toolkit';

const initialCart = (() => {
  try {
    const saved = localStorage.getItem('savoria_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
})();

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: initialCart,
    isDrawerOpen: false
  },
  reducers: {
    addItem: (state, action) => {
      const dish = action.payload;
      const existing = state.items.find(item => item._id === dish._id);
      if (existing) {
        existing.quantity += (dish.quantity || 1);
      } else {
        state.items.push({ ...dish, quantity: dish.quantity || 1 });
      }
      localStorage.setItem('savoria_cart', JSON.stringify(state.items));
    },
    removeItem: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(item => item._id !== id);
      localStorage.setItem('savoria_cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter(item => item._id !== id);
      } else {
        const item = state.items.find(i => i._id === id);
        if (item) item.quantity = quantity;
      }
      localStorage.setItem('savoria_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('savoria_cart');
    },
    toggleCartDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    setCartDrawer: (state, action) => {
      state.isDrawerOpen = action.payload;
    }
  }
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  toggleCartDrawer,
  setCartDrawer
} = cartSlice.actions;

export default cartSlice.reducer;
