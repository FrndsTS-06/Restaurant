import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sparkles as SparklesIcon, Eye, Zap, Layers, Compass, Wine, Utensils } from 'lucide-react';
import * as THREE from 'three';
import { StudioLighting } from './StudioLighting';
import { RestaurantDiningSalon3D } from './RestaurantDiningSalon3D';
import { SignatureDishModel } from './SignatureDishModel';
import { GoldDustParticles } from './GoldDustParticles';
import { HeroFallback2D } from './HeroFallback2D';

// Responsive & Cinematic Camera Rig with Scroll Animation
const CinematicCameraRig = ({
  isMobile,
  scrollProgress = 0,
  isReducedMotion = false,
  activePerspective = 'salon',
  mousePos = { x: 0, y: 0 }
}) => {
  const { camera, size } = useThree();

  useFrame(() => {
    if (activePerspective === 'salon') {
      // Base camera depth adapted to viewport width (supports ultra-narrow 320px up to 4K)
      const baseZ = size.width < 360 ? 6.2 : size.width < 400 ? 5.6 : size.width < 640 ? 5.1 : size.width < 1024 ? 4.6 : 4.2;
      const baseY = size.width < 640 ? 1.6 : 1.7;

      // Scroll-controlled dolly animation: as user scrolls down, camera tracks smoothly toward the candlelit table
      const scrollDolly = isReducedMotion ? 0 : scrollProgress * 0.9;
      const targetZ = baseZ - scrollDolly;
      const targetY = baseY - (isReducedMotion ? 0 : scrollProgress * 0.35);

      // Subtle mouse parallax tilt
      const parallaxX = isReducedMotion ? 0 : mousePos.x * 0.3;
      const parallaxY = isReducedMotion ? 0 : mousePos.y * 0.2;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, parallaxX, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + parallaxY, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06);

      const lookTargetY = 1.3 - (isReducedMotion ? 0 : scrollProgress * 0.4);
      camera.lookAt(0, lookTargetY, 0);
    } else {
      // Signature Dish Closeup Perspective
      const baseZ = size.width < 360 ? 5.6 : size.width < 400 ? 5.2 : size.width < 640 ? 4.9 : 4.6;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mousePos.x * 0.2, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.4 + (mousePos.y * 0.15), 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseZ, 0.05);
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
};

// Error Boundary to prevent any WebGL runtime failure from breaking the UI
class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('3D Restaurant scene runtime fallback activated:', error?.message || error, errorInfo);
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
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0c10]/85 backdrop-blur-sm z-20 text-center p-6 select-none">
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

  // 2. Hardware concurrency <= 2 (budget entry-level CPU)
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

