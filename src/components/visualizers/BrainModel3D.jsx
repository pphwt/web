import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';
import { useStream } from '../../context/StreamContext';

function Brain() {
  const { scene } = useGLTF('/models/RottenBrain.glb');
  return <primitive object={scene} scale={1.8} />;
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
          (x - 0.5) * 2,
          (y - 0.5) * 2,
          (z - 0.5) * 2
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
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial 
        color="#fb7185" 
        emissive="#fb7185" 
        emissiveIntensity={2} 
        transparent 
        opacity={0.6} 
      />
      <pointLight color="#fb7185" intensity={1} distance={0.5} />
    </mesh>
  );
}

const BrainModel3D = () => {
  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative border-none">
      <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: false }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <Brain />
            <Hotspot />
          </Stage>
          <OrbitControls enableZoom={true} autoRotate={true} autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>
    </div>
  );
};

useGLTF.preload('/models/RottenBrain.glb');
export default BrainModel3D;