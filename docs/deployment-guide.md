# 🚀 RestaurantPro Production Deployment Guide

This guide walks you through deploying RestaurantPro to target cloud infrastructure:
- **Frontend:** React SPA on **Vercel**
- **Backend:** Express API on **Render**
- **Database:** **MongoDB Atlas**
- **Media CDN:** **Cloudinary**
- **Payment Gateway:** **Razorpay**

---

## 1. MongoDB Atlas Setup

1. **Create Cluster:**
   - Log into [cloud.mongodb.com](https://cloud.mongodb.com/).
   - Create a free (M0) or production (M10+) cluster in the same AWS or GCP region as your Render service (e.g., `us-east-1` or `us-west-2` Oregon).

2. **Database User:**
   - Navigate to **Security → Database Access → Add New Database User**.
   - Authentication Method: **Password**.
   - User Privileges: **Read and write to any database**.
   - Generate and securely save a strong password.

3. **Network Access Whitelisting:**
   - Navigate to **Security → Network Access → Add IP Address**.
   - Since Render dynamically allocates outbound IPs on free/starter tiers, add `0.0.0.0/0` (Allow access from anywhere). Authentication is protected by TLS and your database credentials.

4. **Connection String:**
   - Click **Databases → Connect → Drivers (Node.js)**.
   - Copy your connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/restaurantpro_prod?retryWrites=true&w=majority
     ```

5. **Backups & Resilience:**
   - Enable automated daily snapshots in Atlas under **Backup → Cloud Backup Policies**.

---

## 2. Express Backend Deployment on Render

### Method A: Blueprint Deployment (Fastest)
1. Commit the provided [render.yaml](file:///d:/restaurant/render.yaml) to your repository.
2. In Render Dashboard, click **New → Blueprint**.
3. Select your repository. Render will automatically parse the configuration, set the health check path (`/api/health`), and request secret variables.

### Method B: Manual Web Service Setup
1. In Render Dashboard, click **New → Web Service**.
2. Connect your Git repository.
3. Configure settings:
   - **Name:** `restaurantpro-api`
   - **Region:** `Oregon (US West)`
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Health Check Path:** `/api/health`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<your_atlas_connection_string>`
   - `CLIENT_URL`: `https://restaurantpro.vercel.app` (or custom domain)
   - `ALLOWED_ORIGINS`: `https://restaurantpro.vercel.app`
   - `COOKIE_SAME_SITE`: `none`
   - `JWT_SECRET`: `<64_char_random_secret>`
   - `JWT_ACCESS_SECRET`: `<64_char_random_secret>`
   - `JWT_REFRESH_SECRET`: `<64_char_random_secret>`
   - `RAZORPAY_KEY_ID`: `<razorpay_key_id>`
   - `RAZORPAY_KEY_SECRET`: `<razorpay_key_secret>`
   - `RAZORPAY_WEBHOOK_SECRET`: `<webhook_secret>`
   - `CLOUDINARY_CLOUD_NAME`: `<cloud_name>`
   - `CLOUDINARY_API_KEY`: `<api_key>`
   - `CLOUDINARY_API_SECRET`: `<api_secret>`
   - `EMAIL_DEV_MODE`: `false`
   - `SMTP_HOST`: `smtp.sendgrid.net`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `apikey`
   - `SMTP_PASS`: `<sendgrid_api_key>`
   - `EMAIL_FROM`: `SAVORIA Haute Cuisine <concierge@savoria.com>`
5. Click **Create Web Service**.
6. When deployment finishes, verify health check:
   ```bash
   curl https://restaurantpro-api.onrender.com/api/health
   ```

---

## 3. React Frontend Deployment on Vercel

1. Log into [vercel.com](https://vercel.com/) and click **Add New → Project**.
2. Import your Git repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variables:
   - `VITE_API_URL`: `https://restaurantpro-api.onrender.com/api`
   - `VITE_RAZORPAY_KEY_ID`: `<razorpay_key_id>`
5. Click **Deploy**.
6. The included [client/vercel.json](file:///d:/restaurant/client/vercel.json) automatically configures SPA routing rewrites to `/index.html`, eliminating 404s on browser reloads.

---

## 4. Razorpay Webhook Configuration

To ensure payments update order states even if customers close their browser window immediately after payment:

1. Log in to [dashboard.razorpay.com](https://dashboard.razorpay.com/).
2. Navigate to **Settings → Webhooks → Add New Webhook**.
3. **Webhook URL:** `https://restaurantpro-api.onrender.com/api/payments/webhook`
4. **Secret:** Must match `RAZORPAY_WEBHOOK_SECRET` in Render.
5. **Active Events:**
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Click **Save**.

---

## 5. Custom Domain & DNS Configuration

If configuring a custom domain (e.g. `savoria.com`):

### Frontend DNS (Vercel)
| Type | Name | Value | TTL |
|---|---|---|---|
| **A** | `@` | `76.76.21.21` | Automatic |
| **CNAME** | `www` | `cname.vercel-dns.com` | Automatic |

### Backend API DNS (Render)
| Type | Name | Value | TTL |
|---|---|---|---|
| **CNAME** | `api` | `restaurantpro-api.onrender.com` | Automatic |

*When using `api.savoria.com` and `savoria.com`, both frontend and backend share the parent domain, allowing `COOKIE_SAME_SITE=lax` if preferred.*

---

## 6. Rollback Procedures

### Frontend Rollback (Vercel)
1. Go to Vercel Dashboard → Project → **Deployments**.
2. Find the last known healthy deployment.
3. Click the three dots (`...`) → **Rollback to this deployment**.
4. Rollback executes instantly (<10 seconds) with zero downtime.

### Backend Rollback (Render)
1. Go to Render Dashboard → `restaurantpro-api` → **Events**.
2. Select the previous stable commit or trigger **Manual Deploy → Deploy a specific commit**.
3. Render spins up the previous container and performs health check before cutting over traffic.
