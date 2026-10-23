import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMyOrders, getOrderById, cancelOrder } from '../../services/orderService';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  Search,
  Clock,
  CheckCircle,
  ChefHat,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Ban
} from 'lucide-react';

export const OrderTracker = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('orderNumber') || searchParams.get('email') || '';

  const [query, setQuery] = useState(initialQuery);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = async (lookupQuery) => {
    if (!lookupQuery.trim()) return;
    setLoading(true);
    setError(null);
    setActionMessage(null);

    try {
      const trimmed = lookupQuery.trim();
      // If looks like an order number (e.g. SAV-1234) or ObjectId
      if (trimmed.toUpperCase().startsWith('SAV-') || trimmed.length === 24) {
        const res = await getOrderById(trimmed);
        setOrders(res.data ? [res.data] : []);
      } else {
        const res = await getMyOrders(trimmed);
        setOrders(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'No orders found matching your search.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchOrders(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders(query);
  };

  const handleConfirmCancel = async (orderId) => {
    try {
      setLoading(true);
      const res = await cancelOrder(orderId, cancelReason || 'Cancelled by customer');
      setActionMessage(`Order #${res.data?.orderNumber || ''} has been successfully cancelled.`);
      setCancellingOrderId(null);
      setCancelReason('');
      fetchOrders(query);
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'placed':
      case 'pending':
        return 1;
      case 'confirmed':
        return 2;
      case 'preparing':
        return 3;
      case 'ready':
        return 4;
      case 'completed':
      case 'delivered':
        return 5;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const canCancel = (status) => {
    return ['placed', 'pending', 'confirmed', 'preparing'].includes(status);
  };

  return (
    <div id="integrated-order-tracker" className="order-tracking-section animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="gold">Kitchen Dispatch & Fulfillment</Badge>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-3 mb-3">
            Live Order <span className="gradient-text-gold">Tracking</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Enter your customer email address or Order Number (e.g. SAV-1234) to observe real-time kitchen preparation, brigade dispatch, and courier fulfillment.
          </p>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={handleSearch}
          className="bg-[#13151b] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl mb-8 flex flex-col sm:flex-row gap-3"
          aria-label="Order Tracking Search"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="tracking-query-input"
              type="text"
              required
              placeholder="Search by Order # (e.g. SAV-8392) or Customer Email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#0b0c10] border border-white/15 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <Button id="search-order-status-btn" type="submit" disabled={loading} className="shrink-0">
            {loading ? 'Tracking...' : 'Track Order'}
          </Button>
        </form>

        {actionMessage && (
          <div className="p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm text-center">
            {actionMessage}
          </div>
        )}

        {loading && <LoadingSpinner message="Querying live kitchen queue..." />}

        {error && (
          <div className="p-5 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
            <AlertCircle size={22} className="mx-auto mb-2 text-rose-400" />
            <p>{error}</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-8">
            {orders.map((order) => {
              const currentStep = getStepIndex(order.status);
              const isCancelled = order.status === 'cancelled';
              const cancellable = canCancel(order.status);

              return (
                <div
                  key={order._id}
                  className="bg-[#13151b] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all hover:border-amber-400/30"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-white/10 pb-5 mb-6 gap-3">
                    <div>
                      <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">ORDER NUMBER</div>
                      <div className="font-serif text-2xl font-bold text-white mt-0.5">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Customer: <strong className="text-slate-200">{order.customer?.name}</strong> ({order.customer?.email})
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">SERVICE MODALITY</div>
                      <div className="capitalize font-semibold text-amber-400 mt-0.5">
                        {order.orderType} {order.tableNumber ? `(${order.tableNumber})` : ''}
                      </div>
                      {order.deliveryAddress?.street && (
                        <div className="text-xs text-slate-400 mt-1 flex items-center sm:justify-end gap-1">
                          <MapPin size={12} className="text-amber-400 shrink-0" />
                          <span>{order.deliveryAddress.street}, {order.deliveryAddress.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cancelled Alert Banner */}
                  {isCancelled && (
                    <div className="p-4 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-3">
                      <XCircle size={24} className="shrink-0 text-rose-400" />
                      <div>
                        <div className="font-bold text-sm text-white">This order has been CANCELLED</div>
                        <div className="text-xs text-rose-300/80 mt-0.5">
                          Reason: {order.cancellationReason || 'No reason specified'} • Cancelled by: {order.cancelledBy || 'Customer'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5-Step Order Progress Tracker */}
                  {!isCancelled && (
                    <div className="mb-8">
                      <div className="grid grid-cols-5 gap-2 text-center relative">
                        {[
                          { title: 'Placed', icon: <Clock size={16} />, step: 1 },
                          { title: 'Confirmed', icon: <CheckCircle size={16} />, step: 2 },
                          { title: 'Preparing', icon: <ChefHat size={16} />, step: 3 },
                          { title: 'Ready', icon: <UtensilsCrossed size={16} />, step: 4 },
                          { title: 'Completed', icon: <CheckCircle2 size={16} />, step: 5 }
                        ].map((s) => {
                          const isCompleted = currentStep >= s.step;
                          const isCurrent = currentStep === s.step;

                          return (
                            <div key={s.title} className="flex flex-col items-center gap-2">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-amber-400/20 border-2 border-amber-400 text-amber-400'
                                    : 'bg-[#0b0c10] border border-white/10 text-slate-500'
                                } ${isCurrent ? 'ring-4 ring-amber-400/20 shadow-lg shadow-amber-400/20' : ''}`}
                              >
                                {s.icon}
                              </div>
                              <span
                                className={`text-[11px] sm:text-xs ${
                                  isCompleted ? 'font-semibold text-white' : 'text-slate-500'
                                }`}
                              >
                                {s.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="bg-[#0b0c10] border border-white/10 rounded-xl p-5 mb-5">
                    <div className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-3">
                      Culinary Course Items
                    </div>
                    <div className="divide-y divide-white/5">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between text-sm">
                          <div>
                            <span className="text-slate-200">
                              <strong className="text-amber-400">{item.quantity}x</strong> {item.name}
                            </span>
                            {item.specialInstructions && (
                              <span className="block text-xs text-slate-500 mt-0.5">
                                Note: {item.specialInstructions}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-300 font-mono">
                            {formatPrice(item.price * item.quantity, order.currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 mt-4 pt-3 space-y-1.5 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-mono text-slate-300">{formatPrice(order.subtotal, order.currency)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Discount ({order.couponCode || 'Promo'}):</span>
                          <span className="font-mono">-{formatPrice(order.discount, order.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span className="font-mono text-slate-300">{formatPrice(order.tax, order.currency)}</span>
                      </div>
                      {order.orderType === 'delivery' && (
                        <div className="flex justify-between">
                          <span>Delivery Fee:</span>
                          <span className="font-mono text-slate-300">{order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee, order.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                        <span>Total:</span>
                        <span className="font-mono text-amber-400">{formatPrice(order.totalAmount, order.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div className="text-xs text-slate-400">
                      Payment: <strong className="text-emerald-400 uppercase font-mono">{order.paymentStatus}</strong>
                      {' • '}
                      Placed: <span className="text-slate-300">{formatDate(order.createdAt)}</span>
                    </div>

                    {/* Cancellation Controls */}
                    {cancellable && (
                      <div>
                        {cancellingOrderId === order._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Reason for cancellation..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="bg-[#0b0c10] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                            />
                            <button
                              id={`confirm-cancel-order-${order._id}`}
                              onClick={() => handleConfirmCancel(order._id)}
                              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setCancellingOrderId(null)}
                              className="border border-white/15 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                            >
                              Abort
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`cancel-order-btn-${order._id}`}
                            onClick={() => setCancellingOrderId(order._id)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <Ban size={13} /> Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
