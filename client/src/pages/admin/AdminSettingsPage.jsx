import React, { useState, useEffect } from 'react';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation
} from '../../store/api/apiSlice';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Settings,
  Clock,
  MapPin,
  Calendar,
  Save,
  CheckCircle2,
  IndianRupee,
  Building,
  ShieldCheck,
  AlertCircle,
  Megaphone
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AdminSettingsPage = () => {
  const { data: settingsRes, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [form, setForm] = useState({
    restaurantName: 'SAVORIA Haute Cuisine',
    tagline: 'Transcendent Gastronomy & Seasonal Harvests',
    contactEmail: 'concierge@savoria.com',
    contactPhone: '+1 (212) 555-0840',
    taxRatePercent: 8.25,
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'America/New_York',
    autoAcceptOrders: false,
    address: {
      street: '450 Avenue Montaigne',
      city: 'New York',
      state: 'NY',
      zipCode: '10022'
    },
    operatingHours: {
      lunch: { active: true, open: '12:00', close: '15:30' },
      dinner: { active: true, open: '17:00', close: '23:00' },
      closedDays: ['Monday']
    },
    bookingDurationMinutes: 90,
    bufferTimeMinutes: 15,
    slotIntervalMinutes: 30,
    minNoticeHours: 1,
    maxAdvanceDays: 30,
    cancellationNoticeHours: 2,
    homepageBanner: {
      enabled: true,
      badge: 'Seasonal Special',
      text: 'Autumn Truffle Festival — Reserve your exclusive tasting menu table.',
      linkText: 'Reserve Table',
      linkUrl: '/reservations'
    }
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

  useEffect(() => {
    if (settingsRes?.data) {
      const s = settingsRes.data;
      setForm({
        restaurantName: s.restaurantName || 'SAVORIA Haute Cuisine',
        tagline: s.tagline || 'Transcendent Gastronomy & Seasonal Harvests',
        contactEmail: s.contactEmail || 'concierge@savoria.com',
        contactPhone: s.contactPhone || '+1 (212) 555-0840',
        taxRatePercent: s.taxRatePercent !== undefined ? s.taxRatePercent : 8.25,
        currency: s.currency || 'INR',
        currencySymbol: s.currencySymbol || '₹',
        timezone: s.timezone || 'America/New_York',
        autoAcceptOrders: Boolean(s.autoAcceptOrders),
        address: {
          street: s.address?.street || '450 Avenue Montaigne',
          city: s.address?.city || 'New York',
          state: s.address?.state || 'NY',
          zipCode: s.address?.zipCode || '10022'
        },
        operatingHours: {
          lunch: {
            active: s.operatingHours?.lunch?.active !== false,
            open: s.operatingHours?.lunch?.open || '12:00',
            close: s.operatingHours?.lunch?.close || '15:30'
          },
          dinner: {
            active: s.operatingHours?.dinner?.active !== false,
            open: s.operatingHours?.dinner?.open || '17:00',
            close: s.operatingHours?.dinner?.close || '23:00'
          },
          closedDays: s.operatingHours?.closedDays || ['Monday']
        },
        bookingDurationMinutes: s.bookingDurationMinutes || 90,
        bufferTimeMinutes: s.bufferTimeMinutes || 15,
        slotIntervalMinutes: s.slotIntervalMinutes || 30,
        minNoticeHours: s.minNoticeHours || 1,
        maxAdvanceDays: s.maxAdvanceDays || 30,
        cancellationNoticeHours: s.cancellationNoticeHours || 2,
        homepageBanner: {
          enabled: s.homepageBanner?.enabled !== false,
          badge: s.homepageBanner?.badge || 'Seasonal Special',
          text: s.homepageBanner?.text || 'Autumn Truffle Festival — Reserve your exclusive tasting menu table.',
          linkText: s.homepageBanner?.linkText || 'Reserve Table',
          linkUrl: s.homepageBanner?.linkUrl || '/reservations'
        }
      });
    }
  }, [settingsRes]);

  const toggleClosedDay = (day) => {
    setForm(prev => {
      const closed = prev.operatingHours.closedDays || [];
      const isClosed = closed.includes(day);
      return {
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          closedDays: isClosed ? closed.filter(d => d !== day) : [...closed, day]
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    const errors = {};

    const trimmedName = (form.restaurantName || '').trim();
    if (!trimmedName) {
      errors.restaurantName = 'Restaurant name is required.';
    } else if (trimmedName.length < 2) {
      errors.restaurantName = 'Restaurant name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      errors.restaurantName = 'Restaurant name must not exceed 100 characters.';
    }

    const trimmedEmail = (form.contactEmail || '').trim();
    if (!trimmedEmail) {
      errors.contactEmail = 'Concierge email is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.contactEmail = 'Please provide a valid email address.';
    }

    const trimmedPhone = (form.contactPhone || '').trim();
    if (!trimmedPhone) {
      errors.contactPhone = 'Concierge phone is required.';
    } else if (!PHONE_REGEX.test(trimmedPhone)) {
      errors.contactPhone = 'Please provide a valid phone number (e.g. +1 212-555-0840).';
    }

    const tax = Number(form.taxRatePercent);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      errors.taxRatePercent = 'Tax rate percentage must be between 0 and 100.';
    }

    const duration = Number(form.bookingDurationMinutes);
    if (isNaN(duration) || duration < 30 || duration > 240) {
      errors.bookingDurationMinutes = 'Booking duration must be between 30 and 240 minutes.';
    }

    const buffer = Number(form.bufferTimeMinutes);
    if (isNaN(buffer) || buffer < 0 || buffer > 60) {
      errors.bufferTimeMinutes = 'Buffer time must be between 0 and 60 minutes.';
    }

    const interval = Number(form.slotIntervalMinutes);
    if (isNaN(interval) || interval < 15 || interval > 60) {
      errors.slotIntervalMinutes = 'Slot interval must be between 15 and 60 minutes.';
    }

    const minNotice = Number(form.minNoticeHours);
    if (isNaN(minNotice) || minNotice < 0 || minNotice > 168) {
      errors.minNoticeHours = 'Minimum notice must be between 0 and 168 hours.';
    }

    const maxAdvance = Number(form.maxAdvanceDays);
    if (isNaN(maxAdvance) || maxAdvance < 1 || maxAdvance > 365) {
      errors.maxAdvanceDays = 'Max advance booking must be between 1 and 365 days.';
    }

    const cancelNotice = Number(form.cancellationNoticeHours);
    if (isNaN(cancelNotice) || cancelNotice < 0 || cancelNotice > 168) {
      errors.cancellationNoticeHours = 'Cancellation cutoff must be between 0 and 168 hours.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError('Please correct the highlighted form errors before saving.');
      return;
    }
    setFieldErrors({});

    try {
      await updateSettings(form).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err?.data?.message || err.message || 'Failed to save restaurant settings.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving restaurant business configuration..." />;
  }

  return (
    <div className="admin-settings-page p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Restaurant Business Settings
          </h1>
          <p className="text-slate-400 text-sm">
            Manage operational branding, business hours, reservation buffers, and policies.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 size={15} /> Settings Updated in Real-Time
          </div>
        )}
      </div>

      {saveError && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} className="flex-shrink-0 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Section 1: Brand & Contact Info */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building size={18} className="text-amber-400" />
            Establishment Identity & Contact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="settings-res-name" className="text-slate-400 font-semibold block mb-1">Restaurant Name *</label>
              <input
                id="settings-res-name"
                type="text"
                value={form.restaurantName}
                onChange={(e) => {
                  setForm({ ...form, restaurantName: e.target.value });
                  if (fieldErrors.restaurantName) setFieldErrors(prev => ({ ...prev, restaurantName: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.restaurantName ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
                aria-invalid={!!fieldErrors.restaurantName}
                aria-describedby={fieldErrors.restaurantName ? 'res-name-error' : undefined}
              />
              {fieldErrors.restaurantName && (
                <span id="res-name-error" role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.restaurantName}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="settings-res-tagline" className="text-slate-400 font-semibold block mb-1">Tagline / Motto</label>
              <input
                id="settings-res-tagline"
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label htmlFor="settings-res-email" className="text-slate-400 font-semibold block mb-1">Concierge Email *</label>
              <input
                id="settings-res-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => {
                  setForm({ ...form, contactEmail: e.target.value });
                  if (fieldErrors.contactEmail) setFieldErrors(prev => ({ ...prev, contactEmail: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.contactEmail ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
                aria-invalid={!!fieldErrors.contactEmail}
                aria-describedby={fieldErrors.contactEmail ? 'res-email-error' : undefined}
              />
              {fieldErrors.contactEmail && (
                <span id="res-email-error" role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.contactEmail}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="settings-res-phone" className="text-slate-400 font-semibold block mb-1">Concierge Phone *</label>
              <input
                id="settings-res-phone"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => {
                  setForm({ ...form, contactPhone: e.target.value });
                  if (fieldErrors.contactPhone) setFieldErrors(prev => ({ ...prev, contactPhone: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.contactPhone ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
                aria-invalid={!!fieldErrors.contactPhone}
                aria-describedby={fieldErrors.contactPhone ? 'res-phone-error' : undefined}
              />
              {fieldErrors.contactPhone && (
                <span id="res-phone-error" role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.contactPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Address & Currency */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <MapPin size={18} className="text-amber-400" />
            Physical Address & Tax Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="text-slate-400 font-semibold block mb-1">Street Address</label>
              <input
                type="text"
                value={form.address.street}
                onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold block mb-1">City</label>
              <input
                type="text"
                value={form.address.city}
                onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Zip / Postal Code</label>
              <input
                type="text"
                value={form.address.zipCode}
                onChange={(e) => setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">State / Province</label>
              <input
                type="text"
                value={form.address.state}
                onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label htmlFor="settings-tax-rate" className="text-slate-400 font-semibold block mb-1">Sales Tax Rate (%)</label>
              <input
                id="settings-tax-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.taxRatePercent}
                onChange={(e) => {
                  setForm({ ...form, taxRatePercent: parseFloat(e.target.value) || 0 });
                  if (fieldErrors.taxRatePercent) setFieldErrors(prev => ({ ...prev, taxRatePercent: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.taxRatePercent ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
              />
              {fieldErrors.taxRatePercent && (
                <span role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.taxRatePercent}
                </span>
              )}
            </div>
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Currency Code</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Operating Hours */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock size={18} className="text-amber-400" />
            Operating Service Windows & Timezone
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Configured Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              </select>
            </div>

            {/* Lunch Service */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Lunch Service</span>
                <input
                  type="checkbox"
                  checked={form.operatingHours.lunch.active}
                  onChange={(e) => setForm({
                    ...form,
                    operatingHours: {
                      ...form.operatingHours,
                      lunch: { ...form.operatingHours.lunch, active: e.target.checked }
                    }
                  })}
                  className="rounded accent-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Open</label>
                  <input
                    type="time"
                    value={form.operatingHours.lunch.open}
                    onChange={(e) => setForm({
                      ...form,
                      operatingHours: {
                        ...form.operatingHours,
                        lunch: { ...form.operatingHours.lunch, open: e.target.value }
                      }
                    })}
                    className="w-full p-1.5 rounded bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Close</label>
                  <input
                    type="time"
                    value={form.operatingHours.lunch.close}
                    onChange={(e) => setForm({
                      ...form,
                      operatingHours: {
                        ...form.operatingHours,
                        lunch: { ...form.operatingHours.lunch, close: e.target.value }
                      }
                    })}
                    className="w-full p-1.5 rounded bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Dinner Service */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Dinner Service</span>
                <input
                  type="checkbox"
                  checked={form.operatingHours.dinner.active}
                  onChange={(e) => setForm({
                    ...form,
                    operatingHours: {
                      ...form.operatingHours,
                      dinner: { ...form.operatingHours.dinner, active: e.target.checked }
                    }
                  })}
                  className="rounded accent-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Open</label>
                  <input
                    type="time"
                    value={form.operatingHours.dinner.open}
                    onChange={(e) => setForm({
                      ...form,
                      operatingHours: {
                        ...form.operatingHours,
                        dinner: { ...form.operatingHours.dinner, open: e.target.value }
                      }
                    })}
                    className="w-full p-1.5 rounded bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Close</label>
                  <input
                    type="time"
                    value={form.operatingHours.dinner.close}
                    onChange={(e) => setForm({
                      ...form,
                      operatingHours: {
                        ...form.operatingHours,
                        dinner: { ...form.operatingHours.dinner, close: e.target.value }
                      }
                    })}
                    className="w-full p-1.5 rounded bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Closed Days Selector */}
          <div className="pt-2">
            <label className="text-slate-400 font-semibold block mb-2 text-xs">
              Closed Days (No Bookings or Dine-In Allowed)
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => {
                const isClosed = form.operatingHours.closedDays?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleClosedDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isClosed
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {day} {isClosed ? '• Closed' : '• Open'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Reservation & Table Booking Policies */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Calendar size={18} className="text-amber-400" />
            Table Booking & Cancellation Policies
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="settings-booking-duration" className="text-slate-400 font-semibold block mb-1">Standard Duration (Minutes)</label>
              <input
                id="settings-booking-duration"
                type="number"
                min="30"
                max="240"
                value={form.bookingDurationMinutes}
                onChange={(e) => {
                  setForm({ ...form, bookingDurationMinutes: parseInt(e.target.value, 10) || 90 });
                  if (fieldErrors.bookingDurationMinutes) setFieldErrors(prev => ({ ...prev, bookingDurationMinutes: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.bookingDurationMinutes ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
              />
              {fieldErrors.bookingDurationMinutes && (
                <span role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.bookingDurationMinutes}
                </span>
              )}
              <span className="text-[10px] text-slate-500">Seating duration per table booking</span>
            </div>

            <div>
              <label htmlFor="settings-buffer-time" className="text-slate-400 font-semibold block mb-1">Buffer / Turn Time (Minutes)</label>
              <input
                id="settings-buffer-time"
                type="number"
                min="0"
                max="60"
                value={form.bufferTimeMinutes}
                onChange={(e) => {
                  setForm({ ...form, bufferTimeMinutes: parseInt(e.target.value, 10) || 15 });
                  if (fieldErrors.bufferTimeMinutes) setFieldErrors(prev => ({ ...prev, bufferTimeMinutes: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.bufferTimeMinutes ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
              />
              {fieldErrors.bufferTimeMinutes && (
                <span role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.bufferTimeMinutes}
                </span>
              )}
              <span className="text-[10px] text-slate-500">Sanitation and reset buffer between seatings</span>
            </div>

            <div>
              <label htmlFor="settings-slot-interval" className="text-slate-400 font-semibold block mb-1">Slot Interval (Minutes)</label>
              <input
                id="settings-slot-interval"
                type="number"
                min="15"
                max="60"
                value={form.slotIntervalMinutes}
                onChange={(e) => {
                  setForm({ ...form, slotIntervalMinutes: parseInt(e.target.value, 10) || 30 });
                  if (fieldErrors.slotIntervalMinutes) setFieldErrors(prev => ({ ...prev, slotIntervalMinutes: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.slotIntervalMinutes ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
              />
              {fieldErrors.slotIntervalMinutes && (
                <span role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.slotIntervalMinutes}
                </span>
              )}
              <span className="text-[10px] text-slate-500">Booking intervals (e.g. 18:00, 18:30)</span>
            </div>

            <div>
              <label htmlFor="settings-min-notice" className="text-slate-400 font-semibold block mb-1">Min Advance Notice (Hours)</label>
              <input
                id="settings-min-notice"
                type="number"
                min="0"
                max="168"
                value={form.minNoticeHours}
                onChange={(e) => {
                  setForm({ ...form, minNoticeHours: parseInt(e.target.value, 10) || 1 });
                  if (fieldErrors.minNoticeHours) setFieldErrors(prev => ({ ...prev, minNoticeHours: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.minNoticeHours ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
              />
              {fieldErrors.minNoticeHours && (
                <span role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.minNoticeHours}
                </span>
              )}
              <span className="text-[10px] text-slate-500">Minimum notice before slot start</span>
            </div>

            <div>
              <label htmlFor="settings-max-advance" className="text-slate-400 font-semibold block mb-1">Max Advance Booking (Days)</label>
              <input
                id="settings-max-advance"
                type="number"
                min="1"
                max="365"
                value={form.maxAdvanceDays}
                onChange={(e) => {
                  setForm({ ...form, maxAdvanceDays: parseInt(e.target.value, 10) || 30 });
                  if (fieldErrors.maxAdvanceDays) setFieldErrors(prev => ({ ...prev, maxAdvanceDays: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.maxAdvanceDays ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
              />
              {fieldErrors.maxAdvanceDays && (
                <span role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.maxAdvanceDays}
                </span>
              )}
              <span className="text-[10px] text-slate-500">How far in advance patrons can book</span>
            </div>

            <div>
              <label htmlFor="settings-cancel-notice" className="text-slate-400 font-semibold block mb-1">Cancellation Cutoff (Hours)</label>
              <input
                id="settings-cancel-notice"
                type="number"
                min="0"
                max="168"
                value={form.cancellationNoticeHours}
                onChange={(e) => {
                  setForm({ ...form, cancellationNoticeHours: parseInt(e.target.value, 10) || 2 });
                  if (fieldErrors.cancellationNoticeHours) setFieldErrors(prev => ({ ...prev, cancellationNoticeHours: '' }));
                }}
                className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white focus:outline-none focus:border-amber-400 ${
                  fieldErrors.cancellationNoticeHours ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                }`}
              />
              {fieldErrors.cancellationNoticeHours && (
                <span role="alert" className="text-rose-400 text-xs mt-1 block">
                  {fieldErrors.cancellationNoticeHours}
                </span>
              )}
              <span className="text-[10px] text-slate-500">Notice required for guest self-cancellation</span>
            </div>
          </div>
        </div>

        {/* Section 5: Homepage Announcement Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone size={18} className="text-amber-400" />
              Homepage Announcement Banner
            </h2>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={form.homepageBanner?.enabled}
                onChange={(e) => setForm({
                  ...form,
                  homepageBanner: {
                    ...form.homepageBanner,
                    enabled: e.target.checked
                  }
                })}
                className="rounded accent-amber-400"
              />
              Enable Banner on Home Page
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Badge Tag</label>
              <input
                type="text"
                placeholder="e.g. Seasonal Special, Michelin Tasting, etc."
                value={form.homepageBanner?.badge || ''}
                onChange={(e) => setForm({
                  ...form,
                  homepageBanner: {
                    ...form.homepageBanner,
                    badge: e.target.value
                  }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Call to Action Link URL</label>
              <input
                type="text"
                placeholder="/reservations or /menu"
                value={form.homepageBanner?.linkUrl || ''}
                onChange={(e) => setForm({
                  ...form,
                  homepageBanner: {
                    ...form.homepageBanner,
                    linkUrl: e.target.value
                  }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-400 font-semibold block mb-1">Banner Announcement Message</label>
              <input
                type="text"
                placeholder="Autumn Truffle Festival — Reserve your exclusive tasting menu table."
                value={form.homepageBanner?.text || ''}
                onChange={(e) => setForm({
                  ...form,
                  homepageBanner: {
                    ...form.homepageBanner,
                    text: e.target.value
                  }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Button / Link Label</label>
              <input
                type="text"
                placeholder="Reserve Table"
                value={form.homepageBanner?.linkText || ''}
                onChange={(e) => setForm({
                  ...form,
                  homepageBanner: {
                    ...form.homepageBanner,
                    linkText: e.target.value
                  }
                })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400">
            Ensure operating hours reflect kitchen readiness. Saved updates take effect immediately across customer pages.
          </div>
          <Button type="submit" variant="primary" size="md" disabled={isSaving} className="flex items-center gap-2">
            <Save size={16} />
            {isSaving ? 'Saving Configurations...' : 'Save Restaurant Configurations'}
          </Button>
        </div>
      </form>
    </div>
  );
};
