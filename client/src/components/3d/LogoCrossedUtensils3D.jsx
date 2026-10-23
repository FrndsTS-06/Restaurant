import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D Vector Geometry for SAVORIA's Brand Icon (Crossed Utensils on a Beveled Plaque)
 * Translates the 2D Lucide UtensilsCrossed into a rich 3D physical emblem:
 * - Obsidian & Champagne Gold beveled squircle plaque
 * - Precision-extruded Chef's Knife (blade, bolster, handle rivets)
 * - Precision-extruded Gourmet Fork (4 tapered tines, curved neck, handle)
 */
export const LogoCrossedUtensils3D = ({ isHovered = false }) => {
  const emblemGroupRef = useRef();

  useFrame(() => {
    if (!emblemGroupRef.current) return;
    const targetScale = isHovered ? 1.05 : 1.0;
    emblemGroupRef.current.scale.x = THREE.MathUtils.lerp(emblemGroupRef.current.scale.x, targetScale, 0.1);
    emblemGroupRef.current.scale.y = THREE.MathUtils.lerp(emblemGroupRef.current.scale.y, targetScale, 0.1);
    emblemGroupRef.current.scale.z = THREE.MathUtils.lerp(emblemGroupRef.current.scale.z, targetScale, 0.1);
  });
  // 1. Generate squircle (rounded rectangle) base shape
  const squircleShape = useMemo(() => {
    const shape = new THREE.Shape();
    const width = 1.35;
    const height = 1.35;
    const radius = 0.32;
    const x = -width / 2;
    const y = -height / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return shape;
  }, []);

  // 2. Chef's Knife Geometry
  const knifeBladeShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Profile of a classical French chef's knife blade
    shape.moveTo(0, 0);
    shape.lineTo(0.08, 0.45);
    shape.quadraticCurveTo(0.06, 0.65, 0, 0.72); // Curved tip
    shape.lineTo(-0.02, 0.70);
    shape.lineTo(-0.04, 0.0); // Spine
    shape.closePath();
    return shape;
  }, []);

  // 3. Gourmet Fork Geometry
  const forkHeadShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Fork base arch
    shape.moveTo(-0.11, 0.32);
    shape.lineTo(0.11, 0.32);
    shape.lineTo(0.09, 0.42);
    shape.lineTo(-0.09, 0.42);
    shape.closePath();
    return shape;
  }, []);

  return (
    <group ref={emblemGroupRef} position={[0, 0, 0]}>
      {/* Dynamic Specular Front Highlight on Knife & Fork */}
      <pointLight
        position={[0, 0, 0.45]}
        intensity={isHovered ? 2.8 : 1.6}
        color="#fff4d0"
        distance={2.5}
      />
      {/* ======================================================== */}
      {/* 1. OBSIDIAN & GOLD BEVELED PLAQUE BASE                  */}
      {/* ======================================================== */}
      {/* Outer Golden Filigree Trim Bevel */}
      <mesh position={[0, 0, -0.06]} receiveShadow castShadow>
        <extrudeGeometry
          args={[
            squircleShape,
            {
              depth: 0.12,
              bevelEnabled: true,
              bevelSegments: 4,
              bevelThickness: 0.04,
              bevelSize: 0.035
            }
          ]}
        />
        <meshPhysicalMaterial
          color="#e6af5d"
          metalness={0.94}
          roughness={0.16}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
          reflectivity={0.9}
        />
      </mesh>

      {/* Inner Obsidian Slate Cavity */}
      <mesh position={[0, 0, 0.065]} receiveShadow>
        <extrudeGeometry
          args={[
            squircleShape,
            {
              depth: 0.02,
              bevelEnabled: true,
              bevelSegments: 2,
              bevelThickness: 0.015,
              bevelSize: 0.015
            }
          ]}
        />
        <meshStandardMaterial
          color="#0c0e14"
          metalness={0.4}
          roughness={0.55}
        />
      </mesh>

      {/* ======================================================== */}
      {/* 2. CROSSED UTENSILS: CHEF'S KNIFE (Angled -45 deg)       */}
      {/* ======================================================== */}
      <group rotation={[0, 0, -Math.PI / 4]} position={[0, 0, 0.10]}>
        {/* Knife Blade */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <extrudeGeometry
            args={[
              knifeBladeShape,
              { depth: 0.022, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2 }
            ]}
          />
          <meshPhysicalMaterial
            color="#f8fafc"
            metalness={0.98}
            roughness={0.10}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
          />
        </mesh>

        {/* Golden Bolster Ring */}
        <mesh position={[0.02, 0.01, 0.011]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.042, 0.042, 0.035, 16]} />
          <meshStandardMaterial color="#f5cf8e" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Ergonomic Handle */}
        <mesh position={[0.02, -0.28, 0.011]} castShadow>
          <boxGeometry args={[0.075, 0.52, 0.038]} />
          <meshStandardMaterial color="#1a1c23" metalness={0.3} roughness={0.65} />
        </mesh>

        {/* 3 Gold Handle Rivets */}
        {[-0.12, -0.26, -0.40].map((yOffset, idx) => (
          <mesh key={idx} position={[0.02, yOffset, 0.032]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.008, 10]} />
            <meshStandardMaterial color="#ffd700" metalness={0.96} roughness={0.12} />
          </mesh>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 3. CROSSED UTENSILS: GOURMET FORK (Angled +45 deg)       */}
      {/* ======================================================== */}
      <group rotation={[0, 0, Math.PI / 4]} position={[0, 0, 0.14]}>
        {/* Fork Bridge Head */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <extrudeGeometry
            args={[
              forkHeadShape,
              { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2 }
            ]}
          />
          <meshPhysicalMaterial
            color="#f5cf8e"
            metalness={0.95}
            roughness={0.14}
            clearcoat={0.9}
          />
        </mesh>

        {/* 4 Fork Tines */}
        {[-0.075, -0.025, 0.025, 0.075].map((xOffset, idx) => (
          <mesh key={idx} position={[xOffset, 0.58, 0.011]} castShadow>
            <cylinderGeometry args={[0.012, 0.015, 0.32, 10]} />
            <meshPhysicalMaterial
              color="#f5cf8e"
              metalness={0.95}
              roughness={0.14}
              clearcoat={0.9}
            />
          </mesh>
        ))}

        {/* Curved Fork Neck */}
        <mesh position={[0, 0.22, 0.011]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.045, 0.24, 12]} />
          <meshStandardMaterial color="#e6af5d" metalness={0.92} roughness={0.18} />
        </mesh>

        {/* Fork Ergonomic Handle */}
        <mesh position={[0, -0.22, 0.011]} castShadow>
          <boxGeometry args={[0.07, 0.58, 0.034]} />
          <meshStandardMaterial color="#1a1c23" metalness={0.3} roughness={0.65} />
        </mesh>

        {/* Gold Handle Inlay Stripe */}
        <mesh position={[0, -0.22, 0.03]} castShadow>
          <boxGeometry args={[0.02, 0.48, 0.008]} />
          <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
};
