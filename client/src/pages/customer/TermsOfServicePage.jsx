import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, AlertTriangle, ArrowLeft, Clock, Shield } from 'lucide-react';
import { useGetSettingsQuery } from '../../store/api/apiSlice';

export const TermsOfServicePage = () => {
  const { data: settingsRes } = useGetSettingsQuery();
  const settings = settingsRes?.data;

  const restaurantName = settings?.restaurantName || '[RESTAURANT_NAME]';
  const restaurantAddress = settings?.address
    ? `${settings.address.street}, ${settings.address.city}, ${settings.address.state} ${settings.address.zipCode}`
    : '[RESTAURANT_ADDRESS]';
  const contactEmail = settings?.contactEmail || '[CONTACT_EMAIL]';
  const contactPhone = settings?.contactPhone || '[CONTACT_PHONE]';
  const noticeHours = settings?.cancellationNoticeHours || 2;

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-slate-200" style={{ backgroundColor: 'var(--bg-primary, #0c0e12)' }}>
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Return to Home
        </Link>

        {/* Header */}
        <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-white/10 mb-10">
          <div className="flex items-center gap-3 text-amber-400 mb-3">
            <FileText size={28} />
            <span className="text-xs font-bold tracking-widest uppercase text-amber-400/90">
              Hospitality Contract & Dining Policies
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Effective Date: <span className="text-amber-300 font-mono">[EFFECTIVE_DATE: October 1, 2026]</span> • Jurisdiction: <span className="text-amber-300 font-mono">[GOVERNING_LAW_STATE: State of New York, USA]</span>
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
            <strong>Notice on Business Configuration:</strong> Specific parameters in these terms (such as reservation buffer times, notice limits, and restaurant contact information) automatically synchronize with <span className="font-semibold text-white">{restaurantName}</span> active system settings.
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">1.</span> Agreement to Terms
            </h2>
            <p className="mb-3">
              By accessing the website, scheduling dining reservations, or placing pickup and delivery orders with <strong className="text-white">{restaurantName}</strong> (<span className="text-amber-300 font-mono">[RESTAURANT_LEGAL_ENTITY: Savoria Gastronomy Group LLC]</span>), you agree to be legally bound by these Terms of Service.
            </p>
            <p>
              If you do not agree to these terms, please refrain from using our digital ordering system or booking platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">2.</span> Table Bookings & Seating Policy
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <strong className="text-white">Arrival Punctuality:</strong> Reserved tables are held for a maximum buffer of 15 minutes past the designated reservation time slot before being released to waitlisted guests.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <strong className="text-white">Cancellation Notice:</strong> Cancellations must be initiated at least <span className="text-amber-300 font-semibold">{noticeHours} hour(s)</span> (<span className="text-amber-300 font-mono">[CANCELLATION_NOTICE_HOURS: {noticeHours}]</span>) prior to the reservation time slot via our digital tracking portal or by calling our concierge directly.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <strong className="text-white">Party Size & Dining Duration:</strong> Standard dining slots are calculated for 90 to 120 minutes depending on party size to ensure flawless service for all patrons.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">3.</span> Orders, Pricing & Server Calculation
            </h2>
            <p className="mb-3">
              All prices displayed are subject to state and local food & beverage taxes (<span className="text-amber-300 font-mono">[LOCAL_TAX_RATE: 8.25%]</span>).
            </p>
            <p className="mb-3">
              To prevent fraudulent tampering, all order subtotals, tax calculations, discounts, and delivery fees are strictly computed by our trusted backend servers. Client-falsified totals are automatically rejected by our API platform.
            </p>
            <p>
              Coupons are validated upon submission against active expiry dates and single-use quotas. We reserve the right to decline expired or unauthorized promotional codes.
            </p>
          </section>

          {/* Section 4 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">4.</span> Verified Guest Reviews & Moderation
            </h2>
            <p className="mb-3">
              To guarantee community authenticity, reviews and dish ratings may only be submitted by verified guests who have placed and completed a dining or delivery order containing the respective dish.
            </p>
            <p>
              All reviews undergo moderation. Reviews containing defamatory content, profanity, or spam will be rejected or removed in accordance with our content standards.
            </p>
          </section>

          {/* Section 5 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">5.</span> Allergen Disclaimer & Limitation of Liability
            </h2>
            <p className="mb-3">
              While our kitchen brigade adheres to rigorous cross-contamination avoidance protocols, our kitchen handles nuts, shellfish, dairy, gluten, and eggs. Guests with severe or life-threatening anaphylactic sensitivities must state their conditions clearly in both online booking requests and to table captains upon seating.
            </p>
          </section>

          {/* Section 6 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">6.</span> Governing Law & Inquiries
            </h2>
            <p className="mb-4">
              These Terms of Service are governed by and construed in accordance with the laws of <span className="text-amber-300 font-mono">[GOVERNING_LAW_STATE: State of New York, USA]</span>.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-2">Legal & Concierge Inquiries</h3>
              <p className="text-xs text-slate-400 mb-1">
                Company: <span className="text-slate-300">{restaurantName}</span>
              </p>
              <p className="text-xs text-slate-400 mb-1">
                Email: <a href={`mailto:${contactEmail}`} className="text-amber-400 underline">{contactEmail}</a>
              </p>
              <p className="text-xs text-slate-400 mb-1">
                Telephone: <span className="text-slate-300">{contactPhone}</span>
              </p>
              <p className="text-xs text-slate-400">
                Address: <span className="text-slate-300">{restaurantAddress}</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
