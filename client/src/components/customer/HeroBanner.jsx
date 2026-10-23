import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Calendar, Award, Utensils } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { HeroFallback2D } from '../3d/HeroFallback2D';
import { BrandStaticFallback } from '../3d/BrandStaticFallback';

// Lazy-load the 3D scenes to keep initial bundle size lean and fast
const HeroScene3D = React.lazy(() =>
  import('../3d/HeroScene3D').then((module) => ({ default: module.HeroScene3D }))
);
const HeroBrand3D = React.lazy(() =>
  import('../3d/HeroBrand3D').then((module) => ({ default: module.HeroBrand3D }))
);

export const HeroBanner = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden border-b border-white/10 bg-[#0b0c10]">
      {/* Ambient background volumetric glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(230, 175, 93, 0.12) 0%, transparent 70%)',
          filter: 'blur(70px)'
        }}
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Actions (High Contrast & Non-overlapping) */}
          <div className="lg:col-span-6 flex flex-col gap-5 sm:gap-6 text-left">
            {/* Interactive 3D Restaurant Name and Logo */}
            <div className="w-full">
              <Suspense fallback={<BrandStaticFallback />}>
                <HeroBrand3D />
              </Suspense>
            </div>

            <div>
              <Badge variant="gold" icon={<Sparkles size={14} />}>
                Season 2026 Autumn Harvest Degustation
              </Badge>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.14] break-words">
              Epicurean Artistry, <br className="hidden sm:inline" />
              <span className="gradient-text-gold">Transcendent Dining.</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl">
              Immerse yourself in sensory perfection at Savoria. Under the direction of Chef Alexandre Moreau, we weave wild seasonal harvests into timeless multi-course gastronomy.
            </p>

            {/* Primary Action Buttons (Always above visual scene, highly accessible across 320px to 4K) */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 pt-2">
              <Link to="/menu" className="w-full sm:w-auto">
                <Button id="hero-order-now-btn" size="lg" icon={<Utensils size={18} />} className="w-full sm:w-auto justify-center">
                  Order Now
                </Button>
              </Link>
              <Link to="/reservation" className="w-full sm:w-auto">
                <Button id="hero-reserve-table-btn" variant="secondary" size="lg" icon={<Calendar size={18} />} className="w-full sm:w-auto justify-center">
                  Reserve a Table
                </Button>
              </Link>
              <Link to="/menu" className="w-full sm:w-auto">
                <Button id="hero-explore-menu-btn" variant="outline" size="lg" icon={<ArrowRight size={18} />} className="w-full sm:w-auto justify-center">
                  Explore Menu
                </Button>
              </Link>
            </div>

            {/* Accolades Bar */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-5 sm:pt-6 border-t border-white/10 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400 shrink-0" />
                <span className="font-bold text-white">3-Star Michelin Award</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-amber-400 font-bold">★ 4.9</span> / 5 Satisfaction
              </div>
              <div className="text-slate-400 hidden sm:block">
                🌱 100% Organic Sourced
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Canvas Viewport */}
          <div className="lg:col-span-6 w-full relative">
            <Suspense fallback={<HeroFallback2D />}>
              <HeroScene3D />
            </Suspense>
            <p className="text-[11px] text-slate-400/90 italic text-center mt-2.5">
              * Artistic 3D architectural interior visualization inspired by Savoria&apos;s Parisian design heritage.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
