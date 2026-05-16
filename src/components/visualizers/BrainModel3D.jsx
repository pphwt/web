import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Float } from '@react-three/drei';
import { useStream } from '../../context/StreamContext';
import { useTheme } from '../../context/ThemeContext';

function Brain() {
  const { scene } = useGLTF('/models/RottenBrain.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0.55;
        child.material.color.set('#94a3b8');
        child.material.roughness = 0.25;
        child.material.metalness = 0.1;
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={2.5} position={[0, -0.5, 0]} />;
}

function NeuroSpike() {
  const meshRef = useRef();
  const { data } = useStream();

  useEffect(() => {
    if (data?.localization && meshRef.current) {
      const { x, y, z } = data.localization;
      meshRef.current.position.set(
        (x - 0.5) * 2.5,
        (y - 0.5) * 2.5,
        (z - 0.5) * 2.5,
      );
    }
  }, [data]);

  return (
    <group ref={meshRef}>
      <mesh>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={10} toneMapped={false} />
      </mesh>
      <mesh scale={2.5}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.12} emissive="#0ea5e9" emissiveIntensity={2} />
      </mesh>
      <pointLight color="#0ea5e9" intensity={3} distance={2} />
    </group>
  );
}

const BrainModel3D = () => {
  const { isDarkMode: dk } = useTheme();
  return (
  <div className={`w-full h-full rounded-2xl overflow-hidden relative border ${dk ? 'border-white/[0.06]' : 'border-slate-200'}`}>
    <Canvas shadows camera={{ position: [0, 0, 5], fov: 40 }}>
      <color attach="background" args={[dk ? '#060d18' : '#eef2f7']} />
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.0} />
        <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#4f46e5" />
        <pointLight position={[0, 3, 0]} intensity={0.4} color="#0ea5e9" />
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <Brain />
          <NeuroSpike />
        </Float>
        <OrbitControls
          enableZoom
          autoRotate
          autoRotateSpeed={0.4}
          maxDistance={10}
          minDistance={2}
        />
      </Suspense>
    </Canvas>

    <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl border border-sky-500/20 bg-black/40 backdrop-blur-md px-3 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
      <span className="text-[10px] font-semibold text-sky-300">Live Localization</span>
    </div>
  </div>
  );
};

useGLTF.preload('/models/RottenBrain.glb');
export default BrainModel3D;
