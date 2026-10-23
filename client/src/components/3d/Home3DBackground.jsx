import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sparkles, Eye, Zap, Layers, Compass, Wine, Utensils } from 'lucide-react';
import * as THREE from 'three';
import { StudioLighting } from './StudioLighting';
import { RestaurantDiningSalon3D } from './RestaurantDiningSalon3D';
import { SignatureDishModel } from './SignatureDishModel';
import { GoldDustParticles } from './GoldDustParticles';
import { HeroFallback2D } from './HeroFallback2D';

/**
 * Cinematic Camera Rig for the Full Homepage 3D Experience.
 * Continuously interpolates camera depth, elevation, and focal perspective as the
 * guest scrolls from the hero banner through menu, story, distinction pillars, and gallery.
 */
const ContinuousHomepageCameraRig = ({
  isMobile,
  scrollProgress = 0,
  isReducedMotion = false,
  activePerspective = 'salon',
  mousePos = { x: 0, y: 0 }
}) => {
  const { camera, size } = useThree();

  useFrame(({ clock }) => {
    if (activePerspective === 'salon') {
      // Base camera depth adapted to viewport width (supports 320px ultra-compact mobile up to 4K displays)
      const baseZ = size.width < 360 ? 6.2 : size.width < 480 ? 5.6 : size.width < 768 ? 5.1 : size.width < 1024 ? 4.6 : 4.2;
      const baseY = size.width < 640 ? 1.6 : 1.7;

      // When reduced motion is preferred, keep camera firmly at tranquil grand vista without per-frame math
      if (isReducedMotion) {
        camera.position.set(0, baseY, baseZ);
        camera.lookAt(0, 1.25, 0);
        return;
      }

      // Scroll-controlled cinematic glide across the entire homepage:
      // - At scroll = 0 (Hero): Grand entrance vista of the Avenue Montaigne portico & chandelier
      // - At scroll = 0.35 (Menu Categories): Glide down aisle towards central candlelit table
      // - At scroll = 0.70 (Story & Cellar): Subtle pan toward subterranean Grand Cru cellar rack
      // - At scroll = 1.0 (Patrons & CTA): Intimate warm perspective near the candlelight
      const scrollDolly = isReducedMotion ? 0 : scrollProgress * 1.6;
      const scrollElevation = isReducedMotion ? 0 : Math.sin(scrollProgress * Math.PI) * 0.45;
      const scrollPanX = isReducedMotion ? 0 : Math.sin(scrollProgress * Math.PI * 1.5) * 0.35;

      const targetZ = baseZ - scrollDolly;
      const targetY = baseY + scrollElevation - (isReducedMotion ? 0 : scrollProgress * 0.4);
      const targetX = scrollPanX;

      // Subtle breathing harmonic idle motion (when motion is enabled)
      const t = clock.getElapsedTime();
      const idleY = isReducedMotion ? 0 : Math.sin(t * 0.4) * 0.04;
      const idleX = isReducedMotion ? 0 : Math.cos(t * 0.3) * 0.03;

      // Mouse parallax tilt
      const parallaxX = isReducedMotion ? 0 : mousePos.x * 0.35;
      const parallaxY = isReducedMotion ? 0 : mousePos.y * 0.22;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX + idleX + parallaxX, 0.045);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + idleY + parallaxY, 0.045);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);

      // Dynamic look-at focal point moving gracefully through the salon
      const lookTargetX = isReducedMotion ? 0 : Math.sin(scrollProgress * Math.PI) * 0.25;
      const lookTargetY = 1.25 - (isReducedMotion ? 0 : scrollProgress * 0.5);
      camera.lookAt(lookTargetX, lookTargetY, 0);
    } else {
      // Signature Dish Closeup Perspective
      const baseZ = size.width < 360 ? 5.6 : size.width < 480 ? 5.2 : size.width < 768 ? 4.9 : 4.5;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mousePos.x * 0.2, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.4 + (mousePos.y * 0.15), 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseZ, 0.05);
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
};

// WebGL Error Boundary to prevent any GPU context failure from disrupting the homepage
class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('Home3DBackground WebGL runtime fallback activated:', error?.message || error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <HeroFallback2D />;
    }
    return this.props.children;
  }
}

