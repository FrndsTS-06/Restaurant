
# PHASE 1 — COMPLETE PROJECT INSPECTION REPORT

**Project:** Savoria Haute Cuisine & RestaurantPro Suite  
**Role:** Senior Full-Stack Developer, Software Architect & QA Engineer  
**Inspection Date:** October 16, 2026  
**Status:** **PHASE 1 COMPLETE — BASELINE INSPECTION & ARCHITECTURAL INVENTORY**  

---

## 1. Technology Stack, Dependencies, Architecture & Folder Structure

### 1.1 Architecture Overview
The project is architected as a high-performance, full-stack decoupled web application comprising:
- **Frontend Client:** React 18 SPA bundled with Vite 5, Tailwind CSS v4, Redux Toolkit (RTK Query), and React Router v6.
- **Backend API Server:** Node.js (v22+) runtime with Express.js 4.21, Mongoose 8 ODM, Helmet 8 security headers, Express Rate Limiter, and Razorpay SDK integration.
- **Database:** Local or Cloud MongoDB (`restaurantpro_db`), utilizing connection pooling, schema validation, and compound indexes.
- **Testing & QA Stack:** Vitest with JSDOM and `@axe-core` for client unit & accessibility tests; Node native test runner (`node --test`) for backend integration; Playwright (`@playwright/test`) and Puppeteer Core for end-to-end browser workflows.

```
restaurant/
├── client/                      # Frontend Single Page Application (React 18 + Vite)
│   ├── src/
│   │   ├── __tests__/           # Vitest unit, cart, routing & axe-core a11y tests
│   │   ├── components/          # Reusable UI & domain components
│   │   │   ├── common/          # Navbar, Footer, Button, Badge, LoadingSpinner, etc.
│   │   │   ├── customer/        # HeroBanner, CartDrawer, etc.
│   │   │   └── layout/          # Layout, AdminLayout, ProtectedRoute
│   │   ├── features/            # Feature contexts (authContext, cartContext)
│   │   ├── hooks/               # Custom hooks (useAuth, useCart)
│   │   ├── pages/               # Route page components
│   │   │   ├── admin/           # 14 Admin Dashboard consoles (lazy-loaded)
│   │   │   ├── auth/            # LoginPage, RegisterPage, Password Recovery
│   │   │   └── customer/        # HomePage, MenuPage, CartPage, ReservationPage, etc.
│   │   ├── routes/              # AppRoutes.jsx (Route-level code splitting)
│   │   ├── services/            # Axios API client services (menu, order, table, etc.)
│   │   ├── store/               # Redux Toolkit store & apiSlice (RTK Query caching)
│   │   ├── utils/               # formatters.js, constants.js
│   │   └── index.css            # Design tokens, CSS variables, Tailwind v4
│   ├── package.json             # Client dependencies & scripts
│   └── vite.config.js           # Rollup manual chunking & proxy configuration
├── server/                      # Backend REST API Server (Node + Express)
│   ├── src/
│   │   ├── config/              # db.js, env.js, razorpay.js, nodemailer.js
│   │   ├── controllers/         # 17 domain controllers (menu, order, payment, admin, etc.)
│   │   ├── middleware/          # auth.js (JWT, RBAC), error.js, rateLimiter.js
│   │   ├── models/              # 11 Mongoose models (MenuItem, Order, Reservation, etc.)
│   │   ├── routes/              # Express API route modules
│   │   ├── utils/               # apiResponse.js, seedData.js, emailService.js
│   │   ├── validators/          # Payload validation middleware (order, reservation, auth)
│   │   └── server.js            # Express application bootstrapper
│   ├── scripts/                 # Automated audit verification scripts (Phases 5–11)
│   ├── tests/                   # 9 Node native test suites (161 integration tests)
│   └── package.json             # Backend dependencies & test scripts
├── docs/                        # Complete architectural and QA documentation
├── e2e/                         # Playwright & Puppeteer end-to-end specifications
└── package.json                 # Monorepo root scripts & dev dependencies
```

