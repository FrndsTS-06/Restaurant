import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

/**
 * High-Fidelity Static 2D Brand Fallback
 * Used during 3D initialization, reduced-motion preferences,
 * or on devices lacking WebGL acceleration.
 */
export const BrandStaticFallback = () => (
  <div
    role="img"
    aria-label="SAVORIA Haute Cuisine Brand Logo"
    className="flex items-center gap-3.5 sm:gap-4 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-[#13151b] via-[#101218] to-[#0b0c10] border border-amber-400/25 shadow-xl w-full max-w-[500px] h-[135px] xs:h-[150px] sm:h-[165px] my-1"
  >
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/10 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10 shrink-0">
      <UtensilsCrossed size={26} className="sm:w-7 sm:h-7" />
    </div>
    <div className="flex flex-col">
      <div className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-white">
        SAVORIA
      </div>
      <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-amber-400 font-bold -mt-0.5">
        Haute Cuisine
      </div>
    </div>
  </div>
);
