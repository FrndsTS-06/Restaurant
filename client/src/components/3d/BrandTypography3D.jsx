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

  const secondaryLightRef = useRef();

  // Dynamic sweeping gold specular glint across the 3D brand lettering
  useFrame(({ clock }) => {
    if (isReducedMotion) return;
    const t = clock.getElapsedTime();
    // Sweeping primary glint light along X and Y axes
    if (glintLightRef.current) {
      glintLightRef.current.position.x = Math.sin(t * 1.1) * 3.4;
      glintLightRef.current.position.y = 0.35 + Math.cos(t * 2.2) * 0.15;
      glintLightRef.current.intensity = 3.6 + Math.sin(t * 2.2) * 1.2;
    }
    // Secondary counter-glint along the lower accent filigree
    if (secondaryLightRef.current) {
      secondaryLightRef.current.position.x = -Math.sin(t * 0.9) * 2.8;
      secondaryLightRef.current.intensity = 2.0 + Math.cos(t * 1.8) * 0.8;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Dynamic Gold Specular Glint Light */}
      <pointLight
        ref={glintLightRef}
        position={[0, 0.5, 1.2]}
        intensity={4.2}
        color="#fff4d0"
        distance={4.5}
      />
      {/* Secondary Ambient Accent Light */}
      <pointLight
        ref={secondaryLightRef}
        position={[0, -0.2, 0.9]}
        intensity={2.2}
        color="#f59e0b"
        distance={3.2}
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
