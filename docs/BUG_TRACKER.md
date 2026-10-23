# RestaurantPro — Bug Tracker & Issue Resolution Log

**Document Version:** 2.0.0 (Phase 12 Release Audit)  
**Audit Date:** October 16, 2026  
**Auditor:** Quality Assurance & Full-Stack Security Lead  
**Scope:** Comprehensive tracking of all confirmed defects, root-cause analyses, remediations, and formal verification statuses across all 12 project phases.

---

## 1. Issue Summary Matrix

| Issue ID | Category | Severity | Summary | Status | Resolution / Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | Runtime / Startup | High | Backend `EADDRINUSE` port collision on TCP port 5000 | **FIXED AND VERIFIED** | Lingering Node process terminated; port cleared; verified clean boot |
| **BUG-002** | Styling / CSS | High | Universal selector reset in `index.css` overriding Tailwind v4 margins & container padding | **FIXED AND VERIFIED** | Removed unlayered `margin: 0; padding: 0;` reset; restored explicit container layout utilities |
| **BUG-003** | Configuration | Medium | Missing `VITE_RAZORPAY_KEY_ID` in `client/.env` matching `.env.example` | **FIXED AND VERIFIED** | Synchronized `client/.env` with public test key `rzp_test_restaurantpro2026` |
| **BUG-004** | Testing Environment | Low | JSDOM relative URL warning (`Failed to parse URL from /api/*`) in Vitest | **FIXED AND VERIFIED** | Polyfilled relative URL resolution in `client/src/setupTests.js`; 19/19 Vitest tests pass cleanly |
| **BUG-005** | Browser Subagent | Low | Playwright driver 404 download mirror error on Windows subagent CDN | **ACCEPTED WITH DOCUMENTED REASON** | Headless automated verification executed via system-installed Playwright, node fetch, and Puppeteer |
| **BUG-006** | Security (BOLA/IDOR) | High | Unauthenticated / cross-customer cancellation of orders and reservations | **FIXED AND VERIFIED** | Enforced customer email/phone ownership checks on guest cancellations; verified across 65+ integration tests |
| **BUG-007** | API Validation | Medium | Order validation rejected payloads containing `menuItem` ID without client `name`/`price` | **FIXED AND VERIFIED** | Updated `orderValidator.js` to accept `menuItem` ID reference while server enforces authoritative DB pricing |
| **BUG-008** | Performance / Bundling | High | Monolithic frontend bundle included all 14 admin pages in initial guest download | **FIXED AND VERIFIED** | Route-level code splitting (`React.lazy` + `Suspense`) reduced initial bundle by 41.1% (280 kB) |
| **BUG-009** | Accessibility (WCAG) | Medium | Missing `aria-label` screen reader names on icon buttons and non-semantic radiogroups | **FIXED AND VERIFIED** | Added `aria-label` attributes, `role="radiogroup"`, `role="radio"`, and automated axe-core tests (0 violations) |
| **BUG-010** | Payment Gateway | Low | Live Razorpay Gateway production credentials unconfigured | **ACCEPTED WITH DOCUMENTED REASON** | Sandbox credentials `rzp_test_restaurantpro2026` actively configured for safe mock transactions; live keys require production approval |
| **BUG-011** | Testing Environment | Low | Vitest unhandled exception (`cancelAnimationFrame is not defined`) on store teardown | **FIXED AND VERIFIED** | Polyfilled root Node global RAF/CAF in `setupTests.js` & disabled `autoBatch` in `testUtils.jsx`; 20/20 tests pass cleanly |
| **BUG-012** | Test Script / Security | Medium | `verifyPhase7.js` reservation cancellation rejected without `guestEmail` parameter | **FIXED AND VERIFIED** | Added `guestEmail` parameter adhering to BUG-006 BOLA ownership security policy; verified script pass |
| **BUG-013** | Accessibility (WCAG) | Low | Cart drawer quantity adjustment & item deletion buttons lacked accessible `aria-label` names | **FIXED AND VERIFIED** | Added `aria-label="Decrease quantity"`, `aria-label="Increase quantity"`, `aria-label="Remove item"`, and `#cart-drawer-panel` |
| **BUG-014** | Test Automation | Medium | Outdated Playwright interaction selectors causing element mismatch timeouts & navigation race conditions | **FIXED AND VERIFIED** | Synchronized selectors with production DOM (`Add to Order`, `#checkout-name`, `#tab-my-bookings`); 10/10 tests pass |

