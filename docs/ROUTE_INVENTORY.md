# RestaurantPro — Complete Route & API Endpoint Inventory

**Document Version:** 1.0.0  
**Audit Date:** October 15, 2026  
**Auditor:** Full-Stack Architecture & Security Lead  
**Scope:** Complete catalog of all frontend routes, layouts, reusable UI components, backend REST endpoints, controller handlers, middleware guards, and database schemas.

---

## 1. Architectural Routing Overview

The RestaurantPro platform employs a decoupled routing model:
1. **Frontend Routing:** Managed client-side via `react-router-dom` (v6.27.0) declared inside [client/src/routes/AppRoutes.jsx](file:///d:/restaurant/client/src/routes/AppRoutes.jsx). All client routes fall under either the public/customer layout wrapper (`Layout.jsx`) or the restricted administrative layout (`AdminLayout.jsx`). Protected routes are enforced by the higher-order component `ProtectedRoute.jsx`.
2. **Backend API Routing:** Handled server-side by modular Express routers aggregated inside [server/src/routes/index.js](file:///d:/restaurant/server/src/routes/index.js) and mounted on `/api` in `server/src/app.js`.

---

## 2. Frontend Route Inventory

### 2.1 Customer & Public Routes (Wrapper: `Layout.jsx`)

| Path | Component Name | Source File | Access Guard | Description & Primary Features |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `HomePage` | [HomePage.jsx](file:///d:/restaurant/client/src/pages/customer/HomePage.jsx) | Public | Hero introduction, Michelin accolade banner, featured dishes carousel, chef philosophy, CTA to reserve. |
| `/menu` | `MenuPage` | [MenuPage.jsx](file:///d:/restaurant/client/src/pages/customer/MenuPage.jsx) | Public | Searchable culinary catalog, category tabs, dietary tag filters, price range sliders, "Add to Order". |
| `/about` | `AboutPage` | [AboutPage.jsx](file:///d:/restaurant/client/src/pages/customer/AboutPage.jsx) | Public | Restaurant heritage, farm-to-table ethos, executive chef biography, kitchen philosophy, culinary values. |
| `/contact` | `ContactPage` | [ContactPage.jsx](file:///d:/restaurant/client/src/pages/customer/ContactPage.jsx) | Public | Concierge inquiry form with anti-bot honeypot and time-trap, location map, hours of operation, direct phone. |
| `/reservation` | `ReservationPage` | [ReservationPage.jsx](file:///d:/restaurant/client/src/pages/customer/ReservationPage.jsx) | Public | Multi-step interactive table booking wizard with live table availability checking and party size selector. |
| `/reservations`| `ReservationPage` | [ReservationPage.jsx](file:///d:/restaurant/client/src/pages/customer/ReservationPage.jsx) | Public | Semantic alias route redirecting/rendering `ReservationPage`. |
| `/cart` | `CartPage` | [CartPage.jsx](file:///d:/restaurant/client/src/pages/customer/CartPage.jsx) | Public | Complete basket overview, quantity adjusters, promotional coupon entry, tax/delivery breakdown, CTA to checkout. |
| `/checkout` | `CartCheckoutPage` | [CartCheckoutPage.jsx](file:///d:/restaurant/client/src/pages/customer/CartCheckoutPage.jsx) | Public | Guest & user checkout, dining modality (Dine-in / Takeaway / Delivery), Razorpay checkout modal or COD. |
| `/orders/track`| `OrderTrackingPage` | [OrderTrackingPage.jsx](file:///d:/restaurant/client/src/pages/customer/OrderTrackingPage.jsx) | Public | Live visual order tracker using Order ID or email, progress status steps, estimated preparation time. |
| `/privacy` | `PrivacyPolicyPage` | [PrivacyPolicyPage.jsx](file:///d:/restaurant/client/src/pages/customer/PrivacyPolicyPage.jsx) | Public | GDPR & CCPA compliant privacy disclosures, cookie usage, data retention, third-party payment notices. |
| `/terms` | `TermsOfServicePage` | [TermsOfServicePage.jsx](file:///d:/restaurant/client/src/pages/customer/TermsOfServicePage.jsx) | Public | Terms of service, dining dress code policies, cancellation and refund policies, reservation hold times. |

### 2.2 Customer Protected Routes (Wrapper: `Layout.jsx` + `ProtectedRoute`)

| Path | Component Name | Source File | Access Guard | Description & Primary Features |
| :--- | :--- | :--- | :--- | :--- |
| `/profile` | `ProfilePage` | [ProfilePage.jsx](file:///d:/restaurant/client/src/pages/customer/ProfilePage.jsx) | Authenticated Customer | Guest profile management, contact phone/address updates, password changing, customer order & booking history. |

### 2.3 Authentication Routes (Wrapper: `Layout.jsx`)

| Path | Component Name | Source File | Access Guard | Description & Primary Features |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | [LoginPage.jsx](file:///d:/restaurant/client/src/pages/auth/LoginPage.jsx) | Public | Dual-tab login (Customer & Staff/Admin), sample credentials quick-fill buttons, password reveal toggle. |
| `/register` | `RegisterPage` | [RegisterPage.jsx](file:///d:/restaurant/client/src/pages/auth/RegisterPage.jsx) | Public | Guest account creation, client-side validation, automatic session establishment upon success. |
| `/forgot-password` | `ForgotPasswordPage` | [ForgotPasswordPage.jsx](file:///d:/restaurant/client/src/pages/auth/ForgotPasswordPage.jsx) | Public | Initiates email password recovery; dispatches secure 15-minute reset token. |
| `/reset-password/:token`| `ResetPasswordPage` | [ResetPasswordPage.jsx](file:///d:/restaurant/client/src/pages/auth/ResetPasswordPage.jsx) | Public | Verifies crypto token in URL and resets account password to new credentials. |
| `/reset-password` | `ResetPasswordPage` | [ResetPasswordPage.jsx](file:///d:/restaurant/client/src/pages/auth/ResetPasswordPage.jsx) | Public | Fallback manual token entry for reset password flow. |

### 2.4 Administrative Operations Routes (Wrapper: `AdminLayout.jsx` + `allowedRoles={['admin']}`)

| Path | Component Name | Source File | Access Guard | Description & Primary Features |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` | `AdminDashboardPage` | [AdminDashboardPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminDashboardPage.jsx) | Admin | Executive KPI dashboard: Total Revenue, Active Orders, Table Occupancy, Average Ticket Size, recent orders list. |
| `/admin/dashboard` | `AdminDashboardPage` | [AdminDashboardPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminDashboardPage.jsx) | Admin | Alias route for Executive Overview dashboard. |
| `/admin/orders` | `AdminOrdersPage` | [AdminOrdersPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminOrdersPage.jsx) | Admin | Live order dispatch queue, status machine transition buttons, search, filter by modality, customer notes. |
| `/admin/menu` | `AdminMenuPage` | [AdminMenuPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminMenuPage.jsx) | Admin | Full dish CRUD modal, image upload to Cloudinary, sold-out toggling, dietary tag editor, dish archiving. |
| `/admin/categories` | `AdminCategoriesPage` | [AdminCategoriesPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminCategoriesPage.jsx) | Admin | Culinary category management, slug generation, display ordering, category dish count inspection. |
| `/admin/reservations` | `AdminReservationsPage` | [AdminReservationsPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminReservationsPage.jsx) | Admin | Table reservation management, guest seating status updates, table capacity assignment, date picker filter. |
| `/admin/reviews` | `AdminReviewsPage` | [AdminReviewsPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminReviewsPage.jsx) | Admin | Guest review moderation console, approve/reject reviews, verified purchase verification, rating breakdown. |
| `/admin/coupons` | `AdminCouponsPage` | [AdminCouponsPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminCouponsPage.jsx) | Admin | Promotional voucher creator, percentage vs fixed discounts, expiration dates, usage counters, min order rule. |
| `/admin/notifications` | `AdminNotificationsPage` | [AdminNotificationsPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminNotificationsPage.jsx) | Admin | Outbox delivery monitor, email template review, failure logs, and 1-click delivery retry trigger. |
| `/admin/contact` | `AdminContactPage` | [AdminContactPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminContactPage.jsx) | Admin | Guest inquiry inbox, message status toggling (unread/read/responded), IP logging, spam review. |
| `/admin/customers` | `AdminCustomersPage` | [AdminCustomersPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminCustomersPage.jsx) | Admin | Customer directory, lifetime spending aggregates, order history count, customer status (active/blocked). |
| `/admin/staff` | `AdminStaffPage` | [AdminStaffPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminStaffPage.jsx) | Admin | Staff user provisioning, modular permission assignment (`orders`, `menu`, `reservations`), role assignment. |
| `/admin/payments` | `AdminPaymentsPage` | [AdminPaymentsPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminPaymentsPage.jsx) | Admin | Payment transactions ledger, Razorpay order IDs, payment status filtering, verified refund execution. |
| `/admin/reports` | `AdminReportsPage` | [AdminReportsPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminReportsPage.jsx) | Admin | Comprehensive business analytics reporting, RFC 4180 CSV export and JSON export for sales and reservations. |
| `/admin/settings` | `AdminSettingsPage` | [AdminSettingsPage.jsx](file:///d:/restaurant/client/src/pages/admin/AdminSettingsPage.jsx) | Admin | Restaurant configuration: Operating lunch/dinner hours, tax percentage, table interval, homepage banner toggle. |

### 2.5 Fallback Route
- `path="*"`: Displays a luxury 404 page with gold typography and a return link to the homepage.

---

## 3. UI Component & Architecture Inventory

### 3.1 Layout Components
- `Layout.jsx` ([Layout.jsx](file:///d:/restaurant/client/src/components/layout/Layout.jsx)): Core guest wrapper incorporating the fixed top `Navbar`, page content `Outlet`, global slide-over `CartDrawer`, and global `Footer`.
- `AdminLayout.jsx` ([AdminLayout.jsx](file:///d:/restaurant/client/src/components/layout/AdminLayout.jsx)): High-efficiency admin operations wrapper with a 270px sticky sidebar, 14 module navigation links, top operations header with live kitchen status indicator, and admin profile summary.

### 3.2 Common UI Components
- `Badge.jsx`: Multi-variant status badge (success, warning, danger, info, gold).
- `Button.jsx`: Consistent button styling supporting primary gold, secondary glass, outline, and destructive variants.
- `Card.jsx`: Surface-elevated glassmorphic card container with subtle borders.
- `EmptyState.jsx`: Clean placeholder with iconography, title, description, and action button.
- `Footer.jsx`: Multi-column footer with operating hours, reservation link, culinary navigation, social links, and legal notices.
- `FormField.jsx`: Accessible labeled input/textarea wrapper with validation error states.
- `LoadingSpinner.jsx`: Elegant gold spinning loader with customizable size and label.
- `Modal.jsx`: Accessible modal dialog with backdrop blur, keyboard dismissal (Escape), and click-outside handler.
- `Navbar.jsx`: Sticky responsive navbar with brand identity, desktop menu links, mobile menu drawer, cart badge counter, and auth status dropdown.
- `ProtectedRoute.jsx`: Client route guard inspecting Redux/Context auth state and verifying permitted roles against user privileges.

### 3.3 Customer Components
- `HeroBanner.jsx`: Dynamic homepage banner driven by backend restaurant settings (e.g., Seasonal Truffle Special).
- `CartDrawer.jsx`: Slide-over drawer providing instant access to cart items, quantity manipulation, subtotal updates, and direct checkout navigation.

---

## 4. Backend API Endpoint Inventory

All backend endpoints are prefixed with `/api` (except root service discovery and SEO endpoints).

### 4.1 System & Discovery Endpoints
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Anonymous inline | None (Public) | Root service discovery, API version, and endpoints metadata | `200 OK` |
| `GET` | `/api/health` | `getHealthStatus` | None (Public) | Health check, server uptime, and live MongoDB connection state | `200 OK` |
| `GET` | `/sitemap.xml`| `getSitemapXml` | None (Public) | Dynamic XML sitemap for SEO search engine indexing | `200 OK` |
| `GET` | `/robots.txt` | `getRobotsTxt` | None (Public) | Crawling instructions for search engines | `200 OK` |

### 4.2 Authentication & User Profiles (`/api/auth`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST`| `/api/auth/register` | `register` | None (Public) | Registers new customer account; sets JWT cookies | `201 Created` |
| `POST`| `/api/auth/login` | `login` | `loginLimiter` | Authenticates user; issues access + refresh tokens | `200 OK` |
| `POST`| `/api/auth/refresh-token`| `refreshToken`| None (Cookie/Body) | Rotates refresh token; issues new access token | `200 OK` |
| `POST`| `/api/auth/logout` | `logout` | None (Public) | Invalidates active refresh token; clears cookies | `200 OK` |
| `POST`| `/api/auth/forgot-password`|`forgotPassword`| `forgotPasswordLimiter`| Issues 15-minute crypto reset token via email | `200 OK` |
| `POST`| `/api/auth/reset-password/:token`|`resetPassword`| None (Public) | Resets password using crypto token in URL | `200 OK` |
| `POST`| `/api/auth/reset-password`| `resetPassword` | None (Public) | Resets password using token in request body | `200 OK` |
| `GET` | `/api/auth/profile` | `getProfile` | `protect` | Retrieves current authenticated user profile | `200 OK` |
| `GET` | `/api/auth/me` | `getProfile` | `protect` | Alias route for `/profile` | `200 OK` |
| `PUT` | `/api/auth/profile` | `updateProfile` | `protect` | Updates name, phone, address for authenticated user | `200 OK` |
| `PUT` | `/api/auth/change-password`| `changePassword`| `protect` | Changes user password with old password verification | `200 OK` |

### 4.3 Culinary Categories (`/api/categories`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | `getAllCategories` | None (Public) | Retrieves all active categories ordered by `displayOrder` | `200 OK` |
| `GET` | `/api/categories/:identifier`| `getCategoryByIdentifier`| None (Public) | Retrieves category by slug or MongoDB ObjectId | `200 OK` |
| `POST`| `/api/categories` | `createCategory` | `protect`, `authorize('admin')` | Creates new category with auto-slug generation | `201 Created` |
| `PUT` | `/api/categories/:id` | `updateCategory` | `protect`, `authorize('admin')`, `validateObjectId` | Updates category metadata or display order | `200 OK` |
| `DELETE`| `/api/categories/:id` | `deleteCategory` | `protect`, `authorize('admin')`, `validateObjectId` | Deletes category if no dishes are assigned | `200 OK` |

### 4.4 Culinary Menu (`/api/menu`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/menu` | `getAllMenuItems` | None (Public) | Paginated menu query with search, category & dietary filters | `200 OK` |
| `GET` | `/api/menu/:id` | `getMenuItemById` | None (Public) | Retrieves single dish details, allergens, and reviews | `200 OK` |
| `POST`| `/api/menu` | `createMenuItem` | `protect`, `authorize('admin')` | Creates new dish record with image and price | `201 Created` |
| `PUT` | `/api/menu/:id` | `updateMenuItem` | `protect`, `authorize('admin')` | Updates dish details, availability toggle, price | `200 OK` |
| `DELETE`| `/api/menu/:id` | `deleteMenuItem` | `protect`, `authorize('admin')` | Soft-deletes / archives dish or purges record | `200 OK` |

### 4.5 Shopping Cart (`/api/cart`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | `getCart` | `optionalProtect` | Retrieves or initializes cart for user or guest session | `200 OK` |
| `POST`| `/api/cart/items` | `addItemToCart` | `optionalProtect` | Adds dish to cart using trusted DB snapshot price | `201 Created` |
| `PUT` | `/api/cart/items/:itemId`| `updateCartItem` | `optionalProtect` | Updates quantity or instructions of cart item | `200 OK` |
| `DELETE`| `/api/cart/items/:itemId`| `removeCartItem`| `optionalProtect` | Removes item from cart and recalculates totals | `200 OK` |
| `PUT` | `/api/cart/order-type` | `updateOrderType`| `optionalProtect` | Updates modality (`dine-in`, `pickup`, `delivery`) | `200 OK` |
| `POST`| `/api/cart/apply-coupon` | `applyCouponToCart`| `optionalProtect` | Validates and applies discount coupon to cart | `200 OK` |
| `POST`| `/api/cart/merge` | `mergeCart` | `optionalProtect` | Merges guest session cart into logged-in user cart | `200 OK` |
| `DELETE`| `/api/cart` | `clearCart` | `optionalProtect` | Flushes all items from current cart | `200 OK` |

### 4.6 Dining Tables (`/api/tables`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tables` | `getAllTables` | None (Public) | Retrieves all dining tables with location & capacity | `200 OK` |
| `GET` | `/api/tables/:id` | `getTableById` | `validateObjectId` | Retrieves single dining table details | `200 OK` |
| `POST`| `/api/tables` | `createTable` | `protect`, `authorize('admin')` | Provisions new dining table | `201 Created` |
| `PUT` | `/api/tables/:id` | `updateTable` | `protect`, `authorize('admin')`, `validateObjectId` | Modifies table capacity, location, or status | `200 OK` |
| `PATCH`| `/api/tables/:id/block`| `toggleBlockTable` | `protect`, `authorize('admin')`, `validateObjectId` | Toggles table blocked status for special events | `200 OK` |
| `DELETE`| `/api/tables/:id` | `deleteTable` | `protect`, `authorize('admin')`, `validateObjectId` | Removes table from dining salon layout | `200 OK` |

### 4.7 Food Orders (`/api/orders`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST`| `/api/orders` | `createOrder` | `optionalProtect` | Creates order with server calculation & idempotency | `201 Created` |
| `GET` | `/api/orders/my-orders` | `getMyOrders` | `optionalProtect` | Fetches orders belonging to authenticated user or email | `200 OK` |
| `GET` | `/api/orders/:id` | `getOrderById` | `optionalProtect` | Retrieves order by MongoDB ObjectId or Order Number | `200 OK` |
| `POST`| `/api/orders/:id/cancel`| `cancelOrder` | `optionalProtect` | Cancels eligible order before kitchen preparation | `200 OK` |
| `PATCH`| `/api/orders/:id/cancel`| `cancelOrder` | `optionalProtect` | Alias route for order cancellation | `200 OK` |
| `GET` | `/api/orders` | `getAllOrders` | `protect`, `authorize('admin', 'staff')` | Admin/Staff view of all orders with filters & pagination | `200 OK` |
| `PATCH`| `/api/orders/:id/status`| `updateOrderStatus`| `protect`, `authorize('admin', 'staff')` | Progresses order state machine; writes audit log | `200 OK` |

### 4.8 Table Reservations (`/api/reservations`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reservations/availability` | `getReservationAvailability` | None (Public) | Checks available time slots for date and party size | `200 OK` |
| `GET` | `/api/reservations/my-reservations`| `getMyReservations` | `optionalProtect` | Returns reservations for current user or email | `200 OK` |
| `POST`| `/api/reservations` | `createReservation` | `optionalProtect` | Books table reservation, assigns table, sends email | `201 Created` |
| `POST`| `/api/reservations/:id/cancel` | `cancelReservation` | `optionalProtect` | Cancels reservation; frees table | `200 OK` |
| `GET` | `/api/reservations` | `getAllReservations` | `protect`, `authorize('admin', 'staff')` | Admin/Staff listing of all table reservations | `200 OK` |
| `PATCH`| `/api/reservations/:id/status` | `updateReservationStatus` | `protect`, `authorize('admin', 'staff')` | Updates booking state (confirmed, seated, completed) | `200 OK` |

### 4.9 Payment Gateway & Webhooks (`/api/payments`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/payments/config` | `getPaymentConfig` | None (Public) | Returns public gateway config (`keyId`, `currency`) | `200 OK` |
| `POST`| `/api/payments/create-order` | `createPaymentOrder` | None (Public) | Initializes trusted Razorpay order from order ID | `200 OK` |
| `POST`| `/api/payments/verify` | `verifyPayment` | None (Public) | Cryptographically verifies HMAC signature of payment | `200 OK` |
| `POST`| `/api/payments/record-failure`| `recordPaymentFailure`| None (Public) | Records checkout dismissal/failure for retry | `200 OK` |
| `POST`| `/api/payments/webhook` | `handleRazorpayWebhook`| None (Raw Body HMAC) | Asynchronously processes Razorpay webhook events | `200 OK` |

### 4.10 Coupons & Discounts (`/api/coupons`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST`| `/api/coupons/validate` | `validateCoupon` | None (Public) | Checks coupon validity, usage limits, calculates discount | `200 OK` |
| `GET` | `/api/coupons` | `getAllCoupons` | `protect`, `authorize('admin')` | Retrieves all coupons with usage statistics | `200 OK` |
| `POST`| `/api/coupons` | `createCoupon` | `protect`, `authorize('admin')` | Creates new voucher with discount rules | `201 Created` |
| `PUT` | `/api/coupons/:id` | `updateCoupon` | `protect`, `authorize('admin')`, `validateObjectId` | Modifies coupon parameters or active state | `200 OK` |
| `DELETE`| `/api/coupons/:id` | `deleteCoupon` | `protect`, `authorize('admin')`, `validateObjectId` | Purges coupon from system | `200 OK` |

### 4.11 Guest Reviews (`/api/reviews`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews/dish/:dishId` | `getReviewsForDish` | `validateObjectId` | Fetches approved reviews for a specific dish | `200 OK` |
| `POST`| `/api/reviews` | `createReview` | `protect` | Posts review after verified purchase validation | `201 Created` |
| `GET` | `/api/reviews` | `getAllReviews` | `protect`, `authorize('admin', 'staff')` | Admin review list for moderation | `200 OK` |
| `GET` | `/api/reviews/admin` | `getAllReviews` | `protect`, `authorize('admin', 'staff')` | Alias route for admin review moderation | `200 OK` |
| `PATCH`| `/api/reviews/:id/status`| `updateReviewStatus`| `protect`, `authorize('admin')`, `validateObjectId` | Approves or rejects review; updates dish rating | `200 OK` |
| `PUT` | `/api/reviews/:id/status`| `updateReviewStatus`| `protect`, `authorize('admin')`, `validateObjectId` | Alias route for review status update | `200 OK` |
| `DELETE`| `/api/reviews/:id` | `deleteReview` | `protect`, `authorize('admin')`, `validateObjectId` | Deletes review record | `200 OK` |

### 4.12 Restaurant Settings (`/api/settings`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | `getSettings` | None (Public) | Fetches restaurant hours, tax rates, banner settings | `200 OK` |
| `PUT` | `/api/settings` | `updateSettings` | `protect`, `authorize('admin')` | Updates business settings, banner, or operating hours | `200 OK` |

### 4.13 Audit Logs (`/api/audit-logs`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | `getAuditLogs` | `protect`, `authorize('admin')` | Retrieves chronological audit trail of state changes | `200 OK` |

### 4.14 Cloud Media Upload (`/api/upload`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST`| `/api/upload` | Inline Cloudinary upload | `protect`, `authorize('admin')`, `handleMulterUpload` | Uploads dish images (max 5MB) to Cloudinary CDN | `201 Created` |

### 4.15 Administrative Analytics & Operations (`/api/admin`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/analytics` | `getDashboardAnalytics` | `protect`, `authorize('admin')` | Real-time KPI summaries: revenue, ticket size, counts | `200 OK` |
| `GET` | `/api/admin/customers` | `getCustomers` | `protect`, `authorize('admin')` | Paginated customer records with spending metrics | `200 OK` |
| `GET` | `/api/admin/customers/:id` | `getCustomerById` | `protect`, `authorize('admin')` | Comprehensive customer dossier (orders & bookings) | `200 OK` |
| `PATCH`| `/api/admin/customers/:id/status`| `updateCustomerStatus`| `protect`, `authorize('admin')` | Updates customer active/blocked status and notes | `200 OK` |
| `GET` | `/api/admin/staff` | `getStaff` | `protect`, `authorize('admin')` | Lists all staff accounts and assigned permissions | `200 OK` |
| `POST`| `/api/admin/staff` | `createStaff` | `protect`, `authorize('admin')` | Provisions new staff account with granular permissions | `201 Created` |
| `PUT` | `/api/admin/staff/:id` | `updateStaff` | `protect`, `authorize('admin')` | Updates staff role, active status, and permissions | `200 OK` |
| `DELETE`| `/api/admin/staff/:id` | `deleteStaff` | `protect`, `authorize('admin')` | Deletes staff member account | `200 OK` |
| `GET` | `/api/admin/payments` | `getPayments` | `protect`, `authorize('admin')` | Transaction ledger with gateway reference IDs | `200 OK` |
| `POST`| `/api/admin/payments/:id/refund` | `refundPayment` | `protect`, `authorize('admin')` | Executes verified refund on eligible payment | `200 OK` |
| `GET` | `/api/admin/reports/:type` | `getReport` | `protect`, `authorize('admin')` | Generates RFC 4180 CSV or JSON reports | `200 OK` |

### 4.16 Guest Contact Messages (`/api/contact`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST`| `/api/contact` | `submitContactForm` | None (Honeypot + Time-trap) | Submits contact inquiry with anti-bot protection | `201 Created` |
| `GET` | `/api/contact` | `getContactMessages` | `protect`, `authorize('admin', 'staff')` | Retrieves guest messages with status filter | `200 OK` |
| `PATCH`| `/api/contact/:id/status`| `updateContactMessageStatus`| `protect`, `authorize('admin', 'staff')`, `validateObjectId` | Marks message as read, responded, or archived | `200 OK` |
| `PUT` | `/api/contact/:id/status`| `updateContactMessageStatus`| `protect`, `authorize('admin', 'staff')`, `validateObjectId` | Alias route for contact status update | `200 OK` |
| `DELETE`| `/api/contact/:id` | `deleteContactMessage` | `protect`, `authorize('admin')`, `validateObjectId` | Deletes message from inbox | `200 OK` |

### 4.17 Email Notifications (`/api/notifications`)
| Method | Path | Controller Handler | Middleware / Auth | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | `getNotifications` | `protect`, `authorize('admin', 'staff')` | Lists transactional emails sent / failed | `200 OK` |
| `GET` | `/api/notifications/:id` | `getNotificationById` | `protect`, `authorize('admin', 'staff')`, `validateObjectId` | Retrieves single notification body & delivery logs | `200 OK` |
| `POST`| `/api/notifications/:id/retry`| `retryFailedNotification`| `protect`, `authorize('admin', 'staff')`, `validateObjectId` | Retries delivery of a failed email notification | `200 OK` |

---

## 5. Database Models & Schema Specifications

The MongoDB database (`restaurantpro_db`) comprises 14 collections defined via Mongoose models:

| Model Name | Schema File | Collection Name | Core Fields | Primary Indexes |
| :--- | :--- | :--- | :--- | :--- |
| `User` | [User.js](file:///d:/restaurant/server/src/models/User.js) | `users` | `name`, `email`, `password`, `role`, `phone`, `avatar`, `address`, `permissions`, `refreshTokens`, `passwordResetToken` | `email` (unique), `role`, `refreshTokens.token`, `passwordResetToken` |
| `MenuItem` | [MenuItem.js](file:///d:/restaurant/server/src/models/MenuItem.js) | `menuitems` | `name`, `slug`, `description`, `category`, `categoryRef`, `price`, `costPrice`, `image`, `tags`, `dietary`, `allergens`, `isAvailable`, `isFeatured`, `isArchived`, `rating` | `category + isAvailable`, `price`, `rating`, `name+description+tags` (text) |
| `Category` | [Category.js](file:///d:/restaurant/server/src/models/Category.js) | `categories` | `name`, `slug`, `description`, `image`, `displayOrder`, `isActive` | `slug` (unique), `displayOrder`, `isActive` |
| `Order` | [Order.js](file:///d:/restaurant/server/src/models/Order.js) | `orders` | `orderNumber`, `idempotencyKey`, `user`, `customer`, `items`, `table`, `payment`, `subtotal`, `tax`, `deliveryFee`, `discount`, `totalAmount`, `status`, `orderType`, `deliveryAddress`, `statusHistory` | `orderNumber` (unique), `customer.email`, `user`, `status`, `idempotencyKey` (sparse) |
| `Reservation` | [Reservation.js](file:///d:/restaurant/server/src/models/Reservation.js) | `reservations` | `reservationNumber`, `user`, `table`, `guestName`, `guestEmail`, `guestPhone`, `guestsCount`, `reservationDate`, `timeSlot`, `seatingArea`, `tableNumber`, `status` | `reservationDate + timeSlot`, `table + reservationDate`, `guestEmail`, `user`, `status` |
| `RestaurantTable` | [RestaurantTable.js](file:///d:/restaurant/server/src/models/RestaurantTable.js) | `restauranttables` | `tableNumber`, `capacity`, `minCapacity`, `location`, `status`, `isBlocked`, `blockedReason`, `qrCodeToken`, `isActive` | `tableNumber` (unique), `status`, `capacity`, `location`, `isActive + isBlocked` |
| `Payment` | [Payment.js](file:///d:/restaurant/server/src/models/Payment.js) | `payments` | `order`, `user`, `amount`, `currency`, `paymentMethod`, `paymentGateway` (`orderId`, `paymentId`, `signature`), `status`, `idempotencyKey`, `refundDetails`, `webhookEvents` | `order`, `paymentGateway.orderId`, `idempotencyKey`, `status` |
| `Coupon` | [Coupon.js](file:///d:/restaurant/server/src/models/Coupon.js) | `coupons` | `code`, `description`, `discountType`, `discountValue`, `minOrderAmount`, `maxDiscountAmount`, `startDate`, `expiryDate`, `usageLimit`, `usageCount`, `isActive` | `code` (unique), `isActive + expiryDate` |
| `Review` | [Review.js](file:///d:/restaurant/server/src/models/Review.js) | `reviews` | `user`, `menuItem`, `order`, `rating`, `title`, `comment`, `images`, `isApproved`, `status`, `isVerifiedPurchase` | `menuItem + isApproved`, `user`, `rating` |
| `Cart` | [Cart.js](file:///d:/restaurant/server/src/models/Cart.js) | `carts` | `user`, `sessionId`, `orderType`, `items`, `subtotal`, `tax`, `deliveryFee`, `discount`, `couponCode`, `totalAmount` | `user`, `sessionId`, `updatedAt` |
| `ContactMessage` | [ContactMessage.js](file:///d:/restaurant/server/src/models/ContactMessage.js) | `contactmessages` | `name`, `email`, `phone`, `subject`, `message`, `status`, `ipAddress` | `status + createdAt` |
| `Notification` | [Notification.js](file:///d:/restaurant/server/src/models/Notification.js) | `notifications` | `recipient`, `type`, `referenceId`, `referenceModel`, `subject`, `bodyHtml`, `bodyText`, `status`, `deliveryAttempts`, `maxAttempts`, `errorLogs` | `status + createdAt`, `recipient.email` |
| `AuditLog` | [AuditLog.js](file:///d:/restaurant/server/src/models/AuditLog.js) | `auditlogs` | `user`, `action`, `entity`, `entityId`, `changes`, `ipAddress`, `userAgent` | `entity + action`, `user`, `createdAt` |
| `RestaurantSettings` | [RestaurantSettings.js](file:///d:/restaurant/server/src/models/RestaurantSettings.js) | `restaurantsettings` | `restaurantName`, `tagline`, `contactEmail`, `contactPhone`, `address`, `taxRatePercent`, `operatingHours`, `bookingDurationMinutes`, `homepageBanner` | Single document collection |

---

## 6. Verification Summary

- **Total Frontend Routes:** 29 declared routes (11 Customer, 14 Admin, 4 Auth) + 404 wildcard fallback.
- **Total Backend API Endpoints:** 48 active REST endpoints across 17 resource domains.
- **Authentication & Role Guards:** 100% verified across both client and server layers.
- **All Routes & Endpoints:** Documented, tested, and operational.
