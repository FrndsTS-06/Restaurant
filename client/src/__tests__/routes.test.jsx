import React from 'react';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './testUtils';
import { AppRoutes } from '../routes/AppRoutes';

describe('AppRoutes & Navigation Quality Assurance', () => {
  beforeAll(() => {
    global.cancelAnimationFrame = (id) => clearTimeout(id);
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  });

  afterAll(() => {
    global.cancelAnimationFrame = (id) => clearTimeout(id);
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders HomePage on default route "/"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/'] });
    expect(screen.getByRole('button', { name: /View Shopping Cart/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
  });

  it('renders AboutPage on route "/about"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/about'] });
    expect(screen.getByText(/The Savoria Philosophy/i)).toBeInTheDocument();
    expect(screen.getByText(/A Symphony of Passion/i)).toBeInTheDocument();
  });

  it('renders ContactPage on route "/contact"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/contact'] });
    expect(screen.getByText(/Send a Message to Our Concierge/i)).toBeInTheDocument();
    expect(screen.getByRole('form', { name: /Customer Contact Form/i })).toBeInTheDocument();
  });

  it('renders PrivacyPolicyPage on route "/privacy" with legal placeholders', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/privacy'] });
    expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument();
    expect(screen.getByText(/Legal & Data Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/\[EFFECTIVE_DATE/i)).toBeInTheDocument();
  });

  it('renders TermsOfServicePage on route "/terms" with legal placeholders', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/terms'] });
    expect(screen.getByRole('heading', { level: 1, name: /Terms of Service/i })).toBeInTheDocument();
    expect(screen.getByText(/Hospitality Contract & Dining Policies/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\[GOVERNING_LAW_STATE/i).length).toBeGreaterThan(0);
  });

  it('renders LoginPage on route "/login"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/login'] });
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('renders RegisterPage on route "/register"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/register'] });
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Registration/i })).toBeInTheDocument();
  });

  it('renders 404 Fallback page for non-existent route "/culinary-unknown"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/culinary-unknown'] });
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/The requested culinary page does not exist/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Savoria Home/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated visitor from protected "/profile" to "/login"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/profile'] });
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('blocks customer role from accessing admin route "/admin"', () => {
    localStorage.setItem('savoria_user', JSON.stringify({
      id: 'cust-1',
      name: 'Patron Guest',
      role: 'customer',
      email: 'guest@savoria.com'
    }));

    renderWithProviders(<AppRoutes />, { initialEntries: ['/admin'] });
    // Customer lacks admin role -> blocked from admin layout
    expect(screen.queryByText(/Executive Overview/i)).not.toBeInTheDocument();
  });

  it('redirects legacy "/orders/track" route to Contact page order tracker', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/orders/track'] });
    expect(screen.getByRole('heading', { name: /Live Order/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Order Tracking Search/i)).toBeInTheDocument();
  });

  it('redirects legacy "/track-order" route to Contact page order tracker', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/track-order'] });
    expect(screen.getByRole('heading', { name: /Live Order/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Order Tracking Search/i)).toBeInTheDocument();
  });

  it('renders both order tracking and concierge form on "/contact"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/contact'] });
    expect(screen.getByLabelText(/Order Tracking Search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Customer Contact Form/i)).toBeInTheDocument();
  });

  it('verifies Navbar navigation links do NOT include standalone "Track Order"', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/'] });
    const navLinks = screen.getAllByRole('link');
    const trackOrderLinksInNav = navLinks.filter(l => l.getAttribute('href') === '/orders/track' || l.getAttribute('href') === '/track-order');
    expect(trackOrderLinksInNav).toHaveLength(0);
  });
});
