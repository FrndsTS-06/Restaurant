import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroBanner } from '../../components/customer/HeroBanner';
import { getMenuItems } from '../../services/menuService';
import { formatPrice } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCart } from '../../hooks/useCart';
import { useGetHealthQuery, useGetSettingsQuery } from '../../store/api/apiSlice';
import {
  Utensils,
  Star,
  Clock,
  ArrowRight,
  Calendar,
  Wine,
  Sparkles,
  Server,
  Database,
  Quote,
  CheckCircle2,
  Award,
  ChevronRight,
  Leaf,
  ShieldCheck,
  HeartHandshake,
  Camera
} from 'lucide-react';

export const HomePage = () => {
  const [featuredDishes, setFeaturedDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { data: healthData, isSuccess: healthOnline } = useGetHealthQuery(undefined, { pollingInterval: 15000 });
  const { data: settingsRes } = useGetSettingsQuery();
  const settings = settingsRes?.data;

  useEffect(() => {
    let mounted = true;
    const loadFeatured = async () => {
      try {
        const dishes = await getMenuItems();
        if (mounted) {
          const flagged = dishes.filter(d => d.isFeatured);
          setFeaturedDishes(flagged.length > 0 ? flagged.slice(0, 3) : dishes.slice(0, 3));
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to load featured dishes', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadFeatured();
    return () => {
      mounted = false;
    };
  }, []);

  const culinaryCategories = [
    {
      name: 'Starters',
      desc: 'Artisan crudo, veloutés, and delicate carpaccio',
      image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=600&q=80',
      count: '3 Preparations'
    },
    {
      name: 'Mains',
      desc: 'A5 Wagyu, Chilean sea bass, and hand-rolled tagliolini',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      count: '4 Preparations'
    },
    {
      name: 'Desserts',
      desc: 'Chocolate spheres, yuzu tarts, and Madagascar gelato',
      image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80',
      count: '2 Preparations'
    },
    {
      name: 'Beverages',
      desc: 'Small-batch old fashioneds and zero-proof elixirs',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
      count: '2 Cocktails'
    }
  ];

  const valuePillars = [
    {
      icon: <Leaf size={24} className="text-emerald-400" />,
      title: 'Sustainable Wild Harvests',
      desc: '100% organic regional harvests, daily line-caught seafood, and biodynamic estate truffles.'
    },
    {
      icon: <Award size={24} className="text-amber-400" />,
      title: 'Michelin Culinary Pedigree',
      desc: 'Our culinary brigade trains under master artisans in Lyon and Tokyo with precision craft.'
    },
    {
      icon: <Wine size={24} className="text-rose-400" />,
      title: 'Subterranean Wine Cellar',
      desc: 'Over 1,400 curated vintage labels paired flawlessly by dedicated master sommeliers.'
    },
    {
      icon: <HeartHandshake size={24} className="text-sky-400" />,
      title: 'White-Glove Hospitality',
      desc: 'Bespoke dietary allergen care and tailored private salon dining experiences.'
    }
  ];

  const galleryImages = [
    {
      url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80',
      title: 'The Grand Dining Salon',
      subtitle: 'Candlelit ambiance with crystal chandeliers'
    },
    {
      url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      title: 'Precision Degustation Plating',
      subtitle: 'Chef Alexandre Moreau’s signature technique'
    },
    {
      url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
      title: 'Subterranean Cellar Reserve',
      subtitle: 'Over 1,400 rare Burgundies and vintages'
    },
    {
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      title: 'Private Degustation Booths',
      subtitle: 'Intimate evening culinary journeys'
    }
  ];

  const testimonials = [
    {
      quote: 'An astonishing triumph of modern culinary poetry. Every course is plated with architectural precision and sublime emotional resonance.',
      author: 'Jonathan Gold Review Committee',
      outlet: 'Michelin Guide Inspector',
      stars: 5,
      year: '2026'
    },
    {
      quote: 'Alexandre Moreau has redefined the dining room experience. The Wagyu Ribeye with bone marrow jus is perhaps the most accomplished dish in the city.',
      author: 'Eleanor Vance',
      outlet: 'The Epicurean Chronicle',
      stars: 5,
      year: '2025'
    },
    {
      quote: 'The wine cellar pairing alone justifies the visit. A seamless dance between centuries-old Burgundies and boundary-pushing avant-garde dishes.',
      author: 'Marcus Brody',
      outlet: 'International Gastronomy Review',
      stars: 5,
      year: '2026'
    }
  ];

  return (
    <div className="homepage animate-fade-in text-slate-200">
      {/* Live System Architecture Status Bar */}
      <div className="bg-[#13151b] border-b border-white/10 px-4 py-3 text-xs text-slate-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                healthOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-white">RestaurantPro Live:</span>
            <span className="text-slate-400">Full-Stack Architecture Active</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Server size={13} className={healthOnline ? 'text-emerald-400' : 'text-slate-500'} />
              <span>API: {healthOnline ? 'Online (200 OK)' : 'Connecting...'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Database size={13} className={healthData?.database?.connected ? 'text-emerald-400' : 'text-amber-400'} />
              <span>DB: {healthData?.database?.name || 'restaurantpro_db'} ({healthData?.database?.status || 'connected'})</span>
            </div>
            <div className="text-amber-400 font-semibold tracking-wide hidden sm:block">
              RTK Query Polling
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Announcement Banner */}
      {settings?.homepageBanner?.enabled && (
        <div id="homepage-promo-banner" className="bg-gradient-to-r from-amber-950/90 via-[#1f1911] to-slate-950 border-b border-amber-500/30 px-4 py-3 sm:py-3.5 text-xs sm:text-sm text-amber-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles size={11} /> {settings.homepageBanner.badge || 'Featured'}
              </span>
              <span className="font-medium text-slate-100">
                {settings.homepageBanner.text}
              </span>
            </div>
            {settings?.homepageBanner?.linkUrl && (
              <Link
                to={settings.homepageBanner.linkUrl}
                className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-white transition-colors underline underline-offset-4"
              >
                <span>{settings.homepageBanner.linkText || 'Learn More'}</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 1. 3D HERO SECTION */}
      <HeroBanner />

      {/* 2. POPULAR MENU CATEGORIES */}
      <section className="py-20 bg-[#0d0e13]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="gold">Grand Repertoire</Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
                Explore by <span className="gradient-text-gold">Course & Discipline</span>
              </h2>
            </div>
            <Link to="/menu" className="inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 font-semibold">
              <span>View Full Menu Catalogue</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {culinaryCategories.map((cat) => (
              <Link
                key={cat.name}
                to={`/menu?category=${encodeURIComponent(cat.name)}`}
                className="group relative h-72 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all duration-300 shadow-xl"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75 group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 mb-1">
                    {cat.count}
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED DISHES SECTION */}
      <section className="py-24 relative bg-[#0b0c10]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="gold" icon={<Sparkles size={14} />}>
              Seasonal Tasting Selections
            </Badge>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-3 mb-4">
              Chef’s Autumn <span className="gradient-text-gold">Highlights</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Curated degustation courses marrying French heritage with sustainable wild harvests.
            </p>
          </div>

          {loading ? (
            <LoadingSpinner message="Selecting and plating chef creations..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredDishes.map((dish) => (
                <div
                  key={dish._id}
                  className="bg-[#13151b] border border-white/10 rounded-2xl overflow-hidden hover:border-amber-400/40 hover:-translate-y-1 transition-all duration-300 flex flex-col shadow-xl group"
                >
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 text-xs font-bold flex items-center gap-1">
                        <Star size={12} className="fill-amber-400" />
                        {dish.rating || 4.9}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold mb-1">
                      {dish.category}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                      {dish.name}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 flex-1">
                      {dish.description}
                    </p>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                      <div className="font-serif text-xl font-bold text-white">
                        {formatPrice(dish.price)}
                      </div>
                      <Button
                        id={`home-order-dish-${dish._id}`}
                        size="sm"
                        onClick={() => addToCart(dish, 1)}
                        icon={<Utensils size={14} />}
                      >
                        Order Dish
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/menu">
              <Button variant="secondary" icon={<ArrowRight size={18} />}>
                View All Culinary Dishes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. RESTAURANT STORY NARRATIVE */}
      <section className="py-24 bg-[#13151b] border-y border-white/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="gold">The Savoria Heritage</Badge>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-4 mb-6 leading-tight">
                An Obsession with the <br />
                <span className="gradient-text-gold">Purest Raw Flavor</span>
              </h2>
              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                <p>
                  At Savoria, culinary art is approached not as theatrical novelty, but as the respectful elevation of natural produce. Under the leadership of Chef Alexandre Moreau, our brigade follows a simple truth: if the scallop, truffle, or steer is extraordinary, the chef’s role is to reveal its soul.
                </p>
                <p>
                  Every evening service begins at 17:30 with candles lit, vintage jazz drifting softly across the dining room, and sommeliers decanting bottles from our 1,400-label subterranean cellar.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/about">
                  <Button variant="secondary" icon={<ArrowRight size={16} />}>
                    Read Our Full Story
                  </Button>
                </Link>
                <Link to="/reservation">
                  <Button icon={<Calendar size={16} />}>
                    Reserve Your Table
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80"
                alt="Dining Room Atmosphere"
                loading="lazy"
                decoding="async"
                width="1200"
                height="460"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'; }}
                className="rounded-2xl border border-white/10 shadow-2xl w-full h-[460px] object-cover"
              />
              <div className="absolute -bottom-6 -right-6 p-6 rounded-2xl bg-[#0b0c10]/95 border border-amber-400/30 shadow-2xl max-w-xs hidden sm:block">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Award size={16} /> Michelin 3-Star Award
                </div>
                <div className="text-white text-sm font-serif font-bold">
                  "Excellence worth a special gastronomic journey."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US (THE SAVORIA DISTINCTION) */}
      <section className="py-24 bg-[#0e1017]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-amber-400 text-xs uppercase font-bold tracking-widest">
              Uncompromising Standards
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
              The Savoria Distinction
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuePillars.map((p, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-[#13151b] border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between shadow-xl group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    {p.icon}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white mb-2">
                    {p.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. GASTRONOMIC & ATMOSPHERE GALLERY */}
      <section className="py-24 bg-[#0b0c10]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <Badge variant="gold" icon={<Camera size={14} />}>Atmospheric Exhibition</Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
                Moments from the <span className="gradient-text-gold">Dining Salons</span>
              </h2>
            </div>
            <Link to="/about" className="inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 font-semibold">
              <span>View Gallery Archive</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryImages.map((g, idx) => (
              <div
                key={idx}
                className="group relative h-80 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
              >
                <img
                  src={g.url}
                  alt={g.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-80 group-hover:brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-5 flex flex-col justify-end">
                  <h3 className="font-serif text-lg font-bold text-white">{g.title}</h3>
                  <p className="text-xs text-amber-300/90 mt-0.5">{g.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. ACCLAIM & TESTIMONIALS SECTION */}
      <section className="py-24 bg-[#13151b] border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-amber-400 text-xs uppercase font-bold tracking-widest">
              Critical Acclaim
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
              Words from Our Patrons
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-[#0e1017] border border-white/10 flex flex-col justify-between shadow-xl relative"
              >
                <Quote size={32} className="text-amber-400/20 absolute top-6 right-6" />
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                  "{t.quote}"
                </p>
                <div className="pt-4 border-t border-white/10">
                  <div className="font-serif text-white font-bold text-base">{t.author}</div>
                  <div className="text-xs text-amber-400 mt-0.5">{t.outlet} ({t.year})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. GRAND CALL TO ACTION BANNER */}
      <section className="py-20 bg-[#0b0c10]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1a1e28] to-[#12141a] border border-amber-400/30 p-10 sm:p-16 text-center shadow-2xl">
            <div className="max-w-2xl mx-auto relative z-10">
              <Badge variant="gold">Reservations Open</Badge>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-4 mb-4">
                Begin Your Culinary Odyssey
              </h2>
              <p className="text-slate-300 text-base mb-8 leading-relaxed">
                Tables for our evening degustation are allocated up to thirty days in advance. Reserve early to secure your dining salon.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/reservation">
                  <Button id="home-cta-reserve-btn" icon={<Calendar size={18} />}>
                    Reserve Your Table Now
                  </Button>
                </Link>
                <Link to="/menu">
                  <Button variant="secondary" icon={<ArrowRight size={18} />}>
                    Explore Tasting Menu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
