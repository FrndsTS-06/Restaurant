import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const SignatureDishModel = ({ mousePos, isReducedMotion = false, isMobile = false }) => {
  const groupRef = useRef();
  const clocheRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Target cloche lift state: hovered or clicked lifts the dome to reveal dish
  const isClocheLifted = hovered || clicked;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 1. Idle rotation (slow luxurious spin, pauses on hover or reduced-motion)
    if (!isReducedMotion && !hovered) {
      groupRef.current.rotation.y += delta * 0.38;
    }

    // 2. Cursor parallax tracking (gentle tilt tracking mouse XY)
    if (!isReducedMotion) {
      const targetRotX = (mousePos.y * 0.22) + 0.16;
      const targetRotZ = -(mousePos.x * 0.18);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.06);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.06);
    } else {
      groupRef.current.rotation.x = 0.22;
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = 0;
    }

    // 3. Smooth Cloche Dome Lift Animation
    if (clocheRef.current) {
      const targetClocheY = isClocheLifted ? 1.4 : 0.0;
      const targetClocheTiltZ = isClocheLifted ? 0.22 : 0.0;
      if (isReducedMotion) {
        clocheRef.current.position.y = targetClocheY;
        clocheRef.current.rotation.z = targetClocheTiltZ;
      } else {
        clocheRef.current.position.y = THREE.MathUtils.lerp(clocheRef.current.position.y, targetClocheY, 0.08);
        clocheRef.current.rotation.z = THREE.MathUtils.lerp(clocheRef.current.rotation.z, targetClocheTiltZ, 0.08);
      }
    }
  });

  // Responsive scale and vertical centering: frame perfectly on mobile screens
  const groupScale = isMobile ? 0.84 : 1.0;
  const groupPositionY = isMobile ? -0.32 : -0.4;

  return (
    <group
      ref={groupRef}
      scale={[groupScale, groupScale, groupScale]}
      position={[0, groupPositionY, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => setClicked(prev => !prev)}
      cursor="pointer"
    >
      {/* ========================================================= */}
      {/* 1. OBSIDIAN SLATE PEDESTAL (Optimized 36 radial segments) */}
      {/* ========================================================= */}
      <mesh position={[0, -0.45, 0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.25, 0.22, 36]} />
        <meshStandardMaterial
          color="#10121a"
          roughness={0.75}
          metalness={0.25}
        />
      </mesh>

      {/* Gold Inlay Trim on Pedestal */}
      <mesh position={[0, -0.34, 0]}>
        <torusGeometry args={[2.08, 0.025, 10, 36]} />
        <meshStandardMaterial
          color="#e6af5d"
          metalness={0.92}
          roughness={0.18}
        />
      </mesh>

      {/* ========================================================= */}
      {/* 2. FINE BONE CHINA PORCELAIN PLATTER                      */}
      {/* ========================================================= */}
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.7, 1.35, 0.12, 36]} />
        <meshPhysicalMaterial
          color="#fdfdfd"
          roughness={0.12}
          metalness={0.05}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Platter 24K Gold Filigree Rim */}
      <mesh position={[0, -0.19, 0]}>
        <torusGeometry args={[1.68, 0.02, 10, 36]} />
        <meshStandardMaterial
          color="#f5cf8e"
          metalness={0.95}
          roughness={0.12}
        />
      </mesh>

      {/* Platter Inner Center Recess */}
      <mesh position={[0, -0.185, 0]} receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.02, 32]} />
        <meshStandardMaterial
          color="#fbfbfb"
          roughness={0.25}
          metalness={0.02}
        />
      </mesh>

      {/* ========================================================= */}
      {/* 3. GOURMET HAUTE CUISINE PLATING (A5 WAGYU & TRUFFLE)     */}
      {/* ========================================================= */}
      {/* Rich Demi-Glace Sauce Reduction Swirl */}
      <mesh position={[0, -0.165, 0]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <ringGeometry args={[0.2, 0.9, 24]} />
        <meshStandardMaterial
          color="#220e06"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* A5 Wagyu Medallion (Main Course Centerpiece) */}
      <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.58, 0.22, 24]} />
        <meshStandardMaterial
          color="#381c14"
          roughness={0.55}
          metalness={0.15}
        />
      </mesh>

      {/* Caramelized Sear Crust Top */}
      <mesh position={[0, 0.055, 0]} receiveShadow>
        <cylinderGeometry args={[0.53, 0.53, 0.015, 24]} />
        <meshStandardMaterial
          color="#241009"
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Norcia Black Truffle Shavings (Delicate disks) */}
      <mesh position={[-0.15, 0.08, 0.1]} rotation={[0.1, 0.4, 0.15]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.018, 12]} />
        <meshStandardMaterial color="#1a1816" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.18, 0.085, -0.1]} rotation={[-0.1, -0.3, -0.1]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.018, 12]} />
        <meshStandardMaterial color="#1c1a18" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Vibrant Micro-Herbs Garnish (Emerald Sprigs) */}
      <mesh position={[-0.05, 0.12, 0]} rotation={[0.2, 0.5, 0.3]} castShadow>
        <boxGeometry args={[0.06, 0.1, 0.06]} />
        <meshStandardMaterial color="#10b981" roughness={0.4} />
      </mesh>
      <mesh position={[0.08, 0.13, 0.05]} rotation={[-0.3, 0.2, -0.4]} castShadow>
        <boxGeometry args={[0.05, 0.09, 0.05]} />
        <meshStandardMaterial color="#34d399" roughness={0.4} />
      </mesh>

      {/* 24K Edible Gold Leaf Accent */}
      <mesh position={[0.02, 0.115, -0.06]} rotation={[0.2, 0.1, 0.4]}>
        <planeGeometry args={[0.14, 0.12]} />
        <meshStandardMaterial
          color="#ffd700"
          metalness={0.98}
          roughness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ========================================================= */}
      {/* 4. IMPERIAL SILVER & GOLD CLOCHE DOME (Optimized 32x20)   */}
      {/* ========================================================= */}
      <group ref={clocheRef} position={[0, 0, 0]}>
        {/* Main Dome Cloche (Mirror Silver/Steel) */}
        <mesh position={[0, 0.48, 0]} castShadow>
          <sphereGeometry args={[1.48, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            metalness={0.96}
            roughness={0.14}
            clearcoat={1.0}
            clearcoatRoughness={0.08}
          />
        </mesh>

        {/* Lower Rim Bevel on Cloche Dome */}
        <mesh position={[0, 0.48, 0]}>
          <torusGeometry args={[1.48, 0.035, 10, 32]} />
          <meshStandardMaterial
            color="#f5cf8e"
            metalness={0.92}
            roughness={0.16}
          />
        </mesh>

        {/* Champagne Gold Fluted Handle Post */}
        <mesh position={[0, 1.98, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.1, 0.12, 12]} />
          <meshStandardMaterial
            color="#e6af5d"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>

        {/* Champagne Gold Spherical Finial Handle */}
        <mesh position={[0, 2.12, 0]} castShadow>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial
            color="#f5cf8e"
            metalness={0.95}
            roughness={0.12}
          />
        </mesh>
      </group>
    </group>
  );
};
