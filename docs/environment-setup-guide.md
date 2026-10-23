# 🌐 RestaurantPro Environment Setup & Configuration Guide

This guide details all environment configurations, service integrations, and runtime variables required to operate RestaurantPro in development and production.

---

## 1. Prerequisites & External Services

| Service | Purpose | Recommended Tier | Setup Link |
|---|---|---|---|
| **Node.js** | Server & Client Runtime | v18.x or v20.x LTS | [nodejs.org](https://nodejs.org/) |
| **MongoDB Atlas** | Managed MongoDB Cloud Database | M0 Free or M10+ Dedicated | [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas) |
| **Render** | Express REST API Web Service | Individual / Team Web Service | [render.com](https://render.com/) |
| **Vercel** | React Vite Frontend CDN & SPA Hosting | Hobby / Pro | [vercel.com](https://vercel.com/) |
| **Cloudinary** | Dish image hosting, compression & CDN | Free Tier (25 Credits) | [cloudinary.com](https://cloudinary.com/) |
| **Razorpay** | Online Payment Gateway (UPI, Cards, Netbanking) | Sandbox Test Mode / Activated Live | [razorpay.com](https://razorpay.com/) |
| **SMTP / SendGrid** | Transactional email notifications | Free Tier (SendGrid, Mailgun, Brevo) | [sendgrid.com](https://sendgrid.com/) |

---

## 2. Server Environment Variables (`server/.env`)

| Variable | Required in Prod? | Default / Example Value | Description |
|---|:---:|---|---|
| `PORT` | Yes | `5000` (Local) / `10000` (Render) | Port where Express API listens. |
| `NODE_ENV` | Yes | `production` | Enforces production optimizations, hides error stacks, enables secure cookies. |
| `MONGODB_URI` | Yes | `mongodb+srv://<user>:<pwd>@cluster0.mongodb.net/restaurantpro?retryWrites=true&w=majority` | Connection string to MongoDB Atlas. |
| `CLIENT_URL` | Yes | `https://restaurantpro.vercel.app` | Primary frontend origin for CORS and cookies. |
| `ALLOWED_ORIGINS` | Yes | `https://restaurantpro.vercel.app,https://yourdomain.com` | Comma-separated list of allowed origins. |
| `COOKIE_SAME_SITE` | Yes | `none` (Cross-domain) / `lax` (Same-domain) | Set to `none` when frontend is on Vercel and backend is on Render. |
| `RATE_LIMIT_WINDOW_MS`| No | `900000` (15 minutes) | Rate limiting evaluation window in milliseconds. |
| `RATE_LIMIT_MAX` | No | `300` | Maximum requests per IP per window. |
| `JWT_SECRET` | Yes | `64+ char random hex string` | Base cryptographic secret for signing JSON Web Tokens. |
| `JWT_ACCESS_SECRET` | Yes | `64+ char random hex string` | Secret for short-lived access tokens (15m). |
| `JWT_REFRESH_SECRET` | Yes | `64+ char random hex string` | Secret for rotating refresh tokens (7d). |
| `RAZORPAY_KEY_ID` | Yes | `rzp_live_...` or `rzp_test_...` | Public Key ID from Razorpay Dashboard. |
| `RAZORPAY_KEY_SECRET` | Yes | `<secret_key>` | Secret key for signing Razorpay order payloads. |
| `RAZORPAY_WEBHOOK_SECRET`| Yes | `<webhook_secret>` | Secret configured on Razorpay Webhook endpoint. |
| `RAZORPAY_CURRENCY` | No | `INR` | Default transaction currency. |
| `CLOUDINARY_CLOUD_NAME`| Yes | `your-cloud-name` | Cloudinary account cloud identifier. |
| `CLOUDINARY_API_KEY` | Yes | `123456789012345` | API Key from Cloudinary Dashboard. |
| `CLOUDINARY_API_SECRET`| Yes | `<secret>` | API Secret from Cloudinary Dashboard. |
| `EMAIL_DEV_MODE` | Yes | `false` | When `false`, sends real emails via SMTP provider. |
| `SMTP_HOST` | Yes | `smtp.sendgrid.net` | Outgoing SMTP server hostname. |
| `SMTP_PORT` | Yes | `587` | Outgoing SMTP server TLS port. |
| `SMTP_USER` | Yes | `apikey` | SMTP username or API key. |
| `SMTP_PASS` | Yes | `<smtp_password_or_token>` | SMTP password or token. |
| `EMAIL_FROM` | Yes | `SAVORIA Haute Cuisine <concierge@savoria.com>` | Verified sender email address. |
| `SENTRY_DSN` | No | `https://...@sentry.io/...` | Optional DSN for exception tracking. |
| `LOG_LEVEL` | No | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`). |

---

## 3. Client Environment Variables (`client/.env`)

| Variable | Required in Prod? | Production Value (Vercel) | Description |
|---|:---:|---|---|
| `VITE_API_URL` | Yes | `https://restaurantpro-api.onrender.com/api` | Base URL of the deployed Express backend. |
| `VITE_RAZORPAY_KEY_ID`| Yes | `rzp_live_...` or `rzp_test_...` | Public Razorpay Key ID used by the client checkout modal. Must match server. |

---

## 4. Local Development Initialization

To initialize and run RestaurantPro locally:

```bash
# 1. Clone repository
git clone https://github.com/your-username/restaurantpro.git
cd restaurantpro

# 2. Install dependencies across root, server, and client
npm run setup

# 3. Create .env files from templates
cp server/.env.example server/.env
cp client/.env.example client/.env

# 4. Seed database with development models and demo accounts
npm run seed

# 5. Start concurrent development servers
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000`
- **API Health Check:** `http://localhost:5000/api/health`
