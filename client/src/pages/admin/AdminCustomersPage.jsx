import React, { useState } from 'react';
import {
  useGetAdminCustomersQuery,
  useUpdateCustomerStatusMutation
} from '../../store/api/apiSlice';
import { getAdminCustomerById } from '../../services/adminService';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Users,
  Search,
  X,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export const AdminCustomersPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: resData, isLoading, isFetching, refetch } = useGetAdminCustomersQuery({
    page,
    limit: 10,
    search: debouncedSearch
  });

  const [updateCustomerStatus, { isLoading: isUpdatingStatus }] = useUpdateCustomerStatusMutation();

  // Selected customer details modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Status toggle confirmation
  const [statusConfirmModal, setStatusConfirmModal] = useState({
    isOpen: false,
    customer: null,
    targetActive: false,
    notes: ''
  });

  const customers = resData?.data || [];
  const pagination = resData?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleOpenDetails = async (id) => {
    setSelectedCustomerId(id);
    setDetailsLoading(true);
    try {
      const res = await getAdminCustomerById(id);
      setCustomerDetails(res.data);
    } catch (err) {
      alert(`Could not load customer profile: ${err.message}`);
      setSelectedCustomerId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenStatusConfirm = (customer, targetActive) => {
    setStatusConfirmModal({
      isOpen: true,
      customer,
      targetActive,
      notes: customer.notes || ''
    });
  };

  const handleConfirmStatusChange = async () => {
    const { customer, targetActive, notes } = statusConfirmModal;
    try {
      await updateCustomerStatus({
        id: customer._id,
        isActive: targetActive,
        notes
      }).unwrap();
      setStatusConfirmModal({ isOpen: false, customer: null, targetActive: false, notes: '' });
      refetch();
      if (customerDetails && customerDetails.customer?._id === customer._id) {
        setCustomerDetails(prev => ({
          ...prev,
          customer: { ...prev.customer, isActive: targetActive, notes }
        }));
      }
    } catch (err) {
      alert(`Failed to update customer status: ${err?.data?.message || err.message}`);
    }
  };

  return (
    <div className="admin-customers-page p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Customer Directory
          </h1>
          <p className="text-slate-400 text-sm">
            Search guest records, inspect dining histories, total patronage spend, and access accounts.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Total Registered Guests</div>
          <div className="text-2xl font-bold text-white mt-1">{pagination.total || 0}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Showing On Current Page</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{customers.length} guests</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase">Directory Page</div>
          <div className="text-2xl font-bold text-blue-300 mt-1">
            {pagination.page} / {pagination.totalPages || 1}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <LoadingSpinner message="Searching customer records in MongoDB..." />
      ) : customers.length === 0 ? (
        <div className="glass-panel text-center py-16 px-4 rounded-2xl border border-slate-800">
          <Users className="mx-auto text-slate-600 mb-3" size={40} />
          <h3 className="text-lg font-bold text-white mb-1">No Customers Found</h3>
          <p className="text-slate-400 text-xs">No registered customer matches query "{debouncedSearch}".</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">GUEST PROFILE</th>
                  <th className="py-3 px-4">CONTACT</th>
                  <th className="py-3 px-4">ORDERS</th>
                  <th className="py-3 px-4">LIFETIME SPEND</th>
                  <th className="py-3 px-4">JOINED</th>
                  <th className="py-3 px-4">ACCOUNT STATUS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Guest Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                          alt={c.name || 'Customer Avatar'}
                          loading="lazy"
                          decoding="async"
                          width="32"
                          height="32"
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-white">{c.name}</div>
                          {c.notes && (
                            <div className="text-[10px] text-amber-400/80 italic line-clamp-1">"{c.notes}"</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{c.email}</div>
                      <div className="text-[10px] text-slate-400">{c.phone || 'No phone'}</div>
                    </td>

                    {/* Orders count */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {c.ordersCount || 0} ticket{(c.ordersCount === 1) ? '' : 's'}
                    </td>

                    {/* Lifetime Spend */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      {formatPrice(c.totalSpent || 0)}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3 px-4 text-slate-400">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.isActive !== false
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {c.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetails(c._id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View customer dossier"
                        >
                          <Eye size={15} />
                        </button>
                        {c.isActive !== false ? (
                          <button
                            onClick={() => handleOpenStatusConfirm(c, false)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Suspend guest account"
                          >
                            <UserX size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenStatusConfirm(c, true)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                            title="Reactivate guest account"
                          >
                            <UserCheck size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total customers)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  variant="secondary"
                  size="sm"
                >
                  <ChevronLeft size={14} /> Previous
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || isFetching}
                  variant="secondary"
                  size="sm"
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CUSTOMER PROFILE DOSSIER MODAL */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-slate-700 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-amber-400 font-mono font-bold tracking-wider">PATRON DOSSIER</span>
                <h3 className="text-xl font-serif font-bold text-white">
                  {customerDetails?.customer?.name || 'Customer Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {detailsLoading ? (
              <LoadingSpinner message="Loading customer order and booking history..." />
            ) : customerDetails ? (
              <div className="space-y-6 text-xs">
                {/* Contact Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Contact Info</span>
                    <div className="text-white font-medium flex items-center gap-1.5">
                      <Mail size={13} className="text-amber-400" /> {customerDetails.customer?.email}
                    </div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-500" /> {customerDetails.customer?.phone || 'No phone recorded'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Delivery Address</span>
                    <div className="text-slate-300">
                      {customerDetails.customer?.address?.street
                        ? `${customerDetails.customer.address.street}, ${customerDetails.customer.address.city} ${customerDetails.customer.address.zipCode}`
                        : 'No saved address'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Joined: {new Date(customerDetails.customer?.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Orders History */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShoppingBag size={14} className="text-blue-400" />
                    Orders Placed ({customerDetails.orders?.length || 0})
                  </h4>
                  {customerDetails.orders?.length === 0 ? (
                    <p className="text-slate-500 italic p-3 bg-slate-900/50 rounded-xl">No orders placed by this guest yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900 max-h-48 overflow-y-auto">
                      {customerDetails.orders?.map(o => (
                        <div key={o._id} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-amber-400">{o.orderNumber}</span>
                            <span className="text-slate-400 ml-2">({o.orderType})</span>
                            <div className="text-[10px] text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-white">{formatPrice(o.totalAmount, o.currency)}</span>
                            <div className="text-[10px] capitalize text-slate-400">{o.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reservations History */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Calendar size={14} className="text-emerald-400" />
                    Table Bookings ({customerDetails.reservations?.length || 0})
                  </h4>
                  {customerDetails.reservations?.length === 0 ? (
                    <p className="text-slate-500 italic p-3 bg-slate-900/50 rounded-xl">No table reservations recorded.</p>
                  ) : (
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900 max-h-48 overflow-y-auto">
                      {customerDetails.reservations?.map(r => (
                        <div key={r._id} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-emerald-400">{r.reservationNumber}</span>
                            <span className="text-slate-400 ml-2">{r.reservationDate} at {r.timeSlot}</span>
                            <div className="text-[10px] text-slate-500">Party of {r.guestsCount} • Table {r.tableNumber || 'Assigned'}</div>
                          </div>
                          <div className="text-right">
                            <span className="capitalize font-bold text-slate-300">{r.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <Button onClick={() => setSelectedCustomerId(null)} variant="secondary" size="sm">
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS TOGGLE MODAL */}
      {statusConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex items-center gap-3">
              {statusConfirmModal.targetActive ? (
                <ShieldCheck size={24} className="text-emerald-400" />
              ) : (
                <ShieldAlert size={24} className="text-rose-400" />
              )}
              <h3 className="text-lg font-bold text-white">
                {statusConfirmModal.targetActive ? 'Reactivate Guest Account' : 'Suspend Guest Account'}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to {statusConfirmModal.targetActive ? 'reactivate' : 'suspend'} access for{' '}
              <strong>{statusConfirmModal.customer?.name}</strong> ({statusConfirmModal.customer?.email})?
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Maître D Internal Notes</label>
              <textarea
                rows={2}
                value={statusConfirmModal.notes}
                onChange={(e) => setStatusConfirmModal({ ...statusConfirmModal, notes: e.target.value })}
                placeholder="Internal notes regarding this patron..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={() => setStatusConfirmModal({ isOpen: false, customer: null, targetActive: false, notes: '' })}
                variant="secondary"
                size="sm"
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusChange}
                variant={statusConfirmModal.targetActive ? 'primary' : 'danger'}
                size="sm"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Updating...' : statusConfirmModal.targetActive ? 'Confirm Activation' : 'Confirm Suspension'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
