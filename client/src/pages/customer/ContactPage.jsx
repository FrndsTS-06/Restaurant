import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Car, Send, CheckCircle2, AlertCircle, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useGetSettingsQuery, useSubmitContactFormMutation } from '../../store/api/apiSlice';
import { OrderTracker } from '../../components/customer/OrderTracker';

export const ContactPage = () => {
  const { data: settingsRes } = useGetSettingsQuery();
  const settings = settingsRes?.data;
  const [submitContact, { isLoading }] = useSubmitContactFormMutation();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') === 'track' || searchParams.get('orderNumber') || searchParams.get('email')) ? 'track' : 'concierge';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (searchParams.get('tab') === 'track' || searchParams.get('orderNumber') || searchParams.get('email')) {
      setActiveTab('track');
    }
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'track') {
      const orderNumber = searchParams.get('orderNumber');
      const email = searchParams.get('email');
      const newParams = { tab: 'track' };
      if (orderNumber) newParams.orderNumber = orderNumber;
      if (email) newParams.email = email;
      setSearchParams(newParams);
    } else {
      setSearchParams({});
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiries',
    message: ''
  });

  // Anti-spam protections
  const [hpTrap, setHpTrap] = useState(''); // Honeypot field (hidden from humans)
  const formRenderTimeRef = useRef(Date.now()); // Time-trap for rapid bot submission prevention

  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

  useEffect(() => {
    formRenderTimeRef.current = Date.now();
  }, []);

  const restaurantName = settings?.restaurantName || 'SAVORIA';
  const streetAddress = settings?.address?.street || '450 Avenue Montaigne';
  const cityStateZip = settings?.address?.city
    ? `${settings.address.city}, ${settings.address.state || 'NY'} ${settings.address.zipCode || '10022'}`
    : 'New York, NY 10022';
  const contactPhone = settings?.contactPhone || '+1 (212) 555-0840';
  const contactEmail = settings?.contactEmail || 'concierge@savoria.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = 'Full legal name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name must not exceed 100 characters.';
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address (e.g. name@domain.com).';
    }

    const trimmedPhone = formData.phone.trim();
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Please enter a valid phone number (e.g. +1 555-0199).';
    }

    const trimmedMessage = formData.message.trim();
    if (!trimmedMessage) {
      errors.message = 'Please provide a message.';
    } else if (trimmedMessage.length < 5) {
      errors.message = 'Message must be at least 5 characters.';
    } else if (trimmedMessage.length > 3000) {
      errors.message = 'Message must not exceed 3000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      subject: formData.subject,
      message: trimmedMessage,
      _hp_trap: hpTrap,
      _form_time: formRenderTimeRef.current
    };

    try {
      const res = await submitContact(payload).unwrap();
      if (res.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Failed to submit message. Please try again.');
    }
  };

  const faqs = [
    {
      q: 'What is the dining room dress code?',
      a: 'We embrace an atmosphere of refined elegance. Smart elegant attire is requested; athletic wear, shorts, and beachwear are not permitted. Collared shirts or blazers are encouraged for gentlemen.'
    },
    {
      q: 'Do you accommodate severe dietary restrictions or allergies?',
      a: 'Yes. With prior notice at reservation booking, our culinary brigade curates customized multi-course menus for celiac (gluten-free), vegan, vegetarian, and all severe food allergies.'
    },
    {
      q: 'Is valet parking available?',
      a: 'Complimentary white-glove valet parking is provided directly in front of the main portico on Avenue Montaigne for all evening service guests.'
    },
    {
      q: 'What is the corkage policy for private bottles?',
      a: 'Guests may bring up to two 750ml bottles of personal cellar wine not represented on our current wine list. A corkage fee applies.'
    }
  ];

  return (
    <div className="contact-page animate-fade-in text-slate-200">
      {/* Header with Navigation Switcher */}
      <section className="pt-24 pb-14 sm:pt-28 sm:pb-16 border-b border-white/10 bg-[#13151b]/60 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Badge variant="gold">
            {activeTab === 'track' ? 'Kitchen Dispatch & Fulfillment' : 'Guest Concierge Desk'}
          </Badge>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mt-4 mb-4">
            {activeTab === 'track' ? (
              <>Live Order <span className="gradient-text-gold">Tracking</span></>
            ) : (
              <>Connect With <span className="gradient-text-gold">{restaurantName}</span></>
            )}
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            {activeTab === 'track'
              ? 'Observe the live culinary journey of your order from kitchen preparation to white-glove courier dispatch.'
              : 'Our concierge team is at your disposal for bespoke dining arrangements, sommelier requests, and private salon reservations.'}
          </p>

          {/* Dual Tab Switcher */}
          <div className="flex justify-center mt-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-[#0b0c10] border border-white/10 shadow-inner">
              <button
                id="contact-concierge-tab-btn"
                type="button"
                onClick={() => switchTab('concierge')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'concierge'
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail size={16} /> Guest Concierge & Inquiries
              </button>
              <button
                id="contact-tracking-tab-btn"
                type="button"
                onClick={() => switchTab('track')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UtensilsCrossed size={16} /> Live Order Tracking
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Conditional Content: Order Tracking vs Concierge Inquiries */}
      {activeTab === 'track' ? (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <OrderTracker />
          </div>
        </section>
      ) : (
        /* Main Contact Grid */
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Quick banner linking to order tracking */}
            <div className="mb-10 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-amber-300">
                <UtensilsCrossed size={16} className="shrink-0" />
                <span>Looking for the live kitchen preparation status of an existing order?</span>
              </div>
              <button
                type="button"
                onClick={() => switchTab('track')}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                Switch to Order Tracker <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
            {/* Contact Details & Info Cards */}
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-6">
                Restaurant & Concierge Details
              </h2>

              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#13151b] border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">Location</h3>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      {streetAddress}<br />{cityStateZip}
                    </p>
                    <span className="text-xs text-amber-400 font-medium inline-block mt-2 flex items-center gap-1.5">
                      <Car size={14} /> Complimentary Valet Available
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#13151b] border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">Direct Inquiries</h3>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      Concierge Desk: {contactPhone}<br />
                      Private Dining: {contactPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#13151b] border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base">Digital Correspondence</h3>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      {contactEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Hours */}
              <div className="p-6 rounded-2xl bg-[#13151b] border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={18} className="text-amber-400" />
                  <h3 className="text-white font-semibold text-base">Operating Hours</h3>
                </div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Dinner Service:</span>
                    <span className="text-white font-mono">{settings?.operatingHours?.dinner?.open || '17:00'} – {settings?.operatingHours?.dinner?.close || '22:30'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Lunch Degustation:</span>
                    <span className="text-white font-mono">{settings?.operatingHours?.lunch?.open || '12:00'} – {settings?.operatingHours?.lunch?.close || '15:30'}</span>
                  </div>
                  <div className="flex justify-between text-amber-400/90 text-xs pt-1">
                    <span>Weekly Closed Day:</span>
                    <span>{settings?.operatingHours?.closedDays?.join(', ') || 'Monday'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Inquiry Form */}
            <div className="bg-[#13151b] border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl">
              <h2 className="font-serif text-2xl font-bold text-white mb-2">
                Send a Message to Our Concierge
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                We respond to all guest correspondence within four business hours.
              </p>

              {errorMessage && (
                <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {submitted ? (
                <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white mb-2">Inquiry Received</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Thank you, <strong>{formData.name}</strong>. Our guest concierge desk has logged your request and dispatched an automated confirmation to <strong>{formData.email}</strong>.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: 'General Inquiries', message: '' });
                  }}>
                    Send Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Customer Contact Form">
                  {/* Invisible Honeypot Spam Trap */}
                  <input
                    type="text"
                    name="_hp_trap"
                    value={hpTrap}
                    onChange={(e) => setHpTrap(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }}
                  />

                  <div>
                    <label htmlFor="contact-name" className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Full Legal Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="e.g. Lady Vivienne Montgomery"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                      }}
                      disabled={isLoading}
                      className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors ${
                        fieldErrors.name ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                      }`}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                    />
                    {fieldErrors.name && (
                      <span id="contact-name-error" role="alert" className="text-xs text-rose-400 mt-1 block">
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-email" className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                        Email Address *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="name@domain.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                        }}
                        disabled={isLoading}
                        className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors ${
                          fieldErrors.email ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                        }`}
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                      />
                      {fieldErrors.email && (
                        <span id="contact-email-error" role="alert" className="text-xs text-rose-400 mt-1 block">
                          {fieldErrors.email}
                        </span>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                        Contact Phone
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        placeholder="+1 (555) 019-2834"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                        }}
                        disabled={isLoading}
                        className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors ${
                          fieldErrors.phone ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                        }`}
                        aria-invalid={!!fieldErrors.phone}
                        aria-describedby={fieldErrors.phone ? 'contact-phone-error' : undefined}
                      />
                      {fieldErrors.phone && (
                        <span id="contact-phone-error" role="alert" className="text-xs text-rose-400 mt-1 block">
                          {fieldErrors.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Topic of Inquiry *
                    </label>
                    <select
                      id="contact-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      disabled={isLoading}
                      className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      <option value="General Inquiries">General Dining Inquiries</option>
                      <option value="Private Dining">Private Salon & Full Buyouts</option>
                      <option value="Cellar Consultation">Wine Cellar & Pairing Questions</option>
                      <option value="Dietary Arrangements">Custom Dietary Preparation</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                      Message / Special Arrangements *
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      placeholder="Please share details regarding your upcoming visit or private event..."
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (fieldErrors.message) setFieldErrors(prev => ({ ...prev, message: '' }));
                      }}
                      disabled={isLoading}
                      className={`w-full bg-[#0b0c10] border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors ${
                        fieldErrors.message ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-white/15'
                      }`}
                      aria-invalid={!!fieldErrors.message}
                      aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                    />
                    {fieldErrors.message && (
                      <span id="contact-message-error" role="alert" className="text-xs text-rose-400 mt-1 block">
                        {fieldErrors.message}
                      </span>
                    )}
                  </div>

                  <Button
                    id="submit-contact-btn"
                    type="submit"
                    disabled={isLoading}
                    icon={<Send size={16} />}
                    style={{ width: '100%' }}
                  >
                    {isLoading ? 'Transmitting to Concierge Desk...' : 'Transmit Inquiry'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
                    <ShieldCheck size={14} className="text-amber-400" />
                    <span>Protected by Anti-Spam Verification & Honeypot Filter</span>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Frequently Addressed Inquiries */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-bold text-white text-center mb-10">
              Frequently Addressed Hospitality Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-[#13151b] border border-white/10">
                  <h3 className="font-semibold text-white text-base mb-2">{faq.q}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )}
  </div>
);
};

