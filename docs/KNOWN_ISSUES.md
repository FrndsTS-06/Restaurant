# RestaurantPro — Known Issues & Operational Considerations

**Document Version:** 1.0.0 (Phase 12 Release Audit)  
**Last Updated:** October 16, 2026  
**Auditor:** Quality Assurance Lead & DevOps Release Manager  

This document logs all identified edge cases, third-party provider constraints, sandbox limitations, and operational considerations for the RestaurantPro / Savoria Haute Cuisine platform.

---

## 1. Summary of Known Operational Constraints

| Issue Reference | Category | Impact Level | Status | Workaround / Operational Note |
| :--- | :--- | :--- | :--- | :--- |
| **KI-001** | Payment Integration | Low (Sandbox) | **ACCEPTED WITH DOCUMENTED REASON** | Development environment uses Razorpay sandbox test keys; live cards will be declined until production keys are configured. |
| **KI-002** | Automated Testing | Low | **ACCEPTED WITH DOCUMENTED REASON** | Playwright Windows CDN download mirror occasionally returns 404; testing relies on host-installed Playwright runtime and native Node.js test runners. |
| **KI-003** | Email Delivery | Low (Dev Mode) | **ACCEPTED WITH DOCUMENTED REASON** | Transactional emails in local development are safely buffered to the in-memory outbox (`Notification` model) to avoid spamming real SMTP relays. |
| **KI-004** | Image Hosting Fallback | Low | **MITIGATED** | Remote culinary imagery utilizes Unsplash CDN fallbacks with local placeholder fallbacks if third-party CDNs experience downtime. |

---

## 2. Detailed Issue Descriptions & Guidance

### KI-001: Sandbox Payment Gateway Configuration
- **Description:**
  The platform's payment subsystem is currently wired to the Razorpay Sandbox (`RAZORPAY_KEY_ID=rzp_test_restaurantpro2026`). In this mode, real credit card transactions will fail with gateway validation errors.
- **Operational Impact:**
  Safe testing of order checkout, cryptographic signature verification, webhooks, and retry logic is supported using Razorpay test card numbers. Real monetary collection cannot take place until live merchant keys are provisioned.
- **Action Required for Production Release:**
  Update `server/.env` and `client/.env` with production credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`) issued by the merchant acquiring bank.

---

### KI-002: Remote Playwright Binary CDN Download Mirror Mirroring
- **Description:**
  When invoking headless browser subagents on Windows systems, the remote CDN (`playwright.azureedge.net`) sometimes responds with HTTP 404 for certain patch versions of Windows binaries.
- **Operational Impact:**
  Zero impact on production or local browser execution. Automated E2E verification is executed using the locally installed Playwright 1.64.1 Chromium binary, native Node.js test runners, and Vitest jsdom.

---

### KI-003: Transactional Email Delivery in Local Sandbox
- **Description:**
  To prevent unexpected SMTP connection failures or rate limits when running high-volume integration test suites, the backend email utility (`emailService.js`) captures transactional notifications in the MongoDB `Notification` collection when SMTP is unconfigured or in development mode.
- **Operational Impact:**
  Admin users can inspect and trigger retries for captured notifications via the Admin Notifications console (`/admin/notifications`).
- **Action Required for Production Release:**
  Provision valid production SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) in `server/.env`.

---

### KI-004: Remote Asset & CDN Network Resilience
- **Description:**
  Menu and banner images reference curated high-resolution photography hosted on the Unsplash CDN.
- **Operational Impact:**
  If a client device operates completely offline or behind a strict enterprise firewall blocking third-party media CDNs, images may fail to render.
- **Mitigation Implemented:**
  All `<img>` elements implement `decoding="async"`, `loading="lazy"`, explicit bounding dimensions, and accessible `alt` text to ensure zero layout shift (CLS) even if external image requests fail. For enterprise offline deployments, images can be mirrored to Cloudinary or a local static assets directory (`server/public/uploads`).
