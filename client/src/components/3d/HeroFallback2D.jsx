import React from 'react';
import { Award, Sparkles } from 'lucide-react';

export const HeroFallback2D = ({ fullBleed = true }) => {
  return (
    <div
      id="hero-fallback-2d"
      className={
        fullBleed
          ? "w-full h-full min-h-screen relative overflow-hidden bg-[#0e1017] flex items-center justify-center select-none"
          : "relative w-full h-[340px] xs:h-[380px] sm:h-[460px] lg:h-[540px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0e1017] group"
      }
    >
      {/* Background Architectural Dining Salon Image */}
      <img
        src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=80"
        alt="SAVORIA Grand Dining Salon"
        fetchpriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
      />

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-black/40 to-[#0b0c10]/60 pointer-events-none" />

      {/* Floating Gold Plaque */}
      <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 right-6 sm:right-12 p-4 sm:p-6 rounded-2xl bg-[#13151b]/90 backdrop-blur-md border border-amber-400/30 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1.5 mb-1">
            <Sparkles size={13} /> Architectural Salon &amp; Reserve
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
            The Grand Dining Salon Sanctuary
          </h3>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs sm:text-sm font-semibold">
          <Award size={16} /> 3-Star Michelin Setting
        </div>
      </div>
    </div>
  );
};

export default HeroFallback2D;
