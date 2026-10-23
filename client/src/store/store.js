import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import authReducer from './slices/authSlice';
import menuReducer from './slices/menuSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import reservationReducer from './slices/reservationSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    menu: menuReducer,
    cart: cartReducer,
    orders: orderReducer,
    reservations: reservationReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware)
});

export default store;