---

## 2. Detailed Bug Reports & Verification Evidence

### BUG-001: Backend Server `EADDRINUSE` Port Collision on Port 5000
- **Status:** **FIXED AND VERIFIED**
- **Category:** Runtime / Startup Error
- **Severity:** High
- **Root Cause Diagnosis:**
  A background Node.js process previously spawned during an earlier development session was holding the TCP socket open on port 5000. When nodemon attempted to bind a new Express HTTP server instance to port 5000, the Windows network subsystem returned error `-4091` (`EADDRINUSE`).
- **Resolution Applied:**
  1. Identified lingering processes holding port 5000 using PowerShell `Get-NetTCPConnection -LocalPort 5000`.
  2. Terminated the orphaned process cleanly.
  3. Verified that port 5000 was completely released.
  4. Successfully booted `server/src/server.js` on `http://localhost:5000`.
- **Verification Evidence:**
  `curl.exe -i http://localhost:5000/api/health` returned `200 OK` with database status `connected`, `uptimeSeconds > 1000`, and zero port conflicts.

---

### BUG-002: Universal Reset Overriding Tailwind v4 Margins & Container Spacing
- **Status:** **FIXED AND VERIFIED**
- **Category:** Styling / CSS Layout
- **Severity:** High
- **Root Cause Diagnosis:**
  In Tailwind CSS v4, the cascade model utilizes standard CSS cascade layers (`@layer`). In `client/src/index.css`, an unlayered universal reset was present (`*, *::before, *::after { margin: 0; padding: 0; }`). Because unlayered rules take cascade precedence over layered rules, this rule forcefully stripped margins and container paddings across the application.
- **Resolution Applied:**
  1. Removed `margin: 0; padding: 0;` from the universal `*` selector in `client/src/index.css`, preserving only `box-sizing: border-box;`.
  2. Implemented dedicated responsive layout container classes (`.container`, `.section-padding`).
  3. Verified all page components incorporate proper padding clearance.
- **Verification Evidence:**
  Client production bundle recompiled cleanly with Tailwind v4 (`81.18 kB`). All 252 page-viewport tests verified 0 horizontal overflows across 9 viewports (320px to 1920px).

---

### BUG-003: Missing `VITE_RAZORPAY_KEY_ID` in Client Environment
- **Status:** **FIXED AND VERIFIED**
- **Category:** Configuration
- **Severity:** Medium
- **Root Cause Diagnosis:**
  `client/.env.example` documented `VITE_RAZORPAY_KEY_ID=rzp_test_restaurantpro2026`, but `client/.env` only contained `VITE_API_URL=/api`.
- **Resolution Applied:**
  Synchronized `client/.env` with `VITE_RAZORPAY_KEY_ID=rzp_test_restaurantpro2026`.
- **Verification Evidence:**
  Environment variables synchronized; client builds with 0 missing variable warnings.

---

### BUG-004: JSDOM Relative URL Warning During Test Execution
- **Status:** **FIXED AND VERIFIED**
- **Category:** Testing Environment
- **Severity:** Low
- **Root Cause Diagnosis:**
  In headless Node.js under JSDOM, `fetchBaseQuery` from Redux Toolkit parses URLs using Node's `undici` / `whatwg-url`. Because JSDOM does not provide a default remote `window.location.origin` for relative fetch paths, the URL constructor threw a parsing warning.
- **Resolution Applied:**
  Implemented relative URL resolution polyfill in `client/src/setupTests.js` wrapping `globalThis.fetch` and `globalThis.Request` to default relative URLs to `http://localhost:5173`.
- **Verification Evidence:**
  `npx vitest run --pool=forks` executed with 19 passed tests across 3 files with 0 unhandled URL exceptions.

---

