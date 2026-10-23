# PHASE 1 — PROJECT INSPECTION AND 3D IMPLEMENTATION PLANNING REPORT

**Project:** SAVORIA Haute Cuisine & RestaurantPro Platform  
**Roles:** Senior Full-Stack Developer, 3D Web Architect, and QA Engineer  
**Date:** October 18, 2026  
**Status:** **PHASE 1 COMPLETE — BASELINE INSPECTION & ARCHITECTURAL BLUEPRINT**  
*(Strict Hold: No code changes implemented in Phase 1)*

---

## 1. Executive Summary

This inspection and planning document establishes the technical baseline and architectural blueprint for expanding 3D web capabilities across the working SAVORIA restaurant platform. 

The existing production platform is fully operational, incorporating Indian Rupee (INR - ₹) pricing, real-time table reservations, multi-modal checkout, an interactive 3D hero canvas on the homepage, and an 14-module admin dashboard.

**Core Mandate:** Do not rebuild the website or remove any existing features. All 3D enhancements must be strictly additive, fully decoupled, backward-compatible, and guarded by graceful 2D fallbacks.

---

## 2. Existing System Inspection

### 2.1 Full-Stack Architecture & Runtime Overview

```
SAVORIA Restaurant Platform Architecture
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT FRONTEND (PORT 5173)                     │
│  React 18.3.1 SPA • Vite 5.4.9 • TailwindCSS v4 • Lucide Icons         │
│  Redux Toolkit (RTK Query Caching) • React Router v6.27.0              │
│  Three.js 0.186.1 • @react-three/fiber 8.18.0 • @react-three/drei 9.122│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST APIs (/api/*) + JWT & Cookies
┌────────────────────────────────────▼───────────────────────────────────┐
│                        BACKEND SERVER (PORT 5000)                      │
│  Node.js v22+ • Express 4.21.0 MVC • Helmet 8.3.0 • Rate Limiter 8.7.1 │
│  Multer 2.4.0 • Cloudinary 2.11.0 Media CDN • Razorpay 2.9.8 (INR)     │
│  Mongoose 8.7.0 ODM • Centralized Error Middleware (CastError Safe)    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ MongoDB Native Driver
┌────────────────────────────────────▼───────────────────────────────────┐
│                    DATABASE (PORT 27017 - MONGODB)                     │
│  Database: restaurantpro_db                                            │
│  Collections: menuitems, categories, orders, reservations, tables,     │
│               coupons, restaurantsettings, users, reviews, payments    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Frontend Client:** Single Page Application (SPA) structured with modular routing, centralized design tokens in `client/src/index.css`, RTK Query for server state caching, and custom context hooks (`useCart`, `useAuth`).
- **Backend API:** Standardized Express REST API with strict input sanitization, role-based access control (`admin`, `staff`, `customer`), rate-limiting DOS protection, and automated health monitoring.
- **Database:** Local MongoDB instance with compound indexing on query-heavy fields (`category + isAvailable`, `status + createdAt`, `reservationDate + status`).
- **Admin Dashboard:** 14 lazy-loaded sub-modules under `/admin/*` protected by `ProtectedRoute (allowedRoles: ['admin'])`.
- **Application Routing:** React Router v6 handles 14 customer-facing routes and 14 admin console views without full page refreshes.

---

### 2.2 Brand Identity, Logo, Colors & Existing Assets

- **Restaurant Name:** **SAVORIA** (Brand Subtitle: **Haute Cuisine**, Executive Chef: **Alexandre Moreau**).
- **Brand Logo:** Amber-tinted rounded container featuring the `UtensilsCrossed` icon, paired with high-contrast serif typography (`Playfair Display`) and tracking subtitle `HAUTE CUISINE`.
- **Color Palette & Visual Tokens:**
  - `Obsidian Base`: `#0b0c10` (Primary dark canvas)
  - `Deep Slate`: `#13151b` (Surface card backgrounds)
  - `Elevated Slate`: `#1a1e28` (Modal dialogs & dropdowns)
  - `Champagne Gold`: `#e6af5d` (Primary metallic accent, CTAs, highlights)
  - `Light Gold`: `#f5cf8e` (Glows, hover states, badges)
  - `Warm Coral`: `#ff6347` (Gourmet specials, alerts)
  - `Fresh Emerald`: `#10b981` (Vegetarian dishes, organic tags, success toasts)
  - `Sommelier Sky`: `#38bdf8` (Beverages, rim lighting, cellar items)
  - `Typography`: Headings in `'Playfair Display', Georgia, serif`; Interface and body in `'Plus Jakarta Sans', system-ui, sans-serif`.

---

### 2.3 Homepage, Menu Cards, Food Detail Pages & Admin Food Management

1. **Homepage (`HomePage.jsx`):**
   - Features `HeroBanner.jsx` with the interactive 3D hero canvas (`HeroScene3D.jsx`).
   - Displays 3 featured dishes, 4 culinary category spotlight cards, brand value pillars (sustainable wild harvest, 3-star Michelin pedigree, subterranean wine cellar), and quick reservation CTA.
2. **Menu Cards (`MenuPage.jsx`):**
   - Responsive multi-column grid displaying high-resolution food imagery, dietary tags, chef special badges, rating badges, descriptions, INR (`₹`) prices, and "Add to Order" action button.
   - Includes an informational trigger (`<Info />` icon button) opening the comprehensive dish details modal.
3. **Food Detail Modal (`MenuPage.jsx`):**
   - Centered modal dialog (`selectedDishModal`) with backdrop blur.
   - Features full dish photography, dietary pills, full chef description, key ingredients, allergen alerts, nutritional caloric count, preparation time, and direct order placement with keyboard `Escape` dismissal.
4. **Admin Food Management (`AdminMenuPage.jsx`):**
   - Full CRUD management interface for dishes and categories.
   - Inputs for dish name, description, category, INR price, cost price, image upload (Cloudinary integration or direct URL), dietary flags, ingredients, allergens, preparation time, and availability toggle.
   - Currently, there is **no field in the admin form to configure or attach 3D models**.

---

### 2.4 Existing 3D Infrastructure & Dependencies

- **Installed 3D Libraries:**
  - `three`: `^0.186.1`
  - `@react-three/fiber`: `^8.18.0`
  - `@react-three/drei`: `^9.122.0`
- **Existing 3D Components:**
  - `HeroScene3D.jsx`: Master Three.js canvas container. Employs `ResponsiveCameraRig`, `WebGLErrorBoundary`, low-performance hardware detection, intersection observer render pausing (`frameloop={isVisible ? 'always' : 'never'}`), and 2D mode toggle.
  - `SignatureDishModel.jsx`: Procedurally modeled 3D culinary presentation featuring:
    - Obsidian slate base pedestal (`cylinderGeometry`, `roughness: 0.75`).
    - 24K gold inlay ring (`torusGeometry`, `metalness: 0.92`).
    - Fine bone china porcelain platter (`meshPhysicalMaterial`, `clearcoat: 0.9`).
    - Gourmet A5 Wagyu medallion with caramelized crust and demi-glace sauce reduction swirl.
    - Shaved Norcia black truffle disks and emerald micro-herbs.
    - Interactive lifting silver/gold cloche dome (`sphereGeometry`, `metalness: 0.96`, `clearcoat: 1.0`) responding to pointer hover and click.
  - `StudioLighting.jsx`: Configured 3-point studio lighting rig with warm amber key light (`#f59e0b`), cyan rim light (`#38bdf8`), and soft ambient fill.
  - `GoldDustParticles.jsx`: Floating golden ambient particles adding atmosphere.
  - `HeroFallback2D.jsx`: Static 2D fallback component featuring an Unsplash Michelin plating photo and gold plaque badge.

---

### 2.5 Asset Storage Pipeline

- **Images:** Stored as HTTPS strings in MongoDB. Seed dishes utilize curated Unsplash fine dining photography with responsive query parameters. User/admin uploads are handled by Express Multer memory storage and uploaded to Cloudinary (`/api/upload`).
- **3D Assets:** Currently 100% procedural (defined in code). No `.glb` or `.gltf` binary model files are currently stored in `client/public/` or streamed from Cloudinary.

---

## 3. Comprehensive 3D Food Asset Inventory

An audit of the live MongoDB database (`restaurantpro_db.menuitems`) identifies **12 unique culinary offerings**:

| # | Food Item Name | Category | Existing Image URL | 3D Model Availability | Proposed Model Format | Required Fallback Image | Implementation Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **A5 Miyazaki Wagyu Ribeye** | Mains | `photo-1558030006-450675393462` | **Available (Procedural)** | Procedural 3D Plating / `.glb` | Unsplash Wagyu Photo (Active) | **Implemented in Hero (Ready to modularize)** |
| **2** | **Pan-Seared Hokkaido Scallops** | Starters | `photo-1532550907401-a500c9a57435` | **Not Available** | Optimized `.glb` / Procedural Shell Platter | Unsplash Scallops Photo (Active) | **Pending 3D Asset** |
| **3** | **Heirloom Burrata & Roasted Fig** | Starters | `photo-1608897013039-887f21d8c804` | **Not Available** | Optimized `.glb` / Procedural Ceramic Bowl | Unsplash Burrata Photo (Active) | **Pending 3D Asset** |
| **4** | **Hokkaido Scallop Crudo with Yuzu Kosho** | Starters | `photo-1534422298391-e4f8c172dddb` | **Not Available** | Optimized `.glb` / Slate Sashimi Platter | Unsplash Crudo Photo (Active) | **Pending 3D Asset** |
| **5** | **Wild Chilean Sea Bass** | Mains | `photo-1519708227418-c8fd9a32b7a2` | **Not Available** | Optimized `.glb` / Miso Glaze Fish Fillet | Unsplash Sea Bass Photo (Active) | **Pending 3D Asset** |
| **6** | **Wild Forest Truffle Tagliolini** | Mains | `photo-1546549032-9571cd6b27df` | **Not Available** | Optimized `.glb` / Pasta Nest in Bowl | Unsplash Tagliolini Photo (Active) | **Pending 3D Asset** |
| **7** | **Pan-Roasted Duck Breast à l’Orange** | Mains | `photo-1544025162-d76694265947` | **Not Available** | Optimized `.glb` / Sliced Duck Platter | Unsplash Duck Photo (Active) | **Pending 3D Asset** |
| **8** | **Kashmiri Saffron Korma** | Mains | `photo-1544025162-d76694265947` | **Not Available** | Optimized `.glb` / Royal Copper Handi | Unsplash Korma Photo (Active) | **Pending 3D Asset** |
| **9** | **Grand Cru Dark Chocolate Sphere** | Desserts | `photo-1579372786545-d24232daf58c` | **Not Available** | Procedural Orb / `.glb` with Ganache Melt | Unsplash Chocolate Photo (Active) | **Pending 3D Asset** |
| **10**| **Meyer Lemon & Yuzu Tart** | Desserts | `photo-1509440159596-0249088772ff` | **Not Available** | Optimized `.glb` / Fluted Meringue Tart | Unsplash Tart Photo (Active) | **Pending 3D Asset** |
| **11**| **Smoked Rosemary Old Fashioned** | Beverages | `photo-1514362545857-3bc16c4c7d1b` | **Not Available** | Procedural Glassware / `.glb` Crystal Tumbler | Unsplash Cocktail Photo (Active) | **Pending 3D Asset** |
| **12**| **Sparkling Hibiscus & Berry Mocktail** | Beverages | `photo-1551024709-8f23befc6f87` | **Not Available** | Procedural Glassware / `.glb` Stemmed Coupe | Unsplash Mocktail Photo (Active) | **Pending 3D Asset** |

---

## 4. Reusable 3D Architecture Proposal

### 4.1 The WebGL Context Limit & The "Anti-Pattern" to Avoid

> [!CAUTION]
> **CRITICAL WEBGL RISK: MULTIPLE CANVAS INSTANCES**  
> Modern desktop and mobile browsers enforce a hard hardware cap on simultaneous active WebGL contexts (typically 8 to 16 maximum per browser process).  
> **If an individual `<Canvas>` is rendered on every card in the menu grid, the 17th card will crash the browser or silently destroy earlier WebGL contexts**, causing black screens and rendering failures.

### 4.2 The Solution: Single-Instance On-Demand 3D Stage

Instead of embedding 3D canvases inside every grid card, we propose a **Single-Instance On-Demand 3D Presentation Architecture**:

```
                                 USER INTERFACE
 ┌────────────────────────────────────────────────────────────────────────┐
 │ MENU CARD (2D Fast Render)                                             │
 │ - WebP Image                                                           │
 │ - Dietary pills & INR price                                            │
 │ - [3D Interactive Badge] ──(Click / Tap)─┐                             │
 └──────────────────────────────────────────┼─────────────────────────────┘
                                            │
                                            ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ DISH DETAILS MODAL (Dedicated Single-Instance 3D Canvas)               │
 │                                                                        │
 │   [ 📷 Photo Mode ]  |  [ 🔮 3D Interactive Mode ]                     │
 │  ┌──────────────────────────────────────────────────────────────────┐  │
 │  │ <FoodViewer3D dish={selectedDish} />                             │  │
 │  │                                                                  │  │
 │  │  ┌─────────────────────────────────────────────────────────────┐ │  │
 │  │  │ DynamicModelLoader                                          │ │  │
 │  │  │  ├─ If dish.model3dUrl exists ──> Loads .glb via useGLTF    │ │  │
 │  │  │  └─ If no .glb exists ──────────> Procedural Cloche/Pedestal│ │  │
 │  │  └─────────────────────────────────────────────────────────────┘ │  │
 │  │                                                                  │  │
 │  │  ┌─────────────────────────────────────────────────────────────┐ │  │
 │  │  │ PedestalStage (Standardized fine dining porcelain/slate)    │ │  │
 │  │  │ StudioLighting (Warm key, cyan rim, ambient fill)           │ │  │
 │  │  │ OrbitControls (Damped rotation, polar angle limits)         │ │  │
 │  │  │ ContactShadows (Soft ground contact shadow)                 │ │  │
 │  │  └─────────────────────────────────────────────────────────────┘ │  │
 │  └──────────────────────────────────────────────────────────────────┘  │
 │                                                                        │
 │  - Dish Description & Allergen Checklist                               │
 │  - ₹ INR Price & "Add to Order" Button                                 │
 └────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Proposed Component Hierarchy

1. **`client/src/components/3d/FoodViewer3D.jsx`:**
   - Standalone, reusable modal/inline 3D canvas container.
   - Props: `dish`, `isInteractive = true`, `autoRotate = true`, `onClose`.
   - Contains OrbitControls with polar clamp (`minPolarAngle: 0.3`, `maxPolarAngle: 1.45`) preventing customers from looking under the table.
   - Manages memory disposal lifecycle (`geometry.dispose()`, `material.dispose()`) on unmount.
2. **`client/src/components/3d/DynamicModelLoader.jsx`:**
   - Detects whether `dish.model3dUrl` is supplied.
   - If a `.glb` or `.gltf` model is provided: Uses `@react-three/drei`'s `useGLTF` wrapped in `<Center>` and `<Bounds>` to normalize scales across different models.
   - If no custom model exists: Fallback to the procedural gourmet cloche pedestal (`SignatureDishModel.jsx` or category-specific procedural dishes: Platter, Coupe, Bowl).
3. **`client/src/components/3d/PedestalStage.jsx`:**
   - Standardized turntable pedestal with obsidian slate base, gold filigree trim, and fine bone china platter.
   - Provides consistent visual branding across all dishes.

---

## 5. Database Schema & Admin Integration Plan

To support dynamic 3D models from the backend without hardcoding filenames in the frontend:

### 5.1 Schema Additions to `server/src/models/MenuItem.js`

```javascript
// Additive fields in MenuItemSchema
model3dUrl: {
  type: String,
  trim: true,
  default: null
},
modelFormat: {
  type: String,
  enum: ['glb', 'gltf', 'procedural', 'none'],
  default: 'none'
},
has3dModel: {
  type: Boolean,
  default: false
},
modelScale: {
  type: Number,
  default: 1.0,
  min: 0.1,
  max: 5.0
}
```

### 5.2 Admin Dashboard Integration in `AdminMenuPage.jsx`

- Add a "3D Experience Configuration" section in the dish creation and editing modal:
  - Toggle: `Enable 3D View for this Dish` (sets `has3dModel: true`).
  - Dropdown: `3D Model Format` (`GLB Binary`, `Procedural Cloche Preset`, `None`).
  - Text Input: `3D Model URL` (CDN link to `.glb` file or path).
  - Number Input: `Scale Multiplier` (default: 1.0).
  - Preview Action: Live in-modal 3D preview button allowing the chef or administrator to verify the model before saving.

---

## 6. Files Requiring Modification & Required Dependencies

### 6.1 Files Requiring Modification

| File Path | Nature of Modification |
| :--- | :--- |
| `server/src/models/MenuItem.js` | Add `model3dUrl`, `modelFormat`, `has3dModel`, `modelScale` fields. |
| `server/src/routes/uploadRoutes.js` | Support `.glb` mime-types (`model/gltf-binary`) for admin uploads (up to 15MB). |
| `client/src/components/3d/FoodViewer3D.jsx` | **New File:** Universal reusable 3D stage component. |
| `client/src/components/3d/DynamicModelLoader.jsx` | **New File:** Dynamic `.glb` and procedural preset resolver. |
| `client/src/components/3d/PedestalStage.jsx` | **New File:** Standardized porcelain/gold/slate presentation turntable. |
| `client/src/pages/customer/MenuPage.jsx` | Add "3D View" badge to menu cards and integrate `FoodViewer3D` in the dish detail modal. |
| `client/src/pages/admin/AdminMenuPage.jsx` | Add 3D model controls, format selector, and live preview to the dish CRUD modal. |

### 6.2 Dependencies Evaluation

- **Already Installed in `client/package.json`:**
  - `three` (`^0.186.1`)
  - `@react-three/fiber` (`^8.18.0`)
  - `@react-three/drei` (`^9.122.0`)
- **Required New Dependencies:**
  - **Zero new client runtime dependencies required.** The existing versions of Three.js, R3F, and Drei already contain all necessary loaders (`useGLTF`, `OrbitControls`, `Center`, `Bounds`, `ContactShadows`).

---

## 7. Performance, Security, and Compatibility Risk Analysis

### 7.1 Performance & Mobile Constraints
1. **Asset File Size Limits:**
   - Any external `.glb` food model must be optimized and Draco-compressed (target <= 2.5 MB per model).
   - High-polygon raw CAD files will cause frame drops on mid-range Android devices.
2. **GPU Memory & Context Disposals:**
   - When the dish details modal is closed, the Three.js scene must explicitly dispose of textures, materials, and geometries using `gl.dispose()` and `scene.clear()`.
   - The frameloop must be set to `demand` or paused when the modal is inactive.
3. **Core Web Vitals Integrity:**
   - Because 3D models will be loaded on-demand inside the modal, they will **not impact the initial page LCP (Largest Contentful Paint)**. The homepage and menu grid initial paint will remain blisteringly fast.

### 7.2 Safety of Cart, Checkout, and Payments
1. **Event Capture Isolation:**
   - Three.js pointer events must be strictly scoped to the canvas container (`pointer-events: auto`).
   - The 3D canvas must never overlay, intercept, or bubble clicks meant for the "Add to Order", quantity increments, or checkout form inputs.
2. **Pricing & Currency Integrity:**
   - 3D models are strictly presentation layer assets. They have zero touchpoints with order calculations, tax rates (8.25%), or Razorpay payments.
3. **Role-Based Security:**
   - Only authorized administrators will have permission to upload `.glb` assets or modify dish 3D URLs via the authenticated `/api/menu` endpoints.

---

## 8. Senior Technical Lead Phase 1 Sign-Off

```
================================================================================
PHASE 1 ARCHITECTURAL SIGNOFF: APPROVED FOR PLANNING
================================================================================
Project:               SAVORIA Haute Cuisine / RestaurantPro
Inspection Status:     100% COMPLETE & VERIFIED
Active Menu Inventory: 12 Unique Culinary Offerings Audited
3D Architecture:       Single-Instance On-Demand Stage (Zero WebGL Exhaustion)
E-Commerce Integrity:  Cart, Checkout, INR Pricing & Admin 100% Protected
Next Step:             Awaiting User Approval to Begin Phase 2 Implementation
================================================================================
```
