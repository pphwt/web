import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStream } from '../../context/StreamContext';

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

function Heart({ bbRef }) {
  const { scene }    = useGLTF('/models/heart.glb');
  const { events }   = useStream();
  const meshRef      = useRef();
  const activRef     = useRef(0);
  const baseColorRef = useRef({});

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
      baseColorRef.current[child.uuid] = child.material.color.clone();
    });

    const bb = new THREE.Box3().setFromObject(scene);
    bbRef.current = { bb, scale: 1.5 };
  }, [scene, bbRef]);

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

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const beat = 1 + Math.sin(t * Math.PI * 1.2) * 0.022 * (1 + Math.abs(activRef.current) * 0.4);
    meshRef.current.scale.setScalar(1.5 * beat);
  });

  return <primitive ref={meshRef} object={scene} scale={1.5} />;
}

// ── Pulsing 3D source hotspot (torus rings — visible from all angles) ─────────
function PulsingHotspot({ bbRef, onUpdate }) {
  const groupRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const posRef   = useRef({ tx: 0, ty: 0, tz: 0 });
  const [visible, setVisible] = useState(false);
  const cbRef    = useRef(onUpdate);
  cbRef.current  = onUpdate;
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
    // Three rings staggered in phase
    [ring1Ref, ring2Ref, ring3Ref].forEach((ref, i) => {
      if (!ref.current) return;
      const phase = ((t * 1.0 + i * 0.4) % 1.4) / 1.4;
      ref.current.scale.setScalar(1 + phase * 2.8);
      ref.current.material.opacity = (1 - phase) * 0.9;
    });
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Outer glow halo */}
      <mesh>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* Core sphere */}
      <mesh>
        <sphereGeometry args={[0.10, 20, 20]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ff3300"
          emissiveIntensity={18}
          toneMapped={false}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Torus ring 1 — XY plane */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.22, 0.016, 8, 48]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.9} depthWrite={false} />
      </mesh>

      {/* Torus ring 2 — XZ plane */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.016, 8, 48]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.8} depthWrite={false} />
      </mesh>

      {/* Torus ring 3 — YZ plane */}
      <mesh ref={ring3Ref} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.22, 0.016, 8, 48]} />
        <meshBasicMaterial color="#ffff00" transparent opacity={0.7} depthWrite={false} />
      </mesh>

      {/* Vertical spike (beacon) */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.004, 0.018, 0.28, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#00e5ff" />
      </mesh>

      {/* Lights */}
      <pointLight color="#00e5ff" intensity={25} distance={3.0} />
      <pointLight color="#ff3300" intensity={10} distance={1.2} />
    </group>
  );
}

// ── Clinical source info overlay ──────────────────────────────────────────────
function SourcePanel({ info }) {
  if (!info) return null;
  const { region, mm, confidence } = info;
  const risk = riskFromRegion(region);
  const riskColor = risk === 'HIGH' ? '#ef4444' : risk === 'MODERATE' ? '#f59e0b' : '#22c55e';
  const confColor = confidence >= 80 ? '#22c55e' : confidence >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      position: 'absolute', top: 12, left: 12,
      background: 'rgba(4,10,24,0.88)', backdropFilter: 'blur(14px)',
      border: `1px solid ${riskColor}55`, borderRadius: 12,
      padding: '12px 16px', color: '#fff',
      fontFamily: 'ui-monospace,monospace', minWidth: 230, zIndex: 10, pointerEvents: 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: riskColor, boxShadow: `0 0 6px ${riskColor}`,
          }} />
          <span style={{ color: riskColor, fontWeight: 700, fontSize: 9, letterSpacing: 1.8 }}>
            SOURCE LOCALIZATION
          </span>
        </div>
        <span style={{
          background: riskColor + '22', border: `1px solid ${riskColor}44`,
          color: riskColor, fontSize: 9, fontWeight: 700,
          padding: '2px 7px', borderRadius: 4, letterSpacing: 0.8,
        }}>
          {risk} RISK
        </span>
      </div>

      {/* Region name */}
      <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15, marginBottom: 10, letterSpacing: 0.3 }}>
        {region}
      </div>

      {/* Coordinates */}
      <div style={{ fontSize: 11, marginBottom: 10 }}>
        <div style={{ color: '#475569', fontSize: 9, letterSpacing: 1.2, marginBottom: 5, fontWeight: 600 }}>
          3D COORDINATES (mm)
        </div>
        {[['X  (L→R)', mm.x], ['Y  (Ant→Post)', mm.y], ['Z  (Apex→Base)', mm.z]].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#64748b' }}>{l}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{v} mm</span>
          </div>
        ))}
      </div>

      {/* AI Confidence bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
          <span style={{ color: '#64748b', fontSize: 10 }}>AI Confidence</span>
          <span style={{ color: confColor, fontWeight: 800, fontSize: 14 }}>{confidence}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{
            height: '100%', width: `${confidence}%`,
            background: `linear-gradient(to right, ${confColor}88, ${confColor})`,
            borderRadius: 2, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>
    </div>
  );
}

function ColorLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12,
      background: 'rgba(4,10,24,0.75)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
      padding: '7px 12px', fontSize: 11, fontFamily: 'ui-monospace,monospace',
      color: '#94a3b8', zIndex: 10, pointerEvents: 'none',
    }}>
      <div style={{ marginBottom: 5, color: '#475569', letterSpacing: 1.2, fontSize: 9, fontWeight: 600 }}>
        ACTIVATION MAP
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color: '#ef4444', fontSize: 10 }}>Early</span>
        <div style={{
          width: 70, height: 6, borderRadius: 3,
          background: 'linear-gradient(to right,#ef4444,#f97316,#eab308,#22c55e,#3b82f6,#a855f7)',
        }} />
        <span style={{ color: '#a855f7', fontSize: 10 }}>Late</span>
      </div>
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
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        scene={{ background: new THREE.Color(0x040a18) }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 4]}   intensity={1.2} castShadow />
          <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#6366f1" />
          <pointLight       position={[0, 4, 1]}    intensity={0.6}  color="#0ea5e9" />
          <pointLight       position={[2, -3, 2]}   intensity={0.3}  color="#ef4444" />
          <Heart bbRef={bbRef} />
          <PulsingHotspot bbRef={bbRef} onUpdate={setSourceInfo} />
          <OrbitControls enableZoom minDistance={2} maxDistance={8} autoRotate autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>
      <SourcePanel info={sourceInfo} />
      <ColorLegend />
    </div>
  );
};

export default HeartModel3D;