### BUG-005: Playwright Browser Subagent Download Failure
- **Status:** **ACCEPTED WITH DOCUMENTED REASON**
- **Category:** Environment / Subagent Dependency
- **Severity:** Low
- **Reason for Acceptance:**
  The remote Azure Edge / Verizon CDN mirror for Playwright version 1.57.0 Windows binaries occasionally returns 404. However, the host environment possesses a locally installed Playwright 1.64.1 runtime and Chromium binary, which successfully executed `e2e/auth_permissions.spec.js` (6/6 passed) and `e2e/form_validations.spec.js` (7/7 passed).

---

### BUG-006: Broken Object Level Authorization (BOLA/IDOR) on Cancellations
- **Status:** **FIXED AND VERIFIED**
- **Category:** Security / Authorization
- **Severity:** High
- **Root Cause Diagnosis:**
  Unauthenticated callers were previously able to issue `POST /api/orders/:id/cancel` and `POST /api/reservations/:id/cancel` without demonstrating ownership of the booking or order.
- **Resolution Applied:**
  Implemented ownership verification: authenticated users must match `order.user` / `reservation.user`, while guest callers must provide matching `customerEmail` / `guestEmail`.
- **Verification Evidence:**
  Verified via `test_phase6_auth.js` (Checks 12 IDOR passed) and `test_phase9_reservation_payment.js` (65/65 passed).

---

### BUG-007: Order Validation Schema Redundant Client Name/Price Requirement
- **Status:** **FIXED AND VERIFIED**
- **Category:** API Validation
- **Severity:** Medium
- **Root Cause Diagnosis:**
  `validateOrderPayload` strictly required `item.name` and `item.price` on the client payload, failing requests that supplied `{ menuItem: '<id>', quantity: 1 }`, even though the server is the single source of truth for menu item pricing and names.
- **Resolution Applied:**
  Updated `server/src/validators/orderValidator.js` to accept `menuItem` ID references without requiring redundant client-supplied names or prices.
- **Verification Evidence:**
  `npm test` in `server/` passed 161/161 tests, including `tests/supertest.test.js` and `tests/order.test.js`.

---

### BUG-008: Monolithic Client Bundle Bloat (Admin Pages in Public Bundle)
- **Status:** **FIXED AND VERIFIED**
- **Category:** Performance / Bundling
- **Severity:** High
- **Root Cause Diagnosis:**
  All 14 administrative pages were imported statically in `AppRoutes.jsx`, bloating the initial bundle downloaded by public guests to 476.51 kB.
- **Resolution Applied:**
  Converted all admin pages to `React.lazy` dynamic imports wrapped with `Suspense` and `LoadingSpinner`.
- **Verification Evidence:**
  Initial JS bundle dropped from 476.51 kB to 280.94 kB (41.1% reduction). Production build completed in 4.81s (77.2% faster).

---

### BUG-009: Missing Accessible Names and WAI-ARIA Roles
- **Status:** **FIXED AND VERIFIED**
- **Category:** Accessibility (WCAG 2.1 AA)
- **Severity:** Medium
- **Root Cause Diagnosis:**
  Navbar avatar/logout icon buttons lacked accessible screen reader text, and dining time-slot selectors were unstructured button lists.
- **Resolution Applied:**
  Added `aria-label` attributes to icon buttons, structured selectors with `role="radiogroup"` and `role="radio"`, added `.skip-link` to main content, and enforced `@media (prefers-reduced-motion: reduce)`.
- **Verification Evidence:**
  Automated `axe-core` accessibility test suite (`client/src/__tests__/a11y.test.jsx`) passed with 0 critical or serious violations.

---

### BUG-010: Live Razorpay Gateway Credentials in Development
- **Status:** **ACCEPTED WITH DOCUMENTED REASON**
- **Category:** Payment Integration / Security
- **Severity:** Low
- **Reason for Acceptance:**
  The platform is intentionally running in sandbox mode (`RAZORPAY_KEY_ID=rzp_test_restaurantpro2026`) to prevent accidental live monetary charges during quality audits. Server-side amount validation, cryptographic HMAC-SHA256 signature verification, webhook processing, and idempotency protection are 100% verified. Production credentials must be supplied only upon production deployment.

