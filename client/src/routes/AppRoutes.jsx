import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { HomePage } from '../pages/customer/HomePage';
import { MenuPage } from '../pages/customer/MenuPage';
import { AboutPage } from '../pages/customer/AboutPage';
import { ContactPage } from '../pages/customer/ContactPage';
import { ReservationPage } from '../pages/customer/ReservationPage';
import { PrivacyPolicyPage } from '../pages/customer/PrivacyPolicyPage';
import { TermsOfServicePage } from '../pages/customer/TermsOfServicePage';
import { CartPage } from '../pages/customer/CartPage';
import { CartCheckoutPage } from '../pages/customer/CartCheckoutPage';
import { OrderTrackingPage } from '../pages/customer/OrderTrackingPage';
import { ProfilePage } from '../pages/customer/ProfilePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Lazy-loaded Admin Modules for code-splitting and bundle performance
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminMenuPage = lazy(() => import('../pages/admin/AdminMenuPage').then(m => ({ default: m.AdminMenuPage })));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })));
const AdminReservationsPage = lazy(() => import('../pages/admin/AdminReservationsPage').then(m => ({ default: m.AdminReservationsPage })));
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })));
const AdminCouponsPage = lazy(() => import('../pages/admin/AdminCouponsPage').then(m => ({ default: m.AdminCouponsPage })));
const AdminNotificationsPage = lazy(() => import('../pages/admin/AdminNotificationsPage').then(m => ({ default: m.AdminNotificationsPage })));
const AdminContactPage = lazy(() => import('../pages/admin/AdminContactPage').then(m => ({ default: m.AdminContactPage })));
const AdminCustomersPage = lazy(() => import('../pages/admin/AdminCustomersPage').then(m => ({ default: m.AdminCustomersPage })));
const AdminStaffPage = lazy(() => import('../pages/admin/AdminStaffPage').then(m => ({ default: m.AdminStaffPage })));
const AdminPaymentsPage = lazy(() => import('../pages/admin/AdminPaymentsPage').then(m => ({ default: m.AdminPaymentsPage })));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Customer Public & Authenticated Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="reservation" element={<ReservationPage />} />
        <Route path="reservations" element={<ReservationPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsOfServicePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CartCheckoutPage />} />
        <Route path="orders/track" element={<OrderTrackingPage />} />
        <Route path="track-order" element={<OrderTrackingPage />} />
        <Route path="track" element={<OrderTrackingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Protected Customer Profile Route */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Dashboard Protected Routes (Admin role strictly required) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Suspense fallback={<LoadingSpinner message="Loading operations console..." />}>
              <AdminLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="menu" element={<AdminMenuPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="reservations" element={<AdminReservationsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="contact" element={<AdminContactPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="staff" element={<AdminStaffPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route
        path="*"
        element={
          <div className="text-center py-24 px-6 text-white bg-slate-950 min-h-screen">
            <h1 className="text-6xl font-serif font-bold text-amber-400 mb-4">404</h1>
            <p className="text-slate-400 text-lg mb-8">The requested culinary page does not exist.</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
            >
              Return to Savoria Home
            </a>
          </div>
        }
      />
    </Routes>
  );
};
