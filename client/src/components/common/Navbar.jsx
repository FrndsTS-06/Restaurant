import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, UtensilsCrossed, User, Shield, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

export const Navbar = () => {
  const location = useLocation();
  const { totalCount, toggleDrawer } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Keyboard navigation: Escape closes mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Reservations', path: '/reservation' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b0c10]/95 backdrop-blur-md border-b border-white/10 transition-colors">
      <div className="container mx-auto h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <UtensilsCrossed size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="font-serif text-lg sm:text-2xl font-bold tracking-wider text-white">
              SAVORIA
            </div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-amber-400 font-semibold -mt-1">
              Haute Cuisine
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2.5">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs xl:text-sm font-medium tracking-wide transition-all px-2.5 xl:px-3.5 py-1.5 rounded-full ${
                isActive(link.path)
                  ? 'text-amber-300 font-semibold bg-amber-400/15 border border-amber-400/30 shadow-sm shadow-amber-500/10'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 ml-1 xl:ml-2 px-2.5 xl:px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all"
            >
              <Shield size={13} />
              <span className="hidden xl:inline">Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-3 shrink-0">
          {/* Cart Icon Drawer Trigger */}
          <button
            id="nav-cart-btn"
            onClick={toggleDrawer}
            aria-label="View Shopping Cart"
            className="relative p-2 sm:p-2.5 rounded-full bg-[#161822] border border-white/10 text-slate-200 hover:border-amber-400/40 hover:text-amber-400 transition-all"
          >
            <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {totalCount}
              </span>
            )}
          </button>

          {/* Account Profile / Login */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/profile"
                id="nav-profile-link"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                title="View Profile"
                aria-label="View Profile"
              >
                <div className="hidden xl:block text-right">
                  <div className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-amber-400 capitalize">{user.role}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </Link>
              <button
                id="nav-logout-btn"
                onClick={logout}
                title="Log Out"
                aria-label="Log Out"
                className="p-2 sm:p-2.5 rounded-full bg-[#161822] border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-400/30 transition-all cursor-pointer"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              id="nav-signin-link"
              className="inline-flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-semibold hover:bg-amber-500/25 transition-all shadow-sm"
            >
              <User size={14} className="sm:w-[15px] sm:h-[15px]" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Mobile Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            className="lg:hidden p-1.5 sm:p-2 text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
          >
            {mobileMenuOpen ? <X size={22} className="sm:w-[26px] sm:h-[26px]" /> : <Menu size={22} className="sm:w-[26px] sm:h-[26px]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-20 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="relative z-40 lg:hidden bg-[#13151b] border-b border-white/10 px-6 py-6 space-y-4 animate-fade-in shadow-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-base font-medium transition-colors ${
                  isActive(link.path) ? 'text-amber-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-300 hover:text-amber-400"
            >
              Cart & Order Checkout ({totalCount})
            </Link>

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-semibold text-rose-400 pt-2 border-t border-white/10"
              >
                Admin Management Portal
              </Link>
            )}
          </div>
        </>
      )}
    </header>
  );
};
