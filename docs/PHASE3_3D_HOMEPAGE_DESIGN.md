# Phase 3 — Premium 3D Animated Restaurant Homepage Specification
**Platform:** SAVORIA Haute Cuisine / RestaurantPro  
**Lead Roles:** Senior UI/UX Designer, Creative Frontend Developer & 3D Web Experience Architect  
**Date:** October 16, 2026  
**Status:** DESIGN & ARCHITECTURAL BLUEPRINT COMPLETE (Ready for Implementation)

---

## 1. Design Direction & Atmospheric Identity

The redesign of the **SAVORIA Haute Cuisine** homepage establishes a benchmark in modern luxury dining experiences. The visual atmosphere blends cinematic mood lighting with interactive 3D craftsmanship, elevating the dining platform from a traditional menu directory to an immersive digital culinary salon.

### Core Aesthetic Pillars
- **Obsidian & Champagne Palette:** Foundation of deep obsidian (`#0b0c10`), charcoal (`#13151b`), and rich velvet black, accented by warm champagne gold (`#e6af5d`), light gold (`#f5cf8e`), and emerald (`#10b981`).
- **Cinematic Chiaroscuro Lighting:** High-contrast dramatic spotlights with soft warm ambient shadows, evoking intimate candlelit fine-dining tables.
- **Editorial Typography:** Classic serif headings in *Playfair Display* paired with clean, highly readable modern grotesque numerals and body text in *Plus Jakarta Sans*.
- **Uncompromising Legibility:** Text layers over 3D canvases utilize multi-stop radial and linear dark gradient backdrops with `backdrop-filter: blur(12px)` to guarantee WCAG AAA contrast under all camera angles.
- **Performance-First Architecture:** 60fps render loop target, zero main-thread blocking, dynamic chunking, automatic WebGL capability fallbacks, and strict adherence to `@media (prefers-reduced-motion: reduce)`.

---

## 2. Complete Homepage Layout Architecture (10 Sections)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. NAVBAR: Sticky Glassmorphism Header (Logo | Links | Cart | CTAs)    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. 3D HERO: "The Gastronomic Reveal"                                   │
│    Left: Editorial Headline, Tasting Badges, "Order Now" & "Reserve"   │
│    Right: Interactive 3D Gourmet Dish / Cloche Atelier with Lighting   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. FEATURED DISHES: Chef’s Autumn Highlights (Prices in INR ₹ + Cart)   │
├────────────────────────────────────────────────────────────────────────┤
│ 4. RESTAURANT STORY: The Savoria Heritage, Chef Moreau & 3-Star Award │
├────────────────────────────────────────────────────────────────────────┤
│ 5. POPULAR CATEGORIES: Starters | Mains | Desserts | Beverages         │
├────────────────────────────────────────────────────────────────────────┤
│ 6. WHY CHOOSE US: Sourcing | Michelin Brigade | Cellar | Hospitality   │
├────────────────────────────────────────────────────────────────────────┤
│ 7. GALLERY: Curated Salon Interiors & Plating Photography              │
├────────────────────────────────────────────────────────────────────────┤
│ 8. TESTIMONIALS: Michelin Inspector & Critical Acclaim                │
├────────────────────────────────────────────────────────────────────────┤
│ 9. FINAL GRAND CTA: "Begin Your Culinary Odyssey" (Book Table / Order) │
├────────────────────────────────────────────────────────────────────────┤
│ 10. FOOTER: Operating Hours, Concierge Contact, Address & Socials      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Section-by-Section Specification

### Section 1: Professional Navigation Bar
- **Positioning:** Sticky top (`top: 0`, `z-index: 50`) with `background: rgba(11, 12, 16, 0.92)` and `backdrop-filter: blur(16px)`.
- **Haute Cuisine Identity:** Procedural gold emblem featuring intersecting cutlery inside an amber gradient shield, flanked by the serif logotype `"SAVORIA"` and subtitle `"HAUTE CUISINE"`.
- **Navigation Links:** `Home` (`/`), `Menu` (`/menu`), `Reservations` (`/reservation`), `About` (`/about`), `Contact` (`/contact`), `Track Order` (`/orders/track`).
- **Action Triggers:**
  - Shopping Cart bag icon with reactive item count badge (opens Cart drawer).
  - High-conversion Primary CTA: `"Order Online"` button with gold gradient.
  - Secondary CTA: `"Reserve Table"` button.
