import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStream } from '../../context/StreamContext';

function regionFromXYZ(x, y, z) {
  if (z > 0.72) return x < 0.5 ? 'LV Outflow Tract' : 'RV Outflow Tract';
  if (z < 0.25) return 'Ventricular Apex';
  if (x > 0.40 && x < 0.60) return 'Interventricular Septum';
  const ant = y < 0.35, inf = y > 0.65;
  if (x < 0.5) return ant ? 'LV Anterior Wall' : inf ? 'LV Inferior Wall' : 'LV Lateral Wall';
  return ant ? 'RV Anterior Wall' : 'RV Free Wall';
}

function riskFromRegion(region) {
  if (region.includes('Anterior') || region.includes('Septum')) return 'HIGH';
  if (region.includes('Inferior') || region.includes('Lateral')) return 'MODERATE';
  return 'LOW';
}

// ── Heart — natural GLB color, QRS glow pulse only ───────────────────────────
function Heart({ bbRef }) {
  const { scene }  = useGLTF('/models/heart.glb');
  const { events } = useStream();
  const meshRef    = useRef();
  const qrsRef     = useRef(0); // 0–1 glow pulse triggered by QRS

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (!child.material.__cloned) {
        child.material = child.material.clone();
        child.material.__cloned = true;
      }
      if (!child.material.emissive) child.material.emissive = new THREE.Color(0x000000);
      child.material.emissiveIntensity = 0.18;
      child.material.roughness = Math.max(child.material.roughness ?? 0.5, 0.45);
      child.material.metalness = Math.min(child.material.metalness ?? 0, 0.10);
    });
    const bb = new THREE.Box3().setFromObject(scene);
    bbRef.current = { bb, scale: 1.5 };
  }, [scene, bbRef]);

  // QRS glow pulse — triggered when server detects R-wave
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.qrs_detected) qrsRef.current = 1.0;
    };
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
  }, [events]);

  useFrame(({ clock }, dt) => {
    if (!meshRef.current) return;
    // Heartbeat scale pulse
    const t    = clock.getElapsedTime();
    const beat = 1 + Math.sin(t * Math.PI * 1.2) * 0.022;
    meshRef.current.scale.setScalar(1.5 * beat);
    // Decay QRS glow
    qrsRef.current = Math.max(0, qrsRef.current - dt * 3.5);
    scene?.traverse((child) => {
      if (!child.isMesh) return;
      child.material.emissiveIntensity = 0.18 + qrsRef.current * 0.55;
    });
  });

  return <primitive ref={meshRef} object={scene} scale={1.5} />;
}

