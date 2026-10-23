import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Text, Center } from '@react-three/drei';
import * as THREE from 'three';
import { LogoCrossedUtensils3D } from './LogoCrossedUtensils3D';

/**
 * RestaurantDiningSalon3D — Architectural 3D Interior Model
 * An artistic architectural visualization of SAVORIA's fine dining sanctuary,
 * inspired by its Avenue Montaigne Parisian heritage.
 * 
 * Features:
 * - Grand architectural portico with fluted columns & champagne bronze arches
 * - 3D SAVORIA signage and crossed utensils emblem mounted on the grand lintel
 * - Polished dark marble floor with realistic specular reflections
 * - Deep European walnut architectural wainscoting paneling
 * - Arched window with glowing twilight Manhattan/Paris city skyline
 * - Central dining table with draped linen, fine china, crystal glass & flickering candlelight
 * - Grand Cru subterranean cellar rack with backlit vintage bottles
 */
export const RestaurantDiningSalon3D = ({
  mousePos = { x: 0, y: 0 },
  scrollProgress = 0,
  isReducedMotion = false,
  isMobile = false
}) => {
  const salonGroupRef = useRef();
  const candleLightRef = useRef();
  const wineGlowRef = useRef();

  // Gentle idle candle flicker and dynamic ambient light modulation (optimized on mobile)
  useFrame(({ clock }) => {
    if (isReducedMotion) return;
    const t = clock.getElapsedTime();

    // 1. Realistic candle flame micro-flicker (desktop only to preserve mobile battery/GPU)
    if (!isMobile && candleLightRef.current) {
      candleLightRef.current.intensity = 1.35 + Math.sin(t * 7.5) * 0.18 + Math.cos(t * 13.2) * 0.08;
    }

    // 2. Subtle wine display breathing back-glow (desktop only)
    if (!isMobile && wineGlowRef.current) {
      wineGlowRef.current.intensity = 1.1 + Math.sin(t * 1.8) * 0.15;
    }

    // 3. Subtle camera/salon parallax response (desktop only, mobile touch doesn't mouse-hover)
    if (salonGroupRef.current && !isMobile) {
      const targetRotY = (mousePos.x * 0.08);
      const targetRotX = -(mousePos.y * 0.05);
      salonGroupRef.current.rotation.y = THREE.MathUtils.lerp(salonGroupRef.current.rotation.y, targetRotY, 0.05);
      salonGroupRef.current.rotation.x = THREE.MathUtils.lerp(salonGroupRef.current.rotation.x, targetRotX, 0.05);
    }
  });

  // Base responsive scaling
  const scale = isMobile ? 0.72 : 0.88;
  const posY = isMobile ? -0.35 : -0.45;
  const wineShelves = isMobile ? [-0.4, 0.4] : [-0.8, -0.2, 0.4, 1.0];
  const wineBottles = isMobile ? [-0.3, 0, 0.3] : [-0.45, -0.22, 0, 0.22, 0.45];

  return (
    <group ref={salonGroupRef} scale={[scale, scale, scale]} position={[0, posY, 0]}>
      {/* ======================================================== */}
      {/* 1. ARCHITECTURAL FOUNDATION & WALLS                     */}
      {/* ======================================================== */}
      {/* Polished Dark Marble Floor with Subtle Reflections */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshPhysicalMaterial
          color="#0c0e14"
          roughness={0.18}
          metalness={0.22}
          clearcoat={0.8}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Floor Marble Border Inlay (Champagne Gold Key Trim) */}
      <mesh position={[0, -0.59, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 3.86, 48]} />
        <meshStandardMaterial color="#e6af5d" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Back Architectural Wall (Deep Walnut & Obsidian Panels) */}
      <mesh position={[0, 2.2, -3.2]} receiveShadow>
        <boxGeometry args={[12, 5.6, 0.2]} />
        <meshStandardMaterial color="#141118" roughness={0.7} metalness={0.25} />
      </mesh>

      {/* Architectural Walnut Wainscoting Lower Panels */}
      {[-3.6, -1.8, 0, 1.8, 3.6].map((xPos, idx) => (
        <mesh key={idx} position={[xPos, 0.4, -3.08]} receiveShadow>
          <boxGeometry args={[1.6, 2.0, 0.06]} />
          <meshStandardMaterial color="#1e1510" roughness={0.65} metalness={0.15} />
        </mesh>
      ))}

      {/* Gold Trim Molding on Wainscoting */}
      <mesh position={[0, 1.42, -3.05]}>
        <boxGeometry args={[11.8, 0.05, 0.04]} />
        <meshStandardMaterial color="#e6af5d" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* ======================================================== */}
      {/* 2. GRAND ARCHITECTURAL WINDOW & TWILIGHT SKYLINE VIEW    */}
      {/* ======================================================== */}
      {/* Window Aperture Glass (Manhattan / Paris Twilight Vista) */}
      <mesh position={[0, 2.5, -3.12]}>
        <circleGeometry args={[1.5, 36, 0, Math.PI]} />
        <meshBasicMaterial color="#131c2e" />
      </mesh>
      <mesh position={[0, 1.8, -3.12]}>
        <planeGeometry args={[3.0, 1.4]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Glowing City Twilight Stars / Night Bokeh in Window */}
      {[
        [-0.8, 2.8, -3.1], [0.4, 3.1, -3.1], [0.9, 2.4, -3.1],
        [-0.3, 2.2, -3.1], [0.6, 1.9, -3.1], [-1.1, 1.7, -3.1]
      ].map(([x, y, z], idx) => (
        <mesh key={idx} position={[x, y, z]}>
          <circleGeometry args={[0.025, 8]} />
          <meshBasicMaterial color={idx % 2 === 0 ? '#fef08a' : '#93c5fd'} />
        </mesh>
      ))}

      {/* Champagne Bronze Arched Window Frame */}
      <mesh position={[0, 2.5, -3.05]}>
        <torusGeometry args={[1.52, 0.04, 12, 36, Math.PI]} />
        <meshStandardMaterial color="#d4a359" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Window Mullions / Grid */}
      <mesh position={[0, 2.2, -3.05]}>
        <boxGeometry args={[0.035, 2.0, 0.03]} />
        <meshStandardMaterial color="#d4a359" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.0, -3.05]}>
        <boxGeometry args={[3.0, 0.035, 0.03]} />
        <meshStandardMaterial color="#d4a359" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* ======================================================== */}
      {/* 3. GRAND PORTICO WITH 3D SAVORIA SIGNAGE & EMBLEM        */}
      {/* ======================================================== */}
      {/* Left Fluted Column */}
      <group position={[-2.4, 1.6, -1.8]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.22, 4.4, 24]} />
          <meshStandardMaterial color="#1a1c24" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Column Capital & Base in Gold */}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.48, 0.12, 0.48]} />
          <meshStandardMaterial color="#e6af5d" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, -2.15, 0]}>
          <boxGeometry args={[0.52, 0.16, 0.52]} />
          <meshStandardMaterial color="#e6af5d" metalness={0.92} roughness={0.2} />
        </mesh>
      </group>

      {/* Right Fluted Column */}
      <group position={[2.4, 1.6, -1.8]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.22, 4.4, 24]} />
          <meshStandardMaterial color="#1a1c24" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Column Capital & Base in Gold */}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[0.48, 0.12, 0.48]} />
          <meshStandardMaterial color="#e6af5d" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, -2.15, 0]}>
          <boxGeometry args={[0.52, 0.16, 0.52]} />
          <meshStandardMaterial color="#e6af5d" metalness={0.92} roughness={0.2} />
        </mesh>
      </group>

      {/* Architectural Lintel / Entablature Architrave */}
      <mesh position={[0, 3.82, -1.8]} castShadow receiveShadow>
        <boxGeometry args={[5.6, 0.38, 0.45]} />
        <meshPhysicalMaterial
          color="#12141c"
          roughness={0.4}
          metalness={0.35}
          clearcoat={0.6}
        />
      </mesh>

      {/* Gold Architrave Trim Bands */}
      <mesh position={[0, 4.02, -1.56]}>
        <boxGeometry args={[5.62, 0.04, 0.04]} />
        <meshStandardMaterial color="#f5cf8e" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, 3.62, -1.56]}>
        <boxGeometry args={[5.62, 0.04, 0.04]} />
        <meshStandardMaterial color="#f5cf8e" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* --- INTEGRATED 3D RESTAURANT NAME & LOGO SIGNAGE --- */}
      <group position={[0, 3.82, -1.52]}>
        {/* 3D Crossed Utensils Brand Emblem */}
        <group position={[-1.65, 0, 0]} scale={[0.58, 0.58, 0.58]}>
          <LogoCrossedUtensils3D />
        </group>

        {/* 3D Extruded "SAVORIA" Lettering */}
        <Center position={[0.45, 0.05, 0]}>
          <Text3D
            font="/fonts/droid_serif_bold.typeface.json"
            size={0.36}
            height={0.08}
            curveSegments={10}
            bevelEnabled
            bevelThickness={0.016}
            bevelSize={0.012}
            letterSpacing={0.08}
          >
            SAVORIA
            <meshPhysicalMaterial
              color="#fff6dd"
              emissive="#b45309"
              emissiveIntensity={0.28}
              metalness={0.94}
              roughness={0.12}
              clearcoat={1.0}
            />
          </Text3D>
        </Center>

        {/* Gold Subtitle: HAUTE CUISINE */}
        <Center position={[0.45, -0.15, 0.04]}>
          <Text
            text="HAUTE CUISINE"
            fontSize={0.10}
            letterSpacing={0.30}
            anchorX="center"
            anchorY="middle"
          >
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#92400e"
              emissiveIntensity={0.3}
              metalness={0.92}
              roughness={0.2}
            />
          </Text>
        </Center>

        {/* Dedicated Warm Architectural Downlight on Signage */}
        <pointLight
          position={[0, 0.3, 0.8]}
          intensity={2.8}
          color="#ffedd5"
          distance={3.5}
        />
      </group>

      {/* ======================================================== */}
      {/* 4. CENTRAL CANDLELIT FINE DINING TABLE ENSEMBLE          */}
      {/* ======================================================== */}
      <group position={[0, -0.05, 0.8]}>
        {/* Table Wooden Pedestal Base */}
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.36, 0.55, 20]} />
          <meshStandardMaterial color="#1a1510" roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <cylinderGeometry args={[0.62, 0.68, 0.08, 24]} />
          <meshStandardMaterial color="#e6af5d" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Table Top Surface */}
        <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.25, 1.25, 0.04, 36]} />
          <meshStandardMaterial color="#12141c" roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Draped Ivory Linen Tablecloth */}
        <mesh position={[0, -0.08, 0]} receiveShadow>
          <cylinderGeometry args={[1.22, 1.28, 0.16, 36]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.88} />
        </mesh>

        {/* --- FINE CHINA CHARGER & SERVING PLATE --- */}
        <mesh position={[0, 0.015, 0.25]} receiveShadow castShadow>
          <cylinderGeometry args={[0.42, 0.34, 0.02, 32]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.12}
            metalness={0.05}
            clearcoat={0.95}
          />
        </mesh>
        {/* Charger Gold Filigree Rim */}
        <mesh position={[0, 0.026, 0.25]}>
          <torusGeometry args={[0.41, 0.008, 8, 32]} />
          <meshStandardMaterial color="#ffd700" metalness={0.96} roughness={0.1} />
        </mesh>

        {/* Gold Tableware (Dinner Knife & Fork) */}
        <mesh position={[0.48, 0.015, 0.25]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.028, 0.008, 0.42]} />
          <meshStandardMaterial color="#f5cf8e" metalness={0.95} roughness={0.12} />
        </mesh>
        <mesh position={[-0.48, 0.015, 0.25]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.028, 0.008, 0.42]} />
          <meshStandardMaterial color="#f5cf8e" metalness={0.95} roughness={0.12} />
        </mesh>

        {/* --- CRYSTAL WINE GOBLET --- */}
        <group position={[0.38, 0.14, -0.1]}>
          {/* Glass Base & Stem */}
          <mesh position={[0, -0.11, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.01, 16]} />
            <meshPhysicalMaterial color="#ffffff" transmission={0.92} opacity={1} roughness={0.05} ior={1.5} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.14, 12]} />
            <meshPhysicalMaterial color="#ffffff" transmission={0.92} opacity={1} roughness={0.05} ior={1.5} />
          </mesh>
          {/* Glass Bowl */}
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.09, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.3]} />
            <meshPhysicalMaterial color="#ffffff" transmission={0.92} opacity={1} roughness={0.05} ior={1.5} />
          </mesh>
        </group>

        {/* --- AMBIENT TABLE CANDLE IN FROSTED HURRICANE GLASS --- */}
        <group position={[0, 0.02, -0.2]}>
          {/* Brass Candle Dish Base */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.025, 20]} />
            <meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.18} />
          </mesh>
          {/* Wax Candle Pillar */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.14, 16]} />
            <meshStandardMaterial color="#fffbeb" roughness={0.7} />
          </mesh>
          {/* Flickering Flame Geometry */}
          <mesh position={[0, 0.18, 0]}>
            <coneGeometry args={[0.022, 0.065, 10]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          {/* Flame Core Glow */}
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshBasicMaterial color="#fffbeb" />
          </mesh>

          {/* Dynamic Flickering Candle Light */}
          <pointLight
            ref={candleLightRef}
            position={[0, 0.22, 0]}
            color="#fbbf24"
            intensity={1.4}
            distance={2.8}
            decay={2}
          />
        </group>
      </group>

      {/* ======================================================== */}
      {/* 5. GRAND CRU SUBTERRANEAN WINE DISPLAY (RIGHT WALL)       */}
      {/* ======================================================== */}
      <group position={[3.8, 1.4, -1.2]} rotation={[0, -Math.PI / 4, 0]}>
        {/* Wine Display Frame */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 2.6, 0.35]} />
          <meshStandardMaterial color="#0f1118" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Backlit Glass Shelves (Responsive shelf & bottle counts) */}
        {wineShelves.map((y, idx) => (
          <group key={idx} position={[0, y, 0]}>
            <mesh position={[0, 0, 0.08]}>
              <boxGeometry args={[1.4, 0.02, 0.25]} />
              <meshStandardMaterial color="#ffffff" opacity={0.8} transparent roughness={0.1} />
            </mesh>
            {/* Rows of Curated Vintage Wine Bottles with Gold Neck Capsules */}
            {wineBottles.map((bx, bIdx) => (
              <group key={bIdx} position={[bx, 0.14, 0.06]}>
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.038, 0.038, 0.22, 10]} />
                  {isMobile ? (
                    <meshStandardMaterial color="#1a2e1e" roughness={0.3} metalness={0.2} />
                  ) : (
                    <meshPhysicalMaterial color="#1a2e1e" roughness={0.2} metalness={0.3} clearcoat={0.9} />
                  )}
                </mesh>
                <mesh position={[0, 0.13, 0]}>
                  <cylinderGeometry args={[0.014, 0.022, 0.06, 10]} />
                  <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.12} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Amber Backlight in Wine Cellar Display */}
        <pointLight
          ref={wineGlowRef}
          position={[0, 0, 0.4]}
          color="#d97706"
          intensity={1.2}
          distance={2.5}
        />
      </group>

      {/* ======================================================== */}
      {/* 6. AMBIENT WALL SCONCES & VOLUMETRIC ATMOSPHERE          */}
      {/* ======================================================== */}
      {/* Left Wall Sconce */}
      <group position={[-3.8, 2.0, -1.2]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.3, 0.08]} />
          <meshStandardMaterial color="#e6af5d" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.08, 0.08]}>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 12]} />
          <meshBasicMaterial color="#fed7aa" />
        </mesh>
        <pointLight position={[0, 0.1, 0.2]} color="#f59e0b" intensity={1.6} distance={3.0} />
      </group>
    </group>
  );
};
