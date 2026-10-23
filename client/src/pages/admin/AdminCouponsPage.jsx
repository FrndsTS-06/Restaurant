import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Percent,
  Clock,
  Check,
  X
} from 'lucide-react';
import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation
} from '../../store/api/apiSlice';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatPrice } from '../../utils/formatters';

export const AdminCouponsPage = () => {
  const { data: couponsRes, isLoading, refetch } = useGetCouponsQuery();
  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [updateCoupon] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 50,
    maxDiscountAmount: 30,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 100
  });

  const coupons = Array.isArray(couponsRes) ? couponsRes : (couponsRes?.data || []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await createCoupon({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        usageLimit: Number(formData.usageLimit) || 100
      }).unwrap();

      setMessage(`Coupon "${formData.code.toUpperCase()}" created successfully!`);
      setIsModalOpen(false);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 50,
        maxDiscountAmount: 30,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: 100
      });
      setTimeout(() => setMessage(null), 4000);
      refetch();
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to create coupon');
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await updateCoupon({ id: coupon._id, isActive: !coupon.isActive }).unwrap();
      refetch();
    } catch (err) {
      alert('Failed to update coupon status');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await deleteCoupon(id).unwrap();
      refetch();
    } catch (err) {
      alert('Failed to delete coupon');
    }
  };

  return (
    <div className="admin-coupons-page animate-fade-in" style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-lg" style={{ marginBottom: '0.25rem' }}>
            Promotional Coupons & Vouchers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage discount campaigns, usage limits, expiration dates, and minimum order requirements.
          </p>
        </div>

        <Button
          id="open-create-coupon-btn"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={16} />}
        >
          Create New Coupon
        </Button>
      </div>

      {message && (
        <div style={{
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid #34d399',
          color: '#34d399',
          padding: '0.8rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Coupons Table */}
      {isLoading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <Tag size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 className="heading-sm" style={{ marginBottom: '0.5rem' }}>No Active Coupons</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Create your first promotional discount voucher for diner orders.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Create Voucher</Button>
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Code</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Discount Value</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Order Min / Cap</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Usage Quota</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Expiry Date</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const isExpired = new Date(c.expiryDate) < new Date();
                  const isExhausted = c.usageCount >= c.usageLimit;
                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '1rem' }}>
                        <code style={{
                          backgroundColor: 'rgba(230, 175, 93, 0.15)',
                          color: 'var(--accent-gold-light)',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          letterSpacing: '0.05em'
                        }}>
                          {c.code}
                        </code>
                      </td>

                      <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue.toFixed(2)} OFF`}
                      </td>

                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div>Min: {c.minOrderAmount > 0 ? `₹${c.minOrderAmount.toFixed(2)}` : 'None'}</div>
                        {c.maxDiscountAmount && <div>Cap: ₹{c.maxDiscountAmount.toFixed(2)}</div>}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.85rem' }}>
                          <strong style={{ color: isExhausted ? 'var(--accent-coral)' : '#fff' }}>{c.usageCount}</strong> / {c.usageLimit} uses
                        </div>
                        {isExhausted && <span style={{ fontSize: '0.7rem', color: 'var(--accent-coral)' }}>Quota Exceeded</span>}
                      </td>

                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        <div style={{ color: isExpired ? 'var(--accent-coral)' : 'var(--text-secondary)' }}>
                          {new Date(c.expiryDate).toLocaleDateString()}
                        </div>
                        {isExpired && <span style={{ fontSize: '0.7rem', color: 'var(--accent-coral)' }}>Expired</span>}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <Badge variant={!c.isActive ? 'coral' : isExpired || isExhausted ? 'secondary' : 'emerald'}>
                          {!c.isActive ? 'Inactive' : isExpired ? 'Expired' : isExhausted ? 'Limit Reached' : 'Active'}
                        </Badge>
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            title={c.isActive ? 'Deactivate' : 'Activate'}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: c.isActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 99, 71, 0.1)',
                              color: c.isActive ? '#34d399' : 'var(--accent-coral)',
                              cursor: 'pointer'
                            }}
                          >
                            {c.isActive ? <Check size={14} /> : <X size={14} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(c._id, c.code)}
                            title="Delete Coupon"
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(255, 99, 71, 0.3)',
                              backgroundColor: 'rgba(255, 99, 71, 0.1)',
                              color: 'var(--accent-coral)',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '540px',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            position: 'relative'
          }}>
            <h2 className="heading-md" style={{ marginBottom: '1.25rem' }}>
              Create Promotional Coupon
            </h2>

            {error && (
              <div style={{
                backgroundColor: 'rgba(255, 99, 71, 0.15)',
                border: '1px solid var(--accent-coral)',
                color: '#ff8a75',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCoupon}>
              <div className="form-group">
                <label className="form-label">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EPICUREAN20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="form-input"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional cap"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating Voucher...' : 'Create Voucher'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
