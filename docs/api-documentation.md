# 📖 RestaurantPro REST API Reference Manual

**Platform:** RestaurantPro Enterprise Dining & Online Ordering API  
**Base URL:** `https://<api-domain>/api` (or `http://localhost:5000/api` in development)  
**Protocol:** HTTPS with TLS 1.3  
**Content-Type:** `application/json`  
**Authentication:** Bearer JWT in `Authorization: Bearer <access_token>` header or Secure HTTP-only cookies (`accessToken`, `refreshToken`).

---

## 1. Global Standards & Response Architecture

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Standard Paginated Response
```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 10,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [ "Detailed validation issue if applicable" ]
}
```

### Common HTTP Status Codes
| Code | Meaning | Context |
|:---:|:---|:---|
| **200** | OK | Successful GET, PUT, PATCH, DELETE operations |
| **201** | Created | Successful POST creation of resource |
| **400** | Bad Request | Schema validation failure, malformed payload, business constraint error |
| **401** | Unauthorized | Missing, invalid, or expired JWT credentials |
| **403** | Forbidden | Insufficient role or missing permission |
| **404** | Not Found | Target resource does not exist |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Error | Unhandled server exception (stack trace hidden in production) |
| **503** | Service Unavailable | Database disconnected or downstream outage |

---

## 2. Core API Endpoints

### 🩺 System & Service Discovery
- `GET /` — Service metadata, API version, and discovery links.
- `GET /api/health` — Real-time health check reporting database connectivity state, host, and uptime.
- `GET /sitemap.xml` — Dynamically generated XML sitemap for search engines.
- `GET /robots.txt` — Standard crawler directives.

---

### 🔐 Authentication & Session (`/api/auth`)

#### `POST /api/auth/register`
Creates a new customer account. Public registration strictly assigns role `customer`.
- **Body:** `{ "name": "string", "email": "string", "password": "string", "phone": "string" }`
- **Response (201):** User profile, `token`, and `refreshToken`.

#### `POST /api/auth/login`
Authenticates customer, staff, or admin. Rate limited to 10 attempts per 15 minutes.
- **Body:** `{ "email": "string", "password": "string" }`
- **Response (200):** User profile, JWT tokens, and HTTP-only cookies.

#### `POST /api/auth/refresh-token`
Rotates refresh tokens and issues a fresh 15-minute access token.
- **Body:** `{ "refreshToken": "string" }` (or read from cookie).
- **Response (200):** New access token and rotated refresh token.

#### `POST /api/auth/logout`
Invalidates active refresh tokens in database and clears cookies.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200):** `{ "success": true, "message": "Logged out successfully" }`

#### `POST /api/auth/forgot-password`
Generates expiring 15-minute reset token and sends transactional email.
- **Body:** `{ "email": "string" }`
- **Response (200):** `{ "success": true, "message": "Password reset email dispatched" }`

#### `POST /api/auth/reset-password/:token`
Sets new password via one-time token and terminates stale sessions.
- **Body:** `{ "password": "string" }`
- **Response (200):** `{ "success": true, "message": "Password updated successfully" }`

#### `GET /api/auth/profile` *(Protected)*
Fetches authenticated user profile, saved addresses, and role.

#### `PUT /api/auth/profile` *(Protected)*
Updates name, phone, and delivery address.

#### `PUT /api/auth/change-password` *(Protected)*
Verifies current password and updates to new password.

---

### 🍽️ Categories (`/api/categories`)
- `GET /api/categories` — List active categories sorted by display order.
- `GET /api/categories/:id` — Get category details by ID or slug.
- `POST /api/categories` *(Admin)* — Create category (`name`, `description`, `image`, `displayOrder`).
- `PUT /api/categories/:id` *(Admin)* — Update category.
- `DELETE /api/categories/:id` *(Admin)* — Remove category.

---

### 🥗 Culinary Menu Items (`/api/menu`)
- `GET /api/menu` — Paginated and filtered catalog of active dishes.
  - **Query Parameters:**
    - `category`: Category name or ObjectId.
    - `dietary`: Filter by `Vegetarian`, `Vegan`, `Gluten-Free`, `Halal`, `Dairy-Free`.
    - `search`: Keyword search matching name, description, tags.
    - `minPrice` / `maxPrice`: Numerical price boundary.
    - `isFeatured`: `true` / `false`.
    - `isAvailable`: `true` / `false`.
    - `sort`: `price_asc`, `price_desc`, `rating_desc`, `newest`.
    - `page` (default: 1), `limit` (default: 12).