export const HeroScene3D = () => {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [force2D, setForce2D] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isModalActive, setIsModalActive] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activePerspective, setActivePerspective] = useState('salon'); // 'salon' | 'course'

  // Coordinated WebGL context management: pause rendering when a 3D modal viewer is active
  useEffect(() => {
    const handleModalActive = (e) => {
      setIsModalActive(Boolean(e.detail?.active));
    };
    window.addEventListener('savoria:3d-active-modal', handleModalActive);
    return () => window.removeEventListener('savoria:3d-active-modal', handleModalActive);
  }, []);

  // 1. Device Capability, Reduced Motion & Resize Detection
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

  // 2. IntersectionObserver: Pause render loop when scrolled offscreen to conserve GPU & battery
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Controlled Scroll Tracking for Smooth Cinematic Dolly
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // Normalized progress (0 at top, 1 when hero moves past)
      const progress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.8)));
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. Mouse Movement Tracking for Desktop Parallax
  const handleMouseMove = (e) => {
    if (isReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Graceful degradation for unsupported devices or user 2D override
  if (!hasWebGL || force2D) {
    return (
      <div className="relative">
        <HeroFallback2D />
        {hasWebGL && (
          <button
            type="button"
            onClick={() => setForce2D(false)}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-lg hover:bg-black transition-colors"
          >
            <Zap size={13} className="text-amber-400" />
            <span>Enable 3D Experience</span>
          </button>
        )}
      </div>
    );
  }

  // Device-adapted DPR to eliminate GPU thermal throttling
  const targetDpr = isMobile
    ? [1, Math.min(window.devicePixelRatio || 1, 1.25)]
    : [1, Math.min(window.devicePixelRatio || 1, 1.75)];

  return (
    <WebGLErrorBoundary>
      <div
        ref={containerRef}
        id="threejs-hero-canvas-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[340px] xs:h-[380px] sm:h-[460px] lg:h-[540px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-b from-[#13151b] via-[#0e1017] to-[#0b0c10] select-none group"
      >
        <Suspense fallback={<SceneLoader />}>
          <Canvas
            id="hero-3d-canvas"
            shadows
            camera={{ position: [0, 1.6, 4.4], fov: 42 }}
            frameloop={(isVisible && !isModalActive) ? 'always' : 'never'}
            dpr={targetDpr}
            gl={{
              antialias: !isMobile,
              powerPreference: 'high-performance',
              alpha: true
            }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              const handleContextLost = (e) => {
                e.preventDefault();
                console.warn('HeroScene3D WebGL Context Lost. Swapping to 2D Fallback.');
                setHasWebGL(false);
              };
              const handleContextRestored = () => {
                console.log('HeroScene3D WebGL Context Restored.');
                setHasWebGL(true);
              };
              canvas.addEventListener('webglcontextlost', handleContextLost, false);
              canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            aria-label="Interactive 3D Savoria Haute Cuisine Dining Salon Experience"
          >
            <CinematicCameraRig
              isMobile={isMobile}
              scrollProgress={scrollProgress}
              isReducedMotion={isReducedMotion}
              activePerspective={activePerspective}
              mousePos={mousePos}
            />

            {/* Ambient & Studio Lighting */}
            <StudioLighting />

            {/* Perspective 1: Architectural Dining Salon Model */}
            {activePerspective === 'salon' && (
              <RestaurantDiningSalon3D
                mousePos={mousePos}
                scrollProgress={scrollProgress}
                isReducedMotion={isReducedMotion}
                isMobile={isMobile}
              />
            )}

            {/* Perspective 2: Chef's Signature Wagyu Plating Model */}
            {activePerspective === 'course' && (
              <SignatureDishModel
                mousePos={mousePos}
                isReducedMotion={isReducedMotion}
                isMobile={isMobile}
              />
            )}

            {/* Floating Golden Dust Particles */}
            <GoldDustParticles
              count={isMobile ? 28 : 50}
              isReducedMotion={isReducedMotion}
            />
          </Canvas>
        </Suspense>

        {/* View Perspective Switcher & 2D Fallback Mode Controls */}
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 sm:gap-2">
          {/* Perspective Switcher */}
          <div className="flex items-center rounded-full bg-black/70 backdrop-blur-md border border-white/15 p-0.5 shadow-lg">
            <button
              type="button"
              onClick={() => setActivePerspective('salon')}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all ${
                activePerspective === 'salon'
                  ? 'bg-amber-400/25 border border-amber-400/40 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Architectural Dining Salon Perspective"
            >
              <Compass size={12} className={activePerspective === 'salon' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Dining Salon</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePerspective('course')}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all ${
                activePerspective === 'course'
                  ? 'bg-amber-400/25 border border-amber-400/40 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Chef's Signature Degustation Plating"
            >
              <Utensils size={12} className={activePerspective === 'course' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Degustation</span>
            </button>
          </div>

          {/* 2D Mode Button */}
          <button
            type="button"
            onClick={() => setForce2D(true)}
            title="Switch to lightweight 2D mode"
            aria-label="Switch to 2D image mode"
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-slate-300 hover:text-white hover:border-white/40 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          >
            <Layers size={12} className="text-slate-400" />
            <span className="hidden xs:inline">2D</span>
          </button>
        </div>

        {/* Bottom Interactive Badge & Architectural Disclaimer */}
        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 p-3 sm:p-3.5 rounded-2xl bg-[#0b0c10]/85 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pointer-events-none">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
              <SparklesIcon size={10} />
              {activePerspective === 'salon' ? 'Architectural Interior Sanctuary' : 'Autumn Signature Degustation'}
            </div>
            <div className="font-serif text-xs sm:text-sm font-bold text-white truncate">
              {activePerspective === 'salon'
                ? 'Main Dining Salon & Grand Cru Cellar'
                : 'A5 Miyazaki Wagyu & Norcia Truffle'}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Eye size={12} className="text-amber-400 shrink-0" />
            <span className="italic">
              {activePerspective === 'salon'
                ? 'Move cursor or scroll to explore salon'
                : 'Hover or click dome to lift cloche'}
            </span>
          </div>
        </div>
      </div>
    </WebGLErrorBoundary>
  );
};
