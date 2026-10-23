import React from 'react';
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { renderWithProviders } from './testUtils';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { Layout } from '../components/layout/Layout';

describe('Automated Accessibility (axe-core) Quality Audit', () => {
  it('verifies Navbar has no critical accessibility violations', async () => {
    const { container } = renderWithProviders(<Navbar onCartClick={() => {}} />);
    const results = await axe.run(container, {
      rules: {
        // color-contrast requires full computed styles from real browser render
        'color-contrast': { enabled: false }
      }
    });
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (criticalViolations.length > 0) {
      console.error('A11y Critical Violations in Navbar:', JSON.stringify(criticalViolations, null, 2));
    }
    expect(criticalViolations).toEqual([]);
  });

  it('verifies Footer has no critical accessibility violations', async () => {
    const { container } = renderWithProviders(<Footer />);
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false }
      }
    });
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (criticalViolations.length > 0) {
      console.error('A11y Critical Violations in Footer:', JSON.stringify(criticalViolations, null, 2));
    }
    expect(criticalViolations).toEqual([]);
  });

  it('verifies LoginPage form controls, labels and landmarks', async () => {
    const { container } = renderWithProviders(<LoginPage />);
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false }
      }
    });
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (criticalViolations.length > 0) {
      console.error('A11y Critical Violations in LoginPage:', JSON.stringify(criticalViolations, null, 2));
    }
    expect(criticalViolations).toEqual([]);
  });

  it('verifies RegisterPage form controls, labels and landmarks', async () => {
    const { container } = renderWithProviders(<RegisterPage />);
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false }
      }
    });
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (criticalViolations.length > 0) {
      console.error('A11y Critical Violations in RegisterPage:', JSON.stringify(criticalViolations, null, 2));
    }
    expect(criticalViolations).toEqual([]);
  });

  it('verifies Layout skip-to-content and main landmark structure', async () => {
    const { container } = renderWithProviders(
      <Layout>
        <h1>Welcome to Savoria</h1>
        <p>Accessible restaurant dining experience.</p>
      </Layout>
    );
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false }
      }
    });
    const criticalViolations = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (criticalViolations.length > 0) {
      console.error('A11y Critical Violations in Layout:', JSON.stringify(criticalViolations, null, 2));
    }
    expect(criticalViolations).toEqual([]);
  });
});