- **Mobile Responsive:** Accessible drawer menu with keyboard escape listener and focus trap.

---

### Section 2: 3D Hero Experience — "The Gastronomic Reveal"

The Hero section combines an asymmetric editorial layout with a WebGL Three.js interactive viewport:

#### Left Column: High-Impact Typography & Conversion Actions
1. **Michelin Seasonal Badge:**
   - Pill badge with golden amber border: `"Season 2026 Autumn Harvest Degustation"`.
2. **Hero Headline:**
   - Heading (H1, *Playfair Display*, 56px desktop / 36px mobile):
     `Epicurean Artistry,`  
     `<span className="gradient-text-gold">Transcendent Dining.</span>`
3. **Curatorial Subtitle:**
   - 18px body in `#94a3b8` (480px max-width):  
     *"Immerse yourself in sensory perfection at Savoria. Under the direction of Chef Alexandre Moreau, we weave wild seasonal harvests into timeless multi-course gastronomy."*
4. **Action Hierarchy:**
   - **Primary CTA:** `"Order Online"` (Navigates to `/menu` with active dish ordering).
   - **Secondary CTA:** `"Reserve a Table"` (Navigates to `/reservation` table booking atelier).
5. **Accolades Banner:**
   - Michelin 3-Star distinction icon.
   - 4.9/5 Guest Satisfaction index.
   - 100% Organic certified sourcing note.

#### Right Column: Interactive 3D Atelier Canvas
- **Viewport Dimensions:** 100% width, 520px height (desktop), 340px height (mobile).
- **Interactive 3D Subject:** Signature **Imperial Silver & Gold Cloche on Obsidian Pedestal with Plated Haute Cuisine**:
  - A handcrafted metallic cloche dome with brushed gold accents, sitting on a beveled dark slate slab.
  - Floating golden micro-particles drifting upwards like ambient dust in a candlelit salon.
  - Soft contact shadows cast onto the pedestal slab using Drei `ContactShadows`.
- **Lighting Setup:**
  - `DirectionalLight` (Warm gold Key light at `[5, 8, 5]`, intensity `1.8`, castShadow: true).
  - `PointLight` (Cool blue-gray Fill light at `[-5, 3, -3]`, intensity `0.6`).
  - `SpotLight` (Focused Gold Rim light at `[0, 10, 0]`, penumbra: `0.8`, intensity `2.2`).
  - `AmbientLight` (Soft charcoal ambient at intensity `0.4`).
- **Interactive Micro-Behaviors:**
  - **Mouse Parallax Tilt:** Moving cursor gently rotates the model by up to ±12 degrees on X/Y axes with smooth spring damping.
  - **Scroll Cam Easing:** Scrolling down rotates the dish slightly clockwise, seamlessly transferring visual momentum into Section 3.
  - **Hover Inspection:** Hovering the 3D canvas gently tilts the dish upward by 5 degrees for closer inspection.

---

### Section 3: Featured Degustation Courses
- **Header:** `"Chef’s Autumn Highlights"` with subtitle *"Curated degustation courses marrying French heritage with sustainable wild harvests."*
- **Live Data:** Consumes `GET /api/menu` directly, filtering for top rated / featured chef specials.
- **Card Elements:**
  - High-definition photography with subtle zoom on hover.
  - Course category chip (`Starters`, `Mains`, `Desserts`).
  - Rating badge (`★ 4.9`).
  - Dish name and detailed ingredient tasting notes.
  - **Price in Indian Rupees:** Formatted consistently using `formatPrice(dish.price)` (e.g. `₹24.50`, `₹68.00`).
  - **"Order Dish" Action:** Adds course directly to customer cart with instant feedback toast.

---

