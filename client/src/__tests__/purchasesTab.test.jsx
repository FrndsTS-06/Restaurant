import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from './testUtils';
import { PurchasesTab } from '../components/admin/PurchasesTab';

describe('PurchasesTab (Phase 3 Procurement Implementation)', () => {
  it('renders the PurchasesTab with initial default controls and an empty line item', () => {
    renderWithProviders(<PurchasesTab />);

    // Header & Subtabs
    expect(screen.getByText('Inbound Purchase Order Entry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Purchase Order/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Purchase Invoices/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Supplier Balances/i })).toBeInTheDocument();

    // Required Form Fields
    expect(screen.getByLabelText(/Select Supplier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purchase Reference/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purchase Date/i)).toBeInTheDocument();

    // Default line items table should have 1 empty row
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(screen.getByText('-- Select Product --')).toBeInTheDocument();
  });

  it('updates supplier info and shows supplier balance card when a supplier is selected', () => {
    renderWithProviders(<PurchasesTab />);

    const supplierSelect = document.getElementById('purchase-supplier-select');
    fireEvent.change(supplierSelect, { target: { value: 'SUP-001' } });

    // Should display selected supplier card with balance
    expect(screen.getByText('Current Outstanding Balance')).toBeInTheDocument();
    expect(screen.getByText('A5 Kuroge Washu Beef & Premium Marrow')).toBeInTheDocument();
    expect(screen.getByText(/Kenji Takahashi/i)).toBeInTheDocument();
  });

  it('auto-populates unit and default purchase price when a product is selected', () => {
    renderWithProviders(<PurchasesTab />);

    // Find the product select in the first line item
    const productSelect = document.querySelector('[id^="line-product-select-"]');
    // Select Miyazaki Wagyu Tenderloin (PROD-001)
    fireEvent.change(productSelect, { target: { value: 'PROD-001' } });

    // Unit should be displayed
    expect(screen.getByText('per kg')).toBeInTheDocument();

    // Price input should be auto-populated with standard default price 8500
    const priceInput = document.querySelector('[id^="line-price-input-"]');
    expect(priceInput.value).toBe('8500');

    // Subtotal should be 1 * 8500 = ₹8,500.00
    const totalDisplay = document.getElementById('summary-total-purchase-cost');
    expect(totalDisplay.textContent).toContain('8,500');
  });

  it('recalculates subtotal and total cost when quantity changes', () => {
    renderWithProviders(<PurchasesTab />);

    // Select product
    const productSelect = document.querySelector('[id^="line-product-select-"]');
    fireEvent.change(productSelect, { target: { value: 'PROD-001' } }); // Price = 8500

    // Change quantity to 3
    const qtyInput = document.querySelector('[id^="line-quantity-input-"]');
    fireEvent.change(qtyInput, { target: { value: '3' } });

    // 3 * 8500 = 25,500
    const totalDisplay = document.getElementById('summary-total-purchase-cost');
    expect(totalDisplay.textContent).toContain('25,500');
  });

  it('recalculates subtotal and total cost when unit purchase price is manually overridden', () => {
    renderWithProviders(<PurchasesTab />);

    // Select product
    const productSelect = document.querySelector('[id^="line-product-select-"]');
    fireEvent.change(productSelect, { target: { value: 'PROD-001' } }); // Price = 8500

    // Override price to 9000
    const priceInput = document.querySelector('[id^="line-price-input-"]');
    fireEvent.change(priceInput, { target: { value: '9000' } });

    // 1 * 9000 = 9,000
    const totalDisplay = document.getElementById('summary-total-purchase-cost');
    expect(totalDisplay.textContent).toContain('9,000');
  });

  it('adds a new line item row with a stable ID when Add Product Line is clicked', () => {
    renderWithProviders(<PurchasesTab />);

    const addBtn = document.getElementById('add-line-item-btn');
    fireEvent.click(addBtn);

    // Now there should be 2 line item rows (plus header = 3 rows)
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(3);

    // Each row should have unique IDs
    const rowsWithId = document.querySelectorAll('[id^="purchase-line-row-"]');
    expect(rowsWithId.length).toBe(2);
    expect(rowsWithId[0].id).not.toBe(rowsWithId[1].id);
  });

  it('removes a line item row and recalculates totals when trash icon is clicked', () => {
    renderWithProviders(<PurchasesTab />);

    // Add second row
    const addBtn = document.getElementById('add-line-item-btn');
    fireEvent.click(addBtn);

    // Select product on first row (Wagyu = 8500)
    const productSelects = document.querySelectorAll('[id^="line-product-select-"]');
    fireEvent.change(productSelects[0], { target: { value: 'PROD-001' } });

    // Select product on second row (Scallops = 3200)
    fireEvent.change(productSelects[1], { target: { value: 'PROD-002' } });

    // Total should be 8500 + 3200 = 11,700
    let totalDisplay = document.getElementById('summary-total-purchase-cost');
    expect(totalDisplay.textContent).toContain('11,700');

    // Remove first row
    const deleteButtons = document.querySelectorAll('[id^="remove-line-item-btn-"]');
    fireEvent.click(deleteButtons[0]);

    // Now only 1 row remains and total is 3200
    totalDisplay = document.getElementById('summary-total-purchase-cost');
    expect(totalDisplay.textContent).toContain('3,200');
  });

  it('validates required fields and displays error banner when submitting invalid form', () => {
    renderWithProviders(<PurchasesTab />);

    // Click submit without selecting supplier or product
    const submitBtn = document.getElementById('submit-purchase-order-btn');
    fireEvent.click(submitBtn);

    // Error banner should be visible
    expect(screen.getByText(/Please correct the following errors before submitting/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Please select a registered supplier/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Please select a product/i).length).toBeGreaterThan(0);
  });

  it('validates that quantity and purchase price must be positive numbers', () => {
    renderWithProviders(<PurchasesTab />);

    // Select supplier
    const supplierSelect = document.getElementById('purchase-supplier-select');
    fireEvent.change(supplierSelect, { target: { value: 'SUP-001' } });

    // Select product
    const productSelect = document.querySelector('[id^="line-product-select-"]');
    fireEvent.change(productSelect, { target: { value: 'PROD-001' } });

    // Set invalid negative quantity
    const qtyInput = document.querySelector('[id^="line-quantity-input-"]');
    fireEvent.change(qtyInput, { target: { value: '-2' } });

    // Set invalid zero price
    const priceInput = document.querySelector('[id^="line-price-input-"]');
    fireEvent.change(priceInput, { target: { value: '0' } });

    const submitBtn = document.getElementById('submit-purchase-order-btn');
    fireEvent.click(submitBtn);

    // Validation errors should be present in banner and line items
    expect(screen.getAllByText(/Quantity must be greater than 0/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Purchase price must be greater than 0/i).length).toBeGreaterThan(0);
  });

  it('validates that amount paid cannot exceed total purchase cost', () => {
    renderWithProviders(<PurchasesTab />);

    // Select supplier and product
    fireEvent.change(document.getElementById('purchase-supplier-select'), { target: { value: 'SUP-001' } });
    fireEvent.change(document.querySelector('[id^="line-product-select-"]'), { target: { value: 'PROD-001' } }); // 8500

    // Set amount paid higher than total
    const paidInput = document.getElementById('purchase-amount-paid-input');
    fireEvent.change(paidInput, { target: { value: '15000' } });

    const submitBtn = document.getElementById('submit-purchase-order-btn');
    fireEvent.click(submitBtn);

    expect(screen.getAllByText(/cannot exceed total purchase cost/i).length).toBeGreaterThan(0);
  });

  it('successfully submits valid purchase order, displays feedback, and updates ledger', () => {
    renderWithProviders(<PurchasesTab />);

    // 1. Select supplier
    const supplierSelect = document.getElementById('purchase-supplier-select');
    fireEvent.change(supplierSelect, { target: { value: 'SUP-001' } });

    // 2. Select product
    const productSelect = document.querySelector('[id^="line-product-select-"]');
    fireEvent.change(productSelect, { target: { value: 'PROD-001' } });

    // 3. Set quantity to 2
    const qtyInput = document.querySelector('[id^="line-quantity-input-"]');
    fireEvent.change(qtyInput, { target: { value: '2' } }); // Total = 17,000

    // 4. Set partial payment of 7,000
    const paidInput = document.getElementById('purchase-amount-paid-input');
    fireEvent.change(paidInput, { target: { value: '7000' } });

    // 5. Submit form
    const submitBtn = document.getElementById('submit-purchase-order-btn');
    fireEvent.click(submitBtn);

    // 6. Success message displayed
    expect(screen.getByText(/successfully recorded/i)).toBeInTheDocument();

    // 7. Check Invoices Ledger tab
    const historyTabBtn = document.getElementById('purchases-subtab-history-btn');
    fireEvent.click(historyTabBtn);

    // Ledger should now show purchases
    expect(screen.getAllByText(/Miyazaki Wagyu Guild/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Partially Paid')).toBeInTheDocument();
  });

  it('switches between tabs cleanly', () => {
    renderWithProviders(<PurchasesTab />);

    // Switch to Supplier Balances tab
    const suppliersTabBtn = document.getElementById('purchases-subtab-suppliers-btn');
    fireEvent.click(suppliersTabBtn);

    expect(screen.getByText(/Approved Suppliers & Outstanding Payables/i)).toBeInTheDocument();
    expect(screen.getByText('Miyazaki Wagyu Guild')).toBeInTheDocument();
    expect(screen.getByText('Hokkaido Marine Direct')).toBeInTheDocument();

    // Switch back to New Purchase Entry
    const newTabBtn = document.getElementById('purchases-subtab-new-btn');
    fireEvent.click(newTabBtn);
    expect(screen.getByText('Inbound Purchase Order Entry')).toBeInTheDocument();
  });
});
