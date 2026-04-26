import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage, Float } from '@react-three/drei';
import { useStream } from '../../context/StreamContext';

function Brain() {
  const { scene } = useGLTF('/models/RottenBrain.glb');
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.opacity = 0.5;
        child.material.color.set("#94a3b8");
        child.material.roughness = 0.2;
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
        (z - 0.5) * 2.5
      );
    }
  }, [data]);

  return (
    <group ref={meshRef}>
      {/* High-intensity Neurological Focus */}
      <mesh>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial 
          color="#0ea5e9" 
          emissive="#0ea5e9" 
          emissiveIntensity={10} 
          toneMapped={false}
        />
      </mesh>
      
      {/* Neural Glow Aura */}
      <mesh scale={2.5}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial 
          color="#0ea5e9" 
          transparent 
          opacity={0.15} 
          emissive="#0ea5e9" 
          emissiveIntensity={2}
        />
      </mesh>
      
      <pointLight color="#0ea5e9" intensity={3} distance={2} />
    </group>
  );
}

const BrainModel3D = () => {
  return (
    <div className="w-full h-full bg-black/5 rounded-[2.5rem] overflow-hidden relative border border-sky-500/10">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 40 }}>
        <color attach="background" args={['#070b14']} />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.2} contactShadow={false}>
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
               <Brain />
               <NeuroSpike />
            </Float>
          </Stage>
          <OrbitControls 
            enableZoom={true} 
            autoRotate={true} 
            autoRotateSpeed={0.3}
            maxDistance={10}
            minDistance={2}
          />
        </Suspense>
      </Canvas>
      
      {/* HUD Info */}
      <div className="absolute top-6 left-6 p-4 bg-sky-500/10 border border-sky-500/20 backdrop-blur-md rounded-2xl">
          <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-1 italic text-center">Neural Activity Map</p>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
             <span className="text-[9px] font-bold text-white/60">Live Signal Localization</span>
          </div>
      </div>
    </div>
  );
};

useGLTF.preload('/models/RottenBrain.glb');
export default BrainModel3D;