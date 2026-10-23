import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../store/api/apiSlice';
import authReducer from '../store/slices/authSlice';
import menuReducer from '../store/slices/menuSlice';
import cartReducer from '../store/slices/cartSlice';
import orderReducer from '../store/slices/orderSlice';
import reservationReducer from '../store/slices/reservationSlice';

import { AuthProvider } from '../features/auth/authContext';
import { CartProvider } from '../features/cart/cartContext';

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,
      menu: menuReducer,
      cart: cartReducer,
      orders: orderReducer,
      reservations: reservationReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    enhancers: (getDefaultEnhancers) =>
      getDefaultEnhancers({ autoBatch: false }),
    preloadedState
  });
}

export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
