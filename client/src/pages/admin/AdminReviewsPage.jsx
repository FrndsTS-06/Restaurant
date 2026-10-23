import React, { useState } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import {
  useGetAllReviewsQuery,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation
} from '../../store/api/apiSlice';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminReviewsPage = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const { data: reviewsRes, isLoading, refetch } = useGetAllReviewsQuery({ status: filterStatus });
  const [updateReviewStatus, { isLoading: isUpdating }] = useUpdateReviewStatusMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const [actionMessage, setActionMessage] = useState(null);

  const reviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || []);

  const handleStatusChange = async (id, isApproved, status) => {
    try {
      await updateReviewStatus({ id, isApproved, status }).unwrap();
      setActionMessage(`Review marked as ${status}`);
      setTimeout(() => setActionMessage(null), 3500);
      refetch();
    } catch (err) {
      alert(err.data?.message || 'Failed to update review status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this guest review?')) return;
    try {
      await deleteReview(id).unwrap();
      setActionMessage('Review permanently deleted');
      setTimeout(() => setActionMessage(null), 3500);
      refetch();
    } catch (err) {
      alert(err.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="admin-reviews-page animate-fade-in" style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-lg" style={{ marginBottom: '0.25rem' }}>
            Guest Reviews & Moderation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Moderate verified diner reviews, manage approvals, and audit dish sentiment ratings.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'approved', 'pending', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                border: filterStatus === st ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                backgroundColor: filterStatus === st ? 'rgba(230, 175, 93, 0.15)' : 'var(--bg-surface)',
                color: filterStatus === st ? 'var(--accent-gold-light)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
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
          <CheckCircle2 size={16} /> {actionMessage}
        </div>
      )}

      {/* Reviews Table */}
      {isLoading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <Star size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 className="heading-sm" style={{ marginBottom: '0.5rem' }}>No Reviews Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No diner reviews match the selected moderation filter ({filterStatus}).
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Diner & Dish</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rating & Review</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Order Link</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((rev) => (
                  <tr key={rev._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{rev.user?.name || 'Guest Patron'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.user?.email}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold-light)', marginTop: '0.3rem' }}>
                        Dish: <strong>{rev.menuItem?.name || 'Selected Dish'}</strong>
                      </div>
                    </td>

                    <td style={{ padding: '1rem', maxWidth: '350px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.4rem' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < rev.rating ? '#e6af5d' : 'transparent'}
                            color={i < rev.rating ? '#e6af5d' : 'var(--text-muted)'}
                          />
                        ))}
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, marginLeft: '0.3rem' }}>{rev.rating}/5</span>
                      </div>
                      {rev.title && <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{rev.title}</div>}
                      <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        "{rev.comment}"
                      </p>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {rev.order ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <ShieldCheck size={14} color="#34d399" />
                          <span style={{ fontSize: '0.8rem', color: '#34d399' }}>#{rev.order.orderNumber}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct Review</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <Badge variant={rev.isApproved ? 'emerald' : rev.status === 'rejected' ? 'coral' : 'gold'}>
                        {rev.status || (rev.isApproved ? 'Approved' : 'Pending')}
                      </Badge>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {!rev.isApproved ? (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(rev._id, true, 'approved')}
                            disabled={isUpdating}
                            icon={<CheckCircle2 size={14} />}
                          >
                            Approve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(rev._id, false, 'rejected')}
                            disabled={isUpdating}
                            icon={<XCircle size={14} />}
                          >
                            Reject
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(rev._id)}
                          disabled={isDeleting}
                          title="Delete Review"
                          style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(255, 99, 71, 0.3)',
                            backgroundColor: 'rgba(255, 99, 71, 0.1)',
                            color: 'var(--accent-coral)',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
