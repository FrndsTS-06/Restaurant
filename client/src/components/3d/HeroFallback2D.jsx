import React from 'react';
import { Award, Sparkles } from 'lucide-react';

export const HeroFallback2D = () => {
  return (
    <div className="relative w-full h-[340px] xs:h-[380px] sm:h-[460px] lg:h-[540px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0e1017] group">
      {/* Background Architectural Dining Salon Image */}
      <img
        src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80"
        alt="SAVORIA Grand Dining Salon"
        fetchpriority="high"
        decoding="async"
        className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-700"
      />

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-black/30 to-transparent" />

      {/* Floating Gold Plaque */}
      <div className="absolute bottom-3.5 sm:bottom-6 left-3.5 sm:left-6 right-3.5 sm:right-6 p-3 sm:p-5 rounded-2xl bg-[#13151b]/90 backdrop-blur-md border border-amber-400/30 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1 mb-0.5">
            <Sparkles size={11} /> Architectural Salon &amp; Reserve
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
            The Grand Dining Salon
          </h3>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold">
          <Award size={15} /> 3-Star Michelin Setting
        </div>
      </div>
    </div>
  );
};
