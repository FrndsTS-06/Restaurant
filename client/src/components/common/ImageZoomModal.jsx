import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw, Sparkles, Utensils, Move } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80';

export const ImageZoomModal = ({ dish, isOpen, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.35, 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(prev - 0.35, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    resetZoom();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag to pan handlers
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan & pinch
  const touchDistanceRef = useRef(null);
  const handleTouchStart = (e) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - touchDistanceRef.current) / 120;
      setScale(prev => Math.min(Math.max(prev + delta, 1), 3.5));
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  if (!isOpen || !dish) return null;

  const imageUrl = dish.image || DEFAULT_FOOD_IMAGE;
  const zoomPercent = Math.round(scale * 100);

  return createPortal(
    <div
      id="image-zoom-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Culinary Photo Magnification - ${dish.name}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-black/92 backdrop-blur-2xl animate-fade-in select-none"
      onClick={(e) => {
        if (e.target.id === 'image-zoom-modal-overlay') onClose?.();
      }}
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-4 py-2 z-20">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
            <Sparkles size={12} /> High-Resolution Culinary Photography
          </span>
          <h2 className="font-serif text-lg sm:text-2xl font-bold text-white truncate max-w-md sm:max-w-xl">
            {dish.name}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-serif font-bold text-base sm:text-lg hidden sm:block">
            {formatPrice(dish.price)}
          </span>
          <button
            id="image-zoom-close-btn"
            onClick={onClose}
            aria-label="Close high-resolution zoom preview"
            title="Close (Escape)"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Zoom Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full max-w-5xl flex-1 flex items-center justify-center overflow-hidden my-3 rounded-2xl bg-[#090a0f] border border-white/10 shadow-2xl ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
        onClick={() => {
          if (scale === 1) handleZoomIn();
        }}
      >
        <img
          id="zoomed-dish-image"
          src={imageUrl}
          alt={dish.name}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1)',
            maxWidth: '90%',
            maxHeight: '80vh',
            objectFit: 'contain'
          }}
          className="rounded-xl shadow-2xl select-none"
        />

        {/* Pan Indicator Hint when zoomed */}
        {scale > 1 && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[11px] text-amber-300 flex items-center gap-1.5 pointer-events-none">
            <Move size={12} />
            <span>Drag or swipe to pan details</span>
          </div>
        )}
      </div>

      {/* Bottom Floating Zoom Controls Bar */}
      <div className="w-full max-w-xl flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#13151b]/90 backdrop-blur-xl border border-amber-400/30 shadow-2xl z-20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="image-zoom-out-btn"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            aria-label="Zoom out"
            title="Zoom Out (-)"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white transition-colors cursor-pointer"
          >
            <ZoomOut size={16} />
          </button>

          <span
            id="image-zoom-percentage-badge"
            className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono font-bold text-amber-300 min-w-[62px] text-center"
          >
            {zoomPercent}%
          </span>

          <button
            type="button"
            id="image-zoom-in-btn"
            onClick={handleZoomIn}
            disabled={scale >= 3.5}
            aria-label="Zoom in"
            title="Zoom In (+)"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-35 text-white transition-colors cursor-pointer"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-300">
          <button
            type="button"
            id="image-zoom-reset-btn"
            onClick={resetZoom}
            aria-label="Reset image zoom"
            title="Reset Zoom (0 or R)"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
