import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

const HeartShape = () => {
  const mesh = useRef();
  
  // ทำให้หัวใจมีการขยับเล็กน้อยเหมือนมีการเต้น
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.scale.x = 1 + Math.sin(t * 2) * 0.05;
    mesh.current.scale.y = 1 + Math.sin(t * 2) * 0.05;
    mesh.current.scale.z = 1 + Math.sin(t * 2) * 0.05;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh}>
        {/* ตรงนี้ถ้าคุณมีไฟล์ .glb ของหัวใจจริง สามารถใช้ useGLTF โหลดมาแทนได้ครับ */}
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#7f1d1d" 
          roughness={0.2} 
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
};

const HeartModel3D = () => {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
      
      <HeartShape />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
};

export default HeartModel3D;
