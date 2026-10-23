import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/formatters';
import { Button } from '../common/Button';

export const CartDrawer = () => {
  const { isDrawerOpen, setIsDrawerOpen, cartItems, updateQuantity, removeFromCart, clearCart, subtotal, total, totalCount } = useCart();
  const navigate = useNavigate();

  // Keyboard accessibility: Escape key closes drawer
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, setIsDrawerOpen]);

  // Lock background body scroll while drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleCheckout = () => {
    setIsDrawerOpen(false);
    navigate('/checkout');
  };

  const drawerNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your Culinary Order Cart"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Click outside backdrop */}
      <div
        id="cart-drawer-backdrop"
        style={{ flex: 1 }}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Body */}
      <div
        id="cart-drawer-panel"
        style={{
        width: '100%',
        maxWidth: '440px',
        height: '100%',
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
        animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={20} color="var(--accent-gold)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600 }}>
              Your Culinary Order ({totalCount})
            </h3>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close cart"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {cartItems.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              gap: '1rem',
              color: 'var(--text-muted)'
            }}>
              <ShoppingBag size={48} strokeWidth={1.5} color="var(--border-subtle)" />
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>Your order is currently empty.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/menu');
                }}
              >
                Browse Our Menu
              </Button>
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  width="64"
                  height="64"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      aria-label="Remove item"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.95rem' }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.2rem 0.5rem',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-item-qty font-mono font-semibold" style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '18px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Totals */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Estimated Tax (8.25%)</span>
              <span>{formatPrice(subtotal * 0.0825)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent-gold)' }}>{formatPrice(total)}</span>
            </div>

            <Button
              id="cart-checkout-btn"
              onClick={handleCheckout}
              style={{ width: '100%', marginBottom: '0.75rem' }}
              icon={<ArrowRight size={18} />}
            >
              Proceed to Checkout
            </Button>

            <button
              onClick={clearCart}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Clear Entire Order
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerNode, document.body) : drawerNode;
};
