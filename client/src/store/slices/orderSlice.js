import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    ordersList: [],
    currentOrder: null,
    isLoading: false,
    error: null
  },
  reducers: {
    setOrdersList: (state, action) => {
      state.ordersList = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
      state.isLoading = false;
    },
    updateOrderStatusLocal: (state, action) => {
      const { id, status } = action.payload;
      const order = state.ordersList.find(o => o._id === id || o.orderNumber === id);
      if (order) order.status = status;
      if (state.currentOrder && (state.currentOrder._id === id || state.currentOrder.orderNumber === id)) {
        state.currentOrder.status = status;
      }
    },
    setOrderLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setOrderError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});

export const {
  setOrdersList,
  setCurrentOrder,
  updateOrderStatusLocal,
  setOrderLoading,
  setOrderError
} = orderSlice.actions;

export default orderSlice.reducer;
