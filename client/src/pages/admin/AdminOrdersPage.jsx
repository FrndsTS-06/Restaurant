import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAllOrders, updateOrderStatus, cancelOrder } from '../../services/orderService';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  AlertCircle,
  Eye,
  X,
  ChefHat,
  PackageCheck,
  CheckCheck,
  XCircle,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ORDER_STATUSES = [
  { id: 'All', label: 'All Orders' },
  { id: 'placed', label: 'Placed (New)', color: '#f59e0b' },
  { id: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
  { id: 'preparing', label: 'Kitchen Preparing', color: '#8b5cf6' },
  { id: 'ready', label: 'Ready for Pickup', color: '#10b981' },
  { id: 'completed', label: 'Completed', color: '#06b6d4' },
  { id: 'cancelled', label: 'Cancelled', color: '#ef4444' }
];

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Keyboard navigation: Escape closes open modals
  useEffect(() => {
    if (!selectedOrder && !cancelModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedOrder(null);
        setCancelModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder, cancelModalOpen]);

  const fetchOrders = async () => {
    setLoading(true);
    setActionError('');
    try {
      const res = await getAllOrders(statusFilter === 'All' ? null : statusFilter);
      setOrders(res.data || []);
      setPage(1);
    } catch (err) {
      setActionError(`Error fetching orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusTransition = async (orderId, targetStatus) => {
    setActionLoading(true);
    setActionMessage('');
    setActionError('');
    try {
      await updateOrderStatus(orderId, targetStatus);
      setOrders(prev => prev.map(o => (o._id === orderId ? { ...o, status: targetStatus } : o)));
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: targetStatus }));
      }
      setActionMessage(`Order successfully transitioned to ${targetStatus.toUpperCase()}`);
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionError(`Could not transition status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCancelModal = (order) => {
    setOrderToCancel(order);
    setCancelReason('Kitchen ingredient shortage or guest request');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setActionLoading(true);
    setActionMessage('');
    setActionError('');
    try {
      await cancelOrder(orderToCancel._id, cancelReason);
      setOrders(prev => prev.map(o => (o._id === orderToCancel._id ? { ...o, status: 'cancelled' } : o)));
      if (selectedOrder && selectedOrder._id === orderToCancel._id) {
        setSelectedOrder(prev => ({ ...prev, status: 'cancelled' }));
      }
      setActionMessage(`Order #${orderToCancel.orderNumber} successfully cancelled`);
      setTimeout(() => setActionMessage(''), 4000);
      setCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      setActionError(`Could not cancel order: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter orders by search term (orderNumber, customer name, email, phone)
  const filteredOrders = orders.filter(o => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchNum = o.orderNumber?.toLowerCase().includes(q);
    const matchName = o.customer?.name?.toLowerCase().includes(q);
    const matchEmail = o.customer?.email?.toLowerCase().includes(q);
    const matchPhone = o.customer?.phone?.toLowerCase().includes(q);
    return matchNum || matchName || matchEmail || matchPhone;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="admin-orders-page p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Live Order Dispatch Console
          </h1>
          <p className="text-slate-400 text-sm">
            Monitor, coordinate, and transition tickets through each stage of kitchen and delivery service.
          </p>
        </div>
        <Button onClick={fetchOrders} variant="secondary" size="sm" className="flex items-center gap-2">
          <RefreshCw size={15} /> Refresh Orders
        </Button>
      </div>

      {/* Action Messages & Alerts */}
      {actionMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {ORDER_STATUSES.map(st => {
            const active = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search order #, guest, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving orders from database..." />
      ) : filteredOrders.length === 0 ? (
        <div className="glass-panel text-center py-16 px-4 rounded-2xl border border-slate-800">
          <ClipboardList className="mx-auto text-slate-600 mb-3" size={40} />
          <h3 className="text-lg font-bold text-white mb-1">No Orders Found</h3>
          <p className="text-slate-400 text-xs">
            No orders match status "{statusFilter}" or search "{searchTerm}".
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">TICKET #</th>
                  <th className="py-3 px-4">GUEST & CONTACT</th>
                  <th className="py-3 px-4">TYPE</th>
                  <th className="py-3 px-4">ITEMS</th>
                  <th className="py-3 px-4">TOTAL</th>
                  <th className="py-3 px-4">PAYMENT</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">DISPATCH ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedOrders.map(order => (
                  <tr key={order._id} id={`admin-order-row-${order._id}`} className="hover:bg-slate-800/30 transition-colors">
                    {/* Order # */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="hover:underline flex items-center gap-1 text-left"
                      >
                        {order.orderNumber}
                      </button>
                      <div className="text-[10px] text-slate-500 font-sans font-normal">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>

                    {/* Guest */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{order.customer?.name || 'Guest'}</div>
                      <div className="text-[10px] text-slate-400">{order.customer?.phone || order.customer?.email}</div>
                    </td>

                    {/* Order Type */}
                    <td className="py-3.5 px-4 capitalize text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium">
                        {order.orderType}
                      </span>
                    </td>

                    {/* Items Count */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {order.items?.length || 0} course{order.items?.length === 1 ? '' : 's'}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatPrice(order.totalAmount, order.currency)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : order.paymentStatus === 'refunded'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {order.paymentStatus || 'pending'}
                      </span>
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize inline-flex items-center gap-1 ${
                          order.status === 'placed'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : order.status === 'confirmed'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            : order.status === 'preparing'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            : order.status === 'ready'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : order.status === 'completed'
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Dispatch Transitions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          id={`view-order-btn-${order._id}`}
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View order details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* State machine transitions */}
                        {order.status === 'placed' && (
                          <button
                            id={`confirm-order-btn-${order._id}`}
                            onClick={() => handleStatusTransition(order._id, 'confirmed')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors"
                          >
                            Confirm
                          </button>
                        )}

                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusTransition(order._id, 'preparing')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <ChefHat size={12} /> Cook
                          </button>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleStatusTransition(order._id, 'ready')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <PackageCheck size={12} /> Ready
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleStatusTransition(order._id, 'completed')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <CheckCheck size={12} /> Hand Over
                          </button>
                        )}

                        {/* Cancellation Button (eligible if not ready/completed/cancelled) */}
                        {['placed', 'confirmed', 'preparing'].includes(order.status) && (
                          <button
                            onClick={() => handleOpenCancelModal(order)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Cancel ticket"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          {filteredOrders.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Showing <span className="font-medium text-white">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium text-white">{Math.min(page * pageSize, filteredOrders.length)}</span> of{' '}
                <span className="font-medium text-white">{filteredOrders.length}</span> orders
              </span>
              <div className="flex items-center gap-2">
                <Button
                  id="orders-prev-page-btn"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 flex items-center gap-1 text-xs"
                >
                  <ChevronLeft size={14} /> Prev
                </Button>
                <span className="text-slate-300 font-mono px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  id="orders-next-page-btn"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 flex items-center gap-1 text-xs"
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Order Breakdown Details"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrder(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-slate-700 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-amber-400 font-mono font-bold tracking-wider">ORDER BREAKDOWN</span>
                <h3 className="text-xl font-serif font-bold text-white">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Guest & Logistics details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Guest Information</span>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <User size={13} className="text-amber-400" /> {selectedOrder.customer?.name}
                </div>
                <div className="text-slate-300 flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-500" /> {selectedOrder.customer?.phone || 'N/A'}
                </div>
                <div className="text-slate-300 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-500" /> {selectedOrder.customer?.email || 'N/A'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Service Modality</span>
                <div className="font-semibold text-white capitalize">{selectedOrder.orderType} service</div>
                {selectedOrder.orderType === 'dine-in' && (
                  <div className="text-slate-300">Table: {selectedOrder.tableNumber || 'Assigned Maître D'}</div>
                )}
                {selectedOrder.orderType === 'delivery' && (
                  <div className="text-slate-300 flex items-start gap-1.5">
                    <MapPin size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      {selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.city} {selectedOrder.deliveryAddress?.zipCode}
                    </span>
                  </div>
                )}
                <div className="text-slate-400 text-[10px]">
                  Placed at: {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Items Ordered List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dishes Selected</span>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-amber-400/10 text-amber-300 font-bold flex items-center justify-center font-mono">
                        {item.quantity}×
                      </span>
                      <div>
                        <div className="font-semibold text-white">{item.name}</div>
                        {item.specialInstructions && (
                          <div className="text-[10px] text-amber-400/80 italic">"{item.specialInstructions}"</div>
                        )}
                      </div>
                    </div>
                    <div className="font-mono text-white font-semibold">
                      {formatPrice(item.price * item.quantity, selectedOrder.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Calculations */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">{formatPrice(selectedOrder.subtotal, selectedOrder.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax</span>
                <span className="font-mono text-slate-200">{formatPrice(selectedOrder.tax, selectedOrder.currency)}</span>
              </div>
              {selectedOrder.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-slate-200">{formatPrice(selectedOrder.deliveryFee, selectedOrder.currency)}</span>
                </div>
              )}
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-mono">-{formatPrice(selectedOrder.discount, selectedOrder.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800 pt-2 mt-2">
                <span>Total Settled</span>
                <span className="font-mono text-amber-300 text-base">{formatPrice(selectedOrder.totalAmount, selectedOrder.currency)}</span>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button onClick={() => setSelectedOrder(null)} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ORDER CANCELLATION MODAL */}
      {cancelModalOpen && orderToCancel && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cancel Order Confirmation"
          onClick={(e) => { if (e.target === e.currentTarget) setCancelModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold text-white">Cancel Order {orderToCancel.orderNumber}</h3>
            </div>
            <p className="text-xs text-slate-300">
              Please specify the operational or guest reason for cancelling this order. This action creates a permanent audit log trail.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                placeholder="Enter cancellation reason..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button onClick={() => setCancelModalOpen(false)} variant="secondary" size="sm" disabled={actionLoading}>
                Back
              </Button>
              <Button onClick={handleConfirmCancel} variant="danger" size="sm" disabled={actionLoading || !cancelReason.trim()}>
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
