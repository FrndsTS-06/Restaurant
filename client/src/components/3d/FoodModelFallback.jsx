import React, { useState } from 'react';
import { AlertCircle, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

/**
 * FoodModelFallback
 * Static fallback component when WebGL fails, when models fail to load,
 * or when a dish does not have an approved 3D model.
 */
export const FoodModelFallback = ({
  dish = {},
  isError = false,
  errorMessage = '',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  const imageUrl = imageError
    ? DEFAULT_FALLBACK_IMAGE
    : (dish.modelPosterUrl || dish.image || DEFAULT_FALLBACK_IMAGE);

  const isPending = dish.modelStatus === 'pending_approval';
  const isInDevelopment = dish.modelStatus === 'in_development';
  const isMissing = dish.modelStatus === 'missing_asset' || !dish.modelStatus;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#0e1017] group select-none ${className}`}>
      {/* High-Resolution Culinary Photography */}
      <img
        src={imageUrl}
        alt={dish.modelAltText || dish.name || 'Culinary Dish Presentation'}
        onError={() => setImageError(true)}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Atmospheric Vignette Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-black/30 to-black/15 pointer-events-none" />

      {/* Bottom Status Information Banner */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs px-3.5 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 shadow-lg">
        <div className="flex items-center gap-1.5 truncate">
          {isError ? (
            <>
              <AlertCircle size={14} className="text-amber-400 shrink-0" />
              <span className="text-amber-300 font-medium truncate">
                {errorMessage || '3D preview unavailable. Showing high-resolution culinary photography.'}
              </span>
            </>
          ) : isPending ? (
            <>
              <Clock size={14} className="text-amber-400 shrink-0" />
              <span className="text-amber-300 font-medium truncate">
                3D Photogrammetry: Pending Review
              </span>
            </>
          ) : isInDevelopment ? (
            <>
              <Sparkles size={14} className="text-sky-400 shrink-0" />
              <span className="text-sky-300 font-medium truncate">
                3D Asset: In Atelier Development
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span className="text-slate-200 font-medium truncate">
                Verified Haute Cuisine Photography
              </span>
            </>
          )}
        </div>

        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold shrink-0 ml-2">
          Atelier Savoria
        </span>
      </div>
    </div>
  );
};
