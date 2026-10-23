import React, { useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Center } from '@react-three/drei';
import { Box, Sparkles, Eye, Image as ImageIcon, RotateCw, AlertCircle, Clock } from 'lucide-react';
import * as THREE from 'three';

// 3D Model Loader component for GLB files
const GLBModel = ({ url, isRotating = true }) => {
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  useFrame((_, delta) => {
    if (isRotating && modelRef.current) {
      modelRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={1.35}
      position={[0, -0.2, 0]}
    />
  );
};

// Loading spinner within 3D canvas
const ModelLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0c10]/90 z-20 text-center p-4">
    <div className="w-8 h-8 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-2" />
    <span className="text-xs font-semibold text-amber-300 tracking-wider">
      Loading 3D Food Asset...
    </span>
  </div>
);

// Fallback when WebGL or GLTF fails
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('Food 3D model fallback activated:', err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * FoodAssetViewer3D
 * Provides interactive 360-degree 3D viewing where a genuine 3D model is available,
 * and high-quality static fallback image where 3D is pending or missing.
 */
export const FoodAssetViewer3D = ({
  dish,
  height = '280px',
  className = ''
}) => {
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'photo'
  const [autoRotate, setAutoRotate] = useState(true);

  const has3DModel = dish.modelStatus === 'available' && !!dish.model3dUrl;
  const isPending = dish.modelStatus === 'pending_approval';
  const isInDevelopment = dish.modelStatus === 'in_development';
  const isMissing = dish.modelStatus === 'missing_asset' || !dish.modelStatus;

  const fallbackImage = (
    <div className="relative w-full h-full overflow-hidden bg-[#0e1017]">
      <img
        src={dish.modelPosterUrl || dish.image}
        alt={dish.modelAltText || dish.name}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      
      {/* Status Badge for Non-3D Items */}
      {!has3DModel && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-1.5">
            {isPending && (
              <>
                <Clock size={13} className="text-amber-400" />
                <span className="text-amber-300 font-medium">3D Photogrammetry: Pending Review</span>
              </>
            )}
            {isInDevelopment && (
              <>
                <Sparkles size={13} className="text-sky-400" />
                <span className="text-sky-300 font-medium">3D Asset: In Atelier Development</span>
              </>
            )}
            {isMissing && (
              <>
                <AlertCircle size={13} className="text-slate-400" />
                <span className="text-slate-300 font-medium">High-Resolution Studio Photo</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            Verified Photography
          </span>
        </div>
      )}
    </div>
  );

  // If item has no genuine 3D model, render genuine photo with status
  if (!has3DModel) {
    return (
      <div
        style={{ height }}
        className={`relative w-full rounded-2xl overflow-hidden border border-white/10 ${className}`}
      >
        {fallbackImage}
      </div>
    );
  }

  // If item has genuine 3D model, allow switching between 3D and 2D photo
  return (
    <div
      style={{ height }}
      className={`relative w-full rounded-2xl overflow-hidden border border-amber-400/25 bg-gradient-to-b from-[#13151b] to-[#0b0c10] select-none ${className}`}
    >
      {viewMode === 'photo' ? (
        fallbackImage
      ) : (
        <ModelErrorBoundary fallback={fallbackImage}>
          <Suspense fallback={<ModelLoader />}>
            <Canvas
              shadows
              camera={{ position: [0, 1.8, 3.2], fov: 42 }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              aria-label={dish.modelAltText || `3D model of ${dish.name}`}
            >
              <ambientLight intensity={0.8} />
              <directionalLight
                position={[5, 8, 5]}
                intensity={1.8}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <directionalLight position={[-4, 3, -4]} intensity={0.6} color="#38bdf8" />
              <pointLight position={[0, 2.5, 0]} intensity={1.2} color="#fbbf24" />

              <Center>
                <GLBModel url={dish.model3dUrl} isRotating={autoRotate} />
              </Center>

              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={1.8}
                maxDistance={5.5}
                maxPolarAngle={Math.PI / 2.05}
                onStart={() => setAutoRotate(false)}
              />
            </Canvas>
          </Suspense>
        </ModelErrorBoundary>
      )}

      {/* Top Controls: 3D / Photo Mode Switcher (Top Left to avoid modal close button) */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setViewMode(prev => prev === '3d' ? 'photo' : '3d')}
          className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 hover:border-amber-400 text-xs text-white font-medium flex items-center gap-1.5 shadow-md transition-colors"
          title={viewMode === '3d' ? 'View High-Res Photo' : 'View Interactive 3D Model'}
        >
          {viewMode === '3d' ? (
            <>
              <ImageIcon size={12} className="text-amber-400" />
              <span>Photo</span>
            </>
          ) : (
            <>
              <Box size={12} className="text-amber-400" />
              <span>3D</span>
            </>
          )}
        </button>

        {viewMode === '3d' && (
          <button
            type="button"
            onClick={() => setAutoRotate(prev => !prev)}
            className={`p-1 rounded-full backdrop-blur-md border text-xs shadow-md transition-colors ${
              autoRotate
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                : 'bg-black/75 border-white/20 text-slate-400 hover:text-white'
            }`}
            title={autoRotate ? 'Pause Auto-Spin' : 'Resume Auto-Spin'}
          >
            <RotateCw size={14} className={autoRotate ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Bottom Hint Banner for 3D View */}
      {viewMode === '3d' && (
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[11px] text-slate-300 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 pointer-events-none">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Box size={12} />
            <span>360° Interactive 3D Presentation</span>
          </div>
          <span className="text-[10px] text-slate-400 italic">Drag to orbit • Scroll to zoom</span>
        </div>
      )}
    </div>
  );
};
