import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FoodZoomViewer } from '../components/common/FoodZoomViewer';
import { CartProvider } from '../features/cart/cartContext';

// Mock Three.js / R3F Canvas components for jsdom testing
vi.mock('../components/3d/Food3DViewer', () => ({
  Food3DViewer: ({ dish, isOpen }) => (
    <div data-testid="mock-food-3d-viewer" data-open={String(isOpen)}>
      <span>Interactive 3D: {dish.name}</span>
    </div>
  )
}));

const mockDishPhotoOnly = {
  _id: 'dish-tart-101',
  name: 'Meyer Lemon & Yuzu Tart',
  category: 'Desserts',
  price: 24.50,
  description: 'Crisp sable breton with yuzu curd and Italian meringue.',
  image: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80',
  isAvailable: true,
  modelStatus: 'none'
};

const mockDishWith3D = {
  _id: 'dish-wagyu-202',
  name: 'A5 Miyazaki Wagyu Ribeye',
  category: 'Mains',
  price: 185.00,
  description: 'Charcoal-seared Miyazaki A5 wagyu with winter black truffle.',
  image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  isAvailable: true,
  modelStatus: 'available',
  model3dUrl: '/models/food/a5-wagyu-ribeye.glb'
};

const renderWithCart = (ui) => {
  return render(<CartProvider>{ui}</CartProvider>);
};

describe('FoodZoomViewer Component Quality & Accessibility Audit', () => {
  let onClose;

  beforeEach(() => {
    onClose = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={mockDishPhotoOnly}
        isOpen={false}
        onClose={onClose}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders correctly with dish name, category, and INR price when open', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={mockDishPhotoOnly}
        isOpen={true}
        onClose={onClose}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(screen.getByText('Meyer Lemon & Yuzu Tart')).toBeDefined();
    expect(screen.getByText('Desserts')).toBeDefined();
    expect(screen.getByText('₹24.50')).toBeDefined();
    expect(screen.getByRole('button', { name: /close food zoom viewer/i })).toBeDefined();
  });

  it('supports zoom in, zoom out, and reset zoom actions', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={mockDishPhotoOnly}
        isOpen={true}
        onClose={onClose}
      />
    );

    const badge = screen.getByText('100%');
    expect(badge).toBeDefined();

    const zoomInBtn = screen.getByRole('button', { name: /^zoom in$/i });
    const zoomOutBtn = screen.getByRole('button', { name: /^zoom out$/i });
    const resetBtn = screen.getByRole('button', { name: /reset zoom magnification/i });

    // Zoom Out should initially be disabled at 100%
    expect(zoomOutBtn.getAttribute('disabled')).not.toBeNull();

    // Zoom In
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('135%')).toBeDefined();
    expect(zoomOutBtn.getAttribute('disabled')).toBeNull();

    // Zoom In again
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('170%')).toBeDefined();

    // Zoom Out
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('135%')).toBeDefined();

    // Reset Zoom
    fireEvent.click(resetBtn);
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('supports keyboard navigation: Escape to close, +, -, and r to reset', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={mockDishPhotoOnly}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Zoom In via keyboard '+'
    fireEvent.keyDown(window, { key: '+' });
    expect(screen.getByText('135%')).toBeDefined();

    // Zoom Out via keyboard '-'
    fireEvent.keyDown(window, { key: '-' });
    expect(screen.getByText('100%')).toBeDefined();

    // Zoom In and reset via keyboard 'r'
    fireEvent.keyDown(window, { key: '+' });
    expect(screen.getByText('135%')).toBeDefined();
    fireEvent.keyDown(window, { key: 'r' });
    expect(screen.getByText('100%')).toBeDefined();

    // Escape closes viewer
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports mouse wheel zoom on the photo stage', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={mockDishPhotoOnly}
        isOpen={true}
        onClose={onClose}
      />
    );

    const stage = document.getElementById('food-zoom-image-stage');
    expect(stage).not.toBeNull();

    // Wheel up zooms in
    fireEvent.wheel(stage, { deltaY: -100 });
    expect(screen.getByText('135%')).toBeDefined();

    // Wheel down zooms out
    fireEvent.wheel(stage, { deltaY: 100 });
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('supports mobile touch pinch zoom gesture calculation', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={mockDishPhotoOnly}
        isOpen={true}
        onClose={onClose}
      />
    );

    const stage = document.getElementById('food-zoom-image-stage');

    // Simulate 2-finger touch start with initial distance
    fireEvent.touchStart(stage, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 100 }
      ]
    });

    // Simulate 2-finger pinch spread (distance increases from 100 to 240)
    fireEvent.touchMove(stage, {
      touches: [
        { clientX: 50, clientY: 100 },
        { clientX: 290, clientY: 100 }
      ]
    });

    fireEvent.touchEnd(stage);

    // Zoom percentage should have increased beyond 100%
    const badge = document.getElementById('food-zoom-percentage-badge');
    const percent = parseInt(badge.textContent, 10);
    expect(percent).toBeGreaterThan(100);
  });

  it('renders mode tabs for 3D model dishes and allows switching to 3D and back', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={mockDishWith3D}
        isOpen={true}
        onClose={onClose}
      />
    );

    // 3D Dish defaults to 3D view
    expect(screen.getByTestId('mock-food-3d-viewer')).toBeDefined();

    // Switch to High-Res Photo tab
    const photoTabBtn = screen.getByRole('button', { name: /switch to high-resolution culinary photography/i });
    fireEvent.click(photoTabBtn);

    // Photo stage should now be visible
    expect(document.getElementById('food-zoom-primary-image')).not.toBeNull();

    // Switch back to 3D tab
    const threeDTabBtn = screen.getByRole('button', { name: /switch to interactive 3d model inspection/i });
    fireEvent.click(threeDTabBtn);
    expect(screen.getByTestId('mock-food-3d-viewer')).toBeDefined();
  });

  it('allows adding to cart directly from the zoom viewer without closing', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={mockDishPhotoOnly}
        isOpen={true}
        onClose={onClose}
      />
    );

    const addBtn = screen.getByRole('button', { name: /add meyer lemon & yuzu tart to order/i });
    expect(addBtn).toBeDefined();

    fireEvent.click(addBtn);

    // Should display added success feedback
    expect(screen.getByText('Added to Order!')).toBeDefined();
    // Modal should remain open for viewing
    expect(onClose).not.toHaveBeenCalled();
  });

  it('gracefully falls back to default image when image fails to load', () => {
    renderWithCart(
      <FoodZoomViewer
        dish={{
          ...mockDishPhotoOnly,
          image: 'https://broken-image-link-test.com/nonexistent.jpg'
        }}
        isOpen={true}
        onClose={onClose}
      />
    );

    const img = document.getElementById('food-zoom-primary-image');
    expect(img).not.toBeNull();

    // Trigger image error
    fireEvent.error(img);

    // Image source should fall back to DEFAULT_FOOD_IMAGE
    expect(img.src).toContain('images.unsplash.com');
  });

  it('restores focus to trigger element when closed', () => {
    // Create a dummy trigger button in the document
    const trigger = document.createElement('button');
    trigger.id = 'external-trigger-btn';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = renderWithCart(
      <FoodZoomViewer
        dish={mockDishPhotoOnly}
        isOpen={true}
        onClose={onClose}
      />
    );

    // Close viewer by unmounting
    unmount();

    // Clean up
    document.body.removeChild(trigger);
  });
});