// 3D Scene Loading Spinner Overlay
const SceneLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0c10]/90 backdrop-blur-sm z-20 text-center p-6 select-none pointer-events-none">
    <div className="w-10 h-10 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-3 shadow-lg shadow-amber-500/10" />
    <span className="font-serif text-sm font-bold text-amber-300 tracking-wider">
      Illuminating Savoria Dining Sanctuary...
    </span>
    <span className="text-[11px] text-slate-400 mt-1">
      Assembling architectural arches, 3D signage & candlelit salon
    </span>
  </div>
);

// Comprehensive low-performance hardware detection
const checkIsLowPerformanceDevice = () => {
  if (typeof window === 'undefined') return false;

  // 1. Reduced motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  // 2. Low hardware concurrency (<= 2 cores)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    return true;
  }

  // 3. Device RAM < 3 GB
  if (navigator.deviceMemory && navigator.deviceMemory < 3) {
    return true;
  }

  // 4. Data saver mode or 2G slow network
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection && (connection.saveData || connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')) {
    return true;
  }

  // 5. Basic WebGL test
  try {
    const canvas = document.createElement('canvas');
    const gl = window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl'));
    if (!gl) return true;
  } catch (e) {
    return true;
  }

  return false;
};

/**
 * Home3DBackground
 * Reusable full-bleed 3D animated background covering the entire homepage experience.
 * Features:
 * - Fixed background placement behind all page sections (`z-0 pointer-events-none`)
 * - Continuous slow cinematic camera motion responding to page scroll progress
 * - Responsive mouse parallax tilt
 * - Automatic rendering pause when page is hidden (tab switched/minimized)
 * - Automatic pause when 3D Food Modal viewer is active (avoids multi-canvas GPU contention)
 * - Static high-res architectural fallback for low-spec devices or user toggle
 * - Uncompromised WCAG AAA text contrast via obsidian gradient veils
 * - Zero interference with scrolling, clicking, forms, or navigation
 */