### 1.2 Dependencies Inventory

#### Frontend Client Dependencies (`client/package.json`):
- **Core Framework:** `react` (^18.3.1), `react-dom` (^18.3.1), `react-router-dom` (^6.27.0)
- **State & Data Fetching:** `@reduxjs/toolkit` (^2.13.0), `react-redux` (^9.3.0), `axios` (^1.20.0)
- **UI Icons:** `lucide-react` (^0.453.0)
- **Build & Styling:** `vite` (^5.4.9), `tailwindcss` (^4.3.3), `@tailwindcss/postcss` (^4.3.3), `postcss` (^8.5.30), `autoprefixer` (^10.6.1)
- **Testing & A11y:** `vitest` (^2.1.9), `@testing-library/react` (^16.3.3), `@testing-library/jest-dom` (^7.0.1), `jsdom` (^29.1.1), `axe-core` (^4.14.0)

#### Backend Server Dependencies (`server/package.json`):
- **API Server & Routing:** `express` (^4.21.0), `cors` (^2.8.5), `cookie-parser` (^1.4.7)
- **Database & Modeling:** `mongoose` (^8.7.0)
- **Security & Cryptography:** `bcryptjs` (^2.4.3), `jsonwebtoken` (^9.0.2), `helmet` (^8.3.0), `express-rate-limit` (^8.7.1)
- **Payments & Media:** `razorpay` (^2.9.8), `cloudinary` (^2.11.0), `multer` (^2.4.0), `nodemailer` (^10.1.0)
- **Dev & Testing:** `nodemon` (^3.1.7), `supertest` (^7.3.1)

---

## 2. Comprehensive Currency ($ / USD) Usage Inventory

