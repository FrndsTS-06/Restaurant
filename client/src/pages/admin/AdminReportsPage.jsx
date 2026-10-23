import React, { useState, useEffect } from 'react';
import { getAdminReport, downloadReportCsv } from '../../services/adminService';
import { formatPrice } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  ShoppingBag,
  UtensilsCrossed,
  Filter,
  RefreshCw,
  Table
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Revenue Report', icon: <IndianRupee size={16} />, desc: 'Daily gross revenue, tax, delivery fees, and discount totals' },
  { id: 'orders', label: 'Orders Summary Report', icon: <ShoppingBag size={16} />, desc: 'All guest tickets with customer info, status, and course details' },
  { id: 'reservations', label: 'Table Bookings Report', icon: <Table size={16} />, desc: 'Dining reservations, table allocations, and party sizes' },
  { id: 'dishes', label: 'Dishes Performance Report', icon: <UtensilsCrossed size={16} />, desc: 'Sales volume, revenue contribution, and kitchen margins' }
];

export const AdminReportsPage = () => {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getAdminReport(reportType, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        format: 'json'
      });
      setReportData(res.data || []);
    } catch (err) {
      alert(`Could not generate report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleDownloadCsv = async () => {
    setDownloading(true);
    try {
      await downloadReportCsv(reportType, {
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
    } catch (err) {
      alert(`Failed to download CSV: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Quick date presets
  const applyPreset = (days) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="admin-reports-page p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Executive Business Reports & Exports
          </h1>
          <p className="text-slate-400 text-sm">
            Generate audited reports for accounting, kitchen inventory planning, and guest patronage.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleDownloadCsv}
            disabled={downloading || loading || reportData.length === 0}
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            {downloading ? 'Exporting...' : 'Export to CSV'}
          </Button>

          <Button
            onClick={handleDownloadJson}
            disabled={loading || reportData.length === 0}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText size={16} /> Export JSON
          </Button>
        </div>
      </div>

      {/* Report Type Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_TYPES.map(rt => {
          const active = reportType === rt.id;
          return (
            <div
              key={rt.id}
              onClick={() => setReportType(rt.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                active
                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-400/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-lg ${active ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'}`}>
                  {rt.icon}
                </div>
                <h3 className="text-sm font-bold">{rt.label}</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{rt.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Date Filters & Presets */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Start:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">End:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <Button onClick={fetchReport} variant="secondary" size="sm" className="ml-2">
            Filter Range
          </Button>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] uppercase">Presets:</span>
          <button
            onClick={() => applyPreset(7)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            7 Days
          </button>
          <button
            onClick={() => applyPreset(30)}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            30 Days
          </button>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Live Data Preview Table */}
      {loading ? (
        <LoadingSpinner message={`Generating ${reportType} report analytics...`} />
      ) : reportData.length === 0 ? (
        <div className="glass-panel text-center py-16 px-4 rounded-2xl border border-slate-800">
          <BarChart3 className="mx-auto text-slate-600 mb-3" size={40} />
          <h3 className="text-lg font-bold text-white mb-1">No Data Available</h3>
          <p className="text-slate-400 text-xs">No records matched the selected report date range.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-2">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Report Preview ({reportData.length} records ready for export)
            </span>
            <span className="text-[11px] text-amber-400 font-mono">RFC 4180 Compliant CSV Ready</span>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {/* Sales Preview Table */}
            {reportType === 'sales' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">DATE</th>
                    <th className="py-2.5 px-4">ORDERS</th>
                    <th className="py-2.5 px-4">SUBTOTAL</th>
                    <th className="py-2.5 px-4">TAX</th>
                    <th className="py-2.5 px-4">DELIVERY</th>
                    <th className="py-2.5 px-4">DISCOUNT</th>
                    <th className="py-2.5 px-4 text-right">TOTAL REVENUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-sans font-semibold text-white">{row._id}</td>
                      <td className="py-2.5 px-4 text-slate-300">{row.ordersCount}</td>
                      <td className="py-2.5 px-4 text-slate-300">{formatPrice(row.subtotal)}</td>
                      <td className="py-2.5 px-4 text-slate-300">{formatPrice(row.tax)}</td>
                      <td className="py-2.5 px-4 text-slate-300">{formatPrice(row.deliveryFee)}</td>
                      <td className="py-2.5 px-4 text-slate-300">{formatPrice(row.discount)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-amber-300">{formatPrice(row.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Orders Preview Table */}
            {reportType === 'orders' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">ORDER #</th>
                    <th className="py-2.5 px-4">DATE</th>
                    <th className="py-2.5 px-4">GUEST</th>
                    <th className="py-2.5 px-4">TYPE</th>
                    <th className="py-2.5 px-4">STATUS</th>
                    <th className="py-2.5 px-4">COURSES</th>
                    <th className="py-2.5 px-4 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reportData.map(o => (
                    <tr key={o._id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{o.orderNumber}</td>
                      <td className="py-2.5 px-4 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4 text-white font-semibold">{o.customer?.name}</td>
                      <td className="py-2.5 px-4 capitalize text-slate-300">{o.orderType}</td>
                      <td className="py-2.5 px-4 capitalize text-slate-300">{o.status}</td>
                      <td className="py-2.5 px-4 text-slate-300">{o.items?.length || 0}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">{formatPrice(o.totalAmount, o.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Reservations Preview Table */}
            {reportType === 'reservations' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">RES #</th>
                    <th className="py-2.5 px-4">DATE</th>
                    <th className="py-2.5 px-4">TIME</th>
                    <th className="py-2.5 px-4">GUEST</th>
                    <th className="py-2.5 px-4">COVERS</th>
                    <th className="py-2.5 px-4">TABLE</th>
                    <th className="py-2.5 px-4 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reportData.map(r => (
                    <tr key={r._id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">{r.reservationNumber}</td>
                      <td className="py-2.5 px-4 text-white">{r.reservationDate}</td>
                      <td className="py-2.5 px-4 text-slate-300 font-mono">{r.timeSlot}</td>
                      <td className="py-2.5 px-4 text-white font-semibold">{r.guestName}</td>
                      <td className="py-2.5 px-4 text-slate-300">{r.guestsCount} guests</td>
                      <td className="py-2.5 px-4 text-slate-300">{r.tableNumber || 'Auto'}</td>
                      <td className="py-2.5 px-4 text-right capitalize font-bold text-slate-300">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Dishes Preview Table */}
            {reportType === 'dishes' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">DISH CREATION</th>
                    <th className="py-2.5 px-4">CATEGORY</th>
                    <th className="py-2.5 px-4">PRICE</th>
                    <th className="py-2.5 px-4">COST</th>
                    <th className="py-2.5 px-4">UNIT MARGIN</th>
                    <th className="py-2.5 px-4">TOTAL SOLD</th>
                    <th className="py-2.5 px-4 text-right">TOTAL REVENUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reportData.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-semibold text-white">{d.name}</td>
                      <td className="py-2.5 px-4 text-slate-300">{d.category}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-300">{formatPrice(d.price)}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{formatPrice(d.costPrice)}</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-400 font-semibold">{formatPrice(d.margin)}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-200">{d.totalSold}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-300">{formatPrice(d.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
