import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Zap, Layers } from 'lucide-react';
import * as THREE from 'three';
import { LogoCrossedUtensils3D } from './LogoCrossedUtensils3D';
import { BrandTypography3D } from './BrandTypography3D';
import { BrandStaticFallback } from './BrandStaticFallback';

export { BrandStaticFallback };

// Comprehensive low-performance hardware detection
const checkIsLowPerformanceDevice = () => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    return true;
  }
  if (navigator.deviceMemory && navigator.deviceMemory < 3) {
    return true;
  }
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection && (connection.saveData || connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')) {
    return true;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl'));
    if (!gl) return true;
  } catch (e) {
    return true;
  }
  return false;
};

// Camera & framing rig adapted across viewports (320px to 4K)
const BrandCameraRig = ({ isMobile }) => {
  const { camera, size } = useThree();

  useEffect(() => {
    if (size.width < 360) {
      // Ultra-narrow mobile (320px - 359px)
      camera.position.set(0, 0, 4.1);
      camera.fov = 48;
    } else if (size.width < 420) {
      // Small mobile (360px - 419px)
      camera.position.set(0, 0, 3.8);
      camera.fov = 46;
    } else if (size.width < 640) {
      // Standard mobile
      camera.position.set(0, 0, 3.6);
      camera.fov = 44;
    } else {
      // Desktop / Tablet
      camera.position.set(0, 0, 3.4);
      camera.fov = 42;
    }
    camera.updateProjectionMatrix();
  }, [size.width, camera]);

  return null;
};

// Unified 3D Brand Stage (Combines Emblem + Typography with Parallax & Hover Interaction)
const UnifiedBrandStage = ({ mousePos, isReducedMotion, isMobile }) => {
  const brandGroupRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!brandGroupRef.current) return;

    // 1. Subtle idle breathing float
    if (!isReducedMotion) {
      const elapsed = state.clock.getElapsedTime();
      brandGroupRef.current.position.y = Math.sin(elapsed * 1.5) * 0.03;

      // 2. Parallax tilt tracking mouse XY
      const targetRotY = (mousePos.x * 0.22) + (hovered ? 0.06 : 0);
      const targetRotX = -(mousePos.y * 0.16) + 0.03;
      brandGroupRef.current.rotation.y = THREE.MathUtils.lerp(brandGroupRef.current.rotation.y, targetRotY, 0.08);
      brandGroupRef.current.rotation.x = THREE.MathUtils.lerp(brandGroupRef.current.rotation.x, targetRotX, 0.08);
    } else {
      brandGroupRef.current.rotation.set(0, 0, 0);
      brandGroupRef.current.position.set(0, 0, 0);
    }
  });

  // Responsive layout: on small screens, arrange emblem and text with adjusted spacing
  const emblemX = isMobile ? -1.45 : -1.75;
  const typoX = isMobile ? 0.85 : 0.95;
  const overallScale = isMobile ? 0.72 : 0.88;

  return (
    <group
      ref={brandGroupRef}
      scale={[overallScale, overallScale, overallScale]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      cursor="pointer"
    >
      {/* 3D Crossed Utensils Emblem */}
      <group position={[emblemX, 0.06, 0]} scale={[1.1, 1.1, 1.1]}>
        <LogoCrossedUtensils3D isHovered={hovered} />
      </group>

      {/* 3D Extruded Brand Name & Subtitle */}
      <group position={[typoX, 0.06, 0]}>
        <BrandTypography3D isReducedMotion={isReducedMotion} />
      </group>
    </group>
  );
};

// Fallback spinner while typeface font loads into memory
const BrandLoader = () => (
  <div className="flex items-center justify-center h-full w-full bg-[#0e1017]/40 backdrop-blur-xs">
    <div className="flex items-center gap-2.5 text-xs font-serif text-amber-300">
      <div className="w-4 h-4 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
      <span>Rendering 3D Brand Sculpture...</span>
    </div>
  </div>
);

// Error boundary to protect the UI against WebGL crashes
class BrandErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('3D Brand component fallback triggered:', error?.message || error);
  }
  render() {
    if (this.state.hasError) {
      return <BrandStaticFallback />;
    }
    return this.props.children;
  }
}

/**
 * HeroBrand3D — Interactive 3D Restaurant Name and Logo
 * Integrated directly into the Homepage Hero
 */
