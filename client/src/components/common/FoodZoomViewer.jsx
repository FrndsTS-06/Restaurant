import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Utensils,
  Move,
  Box,
  Image as ImageIcon,
  Maximize2,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import { useCart } from '../../hooks/useCart';
import { Food3DViewer } from '../3d/Food3DViewer';

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=85';

/**
 * Optimizes image URLs for ultra-high resolution to prevent blurriness during enlargement
 */
const getHighResImageUrl = (rawUrl) => {
  if (!rawUrl) return DEFAULT_FOOD_IMAGE;
  try {
    // If Unsplash image, upgrade query parameters to high-res 1600px, quality 85
    if (rawUrl.includes('images.unsplash.com')) {
      const url = new URL(rawUrl);
      url.searchParams.set('w', '1600');
      url.searchParams.set('q', '85');
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      return url.toString();
    }
  } catch (e) {
    // Return original if URL parsing fails
  }
  return rawUrl;
};

/**
 * FoodZoomViewer
 * Accessible luxury fullscreen modal viewer for fine dining culinary presentation.
 * Supports:
 * - High-resolution 2D photography zoom (1.0x to 4.0x)
 * - Interactive 3D model rotation and camera dolly zoom
 * - Mouse-wheel zoom, drag-to-pan, and mobile pinch-to-zoom gestures
 * - Reset zoom, keyboard navigation (+, -, 0, r, Space, Escape)
 * - Safe aspect ratio preservation and crisp asset loading
 * - Restoration of keyboard focus to previous active element upon close
 * - Instant Add-to-Cart ordering with untouched INR pricing
 */
