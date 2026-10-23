import React from 'react';
import { AuthProvider } from './features/auth/authContext';
import { CartProvider } from './features/cart/cartContext';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
