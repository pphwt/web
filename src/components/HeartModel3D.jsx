import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Float } from '@react-three/drei';

const HeartShape = () => {
  const meshRef = useRef();

  // 1. โหลดโมเดลจากโฟลเดอร์ public
  // เปลี่ยน path เป็นที่อยู่ไฟล์ของคุณ
  const { scene } = useGLTF('/models/heart.glb');

  // 2. ใส่ Animation การเต้น (Beat)
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // ใช้สูตร Math.sin เพื่อสร้างจังหวะขยับ
    const scale = 1 + Math.sin(t * 3) * 0.05;
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  // 3. แสดงผลโมเดลโดยใช้ <primitive />
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <primitive
        ref={meshRef}
        object={scene}
        scale={1.5} // ปรับขนาดเริ่มต้นตามความเหมาะสมของไฟล์
        position={[0, 0, 0]}
      />
    </Float>
  );
};

const HeartModel3D = () => {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />

        <HeartShape />

        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
};

// ช่วยจอง Memory และทำให้โหลดเร็วขึ้น
useGLTF.preload('/models/heart.glb');

export default HeartModel3D;