### Section 4: The Savoria Heritage (Restaurant Story)
- **Concept:** An editorial narrative celebrating Chef Alexandre Moreau’s philosophy of ingredient purity.
- **Visual Composition:**
  - Left column: Detailed storytelling covering the brigade's 17:30 evening candlelighting ritual, the 1,400-label subterranean Burgundy cellar, and local biodynamic farming partnerships.
  - Right column: High-resolution dining salon interior image with an overlapping floating glass card celebrating the Michelin 3-Star rating.
- **CTAs:** `"Read Our Full Story"` (`/about`) and `"Reserve Your Table"` (`/reservation`).

---

### Section 5: Repertoire by Course & Discipline (Categories)
- **4 Distinct Cards:**
  1. **Starters:** Artisan crudo, veloutés, and delicate carpaccio.
  2. **Mains:** A5 Wagyu, wild Chilean sea bass, hand-rolled tagliolini.
  3. **Desserts:** Grand cru chocolate sphere, yuzu tarts, Madagascar gelato.
  4. **Beverages:** Small-batch old fashioneds, zero-proof botanicals, vintage wines.
- **Visual Styling:** Rich image tiles with dark gradient overlays, typography transitions, and direct routing to filtered menu (`/menu?category=Mains`).

---

### Section 6: The Savoria Distinction (Why Choose Us)
Four bespoke value proposition cards highlighting operational excellence:
1. **Sustainable Wild Harvests:** Daily line-caught seafood and organic estate truffles.
2. **Michelin Pedigree:** Brigade trained under master culinary craftsmen in Lyon and Tokyo.
3. **Subterranean Wine Cellar:** Rare vintages decanted by master sommeliers.
4. **Tailored Guest Concierge:** Dietary allergen curation and private dining salons.

---

### Section 7: Visual Gastronomic Gallery
- **Masonry Visual Showcase:** 6 curated, ultra-high-resolution photographs:
  - Private dining salons with crystal chandeliers.
  - Chef plating with tweezers and gold leaf accents.
  - Candlelit table settings with bespoke Riedel glassware.
  - Subterranean wine cellar tasting room.
- **Micro-Interaction:** Hover reveals photographer notes and tasting course titles with gentle glassmorphism tags.

---

### Section 8: Critical Acclaim & Testimonials
- Authentic culinary reviews from verified gastronomic publications:
  - **Michelin Guide Inspector (2026):** *"An astonishing triumph of modern culinary poetry. Every course is plated with architectural precision."*
  - **The Epicurean Chronicle (2025):** *"Alexandre Moreau has redefined the dining room experience. The Wagyu Ribeye is perhaps the most accomplished dish in the city."*
  - **International Gastronomy Review (2026):** *"The wine cellar pairing alone justifies the visit. A seamless dance between Burgundies and avant-garde dishes."*
- Star ratings rendered in gold, complete with publication accreditation.

---

### Section 9: Grand Final Call-to-Action
- **Heroic Banner:** Contained within a rounded 32px gold-bordered glass container.
- **Copy:** `"Begin Your Culinary Odyssey"`.
- **Context:** Clarifies that evening degustation reservations are released 30 days in advance.
- **Dual CTAs:**
  - Primary: `"Reserve Your Table Now"` (Calendar icon).
  - Secondary: `"Explore Tasting Menu"` (Arrow icon).

---

### Section 10: Complete Culinary Footer
- **Branding:** Savoria Haute Cuisine logotype and Michelin distinction crest.
- **Service Hours:** Lunch Degustation (`12:00 – 15:30`), Dinner Service (`17:00 – 22:30`), Monday Closed.
- **Physical Coordinates:** 450 Avenue Montaigne, New York, NY 10022.
- **Concierge Contacts:** `concierge@savoria.com`, `+1 (212) 555-0840`.
- **Social Media:** Instagram, Facebook, Twitter with accessible screen-reader titles.
- **Newsletter Subscription:** VIP seasonal truffle festival alert signup with email validation.

---

## 4. 3D Animation Storyboard & Camera Choreography