Currency formatting across the frontend client is centralized via `formatPrice()` in [`client/src/utils/formatters.js`](file:///d:/restaurant/client/src/utils/formatters.js):
```javascript
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};
```

### Inventory of All Currency ($ / USD) Occurrences:

| Surface / Area | File Location | Line / Element | Context / Description |
| :--- | :--- | :--- | :--- |
| **1. Homepage** | [`client/src/pages/customer/HomePage.jsx`](file:///d:/restaurant/client/src/pages/customer/HomePage.jsx) | Line 261 | `{formatPrice(dish.price)}` displayed on featured degustation dish cards. |
| **2. Food Menu** | [`client/src/pages/customer/MenuPage.jsx`](file:///d:/restaurant/client/src/pages/customer/MenuPage.jsx) | Line 433 | `{formatPrice(dish.price)}` displayed on catalog dish cards. |
| **3. Food Details Modal** | [`client/src/pages/customer/MenuPage.jsx`](file:///d:/restaurant/client/src/pages/customer/MenuPage.jsx) | Line 596 | `{formatPrice(selectedDishModal.price)}` rendered in the dish modal header. |
| **4. Shopping Cart Drawer** | [`client/src/components/customer/CartDrawer.jsx`](file:///d:/restaurant/client/src/components/customer/CartDrawer.jsx) | Lines 145, 178, 183, 189, 195, 203 | Item prices, subtotal, 8.25% tax, delivery fee ($5.00/FREE), discount, and total. |
| **5. Cart Dedicated Page** | [`client/src/pages/customer/CartPage.jsx`](file:///d:/restaurant/client/src/pages/customer/CartPage.jsx) | Lines 152, 218, 224, 230, 236, 244 | Cart item line subtotals, delivery fee, order discount, and total order cost. |
| **6. Checkout Page** | [`client/src/pages/customer/CartCheckoutPage.jsx`](file:///d:/restaurant/client/src/pages/customer/CartCheckoutPage.jsx) | Lines 212, 243, 248, 254, 260, 266, 321 | Order review summary, fee breakdown, and Pay CTA button (`Pay {formatPrice(total)}`). |
| **7. Order Summary** | [`client/src/pages/customer/OrderTrackingPage.jsx`](file:///d:/restaurant/client/src/pages/customer/OrderTrackingPage.jsx) | Lines 291, 298, 303, 308, 313, 318 | Receipt summary card showing subtotal, coupon deduction, tax, and total paid. |
| **8. Payment Integration** | [`server/src/controllers/paymentController.js`](file:///d:/restaurant/server/src/controllers/paymentController.js) | Lines 56–113 | `amountInSubunits` (amount * 100 in cents/paise); `options.currency` (`USD` / `INR`). |
| **9. Order History** | [`client/src/pages/customer/ProfilePage.jsx`](file:///d:/restaurant/client/src/pages/customer/ProfilePage.jsx) | Lines 377, 386 | Historical order totals and item line prices (`{formatPrice(ord.totalAmount)}`). |
| **10. Invoices & Modal** | [`client/src/pages/admin/AdminOrdersPage.jsx`](file:///d:/restaurant/client/src/pages/admin/AdminOrdersPage.jsx) | Lines 285, 510, 521, 525, 530, 536, 541 | Order management table amount and dispatch invoice breakdown modal. |
| **11. Admin Dashboard** | [`client/src/pages/admin/AdminDashboardPage.jsx`](file:///d:/restaurant/client/src/pages/admin/AdminDashboardPage.jsx) | Lines 130, 134, 214, 332, 377 | Today's revenue KPI, All-time revenue, 14-day sales chart hover tooltip, top dishes revenue. |
| **12. Admin Customers CRM**| [`client/src/pages/admin/AdminCustomersPage.jsx`](file:///d:/restaurant/client/src/pages/admin/AdminCustomersPage.jsx) | Lines 232, 326 | Customer lifetime spend column and detailed customer profile drawer. |
| **13. Admin Payments Ledger**| [`client/src/pages/admin/AdminPaymentsPage.jsx`](file:///d:/restaurant/client/src/pages/admin/AdminPaymentsPage.jsx) | Lines 117, 126, 135, 270, 356 | Total volume, successful volume, refunded volume, and transaction refund modal. |
| **14. Admin Reports** | [`client/src/pages/admin/AdminReportsPage.jsx`](file:///d:/restaurant/client/src/pages/admin/AdminReportsPage.jsx) | Lines 242–246, 276, 332–336 | Sales report (subtotal, tax, deliveryFee, discount, revenue), dish margins & revenue. |
| **15. Admin Coupons Atelier**| [`client/src/pages/admin/AdminCouponsPage.jsx`](file:///d:/restaurant/client/src/pages/admin/AdminCouponsPage.jsx) | Line 204 | Minimum order purchase requirement and fixed discount amounts. |
| **16. Database Records** | [`server/src/models/RestaurantSettings.js`](file:///d:/restaurant/server/src/models/RestaurantSettings.js) | Lines 38, 42 | Schema defaults: `currency: 'USD'`, `currencySymbol: '$'`. |
| **17. Database Records** | [`server/src/models/MenuItem.js`](file:///d:/restaurant/server/src/models/MenuItem.js) | Lines 26, 31 | `price` (Number, min 0), `costPrice` (Number, min 0). |
| **18. Database Records** | [`server/src/models/Order.js`](file:///d:/restaurant/server/src/models/Order.js), [`Cart.js`](file:///d:/restaurant/server/src/models/Cart.js) | Subtotal, Tax, DeliveryFee, Discount, TotalAmount | Numeric fields stored in base currency units (e.g. `24.50`). |
| **19. API Responses** | `GET /api/settings`, `GET /api/menu`, `GET /api/orders` | JSON Payloads | Returns numeric prices and settings `{ currency: "USD", currencySymbol: "$" }`. |

---

## 3. Pricing Calculations, Discounts, Taxes, Delivery Charges & Totals

### 3.1 Mathematical Calculation Rules (Server-Authoritative)
The backend enforces **Zero-Trust Client Pricing** in [`server/src/controllers/orderController.js`](file:///d:/restaurant/server/src/controllers/orderController.js) and [`server/src/models/Cart.js`](file:///d:/restaurant/server/src/models/Cart.js):

1. **Subtotal Calculation:**
   $$\text{Subtotal} = \sum_{i=1}^{n} (\text{item.price} \times \text{item.quantity})$$
   - Calculated strictly using verified database records (`MenuItem.findById()`), ignoring any client-sent price.
2. **Sales Tax:**
   $$\text{Tax} = \text{round}(\text{Subtotal} \times 0.0825 \times 100) / 100$$
   - Fixed standard rate of **8.25%** defined in `RestaurantSettings`.
3. **Delivery Fee:**
   $$\text{DeliveryFee} = \begin{cases} 0 & \text{if } \text{orderType} \neq \text{'delivery'} \\ 0 & \text{if } \text{Subtotal} \ge \$100.00 \\ \$5.00 & \text{if } \text{Subtotal} < \$100.00 \end{cases}$$
4. **Discounts & Coupons:**
   - Evaluated by `coupon.isValidForOrder(subtotal)`.
   - Percentage discounts: `discountAmount = round(subtotal * (discountValue / 100) * 100) / 100`, capped at `maxDiscountAmount` if specified.
   - Fixed discounts: `discountAmount = min(subtotal, discountValue)`.
5. **Total Order Amount:**
   $$\text{Total} = \max(0, \text{round}((\text{Subtotal} + \text{Tax} + \text{DeliveryFee} - \text{Discount}) \times 100) / 100)$$
6. **Payment Subunit Conversion:**
   $$\text{AmountInSubunits} = \text{round}(\text{Total} \times 100) \quad (\text{e.g. } \$24.50 \to 2450 \text{ cents/paise})$$

---

## 4. Current Homepage Assessment & Animation Libraries

### 4.1 Visual Hierarchy & Components
The current homepage ([`client/src/pages/customer/HomePage.jsx`](file:///d:/restaurant/client/src/pages/customer/HomePage.jsx)) is divided into 6 distinct sections:
1. **Live System Architecture Bar:** Displays backend API status (`200 OK`), database name (`restaurantpro_db`), and RTK Query polling state.
2. **Promotional Announcement Banner:** Configurable banner driven by restaurant settings (`#homepage-promo-banner`).
3. **Hero Section ([`HeroBanner.jsx`](file:///d:/restaurant/client/src/components/customer/HeroBanner.jsx)):** 
   - 2-column grid layout with ambient background radial glow (`radial-gradient(circle, rgba(230, 175, 93, 0.12)...)`).
   - Left: Autumn Degustation badge, Playfair Display heading with gold gradient text, narrative paragraph, CTAs ("Reserve a Table", "Explore Culinary Menu"), and Michelin accolade badges.
   - Right: High-resolution featured dish image (`1200x480` with `fetchpriority="high"`), gradient overlay, signature caption, and floating glass highlight pill ("Reservations Open for Tonight").
4. **Grand Repertoire Categories:** 4-card grid (Starters, Mains, Desserts, Beverages) with image hover zoom and direct filtered menu links.
5. **Chef’s Autumn Highlights:** 3-card degustation dish showcase with star ratings, dietary badges, live prices, and instant "Order Dish" actions.
6. **The Savoria Heritage Narrative:** 2-column storytelling section detailing Chef Alexandre Moreau's philosophy, accompanied by dining room photography and Michelin 3-Star award badge.
7. **Critical Acclaim & Testimonials:** 3-column review card grid featuring quotes from Michelin Guide inspectors and food critics.

### 4.2 Current Animation Libraries
- **Installed Animation Libraries:** **NONE (Pure CSS)**.
- **Current Motion Techniques:**
  - Standard CSS keyframes (`@keyframes fade-in`, `@keyframes slide-up` in `index.css`).
  - Tailwind CSS transition utility classes (`transition-all duration-300`, `transition-transform duration-700`, `hover:scale-105`, `hover:-translate-y-1`).
  - Native CSS transitions on buttons and inputs (`var(--transition-fast)`, `var(--transition-smooth)`).
  - Accessibility motion guard: `@media (prefers-reduced-motion: reduce)` zeroes out all animation durations for vestibular sensitivity compliance.

---

## 5. Check: Three.js, React Three Fiber, Drei & GSAP Installation Status

Direct inspection of `client/package.json` and monorepo `package.json` confirms:

| Library | Status | Notes |
| :--- | :---: | :--- |
| **Three.js** (`three`) | ❌ **NOT INSTALLED** | Not present in `dependencies` or `devDependencies`. |
| **React Three Fiber** (`@react-three/fiber`) | ❌ **NOT INSTALLED** | Not present in `dependencies` or `devDependencies`. |
| **Drei** (`@react-three/drei`) | ❌ **NOT INSTALLED** | Not present in `dependencies` or `devDependencies`. |
| **GSAP** (`gsap`) | ❌ **NOT INSTALLED** | Not present in `dependencies` or `devDependencies`. |

---

## 6. Restaurant Assets, Logos, 3D Assets & Brand Palette

### 6.1 Brand Colors & Design Tokens ([`client/src/index.css`](file:///d:/restaurant/client/src/index.css))
- **Primary Background:** `#0b0c10` (Obsidian Dark)
- **Surface Background:** `#13151b` (Deep Charcoal)
- **Elevated Surface:** `#1a1e28` (Card & Modal Fill)
- **Glassmorphism Backdrop:** `rgba(19, 21, 27, 0.75)` with `backdrop-filter: blur(16px)`
- **Subtle Borders:** `rgba(255, 255, 255, 0.08)`
- **Primary Accent (Gold):** `#e6af5d` (Champagne Gold)
- **Light Accent Gold:** `#f5cf8e`
- **Gold Glow:** `rgba(230, 175, 93, 0.25)`
- **Secondary Accents:** Coral (`#ff6347`), Emerald (`#10b981`), Sky Blue (`#38bdf8`)
- **Text Palette:** Primary (`#f8fafc`), Secondary (`#94a3b8`), Muted (`#64748b`)
- **Typography:** Headings in `'Playfair Display', Georgia, serif`; Body in `'Plus Jakarta Sans', system-ui, sans-serif`.

### 6.2 Existing Logos & 2D Imagery
- **Logo:** Procedural SVG icon using Lucide `<UtensilsCrossed size={18} />` inside a rounded gold gradient emblem with typography "SAVORIA Haute Cuisine".
- **Imagery:** High-resolution photography sourced from Unsplash with WebP compression parameters (`auto=format&fit=crop&w=800&q=80`). Covers scallops, wagyu beef, truffles, cocktails, wine cellars, and dining atmospheres.
- **3D Assets (`.glb`, `.gltf`, `.obj`, `.fbx`):** **NONE**. There are currently 0 3D model files in the project.

---

## 7. Responsive Behavior & Performance Baseline

### 7.1 Responsive Behavior Matrix
- The application implements responsive CSS grid and flexbox wrapping rules with explicit container padding across 9 standard breakpoints (320px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px, 1920px).
- Evaluated across 28 routes (252 combinations) during Phase 2 & Phase 12 audits: **0 horizontal overflows detected**.
- Mobile navigation uses an accessible slide-out drawer (`#mobile-nav-drawer`) with keyboard Escape dismissals.
- Data tables implement `overflow-x: auto` wrappers (`.admin-table-container`) to prevent table clipping on mobile viewports.

### 7.2 Performance Baseline (Measured in Phase 11 & Phase 12)
- **Vite Production Build Time:** **4.81s – 6.13s**
- **Initial Client Bundle:** **280.94 kB** (Gzip: **70.31 kB**)
- **Production CSS Bundle:** **81.18 kB** (Gzip: **13.35 kB**)
- **Code Splitting:** 14 admin pages isolated into separate dynamic chunks (6–31 kB each).
- **API Latency (Local Benchmark):**
  - Health endpoint: **5.2ms** avg
  - Public Categories: **6.9ms** avg
  - Menu Catalog: **15.1ms** avg
  - Admin Orders: **29.8ms** avg
  - Admin Analytics: **51.5ms** avg
- **Concurrency Throughput:** 25 simultaneous GET requests to `/api/menu` resolved in **213.5ms** with 100% 200 OK throughput.
- **CLS (Layout Shift):** Minimized via explicit `width`, `height`, and aspect-ratio bounding on all images.

---

## 8. Existing Errors, Warnings, Broken Elements & Code Quality Checks

- **Console Errors in Production Build:** **0 errors**.
- **React Prop Warnings:** Verified and resolved (`fetchpriority` lowercase attribute fix).
- **Broken Image Links:** Verified; all Unsplash image URLs respond with HTTP 200 with fallback placeholders.
- **Text Overlaps / Layout Shifts:** 0 detected across mobile and desktop.
- **Open Bug Tracker Issues:** 0 open issues (all 10 tracked issues in `BUG_TRACKER.md` are marked `FIXED AND VERIFIED` or `ACCEPTED WITH DOCUMENTED REASON`).

---

## 9. Existing Tests & Critical Customer Workflows

### 9.1 Automated Test Suites Summary
- **Client Unit & A11y Suite:** `npx vitest run --pool=forks`
  - **19 passed, 0 failed** (`routes.test.jsx`, `cart.test.jsx`, `a11y.test.jsx`).
  - Automated `axe-core` accessibility checks confirm 0 critical or serious WCAG 2.1 AA violations.
- **Backend Integration Suite:** `npm test` in `server/`
  - **161 passed, 0 failed, 0 skipped** across 9 test files.
- **Playwright E2E Suites:** `npx playwright test`
  - `auth_permissions.spec.js`: 6 passed.
  - `form_validations.spec.js`: 7 passed.
  - `restaurant.spec.js`: 3 passed.

### 9.2 Critical Customer Workflows
1. **Public Catalog Browsing:** Filtering by category, searching, viewing dish details modal.
2. **Persistent Cart Management:** Adding items, updating quantities, guest cart to authenticated user merge upon login.
3. **Checkout & Order Creation:** Modality selection (Delivery, Pickup, Dine-In), server-validated pricing, coupon application, idempotency protection.
4. **Order Tracking:** Live status state machine (`placed` -> `confirmed` -> `preparing` -> `ready` -> `completed`).
5. **Table Reservations:** Live time slot availability check, party size table allocation, double-booking prevention, cancellation.
6. **Customer Account & Security:** Registration with role privilege escalation blocks, JWT login with HttpOnly cookies, password reset, BOLA/IDOR protection.
7. **Admin Operations:** Live analytics dashboard, menu CRUD with image upload, order dispatch status updates, table blocking, customer CRM, refund issuance, RFC 4180 CSV export.

---

## 10. Recommended 3D Implementation Approach

To integrate 3D interactive graphics (such as an interactive 3D culinary dish showcase, a floating gold cloche/plating visual in the Hero banner, or an interactive 3D table seating layout) while strictly preserving current performance, accessibility, and bundle budgets:

### 10.1 Architectural Strategy
1. **Isolated Route / Lazy Canvas Loading:**
   - **Do NOT** bundle Three.js into the root entry bundle (`index.js`).
   - Wrap the 3D scene in a dedicated dynamic component (e.g., `HeroScene3D.jsx` loaded via `React.lazy()` with a lightweight 2D CSS/WebP image placeholder fallback).
   - This prevents Three.js (~150 kB min+gzip) from delaying First Contentful Paint (FCP) or Largest Contentful Paint (LCP).
2. **Library Selection:**
   - Install `three` and `@react-three/fiber` (R3F) with `@react-three/drei` for declarative, component-driven React lifecycle binding.
   - Alternatively, for lightweight procedural particles or a floating geometric cloche without heavy dependencies, consider vanilla Three.js inside a `useEffect` canvas hook.
3. **Asset Strategy (GLTF / GLB Compression):**
   - Use binary `.glb` format with Draco or Meshopt compression (`gltf-pipeline`), keeping asset file sizes under **500 kB – 1.5 MB**.
   - Host 3D assets in `client/public/models/` or on a CDN with HTTP cache headers (`Cache-Control: public, max-age=31536000, immutable`).
4. **Performance & Device Guardrails:**
   - **IntersectionObserver:** Automatically pause the render loop (`invalidate()` or `clock.stop()`) when the canvas scrolls out of viewport, reducing GPU/CPU battery drain.
   - **DPR Clamping:** Clamp `dpr={[1, 1.5]}` or `Math.min(window.devicePixelRatio, 2)` to prevent mobile overheating on high-density retina displays.
   - **WebGL Fallback:** Detect WebGL support via canvas context; gracefully fall back to the existing high-res Unsplash photography if WebGL is disabled or unsupported.
5. **Accessibility Compliance:**
   - Respect `prefers-reduced-motion`: When active, disable continuous rotation and damp orbital controls.
   - Keep interactive controls keyboard-navigable and provide `aria-hidden="true"` on decorative 3D canvases.

---

## 11. Required Files and Modifications (Future Phases)

If proceeding with 3D integration or currency customization in subsequent phases:

### Phase 2+ Target Files:
1. `client/package.json`: Install `three`, `@react-three/fiber`, `@react-three/drei` (or lightweight procedural alternative).
2. `client/vite.config.js`: Add manual rollup chunking rule for `three` to ensure it stays in a separate chunk.
3. `client/src/components/customer/HeroBanner.jsx`: Integrate lazy-loaded `<HeroScene3D />` alongside text content.
4. `client/src/components/3d/HeroScene3D.jsx` (New file): 3D canvas with lighting, camera controls, and optimized model/particles.
5. `client/src/utils/formatters.js`: Multi-currency formatting hook/utility if currency customization is introduced.
6. `client/src/features/cart/cartContext.jsx`: Ensure currency conversions or symbols dynamically reflect active settings.
7. `server/src/models/RestaurantSettings.js`: Support customizable store currency config if multi-currency is selected.

---

## 12. Risks and Dependencies

1. **Bundle Bloat Risk:**
   - *Risk:* Adding Three.js and R3F can increase raw bundle size by ~500–600 kB if not properly code-split.
   - *Mitigation:* Strict dynamic imports (`React.lazy`) and Rollup manual chunking.
2. **Mobile GPU & Battery Consumption:**
   - *Risk:* Continuous requestAnimationFrame loops drain mobile battery and heat devices.
   - *Mitigation:* On-demand rendering (`frameloop="demand"`), pausing when offscreen, and limiting polygon counts.
3. **Asset Availability:**
   - *Risk:* High-quality, low-poly 3D culinary models (e.g. Wagyu dish, caviar tin, wine decanter, cloche) are not yet in the repository.
   - *Mitigation:* Source or generate optimized `.glb` assets, or begin with procedural luxury 3D particle/gold ambient geometry before loading external meshes.
4. **Zero Functionality Regression:**
   - *Risk:* Introducing canvas overlays must not block existing click interactions on CTA buttons ("Reserve a Table", "Explore Menu").
   - *Mitigation:* Set `pointer-events: none` on ambient canvas containers or restrict orbit controls strictly to canvas bounds.

---

## 13. Summary & Phase 1 Sign-Off

Phase 1 inspection is complete. Current architecture, dependencies, currency touchpoints, and technical parameters are comprehensively cataloged with zero modifications to existing production code.

**Awaiting user approval before proceeding to subsequent phases.**
