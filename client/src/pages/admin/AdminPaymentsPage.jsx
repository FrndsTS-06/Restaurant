import React, { useState } from 'react';
import {
  useGetAdminPaymentsQuery,
  useRefundAdminPaymentMutation
} from '../../store/api/apiSlice';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  CreditCard,
  Search,
  Filter,
  IndianRupee,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Receipt
} from 'lucide-react';

export const AdminPaymentsPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: resData, isLoading, isFetching, refetch } = useGetAdminPaymentsQuery({
    page,
    limit: 12,
    status: status === 'all' ? '' : status,
    paymentMethod: paymentMethod === 'all' ? '' : paymentMethod,
    search: debouncedSearch
  });

  const [refundPayment, { isLoading: isRefunding }] = useRefundAdminPaymentMutation();

  // Refund modal state
  const [refundModal, setRefundModal] = useState({
    isOpen: false,
    payment: null,
    reason: ''
  });

  const payments = resData?.data?.payments || [];
  const summary = resData?.data?.summary || {
    totalVolume: 0,
    successfulVolume: 0,
    refundedVolume: 0,
    totalCount: 0,
    successfulCount: 0,
    refundedCount: 0
  };
  const pagination = resData?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleOpenRefund = (payment) => {
    setRefundModal({
      isOpen: true,
      payment,
      reason: 'Guest requested refund for tasting menu modification'
    });
  };

  const handleConfirmRefund = async () => {
    if (!refundModal.payment) return;
    try {
      await refundPayment({
        id: refundModal.payment._id,
        reason: refundModal.reason
      }).unwrap();
      setRefundModal({ isOpen: false, payment: null, reason: '' });
      refetch();
    } catch (err) {
      alert(`Could not process refund: ${err?.data?.message || err.message}`);
    }
  };

  const successRate = summary.totalCount > 0
    ? Math.round((summary.successfulCount / summary.totalCount) * 100)
    : 100;

  return (
    <div className="admin-payments-page p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Payments & Settlement Ledger
          </h1>
          <p className="text-slate-400 text-sm">
            Inspect verified gateway transaction records, payment statuses, and process refunds.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="secondary" size="sm" className="flex items-center gap-2">
          <RefreshCw size={15} /> Refresh Ledger
        </Button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Gross Volume</span>
            <IndianRupee size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{formatPrice(summary.totalVolume)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{summary.totalCount} total transactions</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Settled Revenue</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{formatPrice(summary.successfulVolume)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{summary.successfulCount} successful settlements</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Refunded Volume</span>
            <RotateCcw size={18} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">{formatPrice(summary.refundedVolume)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{summary.refundedCount} refunds executed</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase">Settlement Success Rate</span>
            <ShieldCheck size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">{successRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Gateway settlement ratio</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status & Method Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Statuses</option>
            <option value="successful">Successful</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Payment Methods</option>
            <option value="razorpay">Razorpay Gateway</option>
            <option value="card">Credit / Debit Card</option>
            <option value="cash">Cash on Hand / Table</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search gateway ID, order #..."
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

      {/* Transactions Table */}
      {isLoading ? (
        <LoadingSpinner message="Querying transaction records and payment gateways..." />
      ) : payments.length === 0 ? (
        <div className="glass-panel text-center py-16 px-4 rounded-2xl border border-slate-800">
          <Receipt className="mx-auto text-slate-600 mb-3" size={40} />
          <h3 className="text-lg font-bold text-white mb-1">No Transactions Found</h3>
          <p className="text-slate-400 text-xs">No payment records match the selected status or search filter.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">TRANSACTION / ID</th>
                  <th className="py-3 px-4">ORDER #</th>
                  <th className="py-3 px-4">PATRON</th>
                  <th className="py-3 px-4">METHOD</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Gateway IDs */}
                    <td className="py-3 px-4 font-mono">
                      <div className="text-amber-400 font-semibold">
                        {p.paymentGateway?.paymentId || p._id.slice(-8).toUpperCase()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {p.paymentGateway?.orderId || `TXN-${p._id.slice(-6)}`}
                      </div>
                    </td>

                    {/* Order # */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {p.order?.orderNumber || 'Dine-In Tab'}
                    </td>

                    {/* Patron */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {p.user?.name || p.order?.customer?.name || 'Walk-In Guest'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.user?.email || p.order?.customer?.email}
                      </div>
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4 capitalize text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono">
                        {p.paymentMethod}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatPrice(p.amount, p.currency)}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'successful'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'refunded'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : p.status === 'failed'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Action: Refund */}
                    <td className="py-3 px-4 text-right">
                      {p.status === 'successful' && (
                        <button
                          onClick={() => handleOpenRefund(p)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors ml-auto"
                        >
                          <RotateCcw size={12} /> Refund
                        </button>
                      )}
                      {p.status === 'refunded' && (
                        <span className="text-[10px] text-slate-500 italic">
                          Refunded ({p.refundDetails?.refundId || 'Executed'})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total payments)
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

      {/* REFUND MODAL */}
      {refundModal.isOpen && refundModal.payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <RotateCcw size={22} />
              <h3 className="text-lg font-bold text-white">Execute Gateway Refund</h3>
            </div>
            <p className="text-xs text-slate-300">
              This will execute a full refund of{' '}
              <strong className="text-white font-mono">{formatPrice(refundModal.payment.amount, refundModal.payment.currency)}</strong> back to the original payment method. The associated ticket will be marked as refunded.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Reason for Settlement Refund</label>
              <textarea
                rows={3}
                value={refundModal.reason}
                onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                placeholder="Enter justification for refund audit..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button onClick={() => setRefundModal({ isOpen: false, payment: null, reason: '' })} variant="secondary" size="sm" disabled={isRefunding}>
                Cancel
              </Button>
              <Button onClick={handleConfirmRefund} variant="danger" size="sm" disabled={isRefunding || !refundModal.reason.trim()}>
                {isRefunding ? 'Processing Refund...' : 'Confirm & Execute Refund'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
