import React, { useState, useId } from 'react';
import {
  MOCK_SUPPLIERS,
  MOCK_PRODUCTS,
  INITIAL_MOCK_PURCHASES,
  createEmptyLineItem,
  createStableLineItemId,
  generatePurchaseReference
} from '../../data/mockPurchasesData';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  PackagePlus,
  Truck,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Hash,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Building2,
  HelpCircle,
  FileText,
  RotateCcw,
  Eye,
  X,
  CreditCard,
  Layers,
  ArrowRight
} from 'lucide-react';

export const PurchasesTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('new'); // 'new' | 'history' | 'suppliers'

  // Purchases list state (seeded with mock history, updated on new purchase submission)
  const [purchases, setPurchases] = useState(INITIAL_MOCK_PURCHASES);
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS);

  // Form Controlled State
  const [supplierId, setSupplierId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState(() => generatePurchaseReference());
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Line items state (each item contains a stable, unique ID)
  const [lineItems, setLineItems] = useState(() => [createEmptyLineItem()]);

  // Validation errors state
  const [errors, setErrors] = useState({});
  const [submitFeedback, setSubmitFeedback] = useState(null);

  // Detail modal state for viewing past purchase
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Computed: Selected Supplier
  const selectedSupplier = suppliers.find(s => s.id === supplierId) || null;

  // Computed: Total Purchase Cost
  const totalPurchaseCost = lineItems.reduce((acc, item) => {
    const subtotal = Number(item.subtotal) || 0;
    return acc + subtotal;
  }, 0);

  // Computed: Payment & Balance
  const parsedAmountPaid = amountPaid === '' ? 0 : Number(amountPaid);
  const remainingInvoiceBalance = Math.max(0, totalPurchaseCost - (isNaN(parsedAmountPaid) ? 0 : parsedAmountPaid));
  const currentSupplierBalance = selectedSupplier ? selectedSupplier.openingBalance : 0;
  const projectedSupplierBalance = currentSupplierBalance + remainingInvoiceBalance;

  // --------------------------------------------------------------------------
  // STATE CHANGE HANDLERS
  // --------------------------------------------------------------------------

  /**
   * Handle Supplier Selection
   * Updates supplierId and clears related supplier validation error.
   */
  const handleSupplierChange = (e) => {
    const newId = e.target.value;
    setSupplierId(newId);
    if (errors.supplierId) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.supplierId;
        return copy;
      });
    }
  };

  /**
   * Handle Product Selection for a Line Item
   * 1. Finds the selected product in MOCK_PRODUCTS.
   * 2. Immutably maps lineItems to update the item matching item.id.
   * 3. Sets productId, productName, sku, unit, and auto-populates defaultPurchasePrice.
   * 4. Recalculates line item subtotal: quantity * purchasePrice.
   * 5. Clears any product-selection validation error on this line.
   */
  const handleProductChange = (itemId, newProductId) => {
    const product = MOCK_PRODUCTS.find(p => p.id === newProductId);
    if (!product) {
      // Clear line item product if unselected
      setLineItems(prev => prev.map(item => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          productId: '',
          productName: '',
          sku: '',
          unit: '',
          purchasePrice: '',
          subtotal: 0
        };
      }));
      return;
    }

    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const qty = Number(item.quantity) || 1;
      const price = product.defaultPurchasePrice;
      const subtotal = Number((qty * price).toFixed(2));

      return {
        ...item,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit,
        purchasePrice: price,
        subtotal
      };
    }));

    // Clear line-item error if present
    if (errors.lineItems?.[itemId]?.productId) {
      setErrors(prev => {
        const lineItemErrors = { ...prev.lineItems };
        delete lineItemErrors[itemId].productId;
        if (Object.keys(lineItemErrors[itemId]).length === 0) {
          delete lineItemErrors[itemId];
        }
        return { ...prev, lineItems: lineItemErrors };
      });
    }
  };

  /**
   * Handle Quantity Change for a Line Item
   * 1. Updates the item's quantity value in state.
   * 2. Recalculates subtotal: quantity * purchasePrice.
   * 3. Dynamically updates total purchase cost and supplier balance.
   */
  const handleQuantityChange = (itemId, rawValue) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const qty = rawValue === '' ? '' : Number(rawValue);
      const price = Number(item.purchasePrice) || 0;
      const subtotal = typeof qty === 'number' && !isNaN(qty) && qty > 0 ? Number((qty * price).toFixed(2)) : 0;

      return {
        ...item,
        quantity: rawValue,
        subtotal
      };
    }));

    // Clear line-item quantity error if valid
    const num = Number(rawValue);
    if (num > 0 && errors.lineItems?.[itemId]?.quantity) {
      setErrors(prev => {
        const lineItemErrors = { ...prev.lineItems };
        delete lineItemErrors[itemId].quantity;
        if (Object.keys(lineItemErrors[itemId]).length === 0) {
          delete lineItemErrors[itemId];
        }
        return { ...prev, lineItems: lineItemErrors };
      });
    }
  };

  /**
   * Handle Purchase Price Change for a Line Item
   * 1. Updates the unit price in state.
   * 2. Recalculates subtotal: quantity * purchasePrice.
   * 3. Dynamically updates total purchase cost and supplier balance.
   */
  const handlePriceChange = (itemId, rawValue) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const price = rawValue === '' ? '' : Number(rawValue);
      const qty = Number(item.quantity) || 0;
      const subtotal = typeof price === 'number' && !isNaN(price) && price > 0 ? Number((qty * price).toFixed(2)) : 0;

      return {
        ...item,
        purchasePrice: rawValue,
        subtotal
      };
    }));

    // Clear line-item price error if valid
    const num = Number(rawValue);
    if (num > 0 && errors.lineItems?.[itemId]?.purchasePrice) {
      setErrors(prev => {
        const lineItemErrors = { ...prev.lineItems };
        delete lineItemErrors[itemId].purchasePrice;
        if (Object.keys(lineItemErrors[itemId]).length === 0) {
          delete lineItemErrors[itemId];
        }
        return { ...prev, lineItems: lineItemErrors };
      });
    }
  };

  /**
   * Add a New Line Item Row
   * Appends a new item object with a stable, globally unique ID to lineItems state.
   */
  const handleAddLineItem = () => {
    const newItem = createEmptyLineItem();
    setLineItems(prev => [...prev, newItem]);
  };

  /**
   * Remove a Line Item Row
   * Filters out the item matching itemId.
   * If removing leaves zero rows, replaces with a fresh empty row with a stable ID.
   */
  const handleRemoveLineItem = (itemId) => {
    setLineItems(prev => {
      const filtered = prev.filter(item => item.id !== itemId);
      if (filtered.length === 0) {
        return [createEmptyLineItem()];
      }
      return filtered;
    });

    // Remove any errors associated with this deleted item
    if (errors.lineItems?.[itemId]) {
      setErrors(prev => {
        const lineItemErrors = { ...prev.lineItems };
        delete lineItemErrors[itemId];
        return { ...prev, lineItems: lineItemErrors };
      });
    }
  };

  /**
   * Handle Quick "Pay in Full" action
   */
  const handlePayInFull = () => {
    setAmountPaid(totalPurchaseCost.toFixed(2));
    if (errors.amountPaid) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.amountPaid;
        return copy;
      });
    }
  };

  /**
   * Form Validation Engine
   * Validates all required fields, positive numbers, and cross-field rules.
   * Does NOT silently accept invalid input.
   */
  const validateForm = () => {
    const newErrors = { lineItems: {} };
    let hasLineItemErrors = false;

    // 1. Supplier
    if (!supplierId.trim()) {
      newErrors.supplierId = 'Please select a registered supplier.';
    }

    // 2. Reference Number
    if (!referenceNumber.trim()) {
      newErrors.referenceNumber = 'Purchase reference number is required (e.g. PO-2026-1049).';
    }

    // 3. Purchase Date
    if (!purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required.';
    } else {
      const d = new Date(purchaseDate);
      if (isNaN(d.getTime())) {
        newErrors.purchaseDate = 'Please enter a valid purchase date.';
      }
    }

    // 4. Line Items Validation
    if (!lineItems || lineItems.length === 0) {
      newErrors.general = 'At least one product line item is required.';
    } else {
      lineItems.forEach((item, index) => {
        const itemErrors = {};

        if (!item.productId) {
          itemErrors.productId = `Row ${index + 1}: Please select a product.`;
          hasLineItemErrors = true;
        }

        const qtyNum = Number(item.quantity);
        if (item.quantity === '' || isNaN(qtyNum) || qtyNum <= 0) {
          itemErrors.quantity = `Row ${index + 1}: Quantity must be greater than 0.`;
          hasLineItemErrors = true;
        }

        const priceNum = Number(item.purchasePrice);
        if (item.purchasePrice === '' || isNaN(priceNum) || priceNum <= 0) {
          itemErrors.purchasePrice = `Row ${index + 1}: Purchase price must be greater than 0.`;
          hasLineItemErrors = true;
        }

        if (Object.keys(itemErrors).length > 0) {
          newErrors.lineItems[item.id] = itemErrors;
        }
      });
    }

    // 5. Amount Paid
    if (amountPaid !== '') {
      const paidNum = Number(amountPaid);
      if (isNaN(paidNum) || paidNum < 0) {
        newErrors.amountPaid = 'Amount paid must be 0 or a positive number.';
      } else if (paidNum > totalPurchaseCost && totalPurchaseCost > 0) {
        newErrors.amountPaid = `Amount paid (₹${paidNum.toFixed(2)}) cannot exceed total purchase cost (₹${totalPurchaseCost.toFixed(2)}).`;
      }
    }

    if (!hasLineItemErrors) {
      delete newErrors.lineItems;
    }

    const isValid = Object.keys(newErrors).length === 0;
    return { isValid, errors: newErrors };
  };

  /**
   * Handle Purchase Submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitFeedback(null);

    const { isValid, errors: validationErrors } = validateForm();
    if (!isValid) {
      setErrors(validationErrors);
      // Scroll to top of form or error alert
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Construct valid purchase record
    const newPurchase = {
      id: `PUR-${Date.now().toString().slice(-4)}`,
      referenceNumber: referenceNumber.trim(),
      purchaseDate,
      supplierId,
      supplierName: selectedSupplier?.name || 'Unknown Supplier',
      supplierOpeningBalance: currentSupplierBalance,
      paymentMethod,
      status: remainingInvoiceBalance === 0 ? 'Fully Paid' : parsedAmountPaid > 0 ? 'Partially Paid' : 'Received',
      items: lineItems.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unit: item.unit,
        quantity: Number(item.quantity),
        purchasePrice: Number(item.purchasePrice),
        subtotal: Number(item.subtotal)
      })),
      totalCost: totalPurchaseCost,
      amountPaid: parsedAmountPaid,
      remainingBalance: remainingInvoiceBalance,
      notes: notes.trim()
    };

    // Update purchases history
    setPurchases(prev => [newPurchase, ...prev]);

    // Update supplier opening balance in local state
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        openingBalance: Number((s.openingBalance + remainingInvoiceBalance).toFixed(2))
      };
    }));

    // Show feedback
    setSubmitFeedback({
      type: 'success',
      message: `Purchase Order ${newPurchase.referenceNumber} successfully recorded! Added ${newPurchase.items.length} product(s) for a total of ${formatPrice(newPurchase.totalCost, 'INR')}.`
    });

    // Reset Form for next entry
    setSupplierId('');
    setReferenceNumber(generatePurchaseReference());
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setAmountPaid('');
    setNotes('');
    setLineItems([createEmptyLineItem()]);
    setErrors({});

    // Auto-dismiss success feedback after 6 seconds
    setTimeout(() => {
      setSubmitFeedback(null);
    }, 6000);
  };

  /**
   * Reset Form to default blank state
   */
  const handleResetForm = () => {
    if (window.confirm('Reset all fields in this purchase order?')) {
      setSupplierId('');
      setReferenceNumber(generatePurchaseReference());
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setAmountPaid('');
      setNotes('');
      setLineItems([createEmptyLineItem()]);
      setErrors({});
      setSubmitFeedback(null);
    }
  };

  return (
    <div className="purchases-tab-container max-w-7xl mx-auto space-y-6">
      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          id="purchases-subtab-new-btn"
          onClick={() => setActiveSubTab('new')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeSubTab === 'new'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <PackagePlus size={16} /> New Purchase Order
        </button>

        <button
          id="purchases-subtab-history-btn"
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeSubTab === 'history'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Receipt size={16} /> Purchase Invoices ({purchases.length})
        </button>

        <button
          id="purchases-subtab-suppliers-btn"
          onClick={() => setActiveSubTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeSubTab === 'suppliers'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 size={16} /> Supplier Balances ({suppliers.length})
        </button>
      </div>

      {/* Global Success Feedback Banner */}
      {submitFeedback && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
            <span className="text-sm font-medium">{submitFeedback.message}</span>
          </div>
          <button
            onClick={() => setSubmitFeedback(null)}
            className="text-emerald-400 hover:text-white"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: NEW PURCHASE FORM */}
      {/* ==================================================================== */}
      {activeSubTab === 'new' && (
        <form onSubmit={handleSubmit} noValidate className="space-y-6 animate-fade-in">
          {/* Validation Failure Banner */}
          {Object.keys(errors).length > 0 && (
            <div
              id="purchases-form-error-banner"
              className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-3 animate-shake"
            >
              <AlertCircle size={20} className="shrink-0 text-rose-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold mb-1">Please correct the following errors before submitting:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-rose-200">
                  {errors.supplierId && <li>{errors.supplierId}</li>}
                  {errors.referenceNumber && <li>{errors.referenceNumber}</li>}
                  {errors.purchaseDate && <li>{errors.purchaseDate}</li>}
                  {errors.amountPaid && <li>{errors.amountPaid}</li>}
                  {errors.general && <li>{errors.general}</li>}
                  {errors.lineItems && Object.values(errors.lineItems).map((errObj, idx) => (
                    Object.values(errObj).map((msg, i) => (
                      <li key={`${idx}-${i}`}>{msg}</li>
                    ))
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Section 1: Header & Supplier Selection */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                  <PackagePlus size={20} className="text-amber-400" />
                  Inbound Purchase Order Entry
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Record supplier shipments, invoice costs, line-item quantities, and ledger payments.
                </p>
              </div>
              <Badge variant="gold">Procurement Phase 3</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Supplier Dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="purchase-supplier-select" className="block text-xs font-semibold text-slate-300">
                  Select Supplier <span className="text-amber-400">*</span>
                </label>
                <select
                  id="purchase-supplier-select"
                  value={supplierId}
                  onChange={handleSupplierChange}
                  className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm text-white focus:outline-none transition-colors ${
                    errors.supplierId
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-800 focus:border-amber-400'
                  }`}
                >
                  <option value="">-- Choose Approved Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) — Balance: {formatPrice(s.openingBalance, 'INR')}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="text-rose-400 text-[11px] font-medium">{errors.supplierId}</p>
                )}
              </div>

              {/* Purchase Reference Number */}
              <div className="space-y-1.5">
                <label htmlFor="purchase-reference-input" className="block text-xs font-semibold text-slate-300">
                  Purchase Reference / PO # <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="purchase-reference-input"
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => {
                      setReferenceNumber(e.target.value);
                      if (errors.referenceNumber) {
                        setErrors(prev => {
                          const c = { ...prev };
                          delete c.referenceNumber;
                          return c;
                        });
                      }
                    }}
                    placeholder="e.g. PO-2026-1049"
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-xl text-sm font-mono text-white focus:outline-none transition-colors ${
                      errors.referenceNumber
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-slate-800 focus:border-amber-400'
                    }`}
                  />
                </div>
                {errors.referenceNumber && (
                  <p className="text-rose-400 text-[11px] font-medium">{errors.referenceNumber}</p>
                )}
              </div>

              {/* Purchase Date */}
              <div className="space-y-1.5">
                <label htmlFor="purchase-date-input" className="block text-xs font-semibold text-slate-300">
                  Purchase Date <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    id="purchase-date-input"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => {
                      setPurchaseDate(e.target.value);
                      if (errors.purchaseDate) {
                        setErrors(prev => {
                          const c = { ...prev };
                          delete c.purchaseDate;
                          return c;
                        });
                      }
                    }}
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-xl text-sm text-white focus:outline-none transition-colors ${
                      errors.purchaseDate
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-slate-800 focus:border-amber-400'
                    }`}
                  />
                </div>
                {errors.purchaseDate && (
                  <p className="text-rose-400 text-[11px] font-medium">{errors.purchaseDate}</p>
                )}
              </div>
            </div>

            {/* Selected Supplier Information Card */}
            {selectedSupplier && (
              <div
                id="selected-supplier-card"
                className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs animate-fade-in"
              >
                <div>
                  <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Supplier Specialty</div>
                  <div className="text-slate-200 font-medium mt-0.5">{selectedSupplier.specialty}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Contact Person & Terms</div>
                  <div className="text-slate-200 font-medium mt-0.5">
                    {selectedSupplier.contactPerson} ({selectedSupplier.paymentTerms})
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Email & Phone</div>
                  <div className="text-slate-300 font-mono text-[11px] mt-0.5">
                    {selectedSupplier.email} • {selectedSupplier.phone}
                  </div>
                </div>
                <div className="bg-amber-400/5 p-2 rounded-lg border border-amber-400/20">
                  <div className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Current Outstanding Balance</div>
                  <div className="text-amber-300 font-mono font-bold text-sm mt-0.5">
                    {formatPrice(selectedSupplier.openingBalance, 'INR')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Line Items Table */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-amber-400" />
                  Purchased Products & Line Items
                </h3>
                <p className="text-slate-400 text-xs">
                  Specify products, receiving quantities, and negotiated unit purchase costs.
                </p>
              </div>

              <Button
                id="add-line-item-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                icon={<Plus size={15} />}
              >
                Add Product Line
              </Button>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table id="purchase-line-items-table" className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 min-w-[240px]">Product / Ingredient <span className="text-amber-400">*</span></th>
                    <th className="py-3 px-3 w-28">Unit</th>
                    <th className="py-3 px-3 w-32">Quantity <span className="text-amber-400">*</span></th>
                    <th className="py-3 px-3 w-36">Purchase Price (₹) <span className="text-amber-400">*</span></th>
                    <th className="py-3 px-3 w-36 text-right">Line Total (₹)</th>
                    <th className="py-3 px-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {lineItems.map((item, index) => {
                    const rowErrors = errors.lineItems?.[item.id] || {};
                    const hasError = Object.keys(rowErrors).length > 0;

                    return (
                      <tr
                        key={item.id}
                        id={`purchase-line-row-${item.id}`}
                        className={`transition-colors hover:bg-slate-900/40 ${hasError ? 'bg-rose-500/5' : ''}`}
                      >
                        {/* Row Index */}
                        <td className="py-3 px-3 font-mono text-slate-500 text-center font-bold">
                          {index + 1}
                        </td>

                        {/* Product Dropdown */}
                        <td className="py-3 px-3">
                          <select
                            id={`line-product-select-${item.id}`}
                            value={item.productId}
                            onChange={(e) => handleProductChange(item.id, e.target.value)}
                            className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-xs text-white focus:outline-none transition-colors ${
                              rowErrors.productId ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-amber-400'
                            }`}
                          >
                            <option value="">-- Select Product --</option>
                            {MOCK_PRODUCTS.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) — Standard: {formatPrice(p.defaultPurchasePrice, 'INR')} / {p.unit}
                              </option>
                            ))}
                          </select>
                          {rowErrors.productId && (
                            <span className="text-rose-400 text-[10px] block mt-1">{rowErrors.productId}</span>
                          )}
                        </td>

                        {/* Unit Badge */}
                        <td className="py-3 px-3 text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono">
                            {item.unit ? `per ${item.unit}` : '—'}
                          </span>
                        </td>

                        {/* Quantity Input */}
                        <td className="py-3 px-3">
                          <input
                            id={`line-quantity-input-${item.id}`}
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            placeholder="Qty"
                            className={`w-full px-2.5 py-1.5 bg-slate-900 border rounded-lg text-xs font-mono text-white text-right focus:outline-none transition-colors ${
                              rowErrors.quantity ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-amber-400'
                            }`}
                          />
                          {rowErrors.quantity && (
                            <span className="text-rose-400 text-[10px] block mt-1">{rowErrors.quantity}</span>
                          )}
                        </td>

                        {/* Purchase Price Input */}
                        <td className="py-3 px-3">
                          <input
                            id={`line-price-input-${item.id}`}
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.purchasePrice}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            placeholder="0.00"
                            className={`w-full px-2.5 py-1.5 bg-slate-900 border rounded-lg text-xs font-mono text-white text-right focus:outline-none transition-colors ${
                              rowErrors.purchasePrice ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-amber-400'
                            }`}
                          />
                          {rowErrors.purchasePrice && (
                            <span className="text-rose-400 text-[10px] block mt-1">{rowErrors.purchasePrice}</span>
                          )}
                        </td>

                        {/* Subtotal */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          {formatPrice(item.subtotal, 'INR')}
                        </td>

                        {/* Remove Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`remove-line-item-btn-${item.id}`}
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Remove this line item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Add and Summary Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <Button
                id="add-another-line-btn"
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                icon={<Plus size={14} />}
              >
                Add Another Item
              </Button>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">Total Items: <strong className="text-white">{lineItems.length}</strong></span>
                <span className="text-slate-400">Total Units: <strong className="text-white">
                  {lineItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)}
                </strong></span>
              </div>
            </div>
          </div>

          {/* Section 3: Financial Summary & Supplier Balance Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Details & Notes */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <CreditCard size={16} className="text-amber-400" />
                Payment Modality & Settlement
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Method */}
                <div className="space-y-1">
                  <label htmlFor="purchase-payment-method" className="block text-xs font-medium text-slate-400">
                    Payment Method
                  </label>
                  <select
                    id="purchase-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                    <option value="Credit Card">Corporate Credit Card</option>
                    <option value="Cheque">Account Payee Cheque</option>
                    <option value="Cash">Cash on Delivery</option>
                  </select>
                </div>

                {/* Amount Paid Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="purchase-amount-paid-input" className="block text-xs font-medium text-slate-400">
                      Amount Paid (₹)
                    </label>
                    {totalPurchaseCost > 0 && (
                      <button
                        id="purchase-pay-in-full-btn"
                        type="button"
                        onClick={handlePayInFull}
                        className="text-[10px] text-amber-400 hover:underline font-semibold"
                      >
                        Pay in Full
                      </button>
                    )}
                  </div>
                  <input
                    id="purchase-amount-paid-input"
                    type="number"
                    min="0"
                    step="any"
                    value={amountPaid}
                    onChange={(e) => {
                      setAmountPaid(e.target.value);
                      if (errors.amountPaid) {
                        setErrors(prev => {
                          const c = { ...prev };
                          delete c.amountPaid;
                          return c;
                        });
                      }
                    }}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-slate-900 border rounded-xl text-xs font-mono text-white focus:outline-none transition-colors ${
                      errors.amountPaid ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-amber-400'
                    }`}
                  />
                  {errors.amountPaid && (
                    <p className="text-rose-400 text-[10px] font-medium">{errors.amountPaid}</p>
                  )}
                </div>
              </div>

              {/* Purchase Notes */}
              <div className="space-y-1">
                <label htmlFor="purchase-notes-input" className="block text-xs font-medium text-slate-400">
                  Delivery Inspection & Inbound Notes (Optional)
                </label>
                <textarea
                  id="purchase-notes-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Batch temperature checked at dock, packaging intact, stored in walk-in cold room."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            {/* Calculations & Supplier Balance Impact */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Receipt size={16} className="text-amber-400" />
                Ledger Impact & Cost Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                {/* Total Purchase Cost */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Total Purchase Cost</span>
                  <span id="summary-total-purchase-cost" className="font-mono text-base font-bold text-white">
                    {formatPrice(totalPurchaseCost, 'INR')}
                  </span>
                </div>

                {/* Amount Paid */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Amount Paid Upfront</span>
                  <span id="summary-amount-paid" className="font-mono font-semibold text-emerald-400">
                    - {formatPrice(parsedAmountPaid, 'INR')}
                  </span>
                </div>

                {/* Remaining Invoice Balance */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400 font-medium">Unpaid Balance for this PO</span>
                  <span id="summary-remaining-balance" className="font-mono font-bold text-amber-300">
                    {formatPrice(remainingInvoiceBalance, 'INR')}
                  </span>
                </div>

                {/* Supplier Balance Integration */}
                {selectedSupplier && (
                  <div className="pt-2 space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Current Supplier Payable:</span>
                      <span className="font-mono text-slate-300">{formatPrice(currentSupplierBalance, 'INR')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">+ New Outstanding Due:</span>
                      <span className="font-mono text-amber-300">+{formatPrice(remainingInvoiceBalance, 'INR')}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs font-bold">
                      <span className="text-amber-400">Projected Supplier Balance:</span>
                      <span id="summary-projected-supplier-balance" className="font-mono text-amber-300 text-sm">
                        {formatPrice(projectedSupplierBalance, 'INR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Submit / Reset Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  id="submit-purchase-order-btn"
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  icon={<CheckCircle2 size={16} />}
                >
                  Save Purchase Order
                </Button>

                <Button
                  id="reset-purchase-form-btn"
                  type="button"
                  variant="ghost"
                  onClick={handleResetForm}
                  icon={<RotateCcw size={15} />}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: INVOICES & PURCHASES LEDGER */}
      {/* ==================================================================== */}
      {activeSubTab === 'history' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <Receipt size={20} className="text-amber-400" />
                Inbound Invoices & Purchases Ledger
              </h2>
              <p className="text-slate-400 text-xs">
                Audited list of recorded purchase orders, line items, and supplier payment balances.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveSubTab('new')}
              icon={<Plus size={15} />}
            >
              New Purchase Entry
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Total Cost (₹)</th>
                  <th className="py-3 px-4">Amount Paid (₹)</th>
                  <th className="py-3 px-4">Balance Due (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{p.referenceNumber}</td>
                    <td className="py-3 px-4 text-slate-300">{formatDate(p.purchaseDate)}</td>
                    <td className="py-3 px-4 font-semibold text-white">{p.supplierName}</td>
                    <td className="py-3 px-4 text-slate-300">{p.items?.length || 0} line item(s)</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{formatPrice(p.totalCost, 'INR')}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{formatPrice(p.amountPaid, 'INR')}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">{formatPrice(p.remainingBalance, 'INR')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'Fully Paid'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : p.status === 'Partially Paid'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedPurchase(p)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Purchase Details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: SUPPLIER DIRECTORY & BALANCES */}
      {/* ==================================================================== */}
      {activeSubTab === 'suppliers' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 animate-fade-in">
          <div className="border-b border-slate-800/80 pb-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Building2 size={20} className="text-amber-400" />
              Approved Suppliers & Outstanding Payables
            </h2>
            <p className="text-slate-400 text-xs">
              Live balances and contact directory for culinary ingredient purveyors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div
                key={s.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-amber-400/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-white text-base">{s.name}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">{s.id} • {s.taxId}</span>
                  </div>
                  <Badge variant="gold">{s.paymentTerms}</Badge>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div><strong>Specialty:</strong> {s.specialty}</div>
                  <div><strong>Contact:</strong> {s.contactPerson}</div>
                  <div className="font-mono text-[11px] text-slate-400">{s.email}</div>
                  <div className="font-mono text-[11px] text-slate-400">{s.phone}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Ledger Balance:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {formatPrice(s.openingBalance, 'INR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPurchase(null)}
        >
          <div
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">
                  Purchase Order: {selectedPurchase.referenceNumber}
                </h3>
                <span className="text-xs text-slate-400">{formatDate(selectedPurchase.purchaseDate)} • {selectedPurchase.supplierName}</span>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-mono">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Price</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedPurchase.items.map(item => (
                      <tr key={item.id}>
                        <td className="p-2 text-white font-medium">{item.productName} ({item.sku})</td>
                        <td className="p-2 text-slate-300">{item.quantity} {item.unit}</td>
                        <td className="p-2 font-mono text-slate-300">{formatPrice(item.purchasePrice, 'INR')}</td>
                        <td className="p-2 font-mono font-bold text-amber-300 text-right">{formatPrice(item.subtotal, 'INR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center font-mono">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Total Cost</div>
                  <div className="font-bold text-white mt-0.5">{formatPrice(selectedPurchase.totalCost, 'INR')}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Paid Upfront</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{formatPrice(selectedPurchase.amountPaid, 'INR')}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase">Remaining Due</div>
                  <div className="font-bold text-amber-300 mt-0.5">{formatPrice(selectedPurchase.remainingBalance, 'INR')}</div>
                </div>
              </div>

              {selectedPurchase.notes && (
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 text-slate-300">
                  <strong className="text-slate-400">Notes:</strong> {selectedPurchase.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedPurchase(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
