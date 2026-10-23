import React from 'react';
import { Box, Sparkles } from 'lucide-react';

/**
 * FoodModelLoader
 * Loading state component displayed while GLB/GLTF food models and textures are downloading.
 */
export const FoodModelLoader = ({ message = 'Summoning 3D Culinary Sculpture...' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0c10]/90 backdrop-blur-sm z-20 text-center p-6 select-none animate-fade-in"
    >
      <div className="relative mb-3.5">
        {/* Outer glowing pulsing ring */}
        <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin shadow-lg shadow-amber-500/15" />
        {/* Inner subtle box icon */}
        <div className="absolute inset-0 flex items-center justify-center text-amber-400">
          <Box size={16} className="animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 tracking-wider uppercase font-serif">
        <Sparkles size={12} className="text-amber-400" />
        <span>{message}</span>
      </div>

      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
        Streaming polygon meshes, procedural materials & studio lighting
      </p>
    </div>
  );
};