export const HeroBrand3D = () => {
  const containerRef = useRef(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [force2D, setForce2D] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isModalActive, setIsModalActive] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Check low-performance hardware or reduced motion
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
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Viewport IntersectionObserver: suspend GPU render loop when offscreen
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

  // WebGL coordination: suspend render loop when modal 3D viewer is active
  useEffect(() => {
    const handleModalActive = (e) => {
      setIsModalActive(Boolean(e.detail?.active));
    };
    window.addEventListener('savoria:3d-active-modal', handleModalActive);
    return () => window.removeEventListener('savoria:3d-active-modal', handleModalActive);
  }, []);

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

  if (!hasWebGL || force2D) {
    return (
      <div className="relative inline-block my-1">
        <BrandStaticFallback />
        {hasWebGL && (
          <button
            type="button"
            onClick={() => setForce2D(false)}
            aria-label="Switch to 3D logo"
            className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-black/80 border border-amber-400/40 text-[10px] text-amber-300 font-semibold flex items-center gap-1 shadow hover:bg-black"
          >
            <Zap size={10} className="text-amber-400" />
            <span>3D</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <BrandErrorBoundary>
      <div
        ref={containerRef}
        id="hero-3d-brand-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-[500px] h-[135px] xs:h-[150px] sm:h-[165px] rounded-2xl overflow-hidden border border-amber-400/20 bg-gradient-to-r from-[#12141c]/90 via-[#0e1017]/85 to-[#0b0c10]/90 backdrop-blur-md shadow-2xl select-none group my-1"
        role="img"
        aria-label="SAVORIA Haute Cuisine 3D Brand Logo & Identity"
      >
        <span className="sr-only">SAVORIA Haute Cuisine - 3-Star Michelin Avant-Garde Restaurant</span>

        <Suspense fallback={<BrandLoader />}>
          <Canvas
            id="hero-brand-canvas"
            camera={{ position: [0, 0, 3.4], fov: 42 }}
            frameloop={(isVisible && !isModalActive) ? 'always' : 'never'}
            dpr={isMobile ? [1, 1.25] : [1, 1.75]}
            gl={{
              antialias: !isMobile,
              alpha: true,
              powerPreference: 'high-performance'
            }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              const handleContextLost = (e) => {
                e.preventDefault();
                console.warn('HeroBrand3D WebGL Context Lost. Swapping to 2D Fallback.');
                setHasWebGL(false);
              };
              const handleContextRestored = () => {
                console.log('HeroBrand3D WebGL Context Restored.');
                setHasWebGL(true);
              };
              canvas.addEventListener('webglcontextlost', handleContextLost, false);
              canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
          >
            <BrandCameraRig isMobile={isMobile} />

            {/* Studio Lighting tailored for Brand Metals & Bevels */}
            <ambientLight intensity={1.1} color="#ffffff" />
            {/* Direct Front/Top Key Light: Brilliant Warm Amber */}
            <directionalLight
              position={[2, 3, 5]}
              intensity={3.2}
              color="#fef3c7"
            />
            {/* Rim Light: Cool Sommelier Cyan */}
            <directionalLight
              position={[-4, 2, 3]}
              intensity={1.8}
              color="#38bdf8"
            />
            {/* Fill Light: Soft Champagne */}
            <pointLight
              position={[0, -1, 3]}
              intensity={1.6}
              color="#fed7aa"
            />

            {/* Unified 3D Brand Model */}
            <UnifiedBrandStage
              mousePos={mousePos}
              isReducedMotion={isReducedMotion}
              isMobile={isMobile}
            />
          </Canvas>
        </Suspense>

        {/* 3D Indicator Badge & 2D Mode Switcher */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="px-2 py-0.5 rounded-full bg-black/60 border border-amber-400/30 text-amber-300 text-[10px] font-semibold flex items-center gap-1 pointer-events-none">
            <Sparkles size={10} className="text-amber-400 animate-pulse" />
            <span>3D Emblem</span>
          </span>
          <button
            type="button"
            onClick={() => setForce2D(true)}
            title="Switch to lightweight 2D brand logo"
            aria-label="Switch to 2D brand logo"
            className="px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Layers size={10} className="text-slate-400" />
            <span className="hidden xs:inline">2D</span>
          </button>
        </div>

        {/* Subtle Interactive Hint */}
        <div className="absolute bottom-1.5 right-3 text-[9px] text-amber-400/60 font-mono tracking-widest hidden sm:block pointer-events-none">
          INTERACTIVE 3D IDENTITY
        </div>
      </div>
    </BrandErrorBoundary>
  );
};
