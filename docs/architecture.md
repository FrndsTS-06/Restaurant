# System Architecture

## Overview
Savoria is structured as a decoupled full-stack application:

```
[ Client Browser ]
        │  (HTTP / REST / JSON)
        ▼
[ Express Server ] ─── (Mongoose ODM) ───► [ MongoDB Database ]
        │
    Middlewares:
    - CORS & JSON parser
    - Request logging
    - JWT Auth Guard & RBAC
    - Global Error Boundary
```

## Client Layer
- **Framework**: React with Vite
- **Styling**: Vanilla modern CSS design system with CSS custom properties (variables), responsive layout grids, and glassmorphic elevated panels.
- **State Management**: React Context (`CartContext`, `AuthContext`) for lightweight, predictable client-side state with localStorage persistence.
- **Navigation**: Client-side single-page routing using `react-router-dom`.

## Server Layer
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose schemas for validation and relational population.
- **Authentication**: Stateless JSON Web Tokens (JWT) with bcrypt-hashed passwords and role-based access control (`customer`, `admin`).
