import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStream } from '../../context/StreamContext';

function Heart() {
  const { scene } = useGLTF('/models/heart.glb');
  const { events } = useStream();
  const heartRef = useRef();

  const getRainbowColor = (u) => {
    // Medical Standard Activation Scale: Red (Early/0) -> Purple (Late/1)
    const normalized = Math.max(0, Math.min(1, u));
    const colors = [
        { r: 255, g: 0, b: 0 },    // Red (Focus)
        { r: 255, g: 165, b: 0 },  // Orange
        { r: 255, g: 255, b: 0 },  // Yellow
        { r: 0, g: 255, b: 0 },    // Green
        { r: 0, g: 0, b: 255 },    // Blue
        { r: 128, g: 0, b: 128 }   // Purple (Late)
    ];
    const scaledIdx = normalized * (colors.length - 1);
    const idx = Math.floor(scaledIdx);
    const nextIdx = Math.min(idx + 1, colors.length - 1);
    const factor = scaledIdx - idx;
    const r = Math.round(colors[idx].r + (colors[nextIdx].r - colors[idx].r) * factor);
    const g = Math.round(colors[idx].g + (colors[nextIdx].g - colors[idx].g) * factor);
    const b = Math.round(colors[idx].b + (colors[nextIdx].b - colors[idx].b) * factor);
    return new THREE.Color(`rgb(${r},${g},${b})`);
  };

  useEffect(() => {
    const handleData = (e) => {
      const payload = e.detail;
      if (payload && payload.u !== undefined && scene) {
        scene.traverse((child) => {
          if (child.isMesh) {
            const targetColor = getRainbowColor(payload.u);
            child.material.color.lerp(targetColor, 0.3);
            child.material.emissive = targetColor;
            child.material.emissiveIntensity = payload.u * 0.5;
          }
        });
      }
    };
    if (events) {
      events.addEventListener('data', handleData);
      return () => events.removeEventListener('data', handleData);
    }
  }, [events, scene]);

  return <primitive object={scene} scale={1.5} ref={heartRef} />;
}

function Hotspot() {
  const meshRef = useRef();
  const { events } = useStream();

  useEffect(() => {
    const handleData = (e) => {
      const payload = e.detail;
      if (payload && payload.localization_coords && meshRef.current) {
        const { x, y, z } = payload.localization_coords;
        meshRef.current.position.set(
          (x - 0.5) * 1.5,
          (y - 0.5) * 1.5,
          (z - 0.5) * 1.5
        );
      }
    };
    if (events) {
      events.addEventListener('data', handleData);
      return () => events.removeEventListener('data', handleData);
    }
  }, [events]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial 
        color="#ff0000" 
        emissive="#ff0000" 
        emissiveIntensity={4} 
        transparent 
        opacity={0.8} 
      />
      <pointLight color="#ff0000" intensity={2} distance={1.0} />
    </mesh>
  );
}

const HeartModel3D = () => {
  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative">
      <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.0} />
          <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#6366f1" />
          <pointLight position={[0, 3, 0]} intensity={0.5} color="#0ea5e9" />
          <Heart />
          <Hotspot />
          <OrbitControls enableZoom={true} autoRotate={false} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HeartModel3D;