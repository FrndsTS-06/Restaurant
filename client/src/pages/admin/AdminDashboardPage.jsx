import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetAdminAnalyticsQuery } from '../../store/api/apiSlice';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  IndianRupee,
  ShoppingBag,
  CalendarCheck,
  Clock,
  TrendingUp,
  ArrowRight,
  Flame,
  RefreshCw,
  Layers,
  ChevronRight,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { data: analyticsRes, isLoading, isFetching, refetch, error } = useGetAdminAnalyticsQuery(undefined, {
    pollingInterval: 30000 // auto-refresh every 30 seconds
  });

  const [hoveredDay, setHoveredDay] = useState(null);

  if (isLoading) {
    return <LoadingSpinner message="Aggregating dining room revenue and live tickets..." />;
  }

  if (error) {
    return (
      <div className="glass-panel text-center p-8 m-6 rounded-xl border border-red-500/30">
        <AlertCircle className="mx-auto text-rose-400 mb-3" size={36} />
        <h2 className="text-xl font-bold text-white mb-2">Error Loading Analytics</h2>
        <p className="text-slate-400 text-sm mb-4">
          {error?.data?.message || 'Failed to aggregate real-time metrics from the database.'}
        </p>
        <Button onClick={refetch} variant="primary" size="sm">
          Retry Aggregation
        </Button>
      </div>
    );
  }

  const data = analyticsRes?.data || {};
  const {
    totalOrders = 0,
    todayRevenue = 0,
    todayOrdersCount = 0,
    totalRevenue = 0,
    pendingOrders = 0,
    activeReservations = 0,
    todayReservations = 0,
    popularDishes = [],
    recentOrders = [],
    salesChart = [],
    orderStatusDistribution = {}
  } = data;

  // Compute max revenue for SVG chart scaling
  const maxRevenue = Math.max(...salesChart.map(d => d.revenue), 100);

  // Status mapping colors & labels
  const statusMeta = {
    placed: { label: 'Placed', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    confirmed: { label: 'Confirmed', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    preparing: { label: 'Preparing', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    ready: { label: 'Ready for Pickup', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    completed: { label: 'Completed', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
  };

  const totalStatusCount = Object.values(orderStatusDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="admin-dashboard-page p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
              Live Operations Feed
            </span>
            <span className="text-xs text-slate-400">Timezone: America/New_York</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Executive Operations Overview
          </h1>
          <p className="text-slate-400 text-sm">
            Live dining room revenue, kitchen ticket velocity, table allocations, and customer trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetch()}
            variant="secondary"
            size="sm"
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Refreshing...' : 'Refresh Live Data'}
          </Button>

          <Link to="/admin/reports">
            <Button variant="primary" size="sm">
              Export Business Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 PRIMARY KPI WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Today's Revenue */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
            {formatPrice(todayRevenue)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{todayOrdersCount} orders placed today</span>
            <span className="text-emerald-400 font-medium">All-time: {formatPrice(totalRevenue)}</span>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-amber-400/5 rounded-full blur-xl group-hover:bg-amber-400/10 transition-all pointer-events-none" />
        </div>

        {/* KPI 2: Total Orders */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-blue-400/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
            {totalOrders.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>All guest orders recorded</span>
            <Link to="/admin/orders" className="text-blue-400 hover:underline flex items-center gap-1 font-medium">
              View orders <ChevronRight size={13} />
            </Link>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-400/5 rounded-full blur-xl group-hover:bg-blue-400/10 transition-all pointer-events-none" />
        </div>

        {/* KPI 3: Pending Orders */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-400/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Orders</span>
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-400">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
            {pendingOrders}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Awaiting kitchen completion</span>
            <Link to="/admin/orders" className="text-purple-400 hover:underline flex items-center gap-1 font-medium">
              Dispatch desk <ChevronRight size={13} />
            </Link>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-400/5 rounded-full blur-xl group-hover:bg-purple-400/10 transition-all pointer-events-none" />
        </div>

        {/* KPI 4: Active Reservations */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-400/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Reservations</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white mb-1">
            {activeReservations}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{todayReservations} seated or booked today</span>
            <Link to="/admin/reservations" className="text-emerald-400 hover:underline flex items-center gap-1 font-medium">
              Concierge <ChevronRight size={13} />
            </Link>
          </div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-400/5 rounded-full blur-xl group-hover:bg-emerald-400/10 transition-all pointer-events-none" />
        </div>
      </div>

      {/* SALES CHART & ORDER STATUS DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WIDGET: Sales Chart (14-Day Revenue Trend) */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-amber-400" size={18} />
                14-Day Revenue Trajectory
              </h2>
              <p className="text-xs text-slate-400">Daily gross revenue settlements from confirmed orders</p>
            </div>
            {hoveredDay && (
              <div className="px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 font-medium">
                {hoveredDay.date}: <span className="font-bold">{formatPrice(hoveredDay.revenue)}</span> ({hoveredDay.orders} orders)
              </div>
            )}
          </div>

          {/* SVG & Bar Chart Visualization */}
          {salesChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
              No revenue records registered in the past 14 days.
            </div>
          ) : (
            <div className="pt-4">
              <div className="h-52 flex items-end gap-2 sm:gap-3 px-2 border-b border-slate-800 pb-2">
                {salesChart.map((item, idx) => {
                  const heightPercent = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
                  const isHovered = hoveredDay?.date === item.date;
                  return (
                    <div
                      key={item.date || idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onMouseEnter={() => setHoveredDay(item)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-amber-300 shadow-lg shadow-amber-400/30'
                            : 'bg-gradient-to-t from-amber-600/70 to-amber-400 hover:brightness-125'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              {/* Dates X-Axis */}
              <div className="flex justify-between text-[10px] text-slate-500 pt-2 px-1">
                <span>{salesChart[0]?.date}</span>
                <span>{salesChart[Math.floor(salesChart.length / 2)]?.date}</span>
                <span>{salesChart[salesChart.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* WIDGET: Order Status Distribution */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="text-purple-400" size={18} />
              Order Status Breakdown
            </h2>
            <p className="text-xs text-slate-400">Total volume distribution across lifecycle states</p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(statusMeta).map(([stKey, meta]) => {
              const count = orderStatusDistribution[stKey] || 0;
              const percent = Math.round((count / totalStatusCount) * 100);
              return (
                <div key={stKey} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      {meta.label}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {count} <span className="text-slate-500">({percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* POPULAR DISHES & RECENT ORDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WIDGET: Popular Dishes */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="text-amber-500" size={18} />
                Popular Signature Dishes
              </h2>
              <p className="text-xs text-slate-400">Top ordered culinary creations by guest volume</p>
            </div>
            <Link to="/admin/menu" className="text-xs text-amber-400 hover:underline">
              Manage Menu →
            </Link>
          </div>

          {popularDishes.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No dishes ordered yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {popularDishes.map((dish, idx) => (
                <div key={dish.name || idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{dish.name}</div>
                      <div className="text-xs text-slate-400">{dish.totalOrdered} portions served</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-300 font-mono">
                      {formatPrice(dish.totalRevenue)}
                    </div>
                    <div className="text-[10px] text-slate-500">Total gross</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WIDGET: Recent Orders */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="text-blue-400" size={18} />
                Recent Orders
              </h2>
              <p className="text-xs text-slate-400">Latest tickets received from dine-in, takeaway, and delivery</p>
            </div>
            <Link to="/admin/orders" className="text-xs text-blue-400 hover:underline">
              All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No orders placed recently.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2.5">TICKET</th>
                    <th className="pb-2.5">GUEST</th>
                    <th className="pb-2.5">TYPE</th>
                    <th className="pb-2.5">AMOUNT</th>
                    <th className="pb-2.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentOrders.map(ord => (
                    <tr key={ord._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-mono text-amber-400 font-semibold">{ord.orderNumber}</td>
                      <td className="py-2.5 text-white">{ord.customer?.name || 'Guest'}</td>
                      <td className="py-2.5 text-slate-400 capitalize">{ord.orderType}</td>
                      <td className="py-2.5 font-mono text-white font-semibold">{formatPrice(ord.totalAmount)}</td>
                      <td className="py-2.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block"
                          style={{
                            color: statusMeta[ord.status]?.color || '#94a3b8',
                            backgroundColor: statusMeta[ord.status]?.bg || 'rgba(148, 163, 184, 0.1)'
                          }}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
