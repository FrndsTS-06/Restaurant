import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Text3D, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D Brand Typography for "SAVORIA Haute Cuisine"
 * Features:
 * - Extruded serif lettering with bevels and clearcoat gold physical materials
 * - Sweeping specular highlight / glint across the letters
 * - Perfectly aligned "HAUTE CUISINE" subtitle with luxury tracking
 */
export const BrandTypography3D = ({ isReducedMotion = false }) => {
  const glintLightRef = useRef();

  // Subtle specular glint sweeping slowly across the 3D name
  useFrame(({ clock }) => {
    if (!glintLightRef.current || isReducedMotion) return;
    const t = clock.getElapsedTime();
    // Sweeping point light along X axis from -3 to 3
    glintLightRef.current.position.x = Math.sin(t * 0.8) * 3.2;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Dynamic Gold Specular Glint Light */}
      <pointLight
        ref={glintLightRef}
        position={[0, 0.5, 1.2]}
        intensity={3.8}
        color="#fff1c2"
        distance={4.0}
      />

      {/* 1. Primary Brand Name: SAVORIA in 3D Extruded Serif */}
      <Center position={[0, 0.26, 0]}>
        <Text3D
          font="/fonts/droid_serif_bold.typeface.json"
          size={0.68}
          height={0.18}
          curveSegments={14}
          bevelEnabled
          bevelThickness={0.035}
          bevelSize={0.022}
          bevelOffset={0}
          bevelSegments={5}
          letterSpacing={0.09}
          castShadow
          receiveShadow
        >
          SAVORIA
          <meshPhysicalMaterial
            color="#fff8db"
            emissive="#b45309"
            emissiveIntensity={0.28}
            metalness={0.94}
            roughness={0.12}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            reflectivity={1.0}
          />
        </Text3D>
      </Center>

      {/* Subtle Underline Gold Filigree Accent Bar */}
      <mesh position={[0, -0.22, 0.08]} castShadow>
        <boxGeometry args={[3.2, 0.032, 0.04]} />
        <meshStandardMaterial
          color="#f5cf8e"
          metalness={0.96}
          roughness={0.12}
        />
      </mesh>

      {/* Small Central Diamond on Accent Bar */}
      <mesh position={[0, -0.22, 0.11]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.09, 0.09, 0.045]} />
        <meshStandardMaterial
          color="#ffd700"
          metalness={0.98}
          roughness={0.06}
        />
      </mesh>

      {/* 2. Subtitle: HAUTE CUISINE in Elegant Spaced Gold Typography */}
      <Center position={[0, -0.46, 0.06]}>
        <Text
          text="HAUTE CUISINE"
          fontSize={0.22}
          letterSpacing={0.34}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#07080c"
        >
          <meshPhysicalMaterial
            color="#fcd34d"
            emissive="#d97706"
            emissiveIntensity={0.35}
            metalness={0.94}
            roughness={0.15}
          />
        </Text>
      </Center>
    </group>
  );
};
