import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Utensils, Tag, AlertCircle } from 'lucide-react';

export const CartPage = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    tax,
    deliveryFee,
    discount,
    couponCode,
    orderType,
    updateOrderType,
    applyPromoCode,
    total
  } = useCart();
  const navigate = useNavigate();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState(null);
  const [promoError, setPromoError] = useState(null);
  const [gratuityPercent, setGratuityPercent] = useState(20);

  const gratuity = orderType === 'dine-in' ? (subtotal * gratuityPercent) / 100 : 0;
  const grandTotal = Math.max(0, Math.round((subtotal + tax + deliveryFee - discount + gratuity) * 100) / 100);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setPromoMessage(null);
    setPromoError(null);

    const res = await applyPromoCode(promoInput.trim().toUpperCase());
    if (res.success) {
      setPromoMessage(res.message);
      setPromoInput('');
    } else {
      setPromoError(res.message);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-32 max-w-2xl">
        <EmptyState
          icon={<ShoppingBag size={32} />}
          title="Your Culinary Cart is Empty"
          description="You have not yet added any dishes to your dining order. Explore our seasonal menu to select your courses."
          action={
            <Link to="/menu">
              <Button icon={<Utensils size={16} />}>
                Explore Culinary Menu
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="cart-page animate-fade-in text-slate-200 pt-20 pb-28 sm:pt-24 sm:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-10">
          <Badge variant="gold">Table Order Review</Badge>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white mt-2 mb-2">
            Your Culinary <span className="gradient-text-gold">Order</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Review your selected dishes and courses before kitchen dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Dishes Table List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#13151b] border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Course Items ({cartItems.length})
                </span>
                <button
                  id="clear-entire-cart-btn"
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer"
                >
                  Clear Entire Order
                </button>
              </div>

              <div className="space-y-6 divide-y divide-white/5">
                {cartItems.map((item) => (
                  <div key={item._id} className="pt-6 first:pt-0 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          width="80"
                          height="80"
                          className="w-20 h-20 rounded-xl object-cover border border-white/10 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <Utensils size={24} />
                        </div>
                      )}
                      <div>
                        {item.category && (
                          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">
                            {item.category}
                          </span>
                        )}
                        <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                          {item.name}
                        </h3>
                        <div className="text-amber-400 font-semibold text-sm mt-0.5">
                          {formatPrice(item.price)} each
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      {/* Stepper */}
                      <div className="flex items-center bg-[#0b0c10] border border-white/10 rounded-full px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm font-bold text-white min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Total Price */}
                      <div className="font-serif text-lg font-bold text-white min-w-[80px] text-right">
                        {formatPrice(item.price * item.quantity)}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item._id)}
                        title="Remove dish"
                        aria-label="Remove item"
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Type Selection */}
            <div className="bg-[#13151b] border border-white/10 rounded-2xl p-6">
              <h3 className="font-serif text-lg font-semibold text-white mb-4">
                Service Modality
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dine-in', label: 'Dine-In Table' },
                  { id: 'pickup', label: 'Curbside Pickup' },
                  { id: 'delivery', label: 'White-Glove Delivery' }
                ].map((s) => (
                  <button
                    key={s.id}
                    id={`modality-${s.id}-btn`}
                    onClick={() => updateOrderType(s.id)}
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      orderType === s.id
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                        : 'border-white/10 bg-[#0b0c10] text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary & Gratuity Calculation Card */}
          <div className="space-y-6">
            <div className="bg-[#13151b] border border-white/10 rounded-2xl p-6 shadow-xl sticky top-28">
              <h2 className="font-serif text-xl font-bold text-white mb-6">
                Course Summary
              </h2>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="promo-code-input"
                    type="text"
                    placeholder="Coupon code (SAVORIA10)..."
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 uppercase"
                  />
                </div>
                <button
                  id="apply-coupon-btn"
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {promoMessage && (
                <div className="text-xs text-emerald-400 font-semibold mb-4 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center">
                  {promoMessage}
                </div>
              )}

              {promoError && (
                <div className="text-xs text-rose-400 font-semibold mb-4 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg text-center flex items-center justify-center gap-1.5">
                  <AlertCircle size={14} /> {promoError}
                </div>
              )}

              {couponCode && !promoMessage && (
                <div className="text-xs text-emerald-400 font-semibold mb-4 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center">
                  Coupon Applied: {couponCode} (-{formatPrice(discount)})
                </div>
              )}

              {/* Dining Gratuity Selector (For Dine-in) */}
              {orderType === 'dine-in' && (
                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Service Staff Gratuity
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[18, 20, 22].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setGratuityPercent(pct)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          gratuityPercent === pct
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-[#0b0c10] text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Line Items */}
              <div className="space-y-3 text-sm text-slate-400 pb-6 border-b border-white/10">
                <div className="flex justify-between">
                  <span>Course Subtotal:</span>
                  <span className="text-white font-medium">{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Privilege Discount ({couponCode}):</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>State & City Tax (8.25%):</span>
                  <span className="text-white font-medium">{formatPrice(tax)}</span>
                </div>

                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span className="text-white font-medium">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-400 font-semibold">FREE (₹100+ order)</span>
                      ) : (
                        formatPrice(deliveryFee)
                      )}
                    </span>
                  </div>
                )}

                {orderType === 'dine-in' && gratuity > 0 && (
                  <div className="flex justify-between">
                    <span>Kitchen & Dining Gratuity ({gratuityPercent}%):</span>
                    <span className="text-white font-medium">{formatPrice(gratuity)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-4 pb-6">
                <span className="font-serif text-lg font-bold text-white">Estimated Total:</span>
                <span className="font-serif text-2xl font-bold text-amber-400">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              {/* Action Button to Checkout */}
              <Button
                id="cart-proceed-checkout-btn"
                onClick={() => navigate('/checkout')}
                icon={<ArrowRight size={18} />}
                style={{ width: '100%' }}
              >
                Proceed to Checkout
              </Button>

              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-500">
                <ShieldCheck size={14} className="text-amber-400" />
                <span>Backend Calculated • Zero Client-Tampered Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
