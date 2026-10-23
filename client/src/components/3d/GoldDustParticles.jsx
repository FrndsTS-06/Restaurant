import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const GoldDustParticles = ({ count = 65, isReducedMotion = false }) => {
  const pointsRef = useRef();

  // Generate deterministic particle coordinates within a culinary cylinder volume
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 0.5 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;

      pos[i * 3] = Math.cos(theta) * radius; // X
      pos[i * 3 + 1] = -1.2 + Math.random() * 3.2; // Y
      pos[i * 3 + 2] = Math.sin(theta) * radius; // Z

      vel[i * 3] = (Math.random() - 0.5) * 0.003; // Drift X
      vel[i * 3 + 1] = 0.003 + Math.random() * 0.005; // Upward drift Y
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003; // Drift Z
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  useFrame(() => {
    if (isReducedMotion || !pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posArray = geo.attributes.position.array;

    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += velocities[i * 3 + 1]; // Rise
      posArray[i * 3] += velocities[i * 3]; // Sway
      posArray[i * 3 + 2] += velocities[i * 3 + 2];

      // Recycle particles when they ascend past the top
      if (posArray[i * 3 + 1] > 2.8) {
        posArray[i * 3 + 1] = -1.2;
        const radius = 0.5 + Math.random() * 2.0;
        const theta = Math.random() * Math.PI * 2;
        posArray[i * 3] = Math.cos(theta) * radius;
        posArray[i * 3 + 2] = Math.sin(theta) * radius;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#f5cf8e"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
