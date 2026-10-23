import React, { useState } from 'react';
import { formatPrice } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Utensils, Info, Sparkles, Box, Check, ZoomIn } from 'lucide-react';

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

/**
 * Food3DCard
 * Reusable menu card component featuring:
 * - Static high-definition food preview image for maximum performance (0 WebGL load on cards)
 * - "View in 3D" action trigger ONLY when a valid 3D model is available
 * - Correct food name, category, and INR price
 * - Preserved "Add to Order" cart integration
 * - Interactive image zoom trigger for high-res culinary photography
 * - Graceful fallback for broken or missing images
 */
export const Food3DCard = ({
  dish,
  onSelectDish,
  onAddDish,
  onView3D,
  onZoomImage
}) => {
  const [imageError, setImageError] = useState(false);

  const has3DModel = dish.modelStatus === 'available' && !!dish.model3dUrl;
  const imageUrl = imageError ? DEFAULT_FOOD_IMAGE : (dish.image || DEFAULT_FOOD_IMAGE);

  return (
    <div
      id={`food-card-${dish._id}`}
      className="glass-panel group"
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all var(--transition-fast)',
        opacity: dish.isAvailable ? 1 : 0.72,
        filter: dish.isAvailable ? 'none' : 'grayscale(35%)',
        position: 'relative'
      }}
    >
      {/* Card Visual Header with Static Preview Image */}
      <div
        id={`food-card-header-${dish._id}`}
        onClick={() => onSelectDish?.(dish)}
        style={{ position: 'relative', height: '220px', overflow: 'hidden', cursor: 'pointer' }}
        title={`View culinary presentation and details for ${dish.name}`}
      >
        <img
          src={imageUrl}
          alt={dish.name}
          onError={() => setImageError(true)}
          loading="lazy"
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s ease'
          }}
          className="group-hover:scale-105"
        />

        {/* Sold Out / Seasonal Overlay */}
        {!dish.isAvailable && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
            zIndex: 3
          }}>
            <span className="badge badge-rose" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}>
              SOLD OUT / SEASONAL
            </span>
          </div>
        )}

        {/* Top Left Badges: Dietary, Chef Special, 3D Indicator */}
        <div style={{
          position: 'absolute',
          top: '0.85rem',
          left: '0.85rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          zIndex: 2
        }}>
          {dish.dietary?.map(tag => (
            <span key={tag} className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              {tag}
            </span>
          ))}
          {dish.isFeatured && (
            <span className="badge badge-gold" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Sparkles size={10} /> Chef Special
            </span>
          )}
          {has3DModel && (
            <span
              className="badge badge-gold"
              style={{
                fontSize: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: 'rgba(230, 175, 93, 0.25)',
                border: '1px solid var(--accent-gold)'
              }}
            >
              <Box size={10} /> 3D View Available
            </span>
          )}
        </div>

        {/* Top Right Rating Badge */}
        <div style={{
          position: 'absolute',
          top: '0.85rem',
          right: '0.85rem',
          zIndex: 2
        }}>
          <span className="badge badge-gold">⭐ {dish.rating || 4.9}</span>
        </div>

        {/* Bottom Right Quick Image Zoom Button */}
        <button
          type="button"
          id={`zoom-dish-btn-${dish._id}`}
          onClick={(e) => {
            e.stopPropagation();
            onZoomImage ? onZoomImage(dish) : onSelectDish?.(dish);
          }}
          aria-label={`Zoom high-resolution photograph of ${dish.name}`}
          title="Zoom Photograph (+)"
          style={{
            position: 'absolute',
            bottom: '0.75rem',
            right: '0.75rem',
            zIndex: 2,
            padding: '0.45rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(11, 12, 16, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fcd34d',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}
        >
          <ZoomIn size={14} />
        </button>
      </div>

      {/* Card Content & Action Bar */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            {dish.category}
          </span>
          <button
            onClick={() => onSelectDish?.(dish)}
            title="Dish Information & Allergens"
            aria-label={`Culinary details for ${dish.name}`}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            className="hover:text-white transition-colors"
          >
            <Info size={16} />
          </button>
        </div>

        <h3
          id={`food-card-title-${dish._id}`}
          onClick={() => onSelectDish?.(dish)}
          style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff', cursor: 'pointer' }}
          className="hover:text-amber-300 transition-colors"
        >
          {dish.name}
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, flex: 1, marginBottom: '1.25rem' }}>
          {dish.description}
        </p>

        {/* Ingredients Preview */}
        {dish.ingredients && dish.ingredients.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Key Ingredients: </span>
            {dish.ingredients.slice(0, 3).join(', ')}{dish.ingredients.length > 3 ? '...' : ''}
          </div>
        )}

        {/* Footer: Price, 3D Trigger & Add to Cart Action */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1rem',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                {formatPrice(dish.price)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {dish.calories ? `${dish.calories} kcal` : ''}
              </div>
            </div>

            {/* "View in 3D" Button — Rendered ONLY when an approved genuine 3D model is available */}
            {has3DModel && (
              <button
                type="button"
                id={`view-3d-btn-${dish._id}`}
                onClick={() => onView3D ? onView3D(dish) : onSelectDish?.(dish)}
                aria-label={`View ${dish.name} in interactive 3D`}
                title={`Explore 3D presentation of ${dish.name}`}
                className="px-3 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Box size={14} className="text-amber-400" />
                <span>View in 3D</span>
              </button>
            )}
          </div>

          <Button
            id={`order-dish-btn-${dish._id}`}
            size="sm"
            disabled={!dish.isAvailable}
            onClick={() => onAddDish?.(dish)}
            variant={dish.isAvailable ? 'primary' : 'ghost'}
            icon={<Utensils size={14} />}
            className="w-full justify-center"
          >
            {dish.isAvailable ? 'Add to Order' : 'Sold Out'}
          </Button>
        </div>
      </div>
    </div>
  );
};