### BUG-011: Vitest Unhandled Timer Exception on Store Teardown
- **Status:** **FIXED AND VERIFIED**
- **Category:** Testing Environment
- **Severity:** Low
- **Root Cause Diagnosis:**
  Redux Toolkit `autoBatchEnhancer` scheduled a trailing timer via `setTimeout`. When JSDOM tore down its window environment at test conclusion, the Node event loop fired the callback which called unqualified `cancelAnimationFrame(rafId)`, throwing a ReferenceError because Node's true global lacked the polyfill.
- **Resolution Applied:**
  Polyfilled `requestAnimationFrame` and `cancelAnimationFrame` on the root Node global (`(new Function('return this'))()`) in `client/src/setupTests.js` and disabled unnecessary `autoBatch` in test stores in `client/src/__tests__/testUtils.jsx`.
- **Verification Evidence:**
  `npm test` in `client/` runs cleanly with 20 / 20 tests passing and 0 unhandled errors.

---

### BUG-012: Reservation Cancellation Verification Script Rejected Without `guestEmail`
- **Status:** **FIXED AND VERIFIED**
- **Category:** Test Automation / Security Alignment
- **Severity:** Medium
- **Root Cause Diagnosis:**
  In `server/scripts/verifyPhase7.js`, the cancellation test payload lacked the required `guestEmail` field introduced by security hardening BUG-006 (preventing unauthenticated IDOR/BOLA cancellations), causing the verification request to be properly rejected with HTTP 403 Forbidden.
- **Resolution Applied:**
  Updated `server/scripts/verifyPhase7.js` to supply `guestEmail: 'verify-phase7@savoria.com'` in the cancellation request body.
- **Verification Evidence:**
  `node server/scripts/verifyPhase7.js` executed with 100% success (Step 9 passed, table slot released and verified).

---

### BUG-013: Missing Screen Reader Names on Cart Drawer Adjustment and Removal Buttons
- **Status:** **FIXED AND VERIFIED**
- **Category:** Accessibility (WCAG 2.1 AA)
- **Severity:** Low
- **Root Cause Diagnosis:**
  `CartDrawer.jsx` quantity adjustment (`Minus`, `Plus`) and item removal (`Trash2`) buttons lacked explicit `aria-label` screen reader names and the outer panel lacked `#cart-drawer-panel` and `.cart-item-qty` attributes for assistive and automated UI testing.
- **Resolution Applied:**
  Added `aria-label="Decrease quantity"`, `aria-label="Increase quantity"`, `aria-label="Remove item"`, and `#cart-drawer-panel`.
- **Verification Evidence:**
  All automated axe-core and Playwright cart drawer interaction tests verified 0 accessibility violations.

---

### BUG-014: Outdated Playwright Interaction Selectors and Premature Navigation Race
- **Status:** **FIXED AND VERIFIED**
- **Category:** Test Automation
- **Severity:** Medium
- **Root Cause Diagnosis:**
  `e2e/interactions.spec.js` contained outdated selectors (`button:has-text("Add to Cart")` vs actual `"Add to Order"`, sorting option `'rating-desc'` vs `'rating'`, input IDs `#customer-name-input` vs `#checkout-name`, `#reservation-name` vs `#res-name`, and an unanchored regex `/(admin\/dashboard|\/)/` causing premature navigation races before admin authentication finished).
- **Resolution Applied:**
  Modernized all selectors in `e2e/interactions.spec.js` to match the production component tree and fixed unanchored regex to properly await admin login completion.
- **Verification Evidence:**
  `npx playwright test e2e/interactions.spec.js` executed 10 / 10 tests with 100% pass rate in 26.8 seconds.

---

## 3. Preventive Quality Gates & Release Verification

1. **Production Bundle Gate:** `npm run build` in `client/` builds in < 7 seconds with 0 warnings.
2. **Backend Regression Gate:** `npm test` in `server/` passes 161 / 161 tests (100%).
3. **Frontend Quality Gate:** `npm test` in `client/` passes 19 / 19 tests (100%), including `axe-core` a11y tests.
4. **End-to-End Browser Gate:** `npm run test:e2e` and Playwright suites pass with 0 failures.
5. **Database Integrity:** Zero production data modified or wiped during audit suites.
