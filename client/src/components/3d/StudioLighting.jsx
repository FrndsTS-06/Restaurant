import React from 'react';
import { ContactShadows } from '@react-three/drei';

export const StudioLighting = () => {
  return (
    <>
      {/* Soft Ambient Fill */}
      <ambientLight intensity={0.45} color="#1a1e28" />

      {/* Main Warm Key Light */}
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.7}
        color="#fff4db"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
      />

      {/* Cool Slate Fill Light */}
      <pointLight position={[-4, 2, -3]} intensity={0.65} color="#94a3b8" />

      {/* Dramatic Golden Overhead Spotlight */}
      <spotLight
        position={[0, 7, 2]}
        intensity={2.2}
        color="#e6af5d"
        angle={0.65}
        penumbra={0.8}
      />

      {/* Warm Gold Rim Light from Behind */}
      <pointLight position={[2, 3, -4]} intensity={1.1} color="#f5cf8e" />

      {/* Realistic Soft Contact Shadow on Pedestal Base (Baked once with frames={1}) */}
      <ContactShadows
        position={[0, -1.18, 0]}
        opacity={0.75}
        scale={5.5}
        blur={2.4}
        far={3.5}
        frames={1}
        color="#000000"
      />
    </>
  );
};
