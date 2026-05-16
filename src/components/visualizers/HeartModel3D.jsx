import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useStream } from '../../context/StreamContext';

// ── Activation colour scale (Red=early → Purple=late) ────────────────────────
const STOPS = [
  [255, 0,   0  ],
  [255, 165, 0  ],
  [255, 255, 0  ],
  [0,   255, 0  ],
  [0,   0,   255],
  [128, 0,   128],
];

function activationColor(u) {
  const t  = Math.max(0, Math.min(1, u));
  const si = t * (STOPS.length - 1);
  const i  = Math.floor(si), j = Math.min(i + 1, STOPS.length - 1), f = si - i;
  const r  = Math.round(STOPS[i][0] + (STOPS[j][0] - STOPS[i][0]) * f);
  const g  = Math.round(STOPS[i][1] + (STOPS[j][1] - STOPS[i][1]) * f);
  const b  = Math.round(STOPS[i][2] + (STOPS[j][2] - STOPS[i][2]) * f);
  return new THREE.Color(`rgb(${r},${g},${b})`);
}

// ── Anatomical region label from normalised [0,1] coords ─────────────────────
function regionFromXYZ(x, y, z) {
  if (z > 0.72) return x < 0.5 ? 'LV Outflow Tract' : 'RV Outflow Tract';
  if (z < 0.25) return 'Ventricular Apex';
  if (x > 0.40 && x < 0.60) return 'Interventricular Septum';
  const ant = y < 0.35, inf = y > 0.65;
  if (x < 0.5) return ant ? 'LV Anterior Wall' : inf ? 'LV Inferior Wall' : 'LV Lateral Wall';
  return ant ? 'RV Anterior Wall' : 'RV Free Wall';
}

// ── Anatomical heart (heart.glb) with live activation coloring ───────────────
function Heart({ bbRef }) {
  const { scene }   = useGLTF('/models/heart.glb');
  const { events }  = useStream();
  const meshRef     = useRef();
  const activRef    = useRef(0);   // latest activation value for useFrame
  const baseColorRef = useRef({}); // store original material colors

  // Clone materials + capture bounding box once
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (!child.material.__cloned) {
        child.material = child.material.clone();
        child.material.__cloned = true;
      }
      if (!child.material.emissive) child.material.emissive = new THREE.Color(0x000000);
      child.material.emissiveIntensity = 0.25;
      child.material.roughness = Math.max(child.material.roughness ?? 0.5, 0.4);
      child.material.metalness = Math.min(child.material.metalness ?? 0, 0.15);
      // Save original colour for reset
      baseColorRef.current[child.uuid] = child.material.color.clone();
    });

    // Compute bounding box in LOCAL space, accounting for scale=1.5 applied to primitive
    const bb = new THREE.Box3().setFromObject(scene);
    bbRef.current = { bb, scale: 1.5 };
  }, [scene, bbRef]);

  // High-freq activation updates (20 Hz from WebSocket)
  useEffect(() => {
    const handler = (e) => {
      const u = e.detail?.leads?.lead_i ?? e.detail?.u;
      if (u == null) return;
      activRef.current = u;
      const color = activationColor(u);
      scene?.traverse((child) => {
        if (!child.isMesh) return;
        child.material.color.lerp(color, 0.25);
        child.material.emissive.lerp(color, 0.12);
        child.material.emissiveIntensity = 0.2 + Math.abs(u) * 0.45;
      });
    };
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
  }, [events, scene]);

  // Heartbeat pulse: ~72 BPM = 1.2 Hz
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const beat = 1 + Math.sin(t * Math.PI * 1.2) * 0.022 * (1 + Math.abs(activRef.current) * 0.4);
    meshRef.current.scale.setScalar(1.5 * beat);
  });

  return <primitive ref={meshRef} object={scene} scale={1.5} />;
}

