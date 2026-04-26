import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage, Html } from '@react-three/drei';
import { useStream } from '../../context/StreamContext';

function Heart() {
  const { scene } = useGLTF('/models/heart.glb');
  return <primitive object={scene} scale={1.5} />;
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
        color="#0ea5e9" 
        emissive="#0ea5e9" 
        emissiveIntensity={2} 
        transparent 
        opacity={0.6} 
      />
      <pointLight color="#0ea5e9" intensity={1} distance={0.5} />
    </mesh>
  );
}

const HeartModel3D = () => {
  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative">
      <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: false }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <Heart />
            <Hotspot />
          </Stage>
          <OrbitControls enableZoom={true} autoRotate={true} autoRotateSpeed={1} />
        </Suspense>
      </Canvas>
    </div>
  );
};

useGLTF.preload('/models/heart.glb');
export default HeartModel3D;