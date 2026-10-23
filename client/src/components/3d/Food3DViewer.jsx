import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FoodModelLoader } from './FoodModelLoader';
import { FoodModelFallback } from './FoodModelFallback';
import { FoodModelControls } from './FoodModelControls';

// Model renderer with smooth idle spin
const GLBFoodMesh = ({ url, isAutoRotating = true }) => {
  const { scene } = useGLTF(url);
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (isAutoRotating && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.42;
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={scene}
      scale={1.35}
      position={[0, -0.15, 0]}
    />
  );
};

// Camera Controller helper component allowing external zoom and reset actions
const CameraRigController = ({ controlsRef, onReady }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (onReady) {
      onReady({ camera });
    }
  }, [camera, onReady]);

  return null;
};

// WebGL Error Boundary to prevent application crashes on GPU context drop
class Food3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.warn('Food3DViewer runtime WebGL error:', error?.message || error, errorInfo);
  }
  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.dish?.model3dUrl !== this.props.dish?.model3dUrl) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <FoodModelFallback
          dish={this.props.dish}
          isError={true}
          errorMessage="3D acceleration unavailable. Showing verified studio photography."
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Food3DViewer
 * Production-ready interactive 3D model viewer with 360-degree rotation,
 * touch gestures, automatic centering, studio lighting, zoom, reset, and keyboard controls.
 */
