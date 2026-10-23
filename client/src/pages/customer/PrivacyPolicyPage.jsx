import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useGetSettingsQuery } from '../../store/api/apiSlice';

export const PrivacyPolicyPage = () => {
  const { data: settingsRes } = useGetSettingsQuery();
  const settings = settingsRes?.data;

  const restaurantName = settings?.restaurantName || '[RESTAURANT_NAME]';
  const restaurantAddress = settings?.address
    ? `${settings.address.street}, ${settings.address.city}, ${settings.address.state} ${settings.address.zipCode}`
    : '[RESTAURANT_ADDRESS]';
  const contactEmail = settings?.contactEmail || '[CONTACT_EMAIL]';
  const contactPhone = settings?.contactPhone || '[CONTACT_PHONE]';

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
            <Shield size={28} />
            <span className="text-xs font-bold tracking-widest uppercase text-amber-400/90">
              Legal & Data Governance
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Effective Date: <span className="text-amber-300 font-mono">[EFFECTIVE_DATE: October 1, 2026]</span> • Last Updated: <span className="text-amber-300 font-mono">[LAST_REVIEW_DATE: October 13, 2026]</span>
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed">
            <strong>Notice on Business Configuration:</strong> This document contains highlighted business identifiers (e.g. <code>[RESTAURANT_NAME]</code>, <code>[RESTAURANT_ADDRESS]</code>) which dynamically synchronize with your restaurant management profile.
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">1.</span> Corporate Entity & Scope
            </h2>
            <p className="mb-3">
              This Privacy Policy describes how <strong className="text-white">{restaurantName}</strong> (operating under legal entity <span className="text-amber-300 font-mono">[RESTAURANT_LEGAL_ENTITY: Savoria Gastronomy Group LLC]</span>, hereinafter referred to as "the Restaurant", "we", "us", or "our") collects, protects, and utilizes information gathered through our online reservation system, ordering platform, customer accounts, and physical dining services located at <strong className="text-white">{restaurantAddress}</strong>.
            </p>
            <p>
              By accessing our website or placing dining reservations and orders, you acknowledge the terms established herein.
            </p>
          </section>

          {/* Section 2 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">2.</span> Information We Collect
            </h2>
            <ul className="space-y-3 list-disc list-inside text-slate-300">
              <li>
                <strong className="text-white">Personal Identifiers:</strong> Full legal name, email address, telephone number, and physical delivery address provided during dining bookings or checkout.
              </li>
              <li>
                <strong className="text-white">Dietary & Allergen Preferences:</strong> Specific preparation requests, allergy notices, and table preferences submitted for guest safety.
              </li>
              <li>
                <strong className="text-white">Transaction & Payment Data:</strong> Transaction identifiers, payment timestamps, coupon codes, and service amounts. We never store raw credit card numbers or CVV codes; all online transactions are tokenized through our PCI-DSS Level 1 gateway provider <span className="text-amber-300 font-mono">[PAYMENT_GATEWAY_PROVIDER: Razorpay Sandbox/Live]</span>.
              </li>
              <li>
                <strong className="text-white">Technical & Log Data:</strong> Internet Protocol (IP) addresses, browser types, session cookies, and interaction timestamps utilized for security audit logging and fraud prevention.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">3.</span> Purpose of Processing & Legal Basis
            </h2>
            <p className="mb-3">
              We process personal data solely for legitimate hospitality purposes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <strong className="text-white block mb-1">Contractual Performance</strong>
                Processing reservations, culinary preparations, and dispatching order confirmations.
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <strong className="text-white block mb-1">Guest Safety & Allergies</strong>
                Preserving life safety through strict allergen alerts and chef kitchen tickets.
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <strong className="text-white block mb-1">Transactional Notifications</strong>
                Dispatching automated email receipts, booking updates, and table confirmations.
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <strong className="text-white block mb-1">Fraud & Security Controls</strong>
                Cryptographic HMAC verification, honeypot spam protection, and audit logs.
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">4.</span> Data Retention & Security
            </h2>
            <p className="mb-3">
              Personal information is retained only as long as necessary for dining history, accounting compliance (standard 7 years for financial records), and guest loyalty services.
            </p>
            <p>
              All customer passwords are encrypted using state-of-the-art cryptographic hashing (Argon2id / bcrypt with salted rounds). Communications are secured via TLS 1.3 encryption.
            </p>
          </section>

          {/* Section 5 */}
          <section className="glass-panel p-6 sm:p-8 rounded-xl border border-white/10">
            <h2 className="text-xl font-serif font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-amber-400">5.</span> Your Privacy Rights & Contact
            </h2>
            <p className="mb-3">
              Under applicable data protection laws (GDPR, CCPA, and standard state regulations), you have the right to request access to your records, rectify inaccurate details, or request account erasure.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="font-semibold text-white mb-2">Concierge Privacy Contact</h3>
              <p className="text-xs text-slate-400 mb-1">
                Data Protection Officer: <span className="text-amber-300 font-mono">[DATA_PROTECTION_OFFICER: Legal Counsel Desk]</span>
              </p>
              <p className="text-xs text-slate-400 mb-1">
                Email: <a href={`mailto:${contactEmail}`} className="text-amber-400 underline">{contactEmail}</a>
              </p>
              <p className="text-xs text-slate-400 mb-1">
                Telephone: <span className="text-slate-300">{contactPhone}</span>
              </p>
              <p className="text-xs text-slate-400">
                Physical Office: <span className="text-slate-300">{restaurantAddress}</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