// ── Map-pin style localization marker ────────────────────────────────────────
function PinMarker({ bbRef, onUpdate }) {
  const groupRef   = useRef();
  const posRef     = useRef(null);
  const [info, setInfo]     = useState(null);
  const { events } = useStream();

  useEffect(() => {
    const handler = (e) => {
      const coords = e.detail?.localization_coords;
      const conf   = e.detail?.ai_confidence ?? 0;
      if (!coords || !bbRef.current) return;

      const { bb, scale } = bbRef.current;
      const mn = bb.min.clone().multiplyScalar(scale);
      const mx = bb.max.clone().multiplyScalar(scale);

      posRef.current = new THREE.Vector3(
        mn.x + coords.x * (mx.x - mn.x),
        mn.y + coords.y * (mx.y - mn.y),
        mn.z + coords.z * (mx.z - mn.z),
      );

      const BOUNDS_MM = { x: 103.2, y: 92.2, z: 72.0 };
      const region = regionFromXYZ(coords.x, coords.y, coords.z);
      const nextInfo = {
        coords,
        mm: {
          x: (coords.x * BOUNDS_MM.x).toFixed(1),
          y: (coords.y * BOUNDS_MM.y).toFixed(1),
          z: (coords.z * BOUNDS_MM.z).toFixed(1),
        },
        region,
        risk: riskFromRegion(region),
        confidence: Math.round(conf * 100),
      };
      setInfo(nextInfo);
      onUpdate?.(nextInfo);
    };
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
  }, [events, bbRef, onUpdate]);

  // Smoothly move pin to target position
  useFrame(() => {
    if (!groupRef.current || !posRef.current) return;
    groupRef.current.position.lerp(posRef.current, 0.06);
  });

  if (!info) return null;

  const riskColor = info.risk === 'HIGH' ? '#ef4444' : info.risk === 'MODERATE' ? '#f59e0b' : '#22c55e';

  return (
    <group ref={groupRef} renderOrder={999}>
      {/* Base pulse ring — always visible (depthTest=false) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={999}>
        <ringGeometry args={[0.12, 0.18, 48]} />
        <meshBasicMaterial color={riskColor} transparent opacity={0.9} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={998}>
        <ringGeometry args={[0.19, 0.26, 48]} />
        <meshBasicMaterial color={riskColor} transparent opacity={0.45} depthTest={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Pin stick */}
      <mesh position={[0, 0.45, 0]} renderOrder={999}>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 8]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </mesh>

      {/* Pin head (sphere on top) */}
      <mesh position={[0, 0.74, 0]} renderOrder={999}>
        <sphereGeometry args={[0.075, 20, 20]} />
        <meshBasicMaterial color={riskColor} depthTest={false} />
      </mesh>
      {/* Inner bright core */}
      <mesh position={[0, 0.74, 0]} renderOrder={999}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </mesh>

      {/* HTML label — always faces camera */}
      <Html
        position={[0.28, 0.80, 0]}
        distanceFactor={5}
        style={{ pointerEvents: 'none' }}
        occlude={false}
      >
        <div style={{
          background: 'rgba(4,10,24,0.92)',
          backdropFilter: 'blur(12px)',
          border: `1.5px solid ${riskColor}`,
          borderRadius: 8,
          padding: '6px 10px',
          color: '#fff',
          fontFamily: 'ui-monospace,monospace',
          whiteSpace: 'nowrap',
          lineHeight: 1.5,
          boxShadow: `0 0 16px ${riskColor}44`,
        }}>
          <div style={{ color: riskColor, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 2 }}>
            ⬤ {info.risk} RISK
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
            {info.region}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            {info.mm.x} / {info.mm.y} / {info.mm.z} mm
          </div>
          <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginTop: 3 }}>
            AI {info.confidence}%
          </div>
        </div>
      </Html>

      {/* Local light for glow effect */}
      <pointLight color={riskColor} intensity={12} distance={2.0} />
    </group>
  );
}

function ColorLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12,
      background: 'rgba(4,10,24,0.80)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
      padding: '7px 12px', fontFamily: 'ui-monospace,monospace',
      color: '#94a3b8', zIndex: 10, pointerEvents: 'none',
    }}>
      <div style={{ marginBottom: 4, color: '#475569', fontSize: 9, fontWeight: 700, letterSpacing: 1.2 }}>
        RISK LEVEL
      </div>
      {[['#ef4444','HIGH — Anterior/Septal'], ['#f59e0b','MODERATE — Lateral/Inferior'], ['#22c55e','LOW — Other']].map(([c,l]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: '#64748b' }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

const HeartModel3D = () => {
  const [sourceInfo, setSourceInfo] = useState(null);
  const bbRef = useRef(null);

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative">
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 4], fov: 42 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        scene={{ background: new THREE.Color(0x040a18) }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 5, 4]}   intensity={1.3} castShadow />
          <directionalLight position={[-4, -2, -3]} intensity={0.3} color="#8b5cf6" />
          <pointLight       position={[0, 4, 1]}    intensity={0.5} color="#e2e8f0" />
          <Heart bbRef={bbRef} />
          <PinMarker bbRef={bbRef} onUpdate={setSourceInfo} />
          <OrbitControls enableZoom minDistance={2} maxDistance={8} autoRotate autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>
      <ColorLegend />
    </div>
  );
};

export default HeartModel3D;