export const Food3DViewer = ({
  dish,
  height = '300px',
  isOpen = true,
  className = ''
}) => {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'photo'
  const [isAutoRotating, setIsAutoRotating] = useState(!prefersReducedMotion);
  const [isInteracting, setIsInteracting] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  const controlsRef = useRef();
  const cameraRef = useRef();

  const isValidModelUrl = typeof dish?.model3dUrl === 'string' &&
    (/\.(glb|gltf)($|\?)/i.test(dish.model3dUrl.trim()));
  const has3DModel = dish?.modelStatus === 'available' && isValidModelUrl;

  // Test WebGL availability and hardware capability on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl'));
      if (!gl) {
        setHasWebGL(false);
        return;
      }
      // Low-memory and slow-network safe fallback
      if (navigator.deviceMemory && navigator.deviceMemory < 2) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && (connection.saveData || connection.effectiveType === '2g')) {
          setHasWebGL(false);
          return;
        }
      }
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  // Coordinated WebGL context management: notify background canvases to pause
  useEffect(() => {
    if (isOpen && viewMode === '3d' && has3DModel && hasWebGL) {
      window.dispatchEvent(new CustomEvent('savoria:3d-active-modal', { detail: { active: true } }));
    } else {
      window.dispatchEvent(new CustomEvent('savoria:3d-active-modal', { detail: { active: false } }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('savoria:3d-active-modal', { detail: { active: false } }));
    };
  }, [isOpen, viewMode, has3DModel, hasWebGL]);

  // Reset Camera View handler
  const handleResetView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1.8, 3.2);
      cameraRef.current.lookAt(0, 0, 0);
    }
    setIsAutoRotating(true);
  }, []);

  // Controlled Zoom In
  const handleZoomIn = useCallback(() => {
    if (controlsRef.current && cameraRef.current) {
      const cam = cameraRef.current;
      const dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      cam.position.addScaledVector(dir, 0.4);
      controlsRef.current.update();
    }
  }, []);

  // Controlled Zoom Out
  const handleZoomOut = useCallback(() => {
    if (controlsRef.current && cameraRef.current) {
      const cam = cameraRef.current;
      const dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      cam.position.addScaledVector(dir, -0.4);
      controlsRef.current.update();
    }
  }, []);

  // Keyboard accessibility: 'r' to reset, '+' / '-' to zoom, Space to toggle spin
  useEffect(() => {
    if (!isOpen || viewMode !== '3d' || !has3DModel) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetView();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoRotating(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewMode, has3DModel, handleResetView, handleZoomIn, handleZoomOut]);

  // If item does not have an approved genuine 3D model or WebGL is unsupported, render static fallback
  if (!has3DModel || !hasWebGL) {
    return (
      <div
        style={{ height }}
        className={`relative w-full rounded-2xl overflow-hidden border border-white/10 ${className}`}
      >
        <FoodModelFallback dish={dish} />
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className={`relative w-full rounded-2xl overflow-hidden border border-amber-400/25 bg-gradient-to-b from-[#13151b] via-[#0f1117] to-[#0b0c10] select-none ${className}`}
    >
      {viewMode === 'photo' ? (
        <FoodModelFallback dish={dish} />
      ) : (
        <Food3DErrorBoundary dish={dish}>
          <Canvas
            id="food-3d-canvas"
            shadows
            camera={{
              position: (typeof window !== 'undefined' && window.innerWidth < 640) ? [0, 2.0, 3.6] : [0, 1.8, 3.2],
              fov: (typeof window !== 'undefined' && window.innerWidth < 640) ? 48 : 42
            }}
            frameloop={isOpen ? ((isAutoRotating || isInteracting) ? 'always' : 'demand') : 'never'}
            dpr={typeof window !== 'undefined' && window.innerWidth < 640 ? [1, 1.25] : [1, 1.75]}
            gl={{
              antialias: typeof window === 'undefined' || window.innerWidth >= 640,
              alpha: true,
              powerPreference: 'high-performance'
            }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              const handleContextLost = (e) => {
                e.preventDefault();
                console.warn('Food3DViewer WebGL Context Lost. Swapping to photo fallback.');
                setHasWebGL(false);
              };
              const handleContextRestored = () => {
                console.log('Food3DViewer WebGL Context Restored.');
                setHasWebGL(true);
              };
              canvas.addEventListener('webglcontextlost', handleContextLost, false);
              canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
            aria-label={dish.modelAltText || `Interactive 3D model of ${dish.name}`}
          >
            <CameraRigController
              controlsRef={controlsRef}
              onReady={({ camera }) => {
                cameraRef.current = camera;
              }}
            />

            {/* Realistic Haute Cuisine Studio Lighting */}
            <ambientLight intensity={0.9} color="#ffffff" />
            <directionalLight
              position={[5, 8, 5]}
              intensity={1.9}
              color="#fffbeb"
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0001}
            />
            <directionalLight
              position={[-4, 3, -4]}
              intensity={0.65}
              color="#38bdf8"
            />
            <pointLight
              position={[0, 2.4, 0]}
              intensity={1.1}
              color="#fbbf24"
              distance={4}
            />

            {/* Center & Scale Model Automatically inside internal Suspense */}
            <Suspense fallback={<Html center><FoodModelLoader /></Html>}>
              <Center>
                <GLBFoodMesh
                  url={dish.model3dUrl}
                  isAutoRotating={isAutoRotating}
                />
              </Center>
            </Suspense>

            {/* Contact Shadow Plane */}
            <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[5, 5]} />
              <shadowMaterial opacity={0.25} />
            </mesh>

            {/* 360-Degree Horizontal Orbit & Mobile Touch Gestures */}
            <OrbitControls
              ref={controlsRef}
              enableDamping={true}
              dampingFactor={0.06}
              enableRotate={true}
              enableZoom={true}
              enablePan={false}
              minDistance={1.6}
              maxDistance={5.2}
              maxPolarAngle={Math.PI / 2.05}
              touches={{
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
              }}
              onStart={() => {
                setIsAutoRotating(false);
                setIsInteracting(true);
              }}
              onEnd={() => {
                setIsInteracting(false);
              }}
            />
          </Canvas>
        </Food3DErrorBoundary>
      )}

      {/* Accessible Interactive Controls Bar */}
      <FoodModelControls
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(prev => (prev === '3d' ? 'photo' : '3d'))}
        isAutoRotating={isAutoRotating}
        onToggleAutoRotate={() => setIsAutoRotating(prev => !prev)}
        onResetView={handleResetView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  );
};
