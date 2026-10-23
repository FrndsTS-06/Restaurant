import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { useAuthContext } from '../../features/auth/authContext';
import { createOrder } from '../../services/orderService';
import {
  loadRazorpayScript,
  createPaymentOrder,
  verifyPaymentSignature,
  recordPaymentFailure
} from '../../services/paymentService';
import { formatPrice } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Truck,
  Store,
  UtensilsCrossed,
  MapPin,
  Banknote,
  RotateCw,
  Lock,
  Sparkles
} from 'lucide-react';

export const CartCheckoutPage = () => {
  const {
    cartItems,
    subtotal,
    tax,
    deliveryFee,
    discount,
    couponCode,
    total,
    clearCart,
    orderType: cartOrderType,
    updateOrderType
  } = useCart();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState(cartOrderType || 'delivery');
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cash'
  const [customer, setCustomer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    tableNumber: '',
    street: '',
    city: '',
    zipCode: '',
    specialNotes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [paymentError, setPaymentError] = useState(null);
  const [retryOrder, setRetryOrder] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

  // Client-side idempotency key to prevent accidental duplicate submissions
  const idempotencyKeyRef = useRef(`idemp_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`);

  useEffect(() => {
    if (user) {
      setCustomer(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    updateOrderType(type);
  };

  /**
   * Launch Razorpay Secure Checkout Dialog
   */
  const launchRazorpayModal = async (targetOrder) => {
    setLoading(true);
    setPaymentError(null);

    try {
      // 1. Ensure Razorpay client SDK is loaded dynamically
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error('Razorpay secure checkout SDK could not be loaded. Please check your internet connection or switch to Cash on Delivery.');
      }

      // 2. Request backend to create Razorpay Order using trusted server pricing
      const rzpRes = await createPaymentOrder({ orderId: targetOrder._id });
      if (!rzpRes.success || !rzpRes.data) {
        throw new Error(rzpRes.message || 'Unable to initialize payment gateway order');
      }

      const { orderId: rzpOrderId, amount, currency, keyId } = rzpRes.data;

      // 3. Configure Razorpay modal options
      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'RestaurantPro Fine Dining',
        description: `Order #${targetOrder.orderNumber} Payment`,
        order_id: rzpOrderId,
        prefill: {
          name: customer.name || targetOrder.customer?.name || '',
          email: customer.email || targetOrder.customer?.email || '',
          contact: customer.phone || targetOrder.customer?.phone || ''
        },
        theme: {
          color: '#e6af5d' // RestaurantPro gold accent
        },
        handler: async function (response) {
          try {
            setLoading(true);
            // 4. Verify payment cryptographic signature on the backend
            const verifyRes = await verifyPaymentSignature({
              orderId: targetOrder._id,
              razorpayOrderId: response.razorpay_order_id || rzpOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              idempotencyKey: idempotencyKeyRef.current
            });

            if (verifyRes.success && verifyRes.data?.verified) {
              await clearCart();
              setOrderSuccess({
                ...targetOrder,
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentTransactionId: response.razorpay_payment_id,
                paymentMethod: 'razorpay'
              });
              setRetryOrder(null);
              setPaymentError(null);
            } else {
              throw new Error(verifyRes.message || 'Signature verification rejected');
            }
          } catch (verifyErr) {
            setPaymentError(verifyErr.message || 'Payment verification failed on server');
            setRetryOrder(targetOrder);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async function () {
            setLoading(false);
            setPaymentError('Razorpay checkout window was dismissed. Your culinary order is reserved and available for retry below.');
            setRetryOrder(targetOrder);

            try {
              await recordPaymentFailure({
                orderId: targetOrder._id,
                razorpayOrderId: rzpOrderId,
                reason: 'Checkout window dismissed by guest'
              });
            } catch (ignore) {}
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', async function (failureResponse) {
        setLoading(false);
        const reason = failureResponse.error?.description || failureResponse.error?.reason || 'Transaction declined';
        setPaymentError(`Payment failed: ${reason}`);
        setRetryOrder(targetOrder);

        try {
          await recordPaymentFailure({
            orderId: targetOrder._id,
            razorpayOrderId: rzpOrderId,
            reason,
            code: failureResponse.error?.code
          });
        } catch (ignore) {}
      });

      razorpayInstance.open();
    } catch (err) {
      setLoading(false);
      setPaymentError(err.message || 'Error launching online payment');
      setRetryOrder(targetOrder);
    }
  };

  /**
   * Handle primary order submission
   */
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setPaymentError(null);

    if (cartItems.length === 0) {
      setError('Your culinary basket is currently empty.');
      return;
    }

    const errors = {};
    const trimmedName = (customer.name || '').trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name must not exceed 100 characters.';
    }

    const trimmedEmail = (customer.email || '').trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address.';
    }

    const trimmedPhone = (customer.phone || '').trim();
    if (!trimmedPhone) {
      errors.phone = 'Contact phone number is required.';
    } else if (!PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Please enter a valid phone number (e.g. +1 555-019-2834).';
    }

    if (orderType === 'dine-in') {
      const trimmedTable = (customer.tableNumber || '').trim();
      if (!trimmedTable) {
        errors.tableNumber = 'Table number is required for dine-in service.';
      }
    }

    if (orderType === 'delivery') {
      const trimmedStreet = (customer.street || '').trim();
      if (!trimmedStreet) {
        errors.street = 'Delivery street address is required.';
      } else if (trimmedStreet.length < 3) {
        errors.street = 'Street address must be at least 3 characters.';
      }

      const trimmedCity = (customer.city || '').trim();
      if (!trimmedCity) {
        errors.city = 'Delivery city is required.';
      }

      const trimmedZip = (customer.zipCode || '').trim();
      if (!trimmedZip) {
        errors.zipCode = 'Postal / ZIP code is required.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);

    const payload = {
      customer: {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone
      },
      items: cartItems.map(item => ({
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      })),
      orderType,
      tableNumber: orderType === 'dine-in' ? (customer.tableNumber || '').trim() : '',
      deliveryAddress: orderType === 'delivery' ? {
        street: (customer.street || '').trim(),
        city: (customer.city || '').trim(),
        zipCode: (customer.zipCode || '').trim()
      } : {},
      couponCode: couponCode || undefined,
      specialNotes: (customer.specialNotes || '').trim(),
      paymentMethod,
      idempotencyKey: idempotencyKeyRef.current
    };

    try {
      const res = await createOrder(payload);
      const placedOrder = res.data;

      if (paymentMethod === 'cash') {
        // Cash on Delivery / Pay at Table
        await clearCart();
        setOrderSuccess({
          ...placedOrder,
          paymentStatus: 'unpaid',
          paymentMethod: 'cash'
        });
        setLoading(false);
      } else {
        // Online Payment via Razorpay
        await launchRazorpayModal(placedOrder);
      }
    } catch (err) {
      setError(err.message || 'Order placement failed. Please verify your details.');
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !orderSuccess && !retryOrder) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-32 text-center max-w-2xl">
        <ShoppingBag size={56} style={{ color: 'var(--text-muted)', margin: '0 auto 1.5rem' }} />
        <h2 className="heading-md" style={{ marginBottom: '1rem' }}>Your Dining Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Explore our fine dining selections and add dishes to begin your order.
        </p>
        <Link to="/menu">
          <Button>Browse Culinary Menu</Button>
        </Link>
      </div>
    );
  }

  // =========================================================================
  // ORDER SUCCESS CONFIRMATION VIEW
  // =========================================================================
  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 max-w-2xl">
        <div className="glass-panel" style={{
          padding: '3.5rem 2rem',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(16, 185, 129, 0.4)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <CheckCircle2 size={36} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Badge variant="emerald">Confirmed & Kitchen Queued</Badge>
            {orderSuccess.paymentMethod === 'razorpay' ? (
              <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={12} /> Paid Online (Razorpay)
              </span>
            ) : (
              <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Banknote size={12} /> Cash on Delivery (Pay upon Arrival)
              </span>
            )}
          </div>

          <h2 className="heading-md" style={{ margin: '0.5rem 0' }}>
            Order #{orderSuccess.orderNumber} Placed!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Our kitchen brigade has received your order and begun fine dining preparation.
          </p>

          <div style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'left',
            marginBottom: '2rem',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Guest Name:</span>
              <strong>{orderSuccess.customer?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Service Type:</span>
              <strong style={{ textTransform: 'capitalize' }}>{orderSuccess.orderType}</strong>
            </div>
            {orderSuccess.deliveryAddress?.street && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Delivery Destination:</span>
                <span style={{ textAlign: 'right', maxWidth: '60%' }}>
                  {orderSuccess.deliveryAddress.street}, {orderSuccess.deliveryAddress.city} {orderSuccess.deliveryAddress.zipCode}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Settled Total:</span>
              <strong style={{ color: 'var(--accent-gold)' }}>{formatPrice(orderSuccess.totalAmount)}</strong>
            </div>
            {orderSuccess.paymentTransactionId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Razorpay Payment ID:</span>
                <code style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>{orderSuccess.paymentTransactionId}</code>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Status:</span>
              <span className={`badge ${orderSuccess.paymentStatus === 'paid' ? 'badge-emerald' : 'badge-gold'}`}>
                {orderSuccess.paymentStatus === 'paid' ? 'Verified & Paid' : 'Cash Payable on Receipt'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to={`/contact?tab=track&email=${encodeURIComponent(orderSuccess.customer?.email)}`}>
              <Button id="track-order-success-btn">
                Track Live Order Status
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CHECKOUT PAGE WITH PAYMENT METHOD SELECTION & RETRY UI
  // =========================================================================
  return (
    <div className="checkout-page animate-fade-in pt-20 pb-28 sm:pt-24 sm:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <Link to="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Continue Browsing Menu
        </Link>

        <h1 className="heading-lg" style={{ marginBottom: '2.5rem' }}>
          Finalize <span className="gradient-text-gold">Culinary Order</span>
        </h1>

        {/* Retry Banner if Payment was Dismissed or Failed */}
        {retryOrder && (
          <div style={{
            backgroundColor: 'rgba(230, 175, 93, 0.12)',
            border: '1px solid var(--accent-gold)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={24} color="var(--accent-gold)" />
              <div>
                <strong style={{ fontSize: '1.05rem', color: 'var(--accent-gold-light)' }}>
                  Payment Incomplete for Order #{retryOrder.orderNumber}
                </strong>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {paymentError || 'Payment was not completed. You can re-open secure checkout or switch payment method.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button
                id="retry-razorpay-btn"
                onClick={() => launchRazorpayModal(retryOrder)}
                disabled={loading}
                icon={<RotateCw size={16} />}
              >
                {loading ? 'Re-opening Razorpay...' : `Retry Online Payment (${formatPrice(retryOrder.totalAmount)})`}
              </Button>

              <Button
                id="switch-cod-btn"
                variant="outline"
                disabled={loading}
                onClick={async () => {
                  await clearCart();
                  setOrderSuccess({
                    ...retryOrder,
                    paymentStatus: 'unpaid',
                    paymentMethod: 'cash'
                  });
                  setRetryOrder(null);
                  setPaymentError(null);
                }}
                icon={<Banknote size={16} />}
              >
                Switch to Cash on Delivery
              </Button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '3rem' }}>
          {/* Checkout Form */}
          <form onSubmit={handlePlaceOrder} noValidate className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h2 className="heading-md" style={{ marginBottom: '1.5rem' }}>Guest & Service Details</h2>

            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 99, 71, 0.15)',
                border: '1px solid var(--accent-coral)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                color: '#ff8a75',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {/* Service Type Selection */}
            <div className="form-group">
              <label className="form-label">Service Modality</label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { id: 'delivery', label: 'Delivery', icon: <Truck size={14} /> },
                  { id: 'pickup', label: 'Pickup', icon: <Store size={14} /> },
                  { id: 'dine-in', label: 'Dine-In', icon: <UtensilsCrossed size={14} /> }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    id={`checkout-type-${type.id}`}
                    disabled={loading}
                    onClick={() => handleOrderTypeChange(type.id)}
                    className="p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    style={{
                      border: orderType === type.id ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                      backgroundColor: orderType === type.id ? 'rgba(230, 175, 93, 0.15)' : 'var(--bg-surface)',
                      color: orderType === type.id ? 'var(--accent-gold-light)' : 'var(--text-secondary)'
                    }}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="checkout-name" className="form-label">Full Name *</label>
                <input
                  id="checkout-name"
                  type="text"
                  name="name"
                  placeholder="e.g. Lady Genevieve"
                  value={customer.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="form-input"
                  style={{ borderColor: fieldErrors.name ? '#ef4444' : undefined }}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'checkout-name-error' : undefined}
                />
                {fieldErrors.name && (
                  <span id="checkout-name-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="checkout-email" className="form-label">Email Address *</label>
                <input
                  id="checkout-email"
                  type="email"
                  name="email"
                  placeholder="name@domain.com"
                  value={customer.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="form-input"
                  style={{ borderColor: fieldErrors.email ? '#ef4444' : undefined }}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'checkout-email-error' : undefined}
                />
                {fieldErrors.email && (
                  <span id="checkout-email-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                    {fieldErrors.email}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="checkout-phone" className="form-label">Contact Phone *</label>
              <input
                id="checkout-phone"
                type="tel"
                name="phone"
                placeholder="+1 (555) 019-2834"
                value={customer.phone}
                onChange={handleInputChange}
                disabled={loading}
                className="form-input"
                style={{ borderColor: fieldErrors.phone ? '#ef4444' : undefined }}
                aria-invalid={!!fieldErrors.phone}
                aria-describedby={fieldErrors.phone ? 'checkout-phone-error' : undefined}
              />
              {fieldErrors.phone && (
                <span id="checkout-phone-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                  {fieldErrors.phone}
                </span>
              )}
            </div>

            {orderType === 'dine-in' && (
              <div className="form-group">
                <label htmlFor="checkout-table" className="form-label">Table Number (if seated) *</label>
                <input
                  id="checkout-table"
                  type="text"
                  name="tableNumber"
                  placeholder="e.g. Table 4 or Window Booth"
                  value={customer.tableNumber}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="form-input"
                  style={{ borderColor: fieldErrors.tableNumber ? '#ef4444' : undefined }}
                  aria-invalid={!!fieldErrors.tableNumber}
                  aria-describedby={fieldErrors.tableNumber ? 'checkout-table-error' : undefined}
                />
                {fieldErrors.tableNumber && (
                  <span id="checkout-table-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                    {fieldErrors.tableNumber}
                  </span>
                )}
              </div>
            )}

            {orderType === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="checkout-street" className="form-label">Delivery Street Address *</label>
                  <input
                    id="checkout-street"
                    type="text"
                    name="street"
                    placeholder="740 Park Avenue, Apt 4B"
                    value={customer.street}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="form-input"
                    style={{ borderColor: fieldErrors.street ? '#ef4444' : undefined }}
                    aria-invalid={!!fieldErrors.street}
                    aria-describedby={fieldErrors.street ? 'checkout-street-error' : undefined}
                  />
                  {fieldErrors.street && (
                    <span id="checkout-street-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                      {fieldErrors.street}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="checkout-city" className="form-label">City *</label>
                    <input
                      id="checkout-city"
                      type="text"
                      name="city"
                      placeholder="New York"
                      value={customer.city}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="form-input"
                      style={{ borderColor: fieldErrors.city ? '#ef4444' : undefined }}
                      aria-invalid={!!fieldErrors.city}
                      aria-describedby={fieldErrors.city ? 'checkout-city-error' : undefined}
                    />
                    {fieldErrors.city && (
                      <span id="checkout-city-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                        {fieldErrors.city}
                      </span>
                    )}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="checkout-zip" className="form-label">Postal / Zip Code *</label>
                    <input
                      id="checkout-zip"
                      type="text"
                      name="zipCode"
                      placeholder="10021"
                      value={customer.zipCode}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="form-input"
                      style={{ borderColor: fieldErrors.zipCode ? '#ef4444' : undefined }}
                      aria-invalid={!!fieldErrors.zipCode}
                      aria-describedby={fieldErrors.zipCode ? 'checkout-zip-error' : undefined}
                    />
                    {fieldErrors.zipCode && (
                      <span id="checkout-zip-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                        {fieldErrors.zipCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Chef Preparation Notes</label>
              <textarea
                id="checkout-notes"
                name="specialNotes"
                rows={2}
                placeholder="Medium-rare steak, dressing on the side, allergies..."
                value={customer.specialNotes}
                onChange={handleInputChange}
                className="form-textarea"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Select Payment Method</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Lock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                  Encrypted Gateway
                </span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Razorpay Online */}
                <div
                  id="payment-method-razorpay"
                  onClick={() => setPaymentMethod('razorpay')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'razorpay' ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                    backgroundColor: paymentMethod === 'razorpay' ? 'rgba(230, 175, 93, 0.08)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="radio-razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>Razorpay Secure Checkout</strong>
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                        Recommended
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Cards, UPI, Net Banking, Wallets • Test Mode Sandbox
                    </div>
                  </div>
                  <CreditCard size={22} color="var(--accent-gold)" />
                </div>

                {/* Cash on Delivery */}
                <div
                  id="payment-method-cash"
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'cash' ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                    backgroundColor: paymentMethod === 'cash' ? 'rgba(230, 175, 93, 0.08)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="radio-cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>Cash on Delivery / Table</strong>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                        Alternative
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Settle payment physically upon courier receipt or table service
                    </div>
                  </div>
                  <Banknote size={22} color="var(--text-secondary)" />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <Button
                id="submit-place-order-btn"
                type="submit"
                disabled={loading}
                icon={paymentMethod === 'razorpay' ? <CreditCard size={18} /> : <Banknote size={18} />}
                style={{ width: '100%' }}
              >
                {loading
                  ? 'Initializing Gateway Order...'
                  : paymentMethod === 'razorpay'
                  ? `Proceed to Razorpay Checkout • ${formatPrice(total)}`
                  : `Confirm Cash on Delivery • ${formatPrice(total)}`}
              </Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} color="var(--accent-emerald)" />
              <span>Idempotent Transaction • Server Calculated Total • No Card Details Stored</span>
            </div>
          </form>

          {/* Order Items Breakdown */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
            <h2 className="heading-md" style={{ marginBottom: '1.5rem' }}>Order Summary</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '320px', overflowY: 'auto' }}>
              {cartItems.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.925rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty: {item.quantity} × {formatPrice(item.price)}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                  <span>Discount ({couponCode})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>State & Local Tax (8.25%)</span>
                <span>{formatPrice(tax)}</span>
              </div>

              {orderType === 'delivery' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong style={{ color: '#34d399' }}>FREE (₹100+ order)</strong> : formatPrice(deliveryFee)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 700, color: '#fff', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--accent-gold)' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