- `GET /api/menu/:id` — Single dish details by ObjectId or slug.
- `POST /api/menu` *(Admin)* — Create dish (`name`, `description`, `category`, `price`, `costPrice`, `image`, `dietary`, `tags`, `prepTimeMinutes`).
- `PUT /api/menu/:id` *(Admin)* — Update dish details, price, or archive state (`isArchived: true`).
- `DELETE /api/menu/:id` *(Admin)* — Delete or soft-archive menu item.

---

### 🛒 Persistent Cart (`/api/cart`)
- `GET /api/cart` — Get cart for authenticated user or guest (`x-session-id` header).
- `POST /api/cart/items` — Add dish (`menuItemId`, `quantity`, `specialInstructions`).
- `PUT /api/cart/items/:itemId` — Update item quantity or cooking instructions.
- `DELETE /api/cart/items/:itemId` — Remove item from cart.
- `POST /api/cart/apply-coupon` — Validate and apply promotional code.
- `DELETE /api/cart` — Clear all items in active cart.

---

### 📦 Customer Orders (`/api/orders`)
- `POST /api/orders` — Place order with delivery address or pickup modality. Calculates trusted prices server-side.
  - **Body:** `{ "customer": { "name", "email", "phone" }, "items": [ { "menuItem", "quantity" } ], "orderType": "delivery" | "pickup", "deliveryAddress": { "street", "city", "state", "zipCode" }, "paymentMethod": "razorpay" | "cash", "couponCode": "string" }`
- `GET /api/orders/my-orders` — List order history for customer.
- `GET /api/orders/:id` — Fetch order details and live preparation tracking by ID or order number (e.g. `SAV-8491`).
- `GET /api/orders` *(Staff / Admin)* — Paginated order list with status and date filters.
- `PATCH /api/orders/:id/status` *(Staff / Admin)* — Progress state machine: `placed` → `confirmed` → `preparing` → `ready` → `delivered` / `completed`. Backwards state updates rejected with HTTP 400.
- `POST /api/orders/:id/cancel` — Cancel eligible order with audit trail.

---

### 🪑 Table Reservations (`/api/reservations`)
- `GET /api/reservations/availability` — Query open time slots for date and party size (`date=YYYY-MM-DD`, `guestsCount=N`).
- `POST /api/reservations` — Book dining table (`guestName`, `guestEmail`, `guestPhone`, `guestsCount`, `reservationDate`, `timeSlot`, `seatingArea`, `specialRequests`). Concurrency locks block double bookings on identical tables.
- `GET /api/reservations/my-reservations` — Customer booking history.
- `POST /api/reservations/:id/cancel` — Customer cancellation of upcoming booking.
- `GET /api/reservations` *(Admin)* — View reservations by date.
- `PATCH /api/reservations/:id/status` *(Admin)* — Update reservation status (`confirmed`, `seated`, `completed`, `cancelled`).

---

### 💳 Payments & Gateways (`/api/payments`)
- `GET /api/payments/config` — Public payment configuration (Razorpay Key ID, test mode indicator).
- `POST /api/payments/create-order` — Create Razorpay order from trusted server-calculated total.
- `POST /api/payments/verify` — Verify Razorpay payment signature via HMAC-SHA256.
- `POST /api/payments/webhook` — Authenticated webhook processor with raw-body signature verification.

---

### 📊 Admin Analytics & Reporting (`/api/admin`)
- `GET /api/admin/analytics` — Executive dashboard metrics (Today's revenue, order counts, active reservations, popular dishes, sales chart).
- `GET /api/admin/customers` — Paginated customer dossiers with lifetime spend and order counts.
- `GET /api/admin/staff` — Staff members and modular permissions list.
- `POST /api/admin/staff` — Provision new staff account.
- `GET /api/admin/reports/:type` — Export sales, orders, reservations, or dishes report in `json` or RFC 4180 `csv` format (`?format=csv`).

---

### ⚙️ Restaurant Configuration & Settings (`/api/settings`)
- `GET /api/settings` — Public restaurant profile, business hours, concierge contact info, and tax rate.
- `PUT /api/settings` *(Admin)* — Update operating schedule, booking duration, buffer times, and homepage banner.
