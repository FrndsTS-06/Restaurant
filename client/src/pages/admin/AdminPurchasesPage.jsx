import React from 'react';
import { PurchasesTab } from '../../components/admin/PurchasesTab';
import { Truck, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AdminPurchasesPage = () => {
  return (
    <div className="admin-purchases-page p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
              Procurement & Inventory
            </span>
            <span className="text-xs text-slate-400">Phase 3 Implementation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Purchases & Supplier Payables
          </h1>
          <p className="text-slate-400 text-sm">
            Manage culinary raw ingredient procurement, multi-product line items, and supplier ledger balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="emerald" icon={<ShieldCheck size={14} />}>
            Audited Ledger
          </Badge>
        </div>
      </div>

      {/* Main Purchases Component */}
      <PurchasesTab />
    </div>
  );
};
