import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Food3DCard } from '../components/3d/Food3DCard';
import { FoodModelFallback } from '../components/3d/FoodModelFallback';
import { FoodModelControls } from '../components/3d/FoodModelControls';
import { FoodModelLoader } from '../components/3d/FoodModelLoader';

describe('Phase 5 — Reusable 3D Food Components Unit Tests', () => {
  const mockDishWith3D = {
    _id: 'dish-wagyu-123',
    name: 'Miyazaki A5 Wagyu Tenderloin',
    category: 'Mains',
    price: 3850,
    calories: 680,
    rating: 4.95,
    isAvailable: true,
    isFeatured: true,
    description: 'Seared Japanese black cattle beef with Périgord truffle jus.',
    ingredients: ['A5 Wagyu', 'Truffle Jus', 'Smoked Sea Salt'],
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
    modelStatus: 'available',
    model3dUrl: '/models/food/a5-wagyu-ribeye.glb',
    modelAltText: '3D Wagyu Beef Tenderloin'
  };

  const mockDishWithout3D = {
    _id: 'dish-salmorejo-456',
    name: 'Cordoban Salmorejo',
    category: 'Appetizers',
    price: 1150,
    calories: 320,
    rating: 4.8,
    isAvailable: true,
    isFeatured: false,
    description: 'Chilled heirloom tomato velouté with crispy jamón.',
    ingredients: ['Heirloom Tomatoes', 'Garlic', 'Extra Virgin Olive Oil'],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    modelStatus: 'in_development',
    model3dUrl: null
  };

  const mockSoldOutDish = {
    ...mockDishWith3D,
    _id: 'dish-wagyu-soldout',
    isAvailable: false
  };

  describe('Food3DCard', () => {
    it('renders correct food name, formatted INR price, and category', () => {
      render(<Food3DCard dish={mockDishWith3D} />);

      expect(screen.getByText('Miyazaki A5 Wagyu Tenderloin')).toBeDefined();
      expect(screen.getByText('₹3,850.00')).toBeDefined();
      expect(screen.getByText('Mains')).toBeDefined();
      expect(screen.getByText('680 kcal')).toBeDefined();
    });

    it('renders "View in 3D" button ONLY when a valid 3D model is available', () => {
      const { unmount } = render(<Food3DCard dish={mockDishWith3D} />);
      const view3dBtn = screen.getByRole('button', { name: /view miyazaki a5 wagyu tenderloin in interactive 3d/i });
      expect(view3dBtn).toBeDefined();
      expect(screen.getByText('View in 3D')).toBeDefined();
      unmount();

      render(<Food3DCard dish={mockDishWithout3D} />);
      expect(screen.queryByText('View in 3D')).toBeNull();
    });

    it('handles "Add to Order" action with correct dish payload', () => {
      const onAddDish = vi.fn();
      render(<Food3DCard dish={mockDishWith3D} onAddDish={onAddDish} />);

      const addBtn = screen.getByRole('button', { name: /add to order/i });
      fireEvent.click(addBtn);
      expect(onAddDish).toHaveBeenCalledTimes(1);
      expect(onAddDish).toHaveBeenCalledWith(mockDishWith3D);
    });

    it('disables Add to Order and displays sold-out overlay for unavailable dishes', () => {
      const onAddDish = vi.fn();
      render(<Food3DCard dish={mockSoldOutDish} onAddDish={onAddDish} />);

      const soldOutBtn = screen.getByRole('button', { name: /sold out/i });
      expect(soldOutBtn.disabled).toBe(true);
      expect(screen.getByText('SOLD OUT / SEASONAL')).toBeDefined();

      fireEvent.click(soldOutBtn);
      expect(onAddDish).not.toHaveBeenCalled();
    });

    it('triggers onView3D or onSelectDish when View in 3D is clicked', () => {
      const onView3D = vi.fn();
      render(<Food3DCard dish={mockDishWith3D} onView3D={onView3D} />);

      const view3dBtn = screen.getByRole('button', { name: /view miyazaki a5 wagyu tenderloin in interactive 3d/i });
      fireEvent.click(view3dBtn);
      expect(onView3D).toHaveBeenCalledTimes(1);
      expect(onView3D).toHaveBeenCalledWith(mockDishWith3D);
    });

    it('gracefully falls back on image load error', () => {
      render(<Food3DCard dish={mockDishWith3D} />);
      const img = screen.getByAltText('Miyazaki A5 Wagyu Tenderloin');
      fireEvent.error(img);
      expect(img.src).toContain('images.unsplash.com');
    });
  });

  describe('FoodModelFallback', () => {
    it('displays dish photography with verified haute cuisine badge by default', () => {
      render(<FoodModelFallback dish={mockDishWith3D} />);
      expect(screen.getByText('Verified Haute Cuisine Photography')).toBeDefined();
      expect(screen.getByText('Atelier Savoria')).toBeDefined();
    });

    it('displays "In Atelier Development" badge when modelStatus is in_development', () => {
      render(<FoodModelFallback dish={mockDishWithout3D} />);
      expect(screen.getByText('3D Asset: In Atelier Development')).toBeDefined();
    });

    it('displays error message when WebGL fails or error prop is true', () => {
      render(
        <FoodModelFallback
          dish={mockDishWith3D}
          isError={true}
          errorMessage="3D acceleration unavailable on device."
        />
      );
      expect(screen.getByText('3D acceleration unavailable on device.')).toBeDefined();
    });
  });

  describe('FoodModelControls', () => {
    it('renders all controls in 3D view mode and triggers callbacks', () => {
      const onToggleViewMode = vi.fn();
      const onToggleAutoRotate = vi.fn();
      const onResetView = vi.fn();
      const onZoomIn = vi.fn();
      const onZoomOut = vi.fn();

      render(
        <FoodModelControls
          viewMode="3d"
          onToggleViewMode={onToggleViewMode}
          isAutoRotating={true}
          onToggleAutoRotate={onToggleAutoRotate}
          onResetView={onResetView}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />
      );

      // Mode Toggle
      const modeBtn = screen.getByRole('button', { name: /switch to high-resolution photo/i });
      fireEvent.click(modeBtn);
      expect(onToggleViewMode).toHaveBeenCalledTimes(1);

      // Auto-rotation toggle
      const rotateBtn = screen.getByRole('button', { name: /pause 3d rotation/i });
      fireEvent.click(rotateBtn);
      expect(onToggleAutoRotate).toHaveBeenCalledTimes(1);

      // Reset View
      const resetBtn = screen.getByRole('button', { name: /reset 3d camera view/i });
      fireEvent.click(resetBtn);
      expect(onResetView).toHaveBeenCalledTimes(1);

      // Zoom In
      const zoomInBtn = screen.getByRole('button', { name: /zoom in on 3d food model/i });
      fireEvent.click(zoomInBtn);
      expect(onZoomIn).toHaveBeenCalledTimes(1);

      // Zoom Out
      const zoomOutBtn = screen.getByRole('button', { name: /zoom out of 3d food model/i });
      fireEvent.click(zoomOutBtn);
      expect(onZoomOut).toHaveBeenCalledTimes(1);
    });

    it('renders 3D View button when currently in photo mode', () => {
      render(<FoodModelControls viewMode="photo" onToggleViewMode={vi.fn()} />);
      expect(screen.getByText('3D View')).toBeDefined();
      expect(screen.queryByRole('button', { name: /reset 3d camera view/i })).toBeNull();
    });
  });

  describe('FoodModelLoader', () => {
    it('renders loading indicator with accessible polite live region', () => {
      render(<FoodModelLoader message="Streaming Miyazaki A5 Wagyu..." />);
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeDefined();
      expect(screen.getByText('Streaming Miyazaki A5 Wagyu...')).toBeDefined();
    });
  });
});