```
Timeline (Seconds)
0.0s ─────── 0.6s ─────── 1.2s ─────── 1.8s ─────── 2.4s ─────── Continuous
 │             │            │            │            │             │
[Load Canvas]  │            │            │            │             │
               ▼            │            │            │             │
          [Camera Dolly]    │            │            │             │
          Z: 6.8 -> 4.4     ▼            │            │             │
                       [Light Ignition]  │            │             │
                       Gold spot 0->2.2  ▼            │             │
                                    [Particles Emerge]│             │
                                    60 gold particles ▼             │
                                                 [Cloche Lift Hint] ▼
                                                 Dome tilts +2°  [Interactive]
                                                                 - Mouse Parallax
                                                                 - Scroll Momentum
```

### Step-by-Step Choreography Details
1. **Scene Initialization (0.0s – 0.6s):**
   - WebGL renderer mounts in background with zero opacity.
   - Canvas alpha is transparent, showing the obsidian gradient backdrop.
2. **Camera Dolly In (0.6s – 1.4s):**
   - Perspective camera (`FOV: 45`) smoothly dollies in from position `[0, 1.2, 6.8]` to `[0, 0.4, 4.4]`.
   - Easing curve: `cubic-bezier(0.16, 1, 0.3, 1)`.
3. **Lighting Ignition (1.0s – 1.8s):**
   - Top golden spotlight fades from `0.0` to `2.2` intensity.
   - Soft contact shadow blooms beneath the pedestal, anchoring the 3D model in physical space.
4. **Golden Dust Particle Ascent (1.4s+):**
   - 60 floating golden particle spheres drift upwards from the pedestal perimeter at varied velocities (0.002 to 0.008 units/frame).
   - Random sine-wave turbulence on X and Z axes mimics warm convection currents from dining candles.
5. **Interactive Parallax State (Continuous):**
   - Window mouse movement creates an interpolated target for the camera:
     $$\text{Cam}_x = \text{Cam}_{x,\text{base}} + (\text{mouse}_x \times 0.35)$$
     $$\text{Cam}_y = \text{Cam}_{y,\text{base}} - (\text{mouse}_y \times 0.20)$$
   - Uses three-pole exponential decay (lerp factor `0.05`) for silky, heavy-damped motion without jitter.
6. **Scroll-Driven Dismissal:**
   - As the user scrolls into Section 3 (Featured Dishes), the 3D dish rotates 30 degrees and translates slightly downward, allowing the text and food cards to gracefully take center stage.
   - When the canvas exits the viewport, an `IntersectionObserver` halts the render loop to conserve 100% of GPU resources.

---

## 5. 3D Asset Requirements & Technical Specifications

| Parameter | Specification | Purpose / Rationale |
| :--- | :--- | :--- |
| **Model Concept** | Imperial Cloche & Haute Cuisine Dish | Signature luxury restaurant visual, instantly conveying fine dining. |
| **File Format** | Binary GLTF (`.glb`) with Draco compression | Single-file binary container, minimal parsing overhead, streaming friendly. |
| **Polygon Budget** | $\le 45,000$ Triangles | Guarantees $\ge 60$ fps on integrated GPUs and mobile devices. |
| **Draw Calls** | $\le 4$ Draw Calls | Highly batched meshes (Base Plate, Cloche Dome, Handle, Dish Details). |
| **PBR Materials** | Standard Metallic/Roughness Workflow | Physically accurate reflections under dynamic Three.js lights. |
| **Base Color Texture** | $1024 \times 1024$ WebP / KTX2 | Crisp resolution for metallic engravings without memory bloat. |
| **Roughness / Metalness** | $1024 \times 1024$ Packed RGBA map | Gold handle: Metalness `0.95`, Roughness `0.18`. Slate: Metalness `0.05`, Roughness `0.85`. |
| **Normal Map** | $1024 \times 1024$ Tangent Space Normal | Micro-details on brushed steel and gourmet garnish without geometry overhead. |
| **Total Asset Size** | $\le 1.8\text{ MB}$ compressed | Instant download over 4G/5G networks. |
| **Procedural Fallback** | Three.js Procedural Lathe/Cylinder Geometry | Zero download instant geometry if external `.glb` fails to load. |

---

## 6. React Component Architecture Plan

