import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Sparkles, Utensils, HeartHandshake, Wine, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AboutPage = () => {
  const milestones = [
    { year: '2018', title: 'Culinary Genesis', desc: 'Savoria opened its doors on Avenue Montaigne with a 24-seat dining room dedicated to pure French technique.' },
    { year: '2020', title: 'First Michelin Star', desc: 'Recognized for precision, micro-seasonality, and innovative dashi infusions in classic French sauces.' },
    { year: '2023', title: 'Grand Cru Cellar Expansion', desc: 'Underground subterranean cellar expanded to 1,400 rare biodynamic and vintage bottles.' },
    { year: '2025', title: 'Three-Star Distinction', desc: 'Awarded the highest international distinction for transcendent gastronomy and service artistry.' }
  ];

  const team = [
    {
      name: 'Chef Alexandre Moreau',
      role: 'Executive Chef & Founder',
      image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80',
      bio: 'Former sous-chef at L’Ambroisie in Paris, Alexandre brings 22 years of relentless pursuit of culinary alchemy.'
    },
    {
      name: 'Élodie Laurent',
      role: 'Head Pastry Chef',
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
      bio: 'Master of delicate textures and sugar artistry, sculpting dessert spheres that evolve with seasonal harvests.'
    },
    {
      name: 'Laurent Vautrin',
      role: 'Chef Sommelier',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
      bio: 'Certified Master Sommelier curating harmonious pairings between forgotten varietals and modern cuisine.'
    }
  ];

  return (
    <div className="about-page animate-fade-in text-slate-200">
      {/* Hero Header */}
      <section className="relative pt-24 pb-24 sm:pt-28 sm:pb-28 border-b border-white/10 overflow-hidden bg-gradient-to-b from-[#13151b] to-[#0b0c10]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
          <Badge variant="gold" icon={<Sparkles size={14} />}>
            The Savoria Philosophy
          </Badge>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-white mt-5 mb-6 leading-tight">
            A Symphony of Passion, <br />
            <span className="gradient-text-gold">Artistry, & Heritage.</span>
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            Gastronomy is more than sustenance—it is an intimate dialogue between earth, ocean, memory, and imagination.
          </p>
        </div>
      </section>

      {/* Story Narrative & Imagery */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <span className="text-amber-400 font-semibold text-xs tracking-widest uppercase">
                Our Genesis
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-3 mb-6">
                Culinary Perfection Born from Fire and Patience
              </h2>
              <div className="space-y-5 text-slate-300 text-base leading-relaxed">
                <p>
                  Founded in 2018 by Chef Alexandre Moreau, Savoria was conceived as a respite from the hurried modern world. Our kitchen is guided by one unyielding principle: reverence for the raw ingredient.
                </p>
                <p>
                  Every dawn, we receive heirloom vegetables harvested within 40 miles, hand-dived scallops from cold coastal waters, and certified A5 Miyazaki wagyu aged to peak tenderness. We eschew shortcuts, simmering stocks for 36 hours and hand-rolling pasta every afternoon.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10 pt-8 border-t border-white/10 text-center sm:text-left">
                <div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-400">100%</div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Organic Produce</div>
                </div>
                <div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-400">3 Stars</div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Michelin Guide</div>
                </div>
                <div>
                  <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-400">1,400+</div>
                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Grand Cru Labels</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80"
                  alt="Savoria Kitchen Craftsmanship"
                  loading="lazy"
                  decoding="async"
                  width="1200"
                  height="460"
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'; }}
                  className="w-full h-[320px] sm:h-[460px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#161822]/95 backdrop-blur-md p-6 rounded-xl border border-amber-400/30 shadow-xl max-w-xs hidden sm:block">
                <div className="text-amber-400 font-semibold text-sm">"Food is memory translated into flavor."</div>
                <div className="text-xs text-slate-400 mt-2">— Alexandre Moreau, Chef Patron</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Historical Milestones */}
      <section className="py-24 sm:py-32 bg-[#13151b] border-y border-white/10">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 sm:mb-20">
            <span className="text-amber-400 font-semibold text-xs tracking-widest uppercase">Our Timeline</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-2">The Evolution of Excellence</h2>
          </div>

          <div className="space-y-10 sm:space-y-14">
            {milestones.map((item, idx) => (
              <div key={idx} className="flex gap-4 sm:gap-10 items-start">
                <div className="font-serif text-xl sm:text-3xl font-bold text-amber-400 w-14 sm:w-24 flex-shrink-0 text-right">
                  {item.year}
                </div>
                <div className="relative pl-4 sm:pl-8 border-l border-amber-400/40 pb-2">
                  <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#e6af5d]" />
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Master Brigade Profiles */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-amber-400 font-semibold text-xs tracking-widest uppercase">The Brigade</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-2 mb-4">Masters of the Craft</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Meet the culinary artists and sommeliers who shape your evening at Savoria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {team.map((member, idx) => (
              <div key={idx} className="bg-[#13151b]/80 border border-white/10 rounded-2xl overflow-hidden hover:border-amber-400/40 transition-all group">
                <div className="h-72 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-bold text-white">{member.name}</h3>
                  <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mt-1 mb-3">
                    {member.role}
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-24 text-center">
            <Link to="/reservation">
              <Button icon={<ArrowRight size={18} />}>
                Experience Our Hospitality
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
