import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Tags,
  CalendarCheck,
  Users,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
  ArrowLeft,
  LogOut,
  ShieldAlert,
  Star,
  TicketPercent,
  Mail,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Keyboard accessibility: Escape key closes admin mobile drawer
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const navItems = [
    { label: 'Executive Overview', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Orders & Dispatch', path: '/admin/orders', icon: <ClipboardList size={18} /> },
    { label: 'Culinary Menu', path: '/admin/menu', icon: <UtensilsCrossed size={18} /> },
    { label: 'Dish Categories', path: '/admin/categories', icon: <Tags size={18} /> },
    { label: 'Table Reservations', path: '/admin/reservations', icon: <CalendarCheck size={18} /> },
    { label: 'Guest Reviews', path: '/admin/reviews', icon: <Star size={18} /> },
    { label: 'Promos & Coupons', path: '/admin/coupons', icon: <TicketPercent size={18} /> },
    { label: 'Email Notifications', path: '/admin/notifications', icon: <Mail size={18} /> },
    { label: 'Guest Messages', path: '/admin/contact', icon: <MessageSquare size={18} /> },
    { label: 'Customer Directory', path: '/admin/customers', icon: <Users size={18} /> },
    { label: 'Staff & Roles', path: '/admin/staff', icon: <ShieldCheck size={18} /> },
    { label: 'Payments & Ledger', path: '/admin/payments', icon: <CreditCard size={18} /> },
    { label: 'Business Reports', path: '/admin/reports', icon: <BarChart3 size={18} /> },
    { label: 'Restaurant Settings', path: '/admin/settings', icon: <Settings size={18} /> }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] flex">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Off-canvas on mobile, static on lg+ */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[270px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col p-5 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        style={{ height: '100vh' }}
      >
        {/* Brand & Mobile Close Button */}
        <div className="flex items-center justify-between mb-5 pl-1">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[rgba(255,99,71,0.15)] flex items-center justify-center text-[var(--accent-coral)]">
                <ShieldAlert size={18} />
              </div>
              <span className="font-serif text-lg font-bold tracking-wide text-white">
                SAVORIA HQ
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest block">
              Restaurant Management
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close admin menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
          {navItems.map(item => {
            const active = item.path === '/admin'
              ? (location.pathname === '/admin' || location.pathname === '/admin/dashboard')
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: active ? '#fff' : 'var(--text-secondary)',
                  backgroundColor: active ? 'rgba(230, 175, 93, 0.15)' : 'transparent',
                  border: active ? '1px solid rgba(230, 175, 93, 0.3)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <span style={{ color: active ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}
          >
            <ArrowLeft size={16} /> Return to Guest Site
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'var(--accent-coral)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <LogOut size={16} /> Sign Out Admin
          </button>
        </div>
      </aside>

      {/* Main Admin View */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <a href="#admin-main-content" className="skip-link">
          Skip to operations console
        </a>
        {/* Top Header */}
        <header className="h-[68px] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="text-sm sm:text-base font-semibold text-[var(--text-secondary)] truncate">
              Operations Console
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              KITCHEN ONLINE
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-none">
                {user?.name || 'Chef Alexandre Moreau'}
              </div>
              <div className="text-[10px] sm:text-xs text-[var(--accent-gold)]">Executive Admin</div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main id="admin-main-content" tabIndex="-1" className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          <React.Suspense fallback={<LoadingSpinner message="Loading operations module..." />}>
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};