export const Home3DBackground = ({ className = '' }) => {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [force2D, setForce2D] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isModalActive, setIsModalActive] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activePerspective, setActivePerspective] = useState('salon'); // 'salon' | 'course'

  // 1. Coordinated WebGL context management: pause rendering when a 3D modal viewer is active
  useEffect(() => {
    const handleModalActive = (e) => {
      setIsModalActive(Boolean(e.detail?.active));
    };
    window.addEventListener('savoria:3d-active-modal', handleModalActive);
    return () => window.removeEventListener('savoria:3d-active-modal', handleModalActive);
  }, []);

  // 2. Hardware Capability, Reduced Motion & Resize Detection
  useEffect(() => {
    if (checkIsLowPerformanceDevice()) {
      try {
        const canvas = document.createElement('canvas');
        const gl = window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl'));
        if (!gl) {
          setHasWebGL(false);
          return;
        }
      } catch (e) {
        setHasWebGL(false);
        return;
      }
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsReducedMotion(true);
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3. Page Visibility API: Pause rendering completely when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 4. Smooth Normalized Scroll Tracking Across Entire Homepage
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
          const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 5. Global Mouse Parallax Tracking
  useEffect(() => {
    if (isReducedMotion) return;
    let ticking = false;
    const handleGlobalMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const x = (e.clientX / window.innerWidth) * 2 - 1;
          const y = -((e.clientY / window.innerHeight) * 2 - 1);
          setMousePos({ x, y });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isReducedMotion]);

  // Graceful degradation for unsupported devices or user 2D override
  if (!hasWebGL || force2D) {
    return (
      <>
        <div className={`fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden ${className}`}>
          <HeroFallback2D fullBleed={true} />
        </div>
        {/* Discrete toggle button with pointer-events-auto and z-40 */}
        {hasWebGL && (
          <div className="fixed bottom-5 right-5 z-40 pointer-events-auto">
            <button
              type="button"
              id="hero-toggle-2d-mode-btn"
              onClick={() => setForce2D(false)}
              className="px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/50 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xl hover:bg-black transition-colors cursor-pointer"
            >
              <Zap size={13} className="text-amber-400" />
              <span>Enable 3D Experience</span>
            </button>
          </div>
        )}
      </>
    );
  }

  // Target DPR to prevent GPU thermal throttling (1.25 on mobile, 1.75 on desktop)
  const targetDpr = isMobile
    ? [1, Math.min(window.devicePixelRatio || 1, 1.25)]
    : [1, Math.min(window.devicePixelRatio || 1, 1.75)];

  const shouldRender = isTabVisible && !isModalActive;

  return (
    <WebGLErrorBoundary>
      <div
        ref={containerRef}
        id="threejs-hero-canvas-container"
        className={`fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none ${className}`}
        aria-hidden="true"
      >
        <Suspense fallback={<SceneLoader />}>
          <Canvas
            id="hero-3d-canvas"
            shadows
            camera={{ position: [0, 1.65, 4.4], fov: 46 }}
            frameloop={shouldRender ? 'always' : 'never'}
            dpr={targetDpr}
            gl={{
              antialias: !isMobile,
              powerPreference: 'high-performance',
              alpha: true,
              stencil: false,
              depth: true
            }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              const handleContextLost = (e) => {
                e.preventDefault();
                console.warn('Home3DBackground WebGL Context Lost. Swapping to 2D Fallback.');
                setHasWebGL(false);
              };
              const handleContextRestored = () => {
                console.log('Home3DBackground WebGL Context Restored.');
                setHasWebGL(true);
              };
              canvas.addEventListener('webglcontextlost', handleContextLost, false);
              canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
            }}
            className="w-full h-full"
            aria-label="Full-Page 3D Savoria Haute Cuisine Dining Salon Experience"
          >
            {/* Cinematic Camera Rig tracking continuous page scroll */}
            <ContinuousHomepageCameraRig
              isMobile={isMobile}
              scrollProgress={scrollProgress}
              isReducedMotion={isReducedMotion}
              activePerspective={activePerspective}
              mousePos={mousePos}
            />

            {/* Ambient & Architectural Studio Lighting */}
            <StudioLighting />

            {/* Architectural Dining Salon 3D Model */}
            {activePerspective === 'salon' && (
              <RestaurantDiningSalon3D
                mousePos={mousePos}
                scrollProgress={scrollProgress}
                isReducedMotion={isReducedMotion}
                isMobile={isMobile}
              />
            )}

            {/* Chef's Signature Wagyu Plating Model (Optional perspective) */}
            {activePerspective === 'course' && (
              <SignatureDishModel
                mousePos={mousePos}
                isReducedMotion={isReducedMotion}
                isMobile={isMobile}
              />
            )}

            {/* Shimmering Golden Dust Particles floating through salon */}
            <GoldDustParticles
              count={isMobile ? 24 : 45}
              isReducedMotion={isReducedMotion}
            />
          </Canvas>
        </Suspense>

        {/* ======================================================== */}
        {/* OBSIDIAN ATMOSPHERIC GRADIENT VEILS (WCAG CONTRAST)       */}
        {/* ======================================================== */}
        {/* Primary Left-to-Right Veil: Shields typography and cards */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0b0c10]/95 via-[#0b0c10]/85 to-[#0b0c10]/55 pointer-events-none z-[1]"
          aria-hidden="true"
        />
        {/* Top-to-Bottom Vignette: Softens edges between sections */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#0b0c10]/60 via-transparent to-[#0b0c10]/85 pointer-events-none z-[1]"
          aria-hidden="true"
        />
      </div>

      {/* ======================================================== */}
      {/* DISCRETE PERSPECTIVE SWITCHER & ACCESSIBILITY CONTROLS   */}
      {/* Mounted at z-40 so clicks and touches are unobstructed   */}
      {/* ======================================================== */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pointer-events-auto">
        {/* Perspective Toggle: Salon Sanctuary vs Degustation Course */}
        <div className="hidden md:inline-flex p-1 rounded-full bg-black/85 backdrop-blur-md border border-white/15 shadow-xl text-xs">
          <button
            type="button"
            id="hero-perspective-salon-btn"
            onClick={() => setActivePerspective('salon')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
              activePerspective === 'salon'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wine size={12} />
            <span>Salon</span>
          </button>
          <button
            type="button"
            id="hero-perspective-course-btn"
            onClick={() => setActivePerspective('course')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
              activePerspective === 'course'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Utensils size={12} />
            <span>Degustation</span>
          </button>
        </div>

        {/* 2D Fallback Override Button for Low-Spec / Battery Conservation */}
        <button
          type="button"
          id="hero-toggle-2d-mode-btn"
          onClick={() => setForce2D(true)}
          className="px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-slate-300 hover:text-amber-300 text-xs font-medium flex items-center gap-1.5 shadow-xl hover:border-amber-400/40 transition-colors cursor-pointer"
          title="Switch to 2D Mode for Low-Power Devices"
        >
          <Layers size={12} />
          <span className="hidden sm:inline">2D Mode</span>
        </button>
      </div>
    </WebGLErrorBoundary>
  );
};

export default Home3DBackground;
