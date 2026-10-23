import React, { useState } from 'react';
import {
  Mail,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  Search,
  Filter
} from 'lucide-react';
import {
  useGetNotificationsQuery,
  useRetryNotificationMutation
} from '../../store/api/apiSlice';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminNotificationsPage = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { data: notifRes, isLoading, refetch } = useGetNotificationsQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm || undefined
  });
  const [retryNotification, { isLoading: isRetrying }] = useRetryNotificationMutation();

  const [selectedNotif, setSelectedNotif] = useState(null);
  const [retryMessage, setRetryMessage] = useState(null);

  const notifications = Array.isArray(notifRes) ? notifRes : (notifRes?.data || []);

  const handleRetry = async (id) => {
    try {
      const res = await retryNotification(id).unwrap();
      setRetryMessage(`Notification delivery re-attempted: ${res.data?.result?.success ? 'Delivered' : 'Failed'}`);
      setTimeout(() => setRetryMessage(null), 4000);
      refetch();
    } catch (err) {
      alert(err.data?.message || err.message || 'Retry attempt failed');
    }
  };

  return (
    <div className="admin-notifications-page animate-fade-in" style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-lg" style={{ marginBottom: '0.25rem' }}>
            Transactional Email Notifications
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Audit automated guest receipts, table booking confirmations, delivery statuses, and retry failed transmissions.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'sent', 'failed', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                border: statusFilter === st ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                backgroundColor: statusFilter === st ? 'rgba(230, 175, 93, 0.15)' : 'var(--bg-surface)',
                color: statusFilter === st ? 'var(--accent-gold-light)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {retryMessage && (
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
          <CheckCircle2 size={16} /> {retryMessage}
        </div>
      )}

      {/* Notifications Table */}
      {isLoading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <Mail size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 className="heading-sm" style={{ marginBottom: '0.5rem' }}>No Notifications Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No email transmissions logged matching the current filter.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Recipient</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Type & Subject</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Delivery Status</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Attempts</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{n.recipient?.email}</div>
                      {n.recipient?.name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.recipient.name}</div>
                      )}
                    </td>

                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--accent-gold-light)',
                        marginBottom: '0.2rem'
                      }}>
                        {n.type?.replace(/_/g, ' ')}
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
                        {n.subject}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <Badge variant={n.status === 'sent' ? 'emerald' : n.status === 'failed' ? 'coral' : 'gold'}>
                        {n.status === 'sent' ? 'Delivered' : n.status === 'failed' ? 'Failed' : 'Pending'}
                      </Badge>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                      <span>{n.deliveryAttempts} / {n.maxAttempts}</span>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedNotif(n)}
                          icon={<Eye size={13} />}
                        >
                          View
                        </Button>

                        {n.status === 'failed' && (
                          <Button
                            size="sm"
                            onClick={() => handleRetry(n._id)}
                            disabled={isRetrying}
                            icon={<RotateCw size={13} />}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail & Error Logs Modal */}
      {selectedNotif && (
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
            maxWidth: '620px',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 className="heading-md" style={{ marginBottom: '1rem' }}>
              Notification Delivery Inspector
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div><strong>Recipient:</strong> {selectedNotif.recipient?.email} ({selectedNotif.recipient?.name || 'Patron'})</div>
              <div><strong>Subject:</strong> {selectedNotif.subject}</div>
              <div><strong>Type:</strong> <code>{selectedNotif.type}</code></div>
              <div><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedNotif.status}</span></div>
              <div><strong>Attempts:</strong> {selectedNotif.deliveryAttempts} / {selectedNotif.maxAttempts}</div>
              {selectedNotif.sentAt && <div><strong>Sent At:</strong> {new Date(selectedNotif.sentAt).toLocaleString()}</div>}
            </div>

            {selectedNotif.errorLogs?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-coral)', marginBottom: '0.5rem' }}>
                  Delivery Error History ({selectedNotif.errorLogs.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedNotif.errorLogs.map((err, i) => (
                    <div key={i} style={{
                      backgroundColor: 'rgba(255, 99, 71, 0.1)',
                      border: '1px solid rgba(255, 99, 71, 0.3)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      color: '#ff8a75'
                    }}>
                      <div>Attempt #{err.attempt}: {err.error}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {new Date(err.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {selectedNotif.status === 'failed' && (
                <Button
                  onClick={() => {
                    handleRetry(selectedNotif._id);
                    setSelectedNotif(null);
                  }}
                  icon={<RotateCw size={14} />}
                >
                  Retry Now
                </Button>
              )}
              <Button variant="secondary" onClick={() => setSelectedNotif(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
