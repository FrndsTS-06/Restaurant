# 🍽️ RestaurantPro — Enterprise Restaurant Management & Online Ordering Platform

[![Automated Tests](https://img.shields.io/badge/tests-187%20passing-brightgreen.svg)](#-automated-testing--quality-assurance)
[![Backend](https://img.shields.io/badge/backend-Express%20%7C%20Node.js%2018%2B-blue.svg)](https://expressjs.com/)
[![Frontend](https://img.shields.io/badge/frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-purple.svg)](https://react.dev/)
[![Database](https://img.shields.io/badge/database-MongoDB%20Atlas%20%7C%20Mongoose-green.svg)](https://www.mongodb.com/)
[![Deployment Target](https://img.shields.io/badge/deploy-Vercel%20%2B%20Render-black.svg)](#-production-deployment-architecture)

**RestaurantPro** is a full-stack, enterprise-grade restaurant management and online food ordering platform. It provides a luxury dining experience for customers (dynamic digital menu, dietary filtering, persistent shopping cart, table reservations, and secure online payments) alongside a comprehensive operations dashboard for staff and administrators (real-time analytics, order dispatching, menu management, customer CRM, review moderation, and RFC 4180 CSV exports).

---

## 🏛️ Production Deployment Architecture

The platform is architected for zero-downtime, scalable cloud hosting:

```
                          ┌────────────────────────┐
                          │   Internet / Visitors  │
                          └───────────┬────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼ (HTTPS / SPA)                                 ▼ (REST API)
   ┌───────────────────────┐                       ┌───────────────────────┐
   │    Vercel Global CDN  │                       │      Render Cloud     │
   │  React 18 + Vite SPA  │─────── API Calls ────>│  Express API Service  │
   │   (Tailwind, Redux)   │                       │    (Trust Proxy,      │
   └───────────────────────┘                       │   Helmet, RateLimit)  │
                                                   └───────────┬───────────┘
                                                               │
                 ┌───────────────────────────┬─────────────────┴─────────────┐
                 │                           │                               │
                 ▼                           ▼                               ▼
      ┌─────────────────────┐     ┌─────────────────────┐         ┌─────────────────────┐
      │    MongoDB Atlas    │     │   Cloudinary CDN    │         │  Razorpay Gateway   │
      │   Cloud Database    │     │ Media & Dish Assets │         │ Sandbox & Webhooks  │
      │  (14 Data Models)   │     │ (Optimized Images)  │         │  (HMAC SHA256)      │
      └─────────────────────┘     └─────────────────────┘         └─────────────────────┘
```

- **Frontend Client:** Hosted on **Vercel** with client-side SPA rewrites (`client/vercel.json`), HTTP/2, and immutable asset caching.
- **Backend API:** Deployed on **Render** with reverse-proxy trust (`trust proxy: 1`), Helmet security headers, multi-origin CORS, and IETF rate limiting.
- **Database:** Hosted on **MongoDB Atlas** with connection pooling, replica sets, and compound indexes.
- **Media Assets:** Managed by **Cloudinary** for image uploads, transforms, and WebP delivery.
- **Payment Processing:** Integrated with **Razorpay** (test sandbox & live) with raw-body webhook signature verification.

---

## ✨ Feature Highlights

### 🍷 Customer Experience
- **Luxury Haute Cuisine Branding:** Warm cream, charcoal, and gold palette with modern typography and responsive layouts for desktop, tablet, and mobile.
- **Dynamic Menu Catalog:** Search, category filters, dietary preferences (Vegan, Vegetarian, Gluten-Free, Halal), price range, and real-time availability badges.
- **Persistent Shopping Cart:** Seamless cart persistence across sessions with guest-to-customer merging and coupon validation (`SAVORIA10`, `CHEF25`).
- **Table Reservation Engine:** Live party size slot querying, operating schedule enforcement, timezone normalization, and concurrency collision locks.
- **Order Tracking:** Real-time progression state machine (`placed` → `confirmed` → `preparing` → `ready` → `delivered`).
- **Secure Online Payments:** Razorpay checkout integration and Cash on Delivery fallback.
- **Verified Order Reviews:** Verified buyers can submit star ratings and testimonials.

### 💼 Operational Management & Administration
- **Real-Time Analytics Dashboard:** Aggregated KPI widgets for today's revenue, active orders, live reservations, popular dishes, and 7-day sales charts.
- **Role-Based Access Control (RBAC):** Hierarchical privileges across `admin`, `staff`, and `customer` roles.
- **Order Dispatch Kanban:** Live status updates with explicit transition validation and terminal state locks.
- **Menu & Category CRUD:** Dish creation, price management, Cloudinary image upload, and soft-archiving.
- **Dining Table Management:** Dining room table configuration, seat capacities, and availability blocking.
- **Customer CRM Dossiers:** Customer profiles, lifetime spend, order history, and concierge notes.
- **Staff Provisioning:** Modular permission assignment for floor and kitchen personnel.
- **RFC 4180 Report Exports:** One-click CSV and JSON exports for sales, orders, reservations, and dish performance.
- **Audit Logging:** Tamper-evident administrative audit trail with actor IP, timestamp, and entity diffs.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite 5, React Router 6, Redux Toolkit, RTK Query, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js 18+, Express 4, Mongoose 8, Helmet, CORS, Cookie-Parser, Express-Rate-Limit |
| **Database** | MongoDB Atlas / Local MongoDB (14 Mongoose Data Models) |
| **Authentication** | JWT Access Tokens (15m) + Rotating Refresh Tokens (7d), Argon2id/Bcrypt, HTTP-only Cookies |
| **Payments** | Razorpay SDK (Order API, Webhook HMAC-SHA256 signature verification) |
| **Media CDN** | Cloudinary API, Multer upload buffer pipeline |
| **Notifications** | Nodemailer with dev outbox mode, SMTP provider integration (SendGrid, SES) |
| **Testing** | Node.js Native Test Runner, Supertest, Vitest, React Testing Library, jsdom |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** running locally on port 27017 or a MongoDB Atlas URI

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/restaurantpro.git
cd restaurantpro

# Install dependencies across root, server, and client
npm run setup
```

### 3. Environment Configuration
```bash
# Server environment
cp server/.env.example server/.env

# Client environment
cp client/.env.example client/.env
```

### 4. Database Seeding & Demo Data
```bash
# Seed all 12 models with realistic menus, tables, orders, and demo accounts
npm run seed
```

### 5. Launch Development Environment
```bash
npm run dev
```
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Default Demo Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@savoria.com` | `Admin@123` | Complete access to `/admin` dashboard, reports, settings, staff |
| **Kitchen / Floor Staff** | `staff@savoria.com` | `Staff@123` | Operational access to orders, reservations, tables, menu |
| **Customer Patron** | `guest@savoria.com` | `Guest@123` | Customer ordering, table booking, profile, order history |

---

## 🧪 Automated Testing & Quality Assurance

RestaurantPro features a multi-tiered test suite with **187 passing automated test cases**:

```bash
# Run all tests (Server integration + Client Vitest)
npm test

# Run backend integration & Supertest suites (161 tests)
npm run test:server

# Run frontend Vitest & React Testing Library suites (14 tests)
npm run test:client

# Run production smoke tests (12 tests)
npm run smoke

# Build optimized production bundle
npm run build
```

---

## 📚 Documentation Suite

Comprehensive deployment, operational, and development guides are located in the [`docs/`](file:///d:/restaurant/docs) directory:

- 📖 [REST API Reference Manual](file:///d:/restaurant/docs/api-documentation.md) — Complete endpoint catalog, request payloads, response schemas, and status codes.
- 🌐 [Environment Setup Guide](file:///d:/restaurant/docs/environment-setup-guide.md) — Variable reference for Local, Vercel, Render, Atlas, Cloudinary, and Razorpay.
- 🛡️ [Administrator Bootstrap & Security Guide](file:///d:/restaurant/docs/admin-bootstrap-instructions.md) — Security boundaries, seed initialization, and password reset procedures.
- 🚀 [Production Deployment Guide](file:///d:/restaurant/docs/deployment-guide.md) — Step-by-step instructions for Vercel, Render, Atlas, DNS, and rollbacks.
- 🛠️ [Troubleshooting Runbook](file:///d:/restaurant/docs/troubleshooting-guide.md) — Diagnostic checklists and solutions for CORS, cookies, database timeouts, and webhooks.
- 📋 [Final Feature & Quality Checklist](file:///d:/restaurant/docs/final-feature-checklist.md) — 12-phase audit report and verification status.

---

## 📜 Available Scripts

| Script | Purpose |
|---|---|
| `npm run setup` | Installs dependencies across root, server, and client. |
| `npm run dev` | Runs both backend and frontend development servers concurrently. |
| `npm run dev:server` | Runs the Express API with nodemon hot reloading. |
| `npm run dev:client` | Runs the Vite frontend development server. |
| `npm run seed` | Seeds MongoDB with complete sample dataset and demo users. |
| `npm run build` | Compiles the client into an optimized production bundle in `client/dist`. |
| `npm start` | Launches the Express server in production mode. |
| `npm test` | Executes both server and client automated test suites. |
| `npm run smoke` | Executes the production smoke test suite against live server endpoints. |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