// ── Pulsing source hotspot ────────────────────────────────────────────────────
function PulsingHotspot({ bbRef, onUpdate }) {
  const groupRef  = useRef();
  const ring1Ref  = useRef();
  const ring2Ref  = useRef();
  const posRef    = useRef({ tx: 0, ty: 0, tz: 0 });
  const [visible, setVisible] = useState(false);
  const cbRef     = useRef(onUpdate);
  cbRef.current   = onUpdate;
  const { events } = useStream();

  useEffect(() => {
    const handler = (e) => {
      const coords = e.detail?.localization_coords;
      const conf   = e.detail?.ai_confidence ?? 0;
      if (!coords || !bbRef.current) return;

      const { bb, scale } = bbRef.current;
      const mn = bb.min.clone().multiplyScalar(scale);
      const mx = bb.max.clone().multiplyScalar(scale);

      posRef.current = {
        tx: mn.x + coords.x * (mx.x - mn.x),
        ty: mn.y + coords.y * (mx.y - mn.y),
        tz: mn.z + coords.z * (mx.z - mn.z),
      };
      setVisible(true);

      // Convert normalised → mm for display (cardiac mesh bounds)
      const BOUNDS_MM = { x: 103.2, y: 92.2, z: 72.0 };
      cbRef.current?.({
        coords,
        mm: {
          x: (coords.x * BOUNDS_MM.x).toFixed(1),
          y: (coords.y * BOUNDS_MM.y).toFixed(1),
          z: (coords.z * BOUNDS_MM.z).toFixed(1),
        },
        region:     regionFromXYZ(coords.x, coords.y, coords.z),
        confidence: Math.round(conf * 100),
      });
    };
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
  }, [events, bbRef]);

  useFrame(({ clock }) => {
    if (!visible || !groupRef.current) return;
    const { tx, ty, tz } = posRef.current;
    groupRef.current.position.set(tx, ty, tz);
    const t = clock.getElapsedTime();
    [ring1Ref, ring2Ref].forEach((ref, i) => {
      if (!ref.current) return;
      const phase = ((t * 1.1 + i * 0.55) % 1.2) / 1.2;
      ref.current.scale.setScalar(1 + phase * 3.2);
      ref.current.material.opacity = (1 - phase) * 0.8;
    });
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Bright core */}
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#fffb00" emissiveIntensity={10} toneMapped={false} />
      </mesh>
      {/* Ring 1 */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[0.06, 0.085, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Ring 2 */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[0.06, 0.085, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color="#00e5ff" intensity={5} distance={1.2} />
    </group>
  );
}

// ── Source info overlay ───────────────────────────────────────────────────────
function SourcePanel({ info }) {
  if (!info) return null;
  const { region, mm, confidence } = info;
  const cc = confidence >= 80 ? '#22c55e' : confidence >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{
      position: 'absolute', top: 12, left: 12,
      background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(239,68,68,0.5)', borderRadius: 10,
      padding: '10px 14px', color: '#fff', fontSize: 12,
      fontFamily: 'ui-monospace,monospace', minWidth: 215, zIndex: 10, pointerEvents: 'none',
    }}>
      <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 10, letterSpacing: 1.5, marginBottom: 6 }}>
        ● SOURCE LOCALIZATION
      </div>
      <div style={{ color: '#f97316', fontWeight: 700, fontSize: 14, marginBottom: 10, lineHeight: 1.3 }}>
        {region}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5e1', fontSize: 11 }}>
        {[['X (L→R)', mm.x], ['Y (Ant→Post)', mm.y], ['Z (Apex→Base)', mm.z]].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>{l}</span>
            <span>{v} mm</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: '#64748b', fontSize: 11 }}>AI Confidence</span>
        <span style={{ color: cc, fontWeight: 700, fontSize: 13 }}>{confidence}%</span>
      </div>
    </div>
  );
}

// ── Activation legend ─────────────────────────────────────────────────────────
function ColorLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
      padding: '7px 12px', fontSize: 11, fontFamily: 'ui-monospace,monospace',
      color: '#94a3b8', zIndex: 10, pointerEvents: 'none',
    }}>
      <div style={{ marginBottom: 5, color: '#475569', letterSpacing: 1, fontSize: 10 }}>ACTIVATION MAP</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color: '#ef4444', fontSize: 10 }}>Early</span>
        <div style={{
          width: 64, height: 6, borderRadius: 3,
          background: 'linear-gradient(to right,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)',
        }} />
        <span style={{ color: '#a855f7', fontSize: 10 }}>Late</span>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const HeartModel3D = () => {
  const [sourceInfo, setSourceInfo] = useState(null);
  const bbRef = useRef(null);

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative">
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 4], fov: 42 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        scene={{ background: new THREE.Color(0x080b14) }}
      >
        <Suspense fallback={null}>
          {/* Lighting for realistic cardiac tissue */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 4]}   intensity={1.2} castShadow />
          <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#6366f1" />
          <pointLight       position={[0, 4, 1]}    intensity={0.6}  color="#0ea5e9" />
          <pointLight       position={[2, -3, 2]}   intensity={0.3}  color="#ef4444" />
          <Environment preset="night" />

          <Heart bbRef={bbRef} />
          <PulsingHotspot bbRef={bbRef} onUpdate={setSourceInfo} />
          <OrbitControls enableZoom minDistance={2} maxDistance={8} autoRotate autoRotateSpeed={0.6} />
        </Suspense>
      </Canvas>
      <SourcePanel info={sourceInfo} />
      <ColorLegend />
    </div>
  );
};

export default HeartModel3D;