export const FoodZoomViewer = ({
  dish,
  isOpen,
  onClose,
  initialMode,
  triggerRef
}) => {
  const { addToCart } = useCart();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);

  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeBtnRef = useRef(null);
  const touchDistanceRef = useRef(null);

  const has3DModel = Boolean(
    dish?.modelStatus === 'available' &&
    typeof dish?.model3dUrl === 'string' &&
    /\.(glb|gltf)($|\?)/i.test(dish.model3dUrl.trim())
  );

  const [activeTab, setActiveTab] = useState('photo'); // 'photo' | '3d'

  // Initialize or reset view mode when dish changes
  useEffect(() => {
    if (isOpen && dish) {
      if (initialMode) {
        setActiveTab(initialMode === '3d' && has3DModel ? '3d' : 'photo');
      } else {
        setActiveTab(has3DModel ? '3d' : 'photo');
      }
      setImgError(false);
    }
  }, [isOpen, dish, has3DModel, initialMode]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(Number((prev + 0.35).toFixed(2)), 4.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(Number((prev - 0.35).toFixed(2)), 1.0);
      if (next <= 1.0) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard accessibility, body scroll locking, and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus on exit
    previousFocusRef.current = triggerRef?.current || document.activeElement;

    resetZoom();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Set initial focus to close button for screen reader / keyboard accessibility
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (activeTab === 'photo') {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          resetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);

      // Restore keyboard focus to triggering element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        try {
          previousFocusRef.current.focus();
        } catch (err) {
          // Ignore if element is detached
        }
      }
    };
  }, [isOpen, onClose, activeTab, handleZoomIn, handleZoomOut, resetZoom, triggerRef]);

  // Coordinate WebGL: pause background scene loops when 3D viewer is active
  useEffect(() => {
    if (isOpen && activeTab === '3d' && has3DModel) {
      window.dispatchEvent(new CustomEvent('savoria:3d-active-modal', { detail: { active: true } }));
    } else {
      window.dispatchEvent(new CustomEvent('savoria:3d-active-modal', { detail: { active: false } }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('savoria:3d-active-modal', { detail: { active: false } }));
    };
  }, [isOpen, activeTab, has3DModel]);

  // Mouse wheel zoom for 2D photo
  const handleWheel = (e) => {
    if (activeTab !== 'photo') return;
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag to pan handlers (2D photo)
  const handleMouseDown = (e) => {
    if (activeTab !== 'photo' || scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (activeTab !== 'photo' || !isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile touch gestures: single-finger drag pan + 2-finger pinch-to-zoom
  const handleTouchStart = (e) => {
    if (activeTab !== 'photo') return;
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
    if (activeTab !== 'photo') return;
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
      const delta = (dist - touchDistanceRef.current) / 140;
      setScale(prev => Math.min(Math.max(Number((prev + delta).toFixed(2)), 1.0), 4.0));
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  const handleAddToCart = () => {
    if (!dish || !dish.isAvailable) return;
    addToCart(dish, 1);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2400);
  };

  if (!isOpen || !dish) return null;

  const rawImage = imgError ? DEFAULT_FOOD_IMAGE : (dish.image || DEFAULT_FOOD_IMAGE);
  const highResImage = getHighResImageUrl(rawImage);
  const zoomPercent = Math.round(scale * 100);

  return createPortal(
    <div
      id="food-zoom-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Culinary Photo & 3D Magnification - ${dish.name}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-3 sm:p-6 bg-black/94 backdrop-blur-2xl animate-fade-in select-none"
      onClick={(e) => {
        if (e.target.id === 'food-zoom-modal-overlay') onClose?.();
      }}
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-6xl flex items-center justify-between gap-3 sm:gap-4 py-2 z-20 border-b border-white/10 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-400" />
              <span>{dish.category || 'Haute Cuisine'}</span>
            </span>
            {has3DModel && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                <Box size={10} /> 3D Model Ready
              </span>
            )}
            {!dish.isAvailable && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] text-rose-300 font-semibold">
                Sold Out / Seasonal
              </span>
            )}
          </div>
          <h2 className="font-serif text-lg sm:text-2xl font-bold text-white truncate">
            {dish.name}
          </h2>
        </div>

        {/* Center / Right Mode Switcher (if 3D model available) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {has3DModel && (
            <div className="flex items-center p-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <button
                type="button"
                id="food-zoom-tab-3d-btn"
                onClick={() => setActiveTab('3d')}
                aria-label="Switch to interactive 3D model inspection"
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === '3d'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Box size={13} />
                <span>3D View</span>
              </button>
              <button
                type="button"
                id="food-zoom-tab-photo-btn"
                onClick={() => setActiveTab('photo')}
                aria-label="Switch to high-resolution culinary photography"
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'photo'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ImageIcon size={13} />
                <span>High-Res Photo</span>
              </button>
            </div>
          )}

          {/* Dish INR Price Badge */}
          <div className="font-serif font-bold text-base sm:text-xl text-amber-400 px-3 py-1 rounded-xl bg-black/60 border border-amber-400/30 hidden xs:block">
            {formatPrice(dish.price)}
          </div>

          {/* Modal Close Button with Accessible Label */}
          <button
            ref={closeBtnRef}
            type="button"
            id="food-zoom-close-btn"
            onClick={onClose}
            aria-label="Close food zoom viewer (Escape)"
            title="Close (Escape)"
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Inspection Viewport */}
      <main
        className="relative w-full max-w-6xl flex-1 flex items-center justify-center overflow-hidden my-2 sm:my-3 rounded-2xl bg-[#08090d] border border-white/10 shadow-2xl"
      >
        {activeTab === '3d' && has3DModel ? (
          /* Real-time 3D Model Viewer with OrbitControls */
          <div className="w-full h-full min-h-[340px] sm:min-h-[480px] relative">
            <Food3DViewer
              dish={dish}
              height="100%"
              isOpen={isOpen && activeTab === '3d'}
              className="h-full border-none rounded-none"
            />
          </div>
        ) : (
          /* High-Resolution Deep Zoom Photography Canvas */
          <div
            ref={containerRef}
            id="food-zoom-image-stage"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-full h-full flex items-center justify-center overflow-hidden relative ${
              scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            }`}
            onClick={(e) => {
              if (scale === 1 && e.target.id === 'food-zoom-primary-image') {
                handleZoomIn();
              }
            }}
          >
            <img
              id="food-zoom-primary-image"
              src={highResImage}
              alt={dish.name}
              onError={() => setImgError(true)}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1)',
                maxWidth: '92%',
                maxHeight: '76vh',
                objectFit: 'contain'
              }}
              className="rounded-xl shadow-2xl select-none"
            />

            {/* Hint Badge when Zoomed */}
            {scale > 1 && (
              <div
                id="food-zoom-pan-hint"
                className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[11px] text-amber-300 flex items-center gap-1.5 pointer-events-none shadow-lg animate-fade-in"
              >
                <Move size={12} />
                <span>Drag mouse or swipe single finger to pan</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Floating Control Bar */}
      <footer className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#12141c]/95 backdrop-blur-xl border border-amber-400/30 shadow-2xl z-20">
        {activeTab === 'photo' ? (
          /* 2D Image Zoom Controls */
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="food-zoom-out-btn"
              onClick={handleZoomOut}
              disabled={scale <= 1.0}
              aria-label="Zoom out"
              title="Zoom Out (-)"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer border border-white/10"
            >
              <ZoomOut size={16} />
            </button>

            <span
              id="food-zoom-percentage-badge"
              className="px-3 py-1.5 rounded-xl bg-black/75 border border-white/15 text-xs font-mono font-bold text-amber-300 min-w-[65px] text-center shadow-inner"
            >
              {zoomPercent}%
            </span>

            <button
              type="button"
              id="food-zoom-in-btn"
              onClick={handleZoomIn}
              disabled={scale >= 4.0}
              aria-label="Zoom in"
              title="Zoom In (+)"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer border border-white/10"
            >
              <ZoomIn size={16} />
            </button>

            <button
              type="button"
              id="food-zoom-reset-btn"
              onClick={resetZoom}
              aria-label="Reset zoom magnification"
              title="Reset Zoom (0 or R)"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10 ml-1"
            >
              <RotateCcw size={13} />
              <span className="hidden xs:inline">Reset</span>
            </button>

            <span className="text-[11px] text-slate-400 italic hidden sm:inline ml-2">
              Wheel or Pinch to magnify
            </span>
          </div>
        ) : (
          /* 3D Model Context Guidance */
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Box size={14} className="text-amber-400" />
            <span className="font-medium">360° Real-time 3D Model</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              • Drag to orbit • Scroll to zoom • R to reset
            </span>
          </div>
        )}

        {/* Quick Add to Cart Action Button */}
        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            id="food-zoom-add-to-cart-btn"
            disabled={!dish.isAvailable}
            onClick={handleAddToCart}
            aria-label={`Add ${dish.name} to order for ${formatPrice(dish.price)}`}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              dish.isAvailable
                ? addedSuccess
                  ? 'bg-emerald-500 text-white border border-emerald-400'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-110 border border-amber-300'
                : 'bg-white/10 text-slate-400 cursor-not-allowed border border-white/10'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check size={16} className="text-white" />
                <span>Added to Order!</span>
              </>
            ) : (
              <>
                <Utensils size={15} />
                <span>{dish.isAvailable ? `Add to Order • ${formatPrice(dish.price)}` : 'Sold Out'}</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
};
