import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, MapPin, Phone, Mail, Award, Heart, Instagram, Facebook, Twitter, ArrowRight, Check } from 'lucide-react';
import { useGetSettingsQuery } from '../../store/api/apiSlice';

export const Footer = () => {
  const { data: settingsRes } = useGetSettingsQuery();
  const settings = settingsRes?.data;
  const [subscribed, setSubscribed] = useState(false);

  const restaurantName = settings?.restaurantName || 'SAVORIA';
  const streetAddress = settings?.address?.street || '450 Avenue Montaigne';
  const cityStateZip = settings?.address?.city
    ? `${settings.address.city}, ${settings.address.state || 'NY'} ${settings.address.zipCode || '10022'}`
    : 'New York, NY 10022';
  const contactPhone = settings?.contactPhone || '+1 (212) 555-0840';
  const contactEmail = settings?.contactEmail || 'concierge@savoria.com';

  return (
    <footer className="bg-[#07080a] border-t border-white/10 pt-16 pb-8 text-slate-300">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
          {/* Brand & Distinction */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UtensilsCrossed size={20} />
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-white">
                {restaurantName}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              A Michelin-distinguished sanctuary for avant-garde gastronomy, seasonal organic harvests, and timeless culinary craft.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Award size={15} />
              <span>3-Star Michelin Excellence Distinction</span>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-white mb-5">
              Service Hours
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <div className="text-slate-200 font-medium">Dinner Service</div>
                <div className="text-xs text-slate-400">
                  {settings?.operatingHours?.dinner?.open || '17:00'} – {settings?.operatingHours?.dinner?.close || '22:30'}
                </div>
              </li>
              <li>
                <div className="text-slate-200 font-medium">Lunch Degustation</div>
                <div className="text-xs text-slate-400">
                  {settings?.operatingHours?.lunch?.open || '12:00'} – {settings?.operatingHours?.lunch?.close || '15:30'}
                </div>
              </li>
              <li className="text-xs text-amber-400/90 italic pt-1">
                Closed: {settings?.operatingHours?.closedDays?.join(', ') || 'Monday'}
              </li>
            </ul>
          </div>

          {/* Location & Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-white mb-5">
              Location & Reservations
            </h4>
            <div className="space-y-3.5 text-sm text-slate-400">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-amber-400 mt-1 flex-shrink-0" />
                <span>{streetAddress}, {cityStateZip}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-amber-400 flex-shrink-0" />
                <span>{contactPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-amber-400 flex-shrink-0" />
                <span>{contactEmail}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
              >
                <Instagram size={15} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
              >
                <Facebook size={15} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
              >
                <Twitter size={15} />
              </a>
            </div>
          </div>

          {/* Quick Experience Links & Newsletter */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-white mb-5">
              Gastronomic Journal
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Subscribe to receive private invitations to seasonal tasting menu unveilings and vintage cellar releases.
            </p>
            {subscribed ? (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <Check size={14} className="flex-shrink-0" />
                <span>Thank you for subscribing to our Gastronomic Journal.</span>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email address..."
                  className="w-full bg-[#13151b] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition-colors flex items-center justify-center flex-shrink-0"
                >
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
              <Link to="/about" className="hover:text-amber-400 transition-colors">Our Heritage</Link>
              <Link to="/menu" className="hover:text-amber-400 transition-colors">A La Carte</Link>
              <Link to="/reservation" className="hover:text-amber-400 transition-colors">Reservations</Link>
              <Link to="/contact" className="hover:text-amber-400 transition-colors">Concierge</Link>
              <Link to="/contact#track-order" id="footer-track-order-link" className="hover:text-amber-400 transition-colors">Track Order</Link>
              <Link to="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} {restaurantName} Haute Cuisine & Gastronomy Group. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Crafted with</span>
              <Heart size={13} className="text-rose-500 fill-rose-500" />
              <span>for discerning epicureans.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
