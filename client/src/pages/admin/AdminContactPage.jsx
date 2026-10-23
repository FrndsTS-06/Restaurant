import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  CheckCircle2,
  Trash2,
  Clock,
  Phone,
  Archive,
  Inbox
} from 'lucide-react';
import {
  useGetContactMessagesQuery,
  useUpdateContactStatusMutation,
  useDeleteContactMessageMutation
} from '../../store/api/apiSlice';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminContactPage = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: contactRes, isLoading, refetch } = useGetContactMessagesQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined
  });
  const [updateStatus] = useUpdateContactStatusMutation();
  const [deleteMessage] = useDeleteContactMessageMutation();

  const [selectedMessage, setSelectedMessage] = useState(null);

  const messages = Array.isArray(contactRes) ? contactRes : (contactRes?.data || []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      refetch();
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (err) {
      alert('Failed to update message status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this guest message permanently?')) return;
    try {
      await deleteMessage(id).unwrap();
      refetch();
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  return (
    <div className="admin-contact-page animate-fade-in" style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-lg" style={{ marginBottom: '0.25rem' }}>
            Guest Inquiries & Messages
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Review concierge messages submitted through the public contact desk with spam protection.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'unread', 'read', 'responded', 'archived'].map((st) => (
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

      {/* Messages List */}
      {isLoading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <Inbox size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 className="heading-sm" style={{ marginBottom: '0.5rem' }}>No Messages in Inbox</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            No guest inquiries match the filter ({statusFilter}).
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedMessage ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
          {/* Messages Table/List */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Guest</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Subject</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => (
                    <tr
                      key={m._id}
                      onClick={() => setSelectedMessage(m)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        backgroundColor: selectedMessage?._id === m._id ? 'rgba(230, 175, 93, 0.1)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.subject}</div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '220px'
                        }}>
                          {m.message}
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <Badge variant={m.status === 'unread' ? 'gold' : m.status === 'responded' ? 'emerald' : 'secondary'}>
                          {m.status}
                        </Badge>
                      </td>

                      <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Message Inspector Pane */}
          {selectedMessage && (
            <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '2rem', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 className="heading-sm" style={{ marginBottom: '0.25rem' }}>{selectedMessage.subject}</h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    From: <strong style={{ color: '#fff' }}>{selectedMessage.name}</strong> ({selectedMessage.email})
                  </div>
                  {selectedMessage.phone && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone: {selectedMessage.phone}</div>
                  )}
                </div>
                <Badge variant={selectedMessage.status === 'unread' ? 'gold' : 'emerald'}>
                  {selectedMessage.status}
                </Badge>
              </div>

              <div style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)'
              }}>
                {selectedMessage.message}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedMessage.status !== 'responded' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(selectedMessage._id, 'responded')}
                      icon={<CheckCircle2 size={14} />}
                    >
                      Mark Responded
                    </Button>
                  )}
                  {selectedMessage.status !== 'archived' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStatusUpdate(selectedMessage._id, 'archived')}
                      icon={<Archive size={14} />}
                    >
                      Archive
                    </Button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}>
                    <Button size="sm" variant="outline" icon={<Mail size={14} />}>
                      Reply via Email
                    </Button>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedMessage._id)}
                    style={{
                      padding: '0.4rem 0.6rem',
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
