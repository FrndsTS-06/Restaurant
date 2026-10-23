# 🛡️ Administrator Bootstrap & Provisioning Guide

This document explains the security architecture, initial provisioning process, and administrative hardening procedures for RestaurantPro.

---

## 1. Security Architecture & Privilege Boundaries

To prevent unauthorized privilege escalation, RestaurantPro implements strict administrative safeguards:
- **Public Registration Barrier:** The public registration endpoint (`POST /api/auth/register`) strictly sets `role: 'customer'`. Any client attempts to supply `role: 'admin'` or `role: 'staff'` in the registration payload are discarded and stripped by validation schemas.
- **Protected Provisioning:** Administrative accounts can only be provisioned via:
  1. The automated CLI database bootstrap script (`npm run seed`).
  2. An authenticated administrative session within the `/admin/staff` dashboard.

---

## 2. Initial Database Seeding

To bootstrap the platform with foundational categories, menu items, dining tables, default business settings, and demo accounts:

```bash
# Run database seed engine
npm run seed
```

### Seeded Credentials
| Role | Email | Initial Password | Permissions |
|---|---|---|---|
| **System Administrator** | `admin@savoria.com` | `Admin@123` | Full access to all platform operations |
| **Kitchen & Floor Staff** | `staff@savoria.com` | `Staff@123` | Order progression, reservations, table statuses |
| **VIP Customer Demo** | `guest@savoria.com` | `Guest@123` | Customer ordering, booking, review eligibility |

---

## 3. Production Hardening Checklist (Immediate Post-Deployment)

Immediately after deploying to production with a fresh MongoDB Atlas instance:

1. **Log in to Admin Dashboard:**
   - Navigate to `https://<your-app-domain>/login`
   - Sign in with `admin@savoria.com` and initial password `Admin@123`.

2. **Update Admin Password:**
   - Navigate to `/profile` or `/admin/settings`.
   - Update password to a strong passphrase (minimum 12 characters, including uppercase, lowercase, numbers, and symbols).

3. **Provision Dedicated Staff Accounts:**
   - Navigate to `/admin/staff`.
   - Create individual accounts for managers, kitchen leads, and floor staff with tailored permissions:
     - `orders:read`, `orders:write` (Kitchen & dispatch staff)
     - `reservations:read`, `reservations:write` (Maître d' and hosts)
     - `menu:read`, `menu:write` (Culinary team)

4. **Deactivate / Remove Test Accounts:**
   - Delete or update credentials for generic test accounts (`guest@savoria.com`, `staff@savoria.com`) to prevent unauthorized access.

---

## 4. Emergency Password Reset & Account Recovery

If the primary administrative account password is lost:

### Method A: Self-Service Email Recovery
1. Navigate to `/forgot-password`.
2. Enter the administrator's email address (`admin@savoria.com`).
3. If SMTP is configured, an expiring 15-minute cryptographically random token will be emailed.
4. Click the link to set a new password.

### Method B: Database CLI Recovery
If email service is down or unconfigured, execute the following script from the server terminal:

```bash
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash('NewStrongPassword@2026', 10);
  await mongoose.connection.collection('users').updateOne(
    { email: 'admin@savoria.com' },
    { \$set: { password: hash } }
  );
  console.log('✅ Admin password updated successfully.');
  process.exit(0);
}
reset();
"
```
