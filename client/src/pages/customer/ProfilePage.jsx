import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMyOrders } from '../../services/orderService';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { Badge } from '../../components/common/Badge';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'orders' | 'security'
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders' && user?.email) {
      setOrdersLoading(true);
      getMyOrders(user.email)
        .then(res => setOrders(res.data || []))
        .catch(err => console.warn('Orders fetch error:', err.message))
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, user]);

  // Profile details state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Keep form data synced when user auth state resolves
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || ''
      });
    }
  }, [user]);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    const errors = {};

    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Full name must not exceed 100 characters.';
    }

    const trimmedPhone = (formData.phone || '').trim();
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Please enter a valid phone number (e.g. +1 555-0199).';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});

    setProfileSaving(true);
    const res = await updateProfile({
      name: trimmedName,
      phone: trimmedPhone,
      address: {
        street: (formData.street || '').trim(),
        city: (formData.city || '').trim(),
        state: (formData.state || '').trim(),
        zipCode: (formData.zipCode || '').trim()
      }
    });

    setProfileSaving(false);
    if (res.success) {
      setProfileSuccess('Profile preferences updated successfully.');
    } else {
      setProfileError(res.message || 'Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Your current password is required.';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters.';
    } else if (passwordData.newPassword.length > 128) {
      errors.newPassword = 'New password must not exceed 128 characters.';
    } else if (passwordData.currentPassword && passwordData.newPassword === passwordData.currentPassword) {
      errors.newPassword = 'New password cannot be identical to your current password.';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'New password and confirmation do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});

    setPasswordSaving(true);
    const res = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    setPasswordSaving(false);

    if (res.success) {
      setPasswordSuccess('Password updated successfully. Other active sessions were invalidated for security.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordError(res.message || 'Failed to change password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
              alt={user?.name || 'Customer Avatar'}
              loading="lazy"
              decoding="async"
              width="96"
              height="96"
              className="w-24 h-24 rounded-full object-cover border-2 border-amber-400/50 shadow-md"
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">{user?.name}</h1>
                <Badge variant={user?.role === 'admin' ? 'accent' : user?.role === 'staff' ? 'primary' : 'neutral'}>
                  {user?.role ? user.role.toUpperCase() : 'CUSTOMER'}
                </Badge>
              </div>
              <p className="text-slate-400 text-sm mb-2">{user?.email}</p>
              <p className="text-xs text-slate-400">
                Savoria Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2026'}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="border border-slate-800 text-slate-300 hover:text-white text-xs">
            Sign Out
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-8 gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-colors border-b-2 ${
              activeTab === 'details'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Personal Information & Address
          </button>
          <button
            id="profile-tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-colors border-b-2 ${
              activeTab === 'orders'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Order History
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-sm font-semibold tracking-wide transition-colors border-b-2 ${
              activeTab === 'security'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Security & Password
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-serif font-bold text-amber-400 mb-6">Personal & Dining Preferences</h2>

            {profileSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} noValidate className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  label="Full Name"
                  id="profile-name"
                  name="name"
                  value={formData.name}
                  onChange={handleDetailsChange}
                  error={profileErrors.name}
                  disabled={profileSaving}
                  required
                />
                <FormField
                  label="Contact Phone"
                  id="profile-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleDetailsChange}
                  error={profileErrors.phone}
                  disabled={profileSaving}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="border-t border-slate-800/80 pt-6">
                <h3 className="text-base font-serif font-semibold text-slate-200 mb-4">Delivery & Billing Address</h3>
                <div className="space-y-4">
                  <FormField
                    label="Street Address"
                    id="profile-street"
                    name="street"
                    value={formData.street}
                    onChange={handleDetailsChange}
                    disabled={profileSaving}
                    placeholder="123 Luxury Boulevard, Penthouse 4"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      label="City"
                      id="profile-city"
                      name="city"
                      value={formData.city}
                      onChange={handleDetailsChange}
                      placeholder="New York"
                    />
                    <FormField
                      label="State / Province"
                      id="profile-state"
                      name="state"
                      value={formData.state}
                      onChange={handleDetailsChange}
                      placeholder="NY"
                    />
                    <FormField
                      label="Postal / ZIP Code"
                      id="profile-zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleDetailsChange}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" disabled={profileSaving}>
                  {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-amber-400">Order History</h2>
                <p className="text-slate-400 text-sm">View your past dining orders and track live statuses.</p>
              </div>
              <Link to="/contact?tab=track">
                <Button variant="ghost" className="border border-slate-800 text-xs text-amber-400">
                  Track By Number
                </Button>
              </Link>
            </div>

            {ordersLoading ? (
              <div className="p-12 text-center text-slate-400">Loading order history...</div>
            ) : orders.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                <ShoppingBag size={40} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-serif text-lg font-bold text-slate-200 mb-1">No Orders Found</h3>
                <p className="text-slate-400 text-sm mb-6">You have not placed any orders with this account yet.</p>
                <Link to="/menu">
                  <Button variant="primary">Explore Culinary Menu</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord._id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-amber-400/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2 mb-4">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">ORDER NUMBER</span>
                        <div className="font-serif text-lg font-bold text-white">{ord.orderNumber}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{formatDate(ord.createdAt)} • Modality: <span className="capitalize text-slate-300 font-semibold">{ord.orderType}</span></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          ord.status === 'cancelled'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : ord.status === 'completed' || ord.status === 'delivered'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {ord.status}
                        </span>
                        <span className="font-serif text-lg font-bold text-amber-400 min-w-[70px] text-right">
                          {formatPrice(ord.totalAmount, ord.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 mb-4">
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-400">
                          <span>{it.quantity}x {it.name}</span>
                          <span>{formatPrice(it.price * it.quantity, ord.currency)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-800/60">
                      <Link to={`/contact?orderNumber=${ord.orderNumber}#track-order`}>
                        <button className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer">
                          Track Live Status <ArrowRight size={13} />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 max-w-xl">
            <h2 className="text-xl font-serif font-bold text-amber-400 mb-2">Security & Authentication</h2>
            <p className="text-slate-400 text-sm mb-6">
              Update your account password. For your protection, updating your password automatically invalidates other active device sessions.
            </p>

            {passwordSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
              <FormField
                label="Current Password"
                id="current-password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.currentPassword}
                disabled={passwordSaving}
                required
              />
              <FormField
                label="New Password"
                id="new-password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.newPassword}
                helperText="Must contain at least 6 characters, max 128 characters."
                disabled={passwordSaving}
                required
              />
              <FormField
                label="Confirm New Password"
                id="confirm-password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.confirmPassword}
                disabled={passwordSaving}
                required
              />

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" disabled={passwordSaving}>
                  {passwordSaving ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
