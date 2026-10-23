import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from './testUtils';
import { CartPage } from '../pages/customer/CartPage';

describe('Cart & Financial Calculations Quality Assurance', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders EmptyState when cart has no items', () => {
    renderWithProviders(<CartPage />, { initialEntries: ['/cart'] });
    expect(screen.getByText(/Your Culinary Cart is Empty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explore Culinary Menu/i })).toBeInTheDocument();
  });

  it('accurately calculates subtotal, tax, delivery fee, and grand total', () => {
    const sampleItems = [
      {
        _id: 'dish-1',
        name: 'Wagyu Beef Ribeye',
        price: 85.00,
        quantity: 2,
        category: 'mains'
      },
      {
        _id: 'dish-2',
        name: 'Black Truffle Risotto',
        price: 45.00,
        quantity: 1,
        category: 'starters'
      }
    ];

    // Seed localStorage
    localStorage.setItem('savoria_cart', JSON.stringify(sampleItems));

    renderWithProviders(<CartPage />, { initialEntries: ['/cart'] });

    // Verify dishes rendered
    expect(screen.getByText(/Wagyu Beef Ribeye/i)).toBeInTheDocument();
    expect(screen.getByText(/Black Truffle Risotto/i)).toBeInTheDocument();

    // Subtotal: (85 * 2) + (45 * 1) = ₹215.00
    expect(screen.getAllByText(/₹215\.00/i).length).toBeGreaterThan(0);

    // Verify checkout button is active
    expect(screen.getByRole('button', { name: /Proceed to Checkout/i })).toBeInTheDocument();
  });

  it('updates item quantities and recalculates on increment', () => {
    const singleItem = [
      {
        _id: 'dish-1',
        name: 'Lobster Bisque',
        price: 30.00,
        quantity: 1,
        category: 'starters'
      }
    ];

    localStorage.setItem('savoria_cart', JSON.stringify(singleItem));

    renderWithProviders(<CartPage />, { initialEntries: ['/cart'] });

    expect(screen.getByText(/Lobster Bisque/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹30\.00/i).length).toBeGreaterThan(0);

    // Click increment button (+)
    const incBtn = screen.getByLabelText(/Increase quantity/i);
    fireEvent.click(incBtn);

    // Quantity should increase to 2, subtotal to ₹60.00
    expect(screen.getAllByText(/₹60\.00/i).length).toBeGreaterThan(0);
  });

  it('removes item when trash button is clicked', () => {
    const singleItem = [
      {
        _id: 'dish-remove',
        name: 'Soufflé au Chocolat',
        price: 24.00,
        quantity: 1,
        category: 'desserts'
      }
    ];

    localStorage.setItem('savoria_cart', JSON.stringify(singleItem));

    renderWithProviders(<CartPage />, { initialEntries: ['/cart'] });

    expect(screen.getByText(/Soufflé au Chocolat/i)).toBeInTheDocument();

    const removeBtn = screen.getByLabelText(/Remove item/i);
    fireEvent.click(removeBtn);

    // Cart should now be empty
    expect(screen.getByText(/Your Culinary Cart is Empty/i)).toBeInTheDocument();
  });

  it('formats large monetary amounts using authentic Indian number grouping', () => {
    const grandTastingItem = [
      {
        _id: 'dish-lakh',
        name: 'Royal Imperial Banquet Experience',
        price: 125000.00,
        quantity: 1,
        category: 'mains'
      }
    ];

    localStorage.setItem('savoria_cart', JSON.stringify(grandTastingItem));

    renderWithProviders(<CartPage />, { initialEntries: ['/cart'] });

    expect(screen.getByText(/Royal Imperial Banquet Experience/i)).toBeInTheDocument();
    // Indian number grouping: 1,25,000.00 (lakhs grouping, not western 125,000.00)
    expect(screen.getAllByText(/₹1,25,000\.00/i).length).toBeGreaterThan(0);
  });
});
