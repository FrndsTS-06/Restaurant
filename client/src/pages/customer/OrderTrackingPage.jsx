import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMyOrders, getOrderById, cancelOrder } from '../../services/orderService';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
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

export const OrderTrackingPage = () => {
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
      // Refresh current search
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
    <div className="order-tracking-page animate-fade-in pt-20 pb-28 sm:pt-24 sm:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Badge variant="gold">Kitchen Dispatch & Fulfillment</Badge>
          <h1 className="heading-xl" style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
            Live Order <span className="gradient-text-gold">Tracking</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '580px', margin: '0 auto' }}>
            Enter your customer email address or Order Number (e.g. SAV-1234) to observe kitchen preparation and fulfillment status.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '3rem', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="tracking-query-input"
              type="text"
              required
              placeholder="Search by Order # (e.g. SAV-8392) or Customer Email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.75rem' }}
            />
          </div>
          <Button id="search-order-status-btn" type="submit" disabled={loading}>
            Track Order
          </Button>
        </form>

        {actionMessage && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            color: '#34d399',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            {actionMessage}
          </div>
        )}

        {loading && <LoadingSpinner message="Querying live kitchen queue..." />}

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 99, 71, 0.1)',
            border: '1px solid rgba(255, 99, 71, 0.3)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            color: '#ff8a75',
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <AlertCircle size={24} style={{ margin: '0 auto 0.5rem' }} />
            <p>{error}</p>
          </div>
        )}

        {orders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {orders.map((order) => {
              const currentStep = getStepIndex(order.status);
              const isCancelled = order.status === 'cancelled';
              const cancellable = canCancel(order.status);

              return (
                <div key={order._id} className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                  {/* Order Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ORDER NUMBER</div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
                        {order.orderNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Customer: <strong>{order.customer?.name}</strong> ({order.customer?.email})
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SERVICE MODALITY</div>
                      <div style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--accent-gold)' }}>
                        {order.orderType} {order.tableNumber ? `(${order.tableNumber})` : ''}
                      </div>
                      {order.deliveryAddress?.street && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cancelled Alert Banner */}
                  {isCancelled && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      marginBottom: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      color: '#f87171'
                    }}>
                      <XCircle size={28} style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>This order has been CANCELLED</div>
                        <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                          Reason: {order.cancellationReason || 'No reason specified'} • Cancelled by: {order.cancelledBy || 'Customer'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5-Step Order Progress Tracker */}
                  {!isCancelled && (
                    <div style={{ marginBottom: '2.5rem' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '0.5rem',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
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
                            <div key={s.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: isCompleted ? 'rgba(230, 175, 93, 0.2)' : 'var(--bg-surface)',
                                border: isCompleted ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                                color: isCompleted ? 'var(--accent-gold)' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: isCurrent ? '0 0 14px var(--accent-gold-glow)' : 'none'
                              }}>
                                {s.icon}
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: isCompleted ? 600 : 400, color: isCompleted ? '#fff' : 'var(--text-muted)' }}>
                                {s.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Culinary Course Items
                    </div>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.9rem', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <span>
                          {item.quantity}x {item.name}
                          {item.specialInstructions && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Note: {item.specialInstructions}
                            </span>
                          )}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{formatPrice(item.price * item.quantity, order.currency)}</span>
                      </div>
                    ))}

                    <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Subtotal:</span>
                        <span>{formatPrice(order.subtotal, order.currency)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                          <span>Discount ({order.couponCode || 'Promo'}):</span>
                          <span>-{formatPrice(order.discount, order.currency)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Tax (8.25%):</span>
                        <span>{formatPrice(order.tax, order.currency)}</span>
                      </div>
                      {order.orderType === 'delivery' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                          <span>Delivery Fee:</span>
                          <span>{order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee, order.currency)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fff', fontSize: '1rem', marginTop: '0.25rem' }}>
                        <span>Total:</span>
                        <span style={{ color: 'var(--accent-gold)' }}>{formatPrice(order.totalAmount, order.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Payment: <strong style={{ color: 'var(--accent-emerald)', textTransform: 'uppercase' }}>{order.paymentStatus}</strong>
                      {' • '}
                      Placed: <span>{formatDate(order.createdAt)}</span>
                    </div>

                    {/* Cancellation Controls */}
                    {cancellable && (
                      <div>
                        {cancellingOrderId === order._id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="Reason for cancellation..."
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="form-input"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                            />
                            <button
                              id={`confirm-cancel-order-${order._id}`}
                              onClick={() => handleConfirmCancel(order._id)}
                              style={{
                                backgroundColor: '#ef4444',
                                color: '#fff',
                                padding: '0.45rem 0.85rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setCancellingOrderId(null)}
                              style={{
                                backgroundColor: 'transparent',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)',
                                padding: '0.45rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Abort
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`cancel-order-btn-${order._id}`}
                            onClick={() => setCancellingOrderId(order._id)}
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '0.45rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <Ban size={14} /> Cancel Order
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