```
client/src/components/3d/
├── HeroScene3D.jsx            # Top-level lazy-loaded R3F Canvas container with Suspense
├── ClochePlatterModel.jsx     # 3D Mesh component (GLTF loader + materials + hover logic)
├── GoldDustParticles.jsx      # Instanced Points particle system with turbulence shader
├── StudioLighting.jsx         # Directional, Spot, and Ambient lights + ContactShadows
├── HeroOverlayContent.jsx     # Accessible HTML content layer (Headlines, Badges, CTAs)
└── HeroFallback2D.jsx         # Lightweight photographic fallback (Non-WebGL & reduced-motion)
```

### Component Details:
1. **`HeroScene3D.jsx`:**
   - Wraps the experience in `@react-three/fiber` `<Canvas>`.
   - Manages pixel ratio clamping (`Math.min(window.devicePixelRatio, 2)`).
   - Incorporates `IntersectionObserver` to disable rendering when scrolled out of view.
   - Detects WebGL2 / WebGL1 capability via `<canvas>.getContext()`.
2. **`ClochePlatterModel.jsx`:**
   - Uses Drei's `useGLTF` hook with Suspense preloading.
   - Implements `useFrame` for spring-interpolated rotation and mouse tracking.
   - Handles pointer events (hover state, tilt).
3. **`GoldDustParticles.jsx`:**
   - Uses `THREE.Points` or `THREE.InstancedMesh` with a custom GLSL vertex shader.
   - Recycles particles looping seamlessly within a bounded cylinder.
4. **`HeroOverlayContent.jsx`:**
   - Pure semantic HTML overlaid via CSS absolute positioning (`pointer-events: none`).
   - Interactive buttons (`Order Online`, `Reserve Table`) explicitly enable `pointer-events: auto`.
5. **`HeroFallback2D.jsx`:**
   - High-resolution WebP photograph of the dish with slow CSS ambient pulse.
   - Zero WebGL overhead, rendered when WebGL is absent or user has low-power battery mode.

---

## 7. Performance, Accessibility & Implementation Strategy

### Bundle & Load Optimization Strategy
1. **Code Splitting via Dynamic Import:**
   - `HeroScene3D` is loaded dynamically with `React.lazy(() => import('../components/3d/HeroScene3D'))`.
   - The initial homepage bundle remains small (281 kB) and completely unaffected.
2. **Rollup Manual Chunk Isolation:**
   - Update `client/vite.config.js` to isolate 3D dependencies:
     ```javascript
     manualChunks: {
       vendor: ['react', 'react-dom', 'react-router-dom'],
       redux: ['@reduxjs/toolkit', 'react-redux'],
       icons: ['lucide-react'],
       three: ['three', '@react-three/fiber', '@react-three/drei']
     }
     ```
3. **Hardware Acceleration & GPU Throttling:**
   - `gl.powerPreference = 'high-performance'`.
   - Turn off antialiasing on mobile devices (`antialias: window.innerWidth > 768`).
   - Cap maximum pixel ratio at `1.5` on retina screens to prevent fill-rate bottlenecks.

### Accessibility (a11y) & Reduced Motion Compliance
- **Reduced Motion:** If `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, the camera dolly and continuous rotation are locked, presenting a static, beautifully lit 3D composition.
- **Screen Reader Hierarchy:** The 3D Canvas element has `aria-hidden="true"`, ensuring screen readers exclusively announce the semantic HTML headings and CTAs.
- **Focus Order:** Tab order flows naturally: Skip Link $\to$ Navbar links $\to$ "Order Online" CTA $\to$ "Reserve a Table" CTA $\to$ Featured Dishes.

---

## 8. Summary of Dependencies Required for Phase 4

| Package | Purpose | Expected Added Gzip Size |
| :--- | :--- | :--- |
| `three` | Core 3D engine, geometry, PBR shaders, scene graph | ~140 kB (gzip) |
| `@react-three/fiber` | React declarative renderer for Three.js | ~42 kB (gzip) |
| `@react-three/drei` | Useful camera controls, ContactShadows, useGLTF helpers | ~55 kB (gzip) |

*All 3D libraries will be quarantined in a separate lazy-loaded Rollup chunk, preserving current page load metrics.*

---

**Phase 3 is complete.** All layout specifications, animation storyboards, 3D asset criteria, component plans, and implementation strategies are fully prepared and documented. Awaiting user approval before proceeding to implementation.
