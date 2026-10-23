# RestaurantPro — Production Release Checklist

**Document Version:** 1.0.0 (Release Candidate)  
**Target Platform:** RestaurantPro & Savoria Haute Cuisine  
**Release Lead:** QA Release Manager & DevOps Lead  

Use this checklist before and during any production deployment to ensure zero downtime, verified configurations, and operational safety.

---

## 1. Pre-Deployment Verification Gates

- [x] **Frontend Production Build:** Run `npm run build` in `client/`. Ensure build finishes in < 10 seconds with 0 errors.
- [x] **Client Bundle Verification:** Verify initial bundle size is < 300 kB (Current: `280.94 kB`, gzip: `70.31 kB`).
- [x] **Backend Integration Tests:** Run `npm test` in `server/`. All 161 tests must pass (100%).
- [x] **Frontend Unit & A11y Tests:** Run `npm test` in `client/`. All 19 tests must pass with 0 axe-core violations.
- [x] **End-to-End Regression Tests:** Run `npm run test:e2e` and verify Playwright specs pass.
- [x] **Database Migrations / Schema Indexes:** Ensure compound indexes on `MenuItem`, `Order`, `Reservation`, and `Review` are registered.
- [x] **Static Syntax Analysis:** Run `node --check` across all server JS files to confirm 0 parsing errors.
- [x] **Visual Overflow Inspection:** Verify 0 horizontal overflows across mobile (320px–430px) and desktop (1024px–1920px) viewports.

---

## 2. Production Environment Variable Configuration

Ensure the following environment variables are securely provisioned in the production environment (e.g., Render, Railway, AWS, DigitalOcean):

### Backend (`server/.env`):
```dotenv
NODE_ENV=production
PORT=5000
CLIENT_URL=https://savoria-restaurant.com
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/restaurantpro_prod?retryWrites=true&w=majority

# Authentication Security (Generate using `openssl rand -hex 32`)
JWT_SECRET=<64-char-secure-random-hex>
JWT_EXPIRE=15m
REFRESH_TOKEN_SECRET=<64-char-secure-random-hex>
REFRESH_TOKEN_EXPIRE=7d

# Live Razorpay Credentials
RAZORPAY_KEY_ID=rzp_live_<your_live_key_id>
RAZORPAY_KEY_SECRET=<your_live_key_secret>
RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>

# Production SMTP Email Delivery
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your_sendgrid_api_key>
FROM_EMAIL=concierge@savoria-restaurant.com
FROM_NAME=SAVORIA Haute Cuisine

# Cloudinary CDN for Menu Images
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

### Frontend (`client/.env`):
```dotenv
VITE_API_URL=/api
VITE_RAZORPAY_KEY_ID=rzp_live_<your_live_key_id>
```

---

## 3. Database Bootstrap & Seeding

- [ ] **Database Reachability:** Test connection to production MongoDB Atlas instance.
- [ ] **Seed Initial Restaurant Settings & Menu:** If initializing a fresh database, execute:
  ```bash
  npm --prefix server run seed
  ```
- [ ] **Rotate Default Seed Passwords:** Immediately change default passwords for seeded accounts:
  - Admin: `admin@savoria.com` -> Update with a high-entropy passphrase via Admin settings.
  - Staff: `staff@savoria.com` -> Update credentials.

---

## 4. Deployment Execution Steps

1. **Deploy Backend Service:**
   - Deploy Node.js server container/service.
   - Verify health check endpoint:
     ```bash
     curl -s https://api.savoria-restaurant.com/api/health
     ```
   - Must return `status: "ok"` and `database: { connected: true }`.
2. **Deploy Frontend Client:**
   - Deploy Vite static assets to CDN or edge host (Vercel, Netlify, Cloudflare Pages, Nginx).
   - Verify single-page-app rewrite rules (`/*` -> `/index.html`) so refreshing deep routes (`/menu`, `/reservation`, `/admin/*`) does not return 404.
3. **Configure SSL / TLS Certificates:**
   - Enforce HTTPS across all domains with automatic certificate renewal.
   - Confirm Helmet's `Strict-Transport-Security` header is sent.
4. **Configure Payment Webhooks:**
   - In Razorpay Dashboard, add Webhook URL:
     `https://api.savoria-restaurant.com/api/payments/webhook`
   - Select events: `payment.captured`, `payment.failed`, `order.paid`.
   - Set secret matching `RAZORPAY_WEBHOOK_SECRET`.

---

## 5. Post-Deployment Smoke Inspection

- [ ] Visit homepage `https://savoria-restaurant.com`.
- [ ] Verify SSL padlock and responsive rendering on mobile and desktop.
- [ ] Test public menu retrieval and item details modal.
- [ ] Add item to cart, verify subtotal, taxes, and delivery fee calculation.
- [ ] Submit a test reservation and verify confirmation number generation.
- [ ] Log in as admin and verify dashboard analytics graphs load correctly.
- [ ] Check server logs for any uncaught exceptions or unhandled promise rejections.

---

## 6. Rollback Plan

If an unexpected regression is detected post-deployment:
1. **Frontend Rollback:** Instantly redeploy the previous immutable Git release tag / build artifact on the CDN.
2. **Backend Rollback:** Revert container image to previous release tag.
3. **Database Guard:** Database migrations are additive; no breaking schema drops exist between versions.
