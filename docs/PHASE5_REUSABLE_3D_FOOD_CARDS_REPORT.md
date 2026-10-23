# Phase 5: Reusable 3D Food Cards & Interactive Viewer Report

**Executive Summary:**
Phase 5 successfully architected, integrated, and verified high-performance, modular React Three Fiber components for the restaurant's culinary menu repertoire:
- **`Food3DCard`**: High-performance static preview cards preventing WebGL context crashes.
- **`Food3DViewer`**: Production-ready interactive 3D model viewer with studio lighting, realistic contact shadows, automatic model centering, 360° horizontal rotation, touch gestures, and keyboard shortcuts.
- **`FoodModelLoader`**: Accessible, branded loading state with polite screen-reader announcements.
- **`FoodModelFallback`**: High-definition culinary photography with honest atelier status badges (`Verified Haute Cuisine Photography`, `3D Photogrammetry: Pending Review`, `In Atelier Development`).
- **`FoodModelControls`**: Fully accessible control dock featuring camera reset (R), auto-spin toggle (Space), zoom in/out (+/-), and dual 3D/Photo mode switching.

---

## 1. Architectural Components Overview

| Component | File Path | Primary Responsibilities |
| :--- | :--- | :--- |
| **`Food3DCard`** | `client/src/components/3d/Food3DCard.jsx` | Static image previews on menu grid; zero WebGL load on list render; displays formatted INR price (`formatPrice`), category, and calories; conditional "View in 3D" trigger; direct "Add to Order" cart integration. |
| **`Food3DViewer`** | `client/src/components/3d/Food3DViewer.jsx` | Full R3F `<Canvas>` viewer; studio 3-point lighting + golden warm keylight; auto-centering `<Center>`; 360° orbit with damping; mobile touch controls; error boundary isolation; rendering paused when closed (`frameloop="never"`). |
| **`FoodModelLoader`** | `client/src/components/3d/FoodModelLoader.jsx` | Accessible loading spinner with pulsing box icon and `role="status"` `aria-live="polite"` status updates. |
| **`FoodModelFallback`** | `client/src/components/3d/FoodModelFallback.jsx` | Displays verified photography for dishes lacking approved 3D assets or in environments without WebGL acceleration. Gracefully handles broken images. |
| **`FoodModelControls`** | `client/src/components/3d/FoodModelControls.jsx` | Accessible button dock for Reset Camera View (R), Auto-Spin (Space), Controlled Zoom (+/-), and 3D/Photo toggle. |

---

## 2. Performance & WebGL Context Isolation

### Single-Canvas Anti-Pattern Prevention
- **The Problem:** Rendering WebGL canvases inside every card in a menu grid of 20+ dishes causes browser WebGL context exhaustion (browsers limit active hardware contexts to 8–16). This triggers severe frame drops, mobile battery drain, and GPU crashes.
- **The Solution:**
  1. `Food3DCard` renders high-definition static images with subtle CSS hover micro-interactions.
  2. The interactive 3D scene is initialized **on-demand only** when the customer triggers "View in 3D".
  3. A single `<Food3DViewer>` instance runs inside an isolated portaled modal (`createPortal(..., document.body)`).
  4. When the modal is closed, the canvas is unmounted and `frameloop` is set to `"never"`, freeing all GPU buffers and memory.

---

## 3. Test Verification Suite Results

### Unit Test Suite (`npm test -- --run`)
- **Total Test Files**: 4 passed (4)
- **Total Unit & A11y Tests**: 32 passed (32)
- **Dedicated 3D Tests (`client/src/__tests__/food3d.test.jsx`)**: 12 passed
  - Card rendering with correct INR formatting (`₹3,850.00`).
  - Conditional "View in 3D" button visibility.
  - Sold-out state handling.
  - Image fallback resilience.
  - Fallback status badges.
  - Control callbacks (Mode, Auto-spin, Reset, Zoom In, Zoom Out).
  - Screen reader accessible live regions (`role="status"`).

### End-to-End Browser Automation (`e2e/verify_phase5_3d_cards_viewer.mjs`)
- **Test 1**: Food3DCard Grid & Static Previews (11 cards, 11 INR prices, 4 genuine 3D buttons) — **PASSED**
- **Test 2**: Interactive Food3DViewer launch via "View in 3D" button — **PASSED**
- **Test 3**: Camera 360° horizontal drag, controlled zoom, and reset — **PASSED**
- **Test 4**: Dual 3D / Photo Mode Switcher — **PASSED**
- **Test 5**: Fallback modal for items without 3D models with honest badge — **PASSED**
- **Test 6**: Direct "Add to Order" cart integration and notification toast — **PASSED**
- **Test 7**: Mobile 375px viewport overflow check (0px overflow) and touch controls — **PASSED**

---

## 4. Acceptance Criteria Checklist

- [x] **Display the correct food name**: Preserved from database menu items.
- [x] **Display the correct INR price**: Formatted with `formatPrice` (`₹` currency prefix).
- [x] **Display an attractive food preview**: Static lazy-loaded imagery with hover scale effect.
- [x] **Show a "View in 3D" button only when a valid 3D model is available**: 4 genuine assets (A5 Wagyu, Dark Chocolate Sphere, Old Fashioned, Hokkaido Scallops).
- [x] **Preserve Add to Cart functionality**: Functional on card and inside modal.
- [x] **Preserve food category and availability information**: Categories, dietary pills, chef specials, and sold-out states preserved.
- [x] **Handle missing images and models gracefully**: Fallback images and honest photogrammetry status badges.
- [x] **Load GLB/GLTF food models**: Loaded via `useGLTF` with procedural mesh caching.
- [x] **Allow 360-degree horizontal rotation**: OrbitControls configured with damping.
- [x] **Allow controlled zoom**: Accessible zoom in/out controls.
- [x] **Support touch gestures on mobile**: `touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}`.
- [x] **Realistic lighting and shadows**: Ambient + 2 directional studio lights + warm key point light + shadow plane.
- [x] **Center and scale models automatically**: Drei `<Center>` wrapper.
- [x] **Provide Reset View functionality**: Reset button and hotkey `R`.
- [x] **Provide loading and error states**: `FoodModelLoader` and `Food3DErrorBoundary`.
- [x] **Pause rendering when the viewer is closed**: `frameloop={isOpen ? 'always' : 'never'}`.
- [x] **Support keyboard-accessible controls**: Space (auto-spin), R (reset view), +/- (zoom).
- [x] **Static fallback if WebGL or model fails**: WebGL context check and error boundary rendering `FoodModelFallback`.
