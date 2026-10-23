import React, { useState, useEffect } from 'react';
import {
  getAllReservations,
  updateReservationStatus
} from '../../services/reservationService';
import {
  getAllTables,
  createTable,
  updateTable,
  toggleBlockTable,
  deleteTable
} from '../../services/tableService';
import { request } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  CalendarCheck,
  Users,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  Plus,
  Trash2,
  Ban,
  Unlock,
  Settings,
  Filter,
  Search,
  AlertCircle,
  Save,
  Check,
  AlertTriangle,
  X
} from 'lucide-react';

export const AdminReservationsPage = () => {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'tables' | 'settings'

  // --- 1. Bookings State ---
  const [reservations, setReservations] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  // --- 2. Tables State ---
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    capacity: 4,
    minCapacity: 1,
    location: 'Main Dining Salon'
  });
  const [tableModalOpen, setTableModalOpen] = useState(false);

  // --- 3. Settings State ---
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);

  // Accessible confirmation & blocking modals, non-blocking feedback
  const [confirmModal, setConfirmModal] = useState(null);
  const [blockModal, setBlockModal] = useState(null);
  const [blockReasonInput, setBlockReasonInput] = useState('VIP Hold or Private Salon Event');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Keyboard Escape listener
  useEffect(() => {
    const isAnyOpen = Boolean(confirmModal) || Boolean(blockModal) || tableModalOpen;
    if (!isAnyOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirmModal(null);
        setBlockModal(null);
        setTableModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, blockModal, tableModalOpen]);

  // Fetch reservations
  const fetchReservations = async () => {
    setBookingsLoading(true);
    try {
      const res = await getAllReservations({
        date: dateFilter,
        status: statusFilter,
        search: searchFilter
      });
      setReservations(res.data || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Fetch tables
  const fetchTables = async () => {
    setTablesLoading(true);
    try {
      const res = await getAllTables();
      setTables(res.data || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setTablesLoading(false);
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await request('/settings');
      setSettings(res.data || {});
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') fetchReservations();
    if (activeTab === 'tables') fetchTables();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, dateFilter, statusFilter]);

  // Handle status update or table assignment
  const handleUpdateReservation = async (id, status, tableNumber, cancellationReason) => {
    try {
      const res = await updateReservationStatus(id, status, tableNumber, cancellationReason);
      setReservations(prev =>
        prev.map(r => (r._id === id ? { ...r, ...res.data } : r))
      );
      setFeedback({ type: 'success', message: `Reservation status transitioned to ${status.toUpperCase()}.` });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3500);
    } catch (err) {
      setFeedback({ type: 'error', message: `Could not update reservation: ${err.message}` });
    }
  };

  // Handle create table
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTable.tableNumber || !newTable.capacity) return;
    try {
      await createTable(newTable);
      setNewTable({ tableNumber: '', capacity: 4, minCapacity: 1, location: 'Main Dining Salon' });
      setTableModalOpen(false);
      fetchTables();
      setFeedback({ type: 'success', message: `Table "${newTable.tableNumber}" added successfully.` });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3500);
    } catch (err) {
      setFeedback({ type: 'error', message: `Failed to add table: ${err.message}` });
    }
  };

  // Handle block/unblock table
  const handleToggleBlockTable = async (id, currentBlocked) => {
    if (currentBlocked) {
      try {
        await toggleBlockTable(id, false, '');
        fetchTables();
        setFeedback({ type: 'success', message: 'Table unblocked and returned to service.' });
        setTimeout(() => setFeedback({ type: '', message: '' }), 3500);
      } catch (err) {
        setFeedback({ type: 'error', message: `Failed to unblock table: ${err.message}` });
      }
    } else {
      setBlockReasonInput('VIP Hold or Private Salon Event');
      setBlockModal({ id });
    }
  };

  const handleConfirmBlockTable = async () => {
    if (!blockModal) return;
    try {
      await toggleBlockTable(blockModal.id, true, blockReasonInput || 'Blocked by manager');
      fetchTables();
      setBlockModal(null);
      setFeedback({ type: 'success', message: 'Table successfully blocked from guest reservations.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 3500);
    } catch (err) {
      setFeedback({ type: 'error', message: `Failed to block table: ${err.message}` });
    }
  };

  // Handle delete table
  const handleDeleteTable = (id, number) => {
    setConfirmModal({
      title: 'Remove Dining Table',
      message: `Permanently delete table "${number}"? Existing reservations will retain history.`,
      confirmText: 'Delete Table',
      onConfirm: async () => {
        try {
          await deleteTable(id);
          fetchTables();
          setFeedback({ type: 'success', message: `Table "${number}" removed.` });
          setTimeout(() => setFeedback({ type: '', message: '' }), 3500);
        } catch (err) {
          setFeedback({ type: 'error', message: `Failed to delete table: ${err.message}` });
        }
      }
    });
  };

  // Handle save settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const res = await request('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setSettings(res.data);
      setSettingsMessage('Dining parameters and operating policies successfully updated.');
    } catch (err) {
      setFeedback({ type: 'error', message: `Failed to save settings: ${err.message}` });
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="admin-reservations-page animate-fade-in text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-white/10 gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Dining Room <span className="gradient-text-gold">Concierge & Tables</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Coordinate guest bookings, live table assignments, dining durations, and buffer periods.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            id="admin-tab-bookings"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-[#13151b] border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Reservations ({reservations.length})
          </button>
          <button
            id="admin-tab-tables"
            onClick={() => setActiveTab('tables')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-[#13151b] border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Dining Tables
          </button>
          <button
            id="admin-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-[#13151b] border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Hours & Policies
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback.message && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 mb-6 animate-fade-in ${
          feedback.type === 'error'
            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
        }`}>
          {feedback.type === 'error' ? <AlertTriangle size={16} className="shrink-0" /> : <Check size={16} className="shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: BOOKINGS LIST & CONCIERGE */}
      {/* ============================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#13151b] border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Date:</span>
                <input
                  id="admin-res-date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase">Status:</span>
                <select
                  id="admin-res-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="seated">Seated</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <Button onClick={fetchReservations} variant="secondary" size="sm">
              Refresh Bookings
            </Button>
          </div>

          {bookingsLoading ? (
            <LoadingSpinner message="Querying reservations..." />
          ) : reservations.length === 0 ? (
            <div className="p-16 rounded-3xl bg-[#13151b] border border-white/10 text-center">
              <CalendarCheck size={48} className="mx-auto text-slate-600 mb-3" />
              <h3 className="font-serif text-lg font-bold text-white mb-1">No Reservations Found</h3>
              <p className="text-slate-400 text-xs">No guest bookings match the current date and status filters.</p>
            </div>
          ) : (
            <div className="bg-[#13151b] border border-white/10 rounded-2xl overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">CODE & GUEST</th>
                    <th className="p-4">DATE & TIME</th>
                    <th className="p-4">PARTY</th>
                    <th className="p-4">TABLE</th>
                    <th className="p-4">NOTES</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reservations.map(r => (
                    <tr key={r._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-[10px] text-amber-400 font-semibold block">{r.reservationNumber || 'RES-SAV'}</span>
                        <div className="font-semibold text-white text-sm">{r.guestName}</div>
                        <div className="text-slate-400 text-[11px]">{r.guestEmail} • {r.guestPhone}</div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="text-white font-medium">{r.reservationDate}</div>
                        <div className="text-amber-400 font-semibold">{r.timeSlot} {r.endTimeSlot ? `– ${r.endTimeSlot}` : ''}</div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-white text-sm">{r.guestsCount}</span> Guests
                        <div className="text-[10px] text-slate-500">{r.seatingArea}</div>
                      </td>

                      <td className="p-4">
                        <input
                          type="text"
                          defaultValue={r.tableNumber || ''}
                          placeholder="Assign table..."
                          onBlur={(e) => {
                            if (e.target.value !== r.tableNumber) {
                              handleUpdateReservation(r._id, null, e.target.value, null);
                            }
                          }}
                          className="bg-[#0b0c10] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white w-28 focus:border-amber-400"
                        />
                      </td>

                      <td className="p-4 max-w-xs text-slate-400 text-[11px]">
                        {r.specialRequests || 'Standard reservation'}
                        {r.cancellationReason && (
                          <span className="block text-rose-400 mt-0.5">Cancel: {r.cancellationReason}</span>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full font-semibold capitalize text-[11px] ${
                          r.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          r.status === 'seated' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                          r.status === 'completed' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                          r.status === 'rejected' || r.status === 'cancelled' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          'bg-slate-700/50 text-slate-300 border border-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <select
                          id={`change-res-status-${r._id}`}
                          value={r.status}
                          onChange={(e) => handleUpdateReservation(r._id, e.target.value, null, null)}
                          className="bg-[#0b0c10] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white cursor-pointer focus:border-amber-400"
                        >
                          <option value="confirmed">Confirm</option>
                          <option value="pending">Pending</option>
                          <option value="seated">Seat Guest</option>
                          <option value="completed">Complete</option>
                          <option value="cancelled">Cancel</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: RESTAURANT TABLE MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-serif text-xl font-bold text-white">Dining Salon Tables</h2>
              <p className="text-slate-400 text-xs">Define capacities, salon locations, and block tables when unavailable.</p>
            </div>
            <Button id="open-add-table-btn" onClick={() => setTableModalOpen(true)} icon={<Plus size={16} />} size="sm">
              Add Table
            </Button>
          </div>

          {/* Add Table Modal / Form */}
          {tableModalOpen && (
            <form onSubmit={handleCreateTable} className="p-6 rounded-2xl bg-[#13151b] border border-amber-400/30 shadow-2xl space-y-4">
              <h3 className="font-serif text-base font-bold text-white">Configure New Dining Table</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Table Number *</label>
                  <input
                    id="new-table-number"
                    type="text"
                    required
                    placeholder="e.g. Table 8"
                    value={newTable.tableNumber}
                    onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Max Capacity (Seats) *</label>
                  <input
                    id="new-table-capacity"
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Min Party Size</label>
                  <input
                    id="new-table-min-capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={newTable.minCapacity}
                    onChange={(e) => setNewTable({ ...newTable, minCapacity: Number(e.target.value) })}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Salon Location</label>
                  <select
                    id="new-table-location"
                    value={newTable.location}
                    onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="Main Dining Salon">Main Dining Salon</option>
                    <option value="Window Alcove">Window Alcove</option>
                    <option value="Patio Terrace">Patio Terrace</option>
                    <option value="Sommelier Cellar Room">Sommelier Cellar Room</option>
                    <option value="Chef Counter">Chef Counter</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setTableModalOpen(false)}>Cancel</Button>
                <Button id="save-new-table-btn" type="submit" size="sm">Save Table</Button>
              </div>
            </form>
          )}

          {tablesLoading ? (
            <LoadingSpinner message="Loading tables..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tables.map(t => (
                <div
                  key={t._id}
                  className={`p-5 rounded-2xl border transition-all ${
                    t.isBlocked
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-[#13151b] border-white/10 hover:border-amber-400/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-white">{t.tableNumber}</h4>
                      <div className="text-[11px] text-slate-400">{t.location}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      t.isBlocked
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {t.isBlocked ? 'Blocked' : 'Available'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 mb-4 space-y-1">
                    <div>Seating: <strong>{t.capacity}</strong> Guests (Min: {t.minCapacity || 1})</div>
                    {t.isBlocked && t.blockedReason && (
                      <div className="text-rose-400 text-[11px]">Reason: {t.blockedReason}</div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <button
                      id={`toggle-block-table-${t._id}`}
                      onClick={() => handleToggleBlockTable(t._id, t.isBlocked)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                        t.isBlocked
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                      }`}
                    >
                      {t.isBlocked ? <Unlock size={13} /> : <Ban size={13} />}
                      {t.isBlocked ? 'Unblock Table' : 'Block Table'}
                    </button>

                    <button
                      onClick={() => handleDeleteTable(t._id, t.tableNumber)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                      title="Delete Table"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: OPERATING HOURS, DURATION & POLICIES */}
      {/* ============================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {settingsMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm text-center">
              {settingsMessage}
            </div>
          )}

          {settingsLoading ? (
            <LoadingSpinner message="Consulting restaurant settings..." />
          ) : settings && (
            <form onSubmit={handleSaveSettings} className="p-8 rounded-3xl bg-[#13151b] border border-white/10 shadow-xl space-y-6 max-w-2xl">
              <div>
                <h2 className="font-serif text-xl font-bold text-white mb-1">Reservation Parameters & Timeslots</h2>
                <p className="text-slate-400 text-xs">Configure seating durations, buffer intervals, and operating windows.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Timezone</label>
                  <input
                    type="text"
                    value={settings.timezone || 'America/New_York'}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Booking Duration (Minutes)</label>
                  <input
                    id="settings-duration"
                    type="number"
                    min="30"
                    max="240"
                    value={settings.bookingDurationMinutes || 90}
                    onChange={(e) => setSettings({ ...settings, bookingDurationMinutes: Number(e.target.value) })}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Buffer Between Seatings (Minutes)</label>
                  <input
                    id="settings-buffer"
                    type="number"
                    min="0"
                    max="60"
                    value={settings.bufferTimeMinutes || 15}
                    onChange={(e) => setSettings({ ...settings, bufferTimeMinutes: Number(e.target.value) })}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Min Notice (Hours in Advance)</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.minNoticeHours || 1}
                    onChange={(e) => setSettings({ ...settings, minNoticeHours: Number(e.target.value) })}
                    className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <h3 className="font-serif text-sm font-bold text-white mb-3">Operating Windows</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Dinner Opening (HH:mm)</label>
                    <input
                      type="text"
                      value={settings.operatingHours?.dinner?.open || '17:00'}
                      onChange={(e) => setSettings({
                        ...settings,
                        operatingHours: {
                          ...settings.operatingHours,
                          dinner: { ...settings.operatingHours?.dinner, open: e.target.value }
                        }
                      })}
                      className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Dinner Last Seating (HH:mm)</label>
                    <input
                      type="text"
                      value={settings.operatingHours?.dinner?.close || '22:30'}
                      onChange={(e) => setSettings({
                        ...settings,
                        operatingHours: {
                          ...settings.operatingHours,
                          dinner: { ...settings.operatingHours?.dinner, close: e.target.value }
                        }
                      })}
                      className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <Button id="save-reservation-settings-btn" type="submit" disabled={settingsSaving} icon={<Save size={16} />}>
                  {settingsSaving ? 'Updating...' : 'Save Dining Policies'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={confirmModal.title}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 space-y-4 bg-[#13151b]">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-300">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button onClick={() => setConfirmModal(null)} variant="secondary" size="sm">
                Cancel
              </Button>
              <Button
                id="admin-confirm-table-action-btn"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  if (cb) cb();
                }}
                variant="danger"
                size="sm"
              >
                {confirmModal.confirmText || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK TABLE MODAL */}
      {blockModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Block Table"
          onClick={(e) => { if (e.target === e.currentTarget) setBlockModal(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-amber-400/30 space-y-4 bg-[#13151b]">
            <div className="flex items-center gap-3 text-amber-400">
              <Ban size={24} />
              <h3 className="text-lg font-bold text-white">Block Dining Table</h3>
            </div>
            <p className="text-xs text-slate-300">
              State the reason this table is temporarily blocked from online reservations (e.g. VIP Hold, Salon Maintenance, Private Buyout).
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Hold Reason</label>
              <input
                id="block-table-reason-input"
                type="text"
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0b0c10] border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button onClick={() => setBlockModal(null)} variant="secondary" size="sm">
                Cancel
              </Button>
              <Button
                id="confirm-block-table-btn"
                onClick={handleConfirmBlockTable}
                variant="primary"
                size="sm"
              >
                Apply Hold
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
