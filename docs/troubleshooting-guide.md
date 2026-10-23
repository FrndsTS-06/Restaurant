# 🛠️ RestaurantPro Production Troubleshooting Runbook

This guide covers diagnostic procedures, root cause analysis, and immediate remediation steps for common operational issues in production.

---

## 1. Quick Diagnostic Checklist

When investigating an incident, start with these four checks:

1. **Check Backend Health:**
   ```bash
   curl -I https://<your-render-api>/api/health
   ```
   *Expected:* HTTP 200 with `status: "ok"` and `database.connected: true`.
2. **Inspect Structured Server Logs:**
   - On Render Dashboard, view **Logs**. Look for JSON log entries with `level: "error"`.
3. **Inspect Client Console & Network Tab:**
   - Open browser DevTools (F12) → **Console** and **Network** tabs to inspect failing requests and headers.
4. **Inspect MongoDB Atlas Metrics:**
   - Atlas Dashboard → **Metrics** → CPU, Memory, and Connections.

---

## 2. Common Issues & Remediation

### 🚨 Issue 1: CORS Policy Error
- **Symptom:** Browser console reports: `Access to fetch at 'https://...onrender.com/api/...' from origin 'https://...vercel.app' has been blocked by CORS policy`.
- **Root Cause:** The `CLIENT_URL` or `ALLOWED_ORIGINS` variable on Render does not match the frontend domain (or has trailing slash mismatch).
- **Remediation:**
  1. In Render Dashboard → Environment Variables.
  2. Set `CLIENT_URL` to exact frontend domain: `https://restaurantpro.vercel.app`.
  3. Set `ALLOWED_ORIGINS` to `https://restaurantpro.vercel.app,http://localhost:5173`.
  4. Redeploy the service.

---

### 🚨 Issue 2: Customer / Admin Logged Out on Page Refresh (Dropped Cookies)
- **Symptom:** User logs in successfully, but refreshing the page or navigating routes reverts to unauthenticated state.
- **Root Cause:** Browsers reject cross-site cookies if `SameSite` is `Lax` or `Strict` when frontend (`vercel.app`) and backend (`onrender.com`) are on different domains.
- **Remediation:**
  1. On Render backend, ensure `COOKIE_SAME_SITE=none`.
  2. Ensure `NODE_ENV=production` so `secure: true` is enforced (browsers require HTTPS when `SameSite=None`).
  3. Note: RestaurantPro also maintains fallback local tokens in `localStorage` which automatically recover sessions if cookies are blocked by third-party tracking settings.

---

### 🚨 Issue 3: MongoDB Atlas Connection Timeout (`MongooseServerSelectionError`)
- **Symptom:** Render server fails to start with `MongooseServerSelectionError: connection timed out` or `/api/health` returns HTTP 503.
- **Root Cause:** Render outbound IP is not permitted in MongoDB Atlas Network Access whitelist.
- **Remediation:**
  1. Log into MongoDB Atlas Dashboard.
  2. Navigate to **Security → Network Access**.
  3. Add IP entry: `0.0.0.0/0` (Allow access from anywhere).
  4. Ensure your database username and password in `MONGODB_URI` do not contain unencoded special characters (e.g. `@`, `:`, `#` must be URL-encoded).

---

### 🚨 Issue 4: Razorpay Webhook Returns 400 Signature Verification Failed
- **Symptom:** Razorpay webhook calls fail with 400 Bad Request.
- **Root Cause:** Raw request body was altered by JSON body parsing or `RAZORPAY_WEBHOOK_SECRET` mismatch.
- **Remediation:**
  1. RestaurantPro's `app.js` is already configured with `verify: (req, res, buf) => { req.rawBody = buf; }` to capture untampered raw bytes.
  2. Confirm `RAZORPAY_WEBHOOK_SECRET` in Render environment matches the secret in Razorpay Dashboard → Webhooks.

---

### 🚨 Issue 5: Vercel 404 Error on Direct Route Access
- **Symptom:** Directly opening `https://<vercel-domain>/menu` or refreshing `/admin` shows 404 Not Found.
- **Root Cause:** Static web server attempts to find `/menu/index.html` file on disk instead of delegating to React Router.
- **Remediation:**
  - Verify that [client/vercel.json](file:///d:/restaurant/client/vercel.json) exists in your repository with rewrites routing `/(.*)` to `/index.html`.

---

### 🚨 Issue 6: 429 Too Many Requests Lockout
- **Symptom:** User receives `{ "success": false, "message": "Too many authentication attempts..." }`.
- **Root Cause:** Rate limiter triggered after >10 failed login attempts within 15 minutes.
- **Remediation:**
  - Wait 15 minutes for the window to expire.
  - In staging/load test environments, increase `RATE_LIMIT_MAX` or set `NODE_ENV=test`.

---

### 🚨 Issue 7: Render Free Tier Cold Starts
- **Symptom:** First request after inactivity takes 30-50 seconds to respond.
- **Root Cause:** Render free web services spin down containers after 15 minutes of idle time.
- **Remediation:**
  - For production, upgrade the Render web service to the Starter plan ($7/mo) for persistent uptime.
  - Or configure a free health ping monitor (e.g., UptimeRobot) pinging `https://<api>/api/health` every 10 minutes.
