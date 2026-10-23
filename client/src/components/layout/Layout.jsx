import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { CartDrawer } from '../customer/CartDrawer';

export const Layout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" style={{ flex: 1 }} tabIndex="-1">
        <Outlet />
      </main>
      <CartDrawer />
      <Footer />
    </div>
  );
};
