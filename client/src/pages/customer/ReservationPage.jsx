import React, { useState, useEffect } from 'react';
import {
  createReservation,
  getReservationAvailability,
  getMyReservations,
  cancelReservation
} from '../../services/reservationService';
import { useAuthContext } from '../../features/auth/authContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ShieldCheck,
  Search,
  Ban,
  Check,
  XCircle,
  MapPin,
  UtensilsCrossed
} from 'lucide-react';

export const ReservationPage = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'history'

  // Booking Form State
  const [formData, setFormData] = useState({
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: user?.phone || '',
    guestsCount: 2,
    reservationDate: new Date().toISOString().split('T')[0],
    timeSlot: '19:00',
    seatingPreference: 'Main Dining Salon',
    specialRequests: ''
  });

  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

  // Customer Booking History State
  const [historyEmail, setHistoryEmail] = useState(user?.email || '');
  const [userBookings, setUserBookings] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        guestName: prev.guestName || user.name || '',
        guestEmail: prev.guestEmail || user.email || '',
        guestPhone: prev.guestPhone || user.phone || ''
      }));
      setHistoryEmail(user.email || '');
    }
  }, [user]);

  // Fetch live slot availability whenever date or party size changes
  useEffect(() => {
    let isMounted = true;
    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      setError(null);
      try {
        const res = await getReservationAvailability(formData.reservationDate, formData.guestsCount);
        if (isMounted) {
          setAvailability(res.data);
          // If current selected timeSlot is unavailable, auto-select first available slot
          const availableSlots = res.data?.slots?.filter(s => s.available) || [];
          if (availableSlots.length > 0 && !availableSlots.some(s => s.time === formData.timeSlot)) {
            setFormData(prev => ({ ...prev, timeSlot: availableSlots[0].time }));
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Availability query notice:', err.message);
        }
      } finally {
        if (isMounted) setAvailabilityLoading(false);
      }
    };

    fetchAvailability();
    return () => { isMounted = false; };
  }, [formData.reservationDate, formData.guestsCount]);

  // Fetch booking history
  const fetchHistory = async (emailToQuery) => {
    const targetEmail = emailToQuery || historyEmail;
    if (!targetEmail) return;

    setHistoryLoading(true);
    setHistoryError(null);
    setActionSuccess(null);
    try {
      const res = await getMyReservations(targetEmail);
      setUserBookings(res.data || []);
    } catch (err) {
      setHistoryError(err.message || 'No reservation history found for this email address.');
      setUserBookings([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && historyEmail) {
      fetchHistory(historyEmail);
    }
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const errors = {};

    const trimmedName = (formData.guestName || '').trim();
    if (!trimmedName) {
      errors.guestName = 'Guest full name is required.';
    } else if (trimmedName.length < 2) {
      errors.guestName = 'Name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      errors.guestName = 'Name must not exceed 100 characters.';
    }

    const trimmedEmail = (formData.guestEmail || '').trim();
    if (!trimmedEmail) {
      errors.guestEmail = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.guestEmail = 'Please enter a valid email address (e.g. name@example.com).';
    }

    const trimmedPhone = (formData.guestPhone || '').trim();
    if (!trimmedPhone) {
      errors.guestPhone = 'Mobile contact number is required.';
    } else if (!PHONE_REGEX.test(trimmedPhone)) {
      errors.guestPhone = 'Please enter a valid phone number (e.g. +1 555-728-1940).';
    }

    const count = parseInt(formData.guestsCount, 10);
    if (isNaN(count) || count < 1 || count > 20) {
      errors.guestsCount = 'Party size must be between 1 and 20 guests.';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (!formData.reservationDate) {
      errors.reservationDate = 'Reservation date is required.';
    } else if (formData.reservationDate < todayStr) {
      errors.reservationDate = 'Reservation date cannot be in the past.';
    }

    if (!formData.timeSlot) {
      errors.timeSlot = 'Please select a seating timeslot.';
    }

    if (formData.specialRequests && formData.specialRequests.length > 500) {
      errors.specialRequests = 'Special requests must not exceed 500 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const response = await createReservation({
        ...formData,
        guestName: trimmedName,
        guestEmail: trimmedEmail,
        guestPhone: trimmedPhone,
        guestsCount: count,
        specialRequests: (formData.specialRequests || '').trim(),
        seatingArea: formData.seatingPreference
      });
      setConfirmedReservation(response.data);
    } catch (err) {
      setError(
        err.message || 'Unable to confirm reservation. Please select a different time or contact the concierge.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    setLoading(true);
    try {
      const res = await cancelReservation(reservationId, cancelReason || 'Cancelled by guest');
      setActionSuccess(`Reservation #${res.data?.reservationNumber || ''} cancelled successfully.`);
      setCancellingId(null);
      setCancelReason('');
      fetchHistory(historyEmail);
    } catch (err) {
      setHistoryError(err.message || 'Cancellation rejected by concierge policy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservation-page animate-fade-in text-slate-200 pt-16 pb-28 sm:pt-20 sm:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <Badge variant="gold" icon={<Sparkles size={14} />}>
            Dining Room Allocations
          </Badge>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-wide mt-5 mb-4">
            Table <span className="gradient-text-gold">Reservations</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Reserve your dining experience with our Michelin-level dining room concierge. Real-time table assignments and availability.
          </p>

          {/* Luxury Segmented Navigation Tabs */}
          <div className="flex justify-center mt-6 sm:mt-8 mb-8 sm:mb-12 px-2">
            <div className="bg-[#13151b] border border-white/10 p-1 sm:p-1.5 rounded-2xl sm:rounded-full inline-flex flex-wrap sm:flex-nowrap justify-center gap-1.5 sm:gap-2 shadow-2xl max-w-full">
              <button
                id="tab-book-table"
                type="button"
                onClick={() => { setActiveTab('book'); setConfirmedReservation(null); }}
                className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-full text-[11px] sm:text-xs md:text-sm font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'book'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/25 font-bold scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Book a Table
              </button>
              <button
                id="tab-my-bookings"
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-full text-[11px] sm:text-xs md:text-sm font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-400/25 font-bold scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                My Bookings & Concierge
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: BOOKING FLOW */}
        {activeTab === 'book' && (
          <>
            {confirmedReservation ? (
              <div className="p-10 sm:p-16 rounded-3xl bg-[#13151b] border border-emerald-500/30 text-center shadow-2xl animate-fade-in max-w-3xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-6">
                  <CheckCircle2 size={36} />
                </div>

                <Badge variant="emerald">Allocation Confirmed</Badge>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-4 mb-2">
                  Reservation #{confirmedReservation.reservationNumber || 'CONFIRMED'}
                </h2>
                <p className="text-slate-300 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                  Thank you, <strong>{confirmedReservation.guestName}</strong>. Your party of {confirmedReservation.guestsCount} has been reserved at SAVORIA.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-[#0b0c10] border border-white/10 text-left mb-8 max-w-2xl mx-auto">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">DATE</div>
                    <div className="text-sm font-semibold text-white mt-1">{confirmedReservation.reservationDate}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">TIME</div>
                    <div className="text-sm font-semibold text-amber-400 mt-1">{confirmedReservation.timeSlot}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">TABLE</div>
                    <div className="text-sm font-semibold text-white mt-1">{confirmedReservation.tableNumber || 'Assigned'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">STATUS</div>
                    <div className="text-sm font-bold text-emerald-400 capitalize mt-1">{confirmedReservation.status}</div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button onClick={() => setConfirmedReservation(null)}>
                    Book Another Table
                  </Button>
                  <Button variant="secondary" onClick={() => { setActiveTab('history'); setHistoryEmail(confirmedReservation.guestEmail); }}>
                    View in My Bookings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* Reservation Form */}
                <form onSubmit={handleSubmit} noValidate className="lg:col-span-8 p-8 sm:p-12 rounded-3xl bg-[#13151b] border border-white/10 shadow-2xl">
                  <div className="border-b border-white/10 pb-5 mb-8">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                        Party & Dining Preferences
                      </h2>
                      <span className="text-xs uppercase tracking-widest text-amber-400/80 font-semibold hidden sm:inline-block">
                        Instant Live Table Allocation
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      Customize your table arrangement, salon ambience, and time allocation.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-start gap-2.5 mb-6">
                      <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="res-name" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold mb-2">
                        Guest Full Name *
                      </label>
                      <input
                        id="res-name"
                        type="text"
                        name="guestName"
                        placeholder="e.g. Lord Julian Sterling"
                        value={formData.guestName}
                        onChange={handleChange}
                        disabled={loading}
                        className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all ${
                          fieldErrors.guestName ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                        }`}
                        aria-invalid={!!fieldErrors.guestName}
                        aria-describedby={fieldErrors.guestName ? 'res-name-error' : undefined}
                      />
                      {fieldErrors.guestName && (
                        <span id="res-name-error" role="alert" className="text-xs text-rose-400 mt-1 block">
                          {fieldErrors.guestName}
                        </span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="res-email" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold mb-2">
                        Email Address *
                      </label>
                      <input
                        id="res-email"
                        type="email"
                        name="guestEmail"
                        placeholder="julian@example.com"
                        value={formData.guestEmail}
                        onChange={handleChange}
                        disabled={loading}
                        className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all ${
                          fieldErrors.guestEmail ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                        }`}
                        aria-invalid={!!fieldErrors.guestEmail}
                        aria-describedby={fieldErrors.guestEmail ? 'res-email-error' : undefined}
                      />
                      {fieldErrors.guestEmail && (
                        <span id="res-email-error" role="alert" className="text-xs text-rose-400 mt-1 block">
                          {fieldErrors.guestEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="res-phone" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold mb-2">
                        Mobile Contact *
                      </label>
                      <input
                        id="res-phone"
                        type="tel"
                        name="guestPhone"
                        placeholder="+1 (555) 728-1940"
                        value={formData.guestPhone}
                        onChange={handleChange}
                        disabled={loading}
                        className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all ${
                          fieldErrors.guestPhone ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                        }`}
                        aria-invalid={!!fieldErrors.guestPhone}
                        aria-describedby={fieldErrors.guestPhone ? 'res-phone-error' : undefined}
                      />
                      {fieldErrors.guestPhone && (
                        <span id="res-phone-error" role="alert" className="text-xs text-rose-400 mt-1 block">
                          {fieldErrors.guestPhone}
                        </span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="res-party-size" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold mb-2">
                        Party Size *
                      </label>
                      <select
                        id="res-party-size"
                        name="guestsCount"
                        value={formData.guestsCount}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                      {fieldErrors.guestsCount && (
                        <span role="alert" className="text-xs text-rose-400 mt-1 block">
                          {fieldErrors.guestsCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date Picker */}
                  <div className="mb-6">
                    <label htmlFor="res-date-picker" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold mb-2">
                      Reservation Date *
                    </label>
                    <input
                      id="res-date-picker"
                      type="date"
                      name="reservationDate"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.reservationDate}
                      onChange={handleChange}
                      disabled={loading}
                      className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all ${
                        fieldErrors.reservationDate ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                      }`}
                      aria-invalid={!!fieldErrors.reservationDate}
                      aria-describedby={fieldErrors.reservationDate ? 'res-date-error' : undefined}
                    />
                    {fieldErrors.reservationDate && (
                      <span id="res-date-error" role="alert" className="text-xs text-rose-400 mt-1 block">
                        {fieldErrors.reservationDate}
                      </span>
                    )}
                  </div>

                  {/* Dynamic Real-Time Slot Picker */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span id="timeslots-group-label" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold">
                        Available Seating Timeslots *
                      </span>
                      {availabilityLoading && (
                        <span className="text-xs text-amber-400 animate-pulse">Verifying live table availability...</span>
                      )}
                    </div>

                    {fieldErrors.timeSlot && (
                      <span id="timeSlot-error" role="alert" className="text-xs text-rose-400 mb-2 block">
                        {fieldErrors.timeSlot}
                      </span>
                    )}

                    {availability?.message && !availability.isAvailable ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm">
                        {availability.message}
                      </div>
                    ) : (
                      <div role="radiogroup" aria-labelledby="timeslots-group-label" className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {availability?.slots && availability.slots.length > 0 ? (
                          availability.slots.map(s => {
                            const isSelected = formData.timeSlot === s.time;
                            return (
                              <button
                                key={s.time}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                disabled={!s.available || loading}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, timeSlot: s.time }));
                                  if (fieldErrors.timeSlot) setFieldErrors(prev => ({ ...prev, timeSlot: '' }));
                                }}
                                className={`py-3.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                  !s.available
                                    ? 'border-white/5 bg-[#0b0c10]/40 text-slate-600 cursor-not-allowed opacity-40'
                                    : isSelected
                                    ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-lg shadow-amber-400/20 font-bold ring-1 ring-amber-400 scale-[1.03]'
                                    : 'border-white/10 bg-[#0b0c10] text-slate-200 hover:border-amber-400/60 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <span className="text-sm font-semibold tracking-wide">{s.time}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.available ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                  {s.available ? `${s.remainingTables} left` : 'Full'}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => (
                            <button
                              key={t}
                              type="button"
                              role="radio"
                              aria-checked={formData.timeSlot === t}
                              disabled={loading}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, timeSlot: t }));
                                if (fieldErrors.timeSlot) setFieldErrors(prev => ({ ...prev, timeSlot: '' }));
                              }}
                              className={`py-3.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                                formData.timeSlot === t
                                  ? 'border-amber-400 bg-amber-400/20 text-amber-300 font-bold ring-1 ring-amber-400 shadow-md'
                                  : 'border-white/10 bg-[#0b0c10] text-slate-200 hover:border-amber-400/50 hover:text-white'
                              }`}
                            >
                              <div className="text-sm font-semibold">{t}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Salon Seating Preference Cards */}
                  <div className="mb-8">
                    <span id="seating-pref-label" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold mb-3">
                      Seating Salon Preference
                    </span>
                    <div role="radiogroup" aria-labelledby="seating-pref-label" className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {[
                        { id: 'Main Dining Salon', desc: 'Central chandelier & jazz acoustics' },
                        { id: 'Window Alcove', desc: 'Panoramic Avenue Montaigne view' },
                        { id: 'Sommelier Cellar Room', desc: 'Subterranean rare reserve pairings' }
                      ].map(pref => (
                        <button
                          key={pref.id}
                          type="button"
                          role="radio"
                          aria-checked={formData.seatingPreference === pref.id}
                          disabled={loading}
                          onClick={() => setFormData({ ...formData, seatingPreference: pref.id })}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            formData.seatingPreference === pref.id
                              ? 'border-amber-400 bg-amber-400/15 text-white ring-1 ring-amber-400 shadow-md'
                              : 'border-white/10 bg-[#0b0c10] text-slate-300 hover:border-white/25 hover:bg-white/5'
                          }`}
                        >
                          <div className="text-sm font-semibold text-amber-300">{pref.id}</div>
                          <div className="text-xs text-slate-400 mt-1">{pref.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-10">
                    <label htmlFor="res-notes" className="block text-xs uppercase tracking-wider text-slate-300 font-semibold mb-2">
                      Special Occasion or Dietary Accommodations
                    </label>
                    <textarea
                      id="res-notes"
                      name="specialRequests"
                      rows={3}
                      placeholder="Anniversary celebration, celiac gluten-free, vegan degustation, quiet table..."
                      value={formData.specialRequests}
                      onChange={handleChange}
                      disabled={loading}
                      maxLength={500}
                      className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors ${
                        fieldErrors.specialRequests ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                      }`}
                    />
                    {fieldErrors.specialRequests && (
                      <span role="alert" className="text-xs text-rose-400 mt-1 block">
                        {fieldErrors.specialRequests}
                      </span>
                    )}
                  </div>

                  <Button
                    id="submit-table-booking-btn"
                    type="submit"
                    disabled={loading}
                    icon={<Calendar size={18} />}
                    style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                  >
                    {loading ? 'Confirming Table Allocation...' : 'Confirm Table Allocation'}
                  </Button>
                </form>

                {/* Sidebar Policies & Info */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="p-8 rounded-3xl bg-[#13151b] border border-white/10 shadow-xl">
                    <h3 className="font-serif text-xl font-bold text-white mb-5 flex items-center gap-2">
                      <Info size={19} className="text-amber-400" /> Dining Room Policies
                    </h3>
                    <ul className="space-y-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                        <div>
                          <strong className="text-slate-200">Grace Period:</strong> Tables reserved for 15 minutes past scheduled seating time before release.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                        <div>
                          <strong className="text-slate-200">Dining Duration:</strong> Allocations are tailored for 90 minutes of fine gastronomy.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                        <div>
                          <strong className="text-slate-200">Cancellation Policy:</strong> Complimentary cancellations up to 2 hours prior to reservation.
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                        <div>
                          <strong className="text-slate-200">Dress Code:</strong> Smart elegant attire. Jacket recommended for gentlemen.
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="p-8 rounded-3xl bg-[#161822] border border-amber-500/25 shadow-xl">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                      Private Salon Buyouts
                    </div>
                    <h4 className="font-serif text-xl font-bold text-white mb-3">
                      Parties of 12 or More
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-5">
                      For corporate galas or private weddings, our cellar sommelier room can host up to 34 guests with dedicated bespoke multi-course menus.
                    </p>
                    <a
                      href="tel:+12125550845"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      <span>Contact Events Concierge</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: MY BOOKINGS & CANCELLATION */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#13151b] border border-white/10 shadow-xl">
              <form onSubmit={(e) => { e.preventDefault(); fetchHistory(); }} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="history-email-input"
                    type="email"
                    required
                    placeholder="Enter reservation email (e.g. julian@example.com)..."
                    value={historyEmail}
                    onChange={(e) => setHistoryEmail(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <Button id="search-history-btn" type="submit" disabled={historyLoading}>
                  Look Up Bookings
                </Button>
              </form>
            </div>

            {actionSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm text-center">
                {actionSuccess}
              </div>
            )}

            {historyError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm text-center">
                {historyError}
              </div>
            )}

            {historyLoading ? (
              <LoadingSpinner message="Consulting dining concierge records..." />
            ) : userBookings.length === 0 ? (
              <div className="p-12 rounded-3xl bg-[#13151b] border border-white/10 text-center">
                <Calendar size={44} className="mx-auto text-slate-600 mb-3" />
                <h3 className="font-serif text-lg font-bold text-white mb-1">No Reservations Found</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto mb-6">
                  No active or past dining reservations matching {historyEmail}. You can easily book your table above.
                </p>
                <Button onClick={() => setActiveTab('book')}>
                  Book a Table Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userBookings.map((b) => {
                  const isCancelled = b.status === 'cancelled';
                  const canCancelBooking = ['confirmed', 'pending'].includes(b.status);

                  return (
                    <div key={b._id} className="p-6 rounded-2xl bg-[#13151b] border border-white/10 hover:border-amber-400/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3 mb-4">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">BOOKING CODE</span>
                          <div className="font-serif text-lg font-bold text-white">{b.reservationNumber || 'RES-SAVORIA'}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Guest: <strong className="text-slate-200">{b.guestName}</strong> ({b.guestPhone})
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            isCancelled
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : b.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                        <div>
                          <span className="text-slate-500 block">Date</span>
                          <span className="text-white font-semibold">{b.reservationDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Seating Time</span>
                          <span className="text-amber-400 font-semibold">{b.timeSlot}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Party Size</span>
                          <span className="text-white font-semibold">{b.guestsCount} Guests</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Assigned Table</span>
                          <span className="text-white font-semibold">{b.tableNumber || 'Assigned on arrival'}</span>
                        </div>
                      </div>

                      {b.specialRequests && (
                        <div className="text-xs text-slate-400 bg-[#0b0c10] p-3 rounded-xl mb-4">
                          <span className="text-slate-500 font-semibold block mb-0.5">Requests:</span>
                          {b.specialRequests}
                        </div>
                      )}

                      {isCancelled && b.cancellationReason && (
                        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mb-4 flex items-center gap-2">
                          <XCircle size={15} className="flex-shrink-0" />
                          <span>Cancelled: {b.cancellationReason}</span>
                        </div>
                      )}

                      {canCancelBooking && (
                        <div className="pt-2 flex justify-end">
                          {cancellingId === b._id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Reason for cancellation..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="bg-[#0b0c10] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                              <button
                                id={`confirm-cancel-res-${b._id}`}
                                onClick={() => handleCancelReservation(b._id)}
                                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Confirm Cancel
                              </button>
                              <button
                                onClick={() => setCancellingId(null)}
                                className="bg-white/5 hover:bg-white/10 text-slate-400 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer"
                              >
                                Abort
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`cancel-res-btn-${b._id}`}
                              onClick={() => setCancellingId(b._id)}
                              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-1 px-3 rounded-lg border border-rose-500/20 bg-rose-500/10 cursor-pointer transition-colors"
                            >
                              <Ban size={13} /> Cancel Reservation
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
