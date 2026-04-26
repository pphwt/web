import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';

// ส่วนที่ไปดึงไฟล์สมองมาจาก public/models/brain.glb
function Brain() {
  // ⚠️ The brain.glb file is corrupted (contains "404: Not Found").
  // Temporarily falling back to heart.glb to prevent the app from crashing.
  const { scene } = useGLTF('/models/heart.glb');
  return <primitive object={scene} scale={1.5} />;
}

const BrainModel3D = () => {
  return (
    <div className="w-full h-full bg-[#4B5162] overflow-hidden relative border-none">
      <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <Brain />
          </Stage>
          <OrbitControls
            enableZoom={true}
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default BrainModel3D;