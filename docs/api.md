# 📖 RestaurantPro REST API Specification

**Base URL**: `/api`  
**Authentication Scheme**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. System & Health
- `GET /api/health` - Server status, uptime, environment, and detailed MongoDB connectivity state (`status`, `connected`, `host`, `readyState`).

## 2. Authentication & Authorization (`/api/auth`)
- `POST /api/auth/register` - Create customer account (`name`, `email`, `password`, `phone`). Public registration strictly enforces `customer` role to prevent privilege escalation.
- `POST /api/auth/login` - Authenticate customer, staff, or admin (rate-limited: max 10 requests / 15m). Returns short-lived access token (15m), refresh token (7d), and sets HTTP-only cookies (`accessToken`, `refreshToken`).
- `POST /api/auth/refresh-token` - Rotate refresh token and issue fresh access token. The old refresh token is revoked immediately.
- `POST /api/auth/logout` - Invalidate active refresh token in database and clear HTTP-only cookies.
- `POST /api/auth/forgot-password` - Issue a cryptographically secure one-time reset token with 15-minute expiration (rate-limited: max 5 requests / 15m).
- `POST /api/auth/reset-password/:token` - Consume one-time token and set new password. Invalidates all existing refresh tokens for security.
- `GET /api/auth/profile` - `[Protected]` Retrieve authenticated user profile, role, address, and account creation date.
- `PUT /api/auth/profile` - `[Protected]` Update personal details and dining/delivery address.
- `PUT /api/auth/change-password` - `[Protected]` Verify current password and update to new password. Terminates stale device sessions.

## 3. Categories (`/api/categories`)
- `GET /api/categories` - Fetch all active food & beverage categories sorted by display order.
- `GET /api/categories/:identifier` - Fetch category by ObjectId or slug (e.g. `mains`).
- `POST /api/categories` - `[Admin]` Create category (`name`, `description`, `image`, `displayOrder`).
- `PUT /api/categories/:id` - `[Admin]` Update category.
- `DELETE /api/categories/:id` - `[Admin]` Delete category.

## 4. Culinary Menu Items (`/api/menu`)
- `GET /api/menu` - Filtered & paginated menu catalogue:
  - Query parameters:
    - `category` (category name or ObjectId)
    - `dietary` (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Spicy, Halal)
    - `search` (Full-text / regex search across dish name, description, tags)
    - `minPrice` / `maxPrice` (Price range filter)
    - `isFeatured` (`true` / `false`)
    - `isAvailable` (`true` / `false`)
    - `sort` (`price_asc`, `price_desc`, `rating_desc`, `newest`)
    - `page` (default: 1)
    - `limit` (default: 12)
- `GET /api/menu/:id` - Fetch dish details by ObjectId or slug with populated category.
- `POST /api/menu` - `[Admin]` Create menu item (`name`, `description`, `category`, `price`, `costPrice`, `image`, `dietary`, `tags`, `prepTimeMinutes`, `calories`).
- `PUT /api/menu/:id` - `[Admin]` Update menu item.
- `DELETE /api/menu/:id` - `[Admin]` Delete menu item.

## 5. Persistent Cart (`/api/cart`)
- `GET /api/cart` - Retrieve persistent cart for authenticated user or `x-session-id` guest header.
- `POST /api/cart/items` - Add item to cart (`menuItemId`, `quantity`, `specialInstructions`).
- `PUT /api/cart/items/:itemId` - Update quantity or cooking instructions.
- `DELETE /api/cart/items/:itemId` - Remove specific item from cart.
- `POST /api/cart/apply-coupon` - Apply coupon code to cart and recalculate discount.
- `DELETE /api/cart` - Clear entire cart.

## 6. Restaurant Tables (`/api/tables`)
- `GET /api/tables` - List dining tables (filter by `status`, `location`, `minCapacity`).
- `GET /api/tables/:id` - Get table details.
- `POST /api/tables` - `[Admin]` Create new dining table (`tableNumber`, `capacity`, `location`, `status`).
- `PUT /api/tables/:id` - `[Admin]` Update table capacity or status.
- `DELETE /api/tables/:id` - `[Admin]` Remove dining table.

## 7. Customer Orders (`/api/orders`)
- `POST /api/orders` - Place food order (`customer`, `items`, `orderType`, `tableNumber`, `deliveryAddress`, `specialNotes`).
- `GET /api/orders/my-orders` - Fetch orders for customer by email or authenticated JWT.
- `GET /api/orders/:id` - Retrieve order by ObjectId or order number (e.g. `SAV-8491`).
- `GET /api/orders` - `[Admin]` Paginated list of all restaurant orders (filter by `status`, `orderType`).
- `PATCH /api/orders/:id/status` - `[Admin]` Update order status (`pending`, `confirmed`, `preparing`, `ready`, `delivered`, `cancelled`) with note.

## 8. Table Reservations (`/api/reservations`)
- `POST /api/reservations` - Book table (`guestName`, `guestEmail`, `guestPhone`, `guestsCount`, `reservationDate`, `timeSlot`, `seatingArea`, `specialRequests`).
- `GET /api/reservations` - `[Admin]` List reservations with date/status filters & pagination.
- `PATCH /api/reservations/:id/status` - `[Admin]` Update status or assign table.

## 9. Payments & Razorpay (`/api/payments`)
- `POST /api/payments/create-order` - Initialize Razorpay order with amount and currency.
- `POST /api/payments/verify` - Verify payment signature with HMAC SHA256.

## 10. Promotional Coupons (`/api/coupons`)
- `POST /api/coupons/validate` - Validate coupon code (`code`, `orderAmount`).
- `GET /api/coupons` - `[Admin]` List all coupons.
- `POST /api/coupons` - `[Admin]` Create coupon (`code`, `discountType`, `discountValue`, `minOrderAmount`, `expiryDate`, `usageLimit`).
- `PUT /api/coupons/:id` - `[Admin]` Update coupon.
- `DELETE /api/coupons/:id` - `[Admin]` Delete coupon.

## 11. Customer Reviews (`/api/reviews`)
- `GET /api/reviews/dish/:dishId` - Get approved reviews for a dish.
- `POST /api/reviews` - `[Authenticated]` Submit review (`menuItemId`, `rating`, `title`, `comment`).
- `GET /api/reviews` - `[Admin]` View all reviews.
- `PATCH /api/reviews/:id/status` - `[Admin]` Approve or hide review.

## 12. Restaurant Settings (`/api/settings`)
- `GET /api/settings` - Retrieve restaurant profile, hours, tax rate, and policies.
- `PUT /api/settings` - `[Admin]` Update settings.

## 13. Audit Logging (`/api/audit-logs`)
- `GET /api/audit-logs` - `[Admin]` Paginated audit trail of administrative actions.

## 14. Media Uploads (`/api/upload`)
- `POST /api/upload` - `[Admin]` Multipart image upload to Cloudinary.
