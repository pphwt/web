import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStream } from '../../context/StreamContext';

// ── Activation colour scale (Red = early, Purple = late) ─────────────────────
const COLOUR_STOPS = [
  { r: 255, g: 0,   b: 0   },
  { r: 255, g: 165, b: 0   },
  { r: 255, g: 255, b: 0   },
  { r: 0,   g: 255, b: 0   },
  { r: 0,   g: 0,   b: 255 },
  { r: 128, g: 0,   b: 128 },
];

function activationColor(u) {
  const t  = Math.max(0, Math.min(1, u));
  const si = t * (COLOUR_STOPS.length - 1);
  const i  = Math.floor(si);
  const j  = Math.min(i + 1, COLOUR_STOPS.length - 1);
  const f  = si - i;
  const r  = Math.round(COLOUR_STOPS[i].r + (COLOUR_STOPS[j].r - COLOUR_STOPS[i].r) * f);
  const g  = Math.round(COLOUR_STOPS[i].g + (COLOUR_STOPS[j].g - COLOUR_STOPS[i].g) * f);
  const b  = Math.round(COLOUR_STOPS[i].b + (COLOUR_STOPS[j].b - COLOUR_STOPS[i].b) * f);
  return new THREE.Color(`rgb(${r},${g},${b})`);
}

// ── Anatomical region from normalised [0,1] coords ────────────────────────────
function regionFromXYZ(x, y, z) {
  const isLeft     = x < 0.50;
  const isApex     = z < 0.25;
  const isBase     = z > 0.72;
  const isSeptal   = x > 0.40 && x < 0.60;
  const isAnterior = y < 0.35;
  const isInferior = y > 0.65;

  if (isBase)   return isLeft ? 'LV Outflow Tract' : 'RV Outflow Tract';
  if (isApex)   return 'Ventricular Apex';
  if (isSeptal) return 'Interventricular Septum';
  if (isLeft)   return isAnterior ? 'LV Anterior Wall' : isInferior ? 'LV Inferior Wall' : 'LV Lateral Wall';
  return isAnterior ? 'RV Anterior Wall' : 'RV Free Wall';
}

// ── Cardiac mesh loaded from exported VTK surface ────────────────────────────
function CardiacMesh({ meshData }) {
  const meshRef   = useRef();
  const matRef    = useRef();
  const { events } = useStream();

  const geometry = useMemo(() => {
    if (!meshData) return null;
    const { vertices, indices, bounds } = meshData;

    // Centre and normalise to [-1,1] for Three.js
    const cx = (bounds.xMin + bounds.xMax) / 2;
    const cy = (bounds.yMin + bounds.yMax) / 2;
    const cz = (bounds.zMin + bounds.zMax) / 2;
    const scale = 2 / Math.max(
      bounds.xMax - bounds.xMin,
      bounds.yMax - bounds.yMin,
      bounds.zMax - bounds.zMin,
    );

    const verts = new Float32Array(vertices.length);
    for (let i = 0; i < vertices.length; i += 3) {
      verts[i]     = (vertices[i]     - cx) * scale;
      verts[i + 1] = (vertices[i + 1] - cy) * scale;
      verts[i + 2] = (vertices[i + 2] - cz) * scale;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [meshData]);

  // Colour-map by PINN activation signal
  useEffect(() => {
    const handleData = (e) => {
      const u = e.detail?.leads?.lead_i ?? e.detail?.u;
      if (u === undefined || !matRef.current) return;
      const color = activationColor(u);
      matRef.current.color.lerp(color, 0.3);
      matRef.current.emissive.lerp(color, 0.2);
      matRef.current.emissiveIntensity = 0.25 + Math.abs(u) * 0.5;
    };
    events?.addEventListener('data', handleData);
    return () => events?.removeEventListener('data', handleData);
  }, [events]);

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color="#8b1a1a"
        emissive="#3a0000"
        emissiveIntensity={0.3}
        roughness={0.6}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Named AHA/RV node markers ─────────────────────────────────────────────────
function AHANodes({ meshData, showLabels }) {
  const nodes = meshData?.nodes;
  const bounds = meshData?.bounds;

  const scaled = useMemo(() => {
    if (!nodes || !bounds) return [];
    const cx = (bounds.xMin + bounds.xMax) / 2;
    const cy = (bounds.yMin + bounds.yMax) / 2;
    const cz = (bounds.zMin + bounds.zMax) / 2;
    const scale = 2 / Math.max(
      bounds.xMax - bounds.xMin,
      bounds.yMax - bounds.yMin,
      bounds.zMax - bounds.zMin,
    );
    return nodes.map((n) => ({
      name: n.name,
      pos: [
        (n.x - cx) * scale,
        (n.y - cy) * scale,
        (n.z - cz) * scale,
      ],
    }));
  }, [nodes, bounds]);

  if (!showLabels || scaled.length === 0) return null;

  return (
    <>
      {scaled.map((n, i) => (
        <group key={i} position={n.pos}>
          <mesh>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshBasicMaterial color="#00e5ff" />
          </mesh>
          <Html distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div style={{
              fontSize: 9, color: '#00e5ff', whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.55)', padding: '1px 4px', borderRadius: 3,
              fontFamily: 'ui-monospace,monospace',
            }}>
              {n.name}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

// ── Pulsing hotspot mapped to cardiac mesh coordinates ────────────────────────
function PulsingHotspot({ meshData, onUpdate }) {
  const groupRef  = useRef();
  const ring1Ref  = useRef();
  const ring2Ref  = useRef();
  const posRef    = useRef({ tx: 0, ty: 0, tz: 0 });
  const [visible, setVisible] = useState(false);
  const cbRef     = useRef(onUpdate);
  cbRef.current   = onUpdate;

  const { events } = useStream();

  const boundsRef = useRef(meshData?.bounds ?? null);
  useEffect(() => { boundsRef.current = meshData?.bounds ?? null; }, [meshData]);

  useEffect(() => {
    const handleData = (e) => {
      const coords = e.detail?.localization_coords;
      const conf   = e.detail?.ai_confidence ?? 0;
      if (!coords || !boundsRef.current) return;

      const b = boundsRef.current;
      const cx = (b.xMin + b.xMax) / 2;
      const cy = (b.yMin + b.yMax) / 2;
      const cz = (b.zMin + b.zMax) / 2;
      const scale = 2 / Math.max(b.xMax - b.xMin, b.yMax - b.yMin, b.zMax - b.zMin);

      const wx = coords.x * (b.xMax - b.xMin) + b.xMin;
      const wy = coords.y * (b.yMax - b.yMin) + b.yMin;
      const wz = coords.z * (b.zMax - b.zMin) + b.zMin;

      posRef.current = {
        tx: (wx - cx) * scale,
        ty: (wy - cy) * scale,
        tz: (wz - cz) * scale,
      };
      setVisible(true);

      cbRef.current?.({
        coords,
        mm:         { x: wx.toFixed(1), y: wy.toFixed(1), z: wz.toFixed(1) },
        region:     regionFromXYZ(coords.x, coords.y, coords.z),
        confidence: Math.round(conf * 100),
      });
    };
    events?.addEventListener('data', handleData);
    return () => events?.removeEventListener('data', handleData);
  }, [events]);

  useFrame(({ clock }) => {
    if (!visible || !groupRef.current) return;
    const { tx, ty, tz } = posRef.current;
    groupRef.current.position.set(tx, ty, tz);

    const t = clock.getElapsedTime();
    [ring1Ref, ring2Ref].forEach((ref, i) => {
      if (!ref.current) return;
      const phase = ((t * 1.1 + i * 0.6) % 1.2) / 1.2;
      ref.current.scale.setScalar(1 + phase * 3);
      ref.current.material.opacity = (1 - phase) * 0.85;
    });
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Bright white-yellow core — contrasts against red mesh */}
      <mesh>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#fffb00" emissiveIntensity={8} />
      </mesh>
      {/* Pulsing ring 1 — cyan */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[0.065, 0.09, 32]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Pulsing ring 2 — white offset */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[0.065, 0.09, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Label above marker */}
      <Html position={[0, 0.14, 0]} distanceFactor={5} style={{ pointerEvents: 'none' }}>
        <div style={{
          fontSize: 10, color: '#fffb00', whiteSpace: 'nowrap',
          background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 4,
          fontFamily: 'ui-monospace,monospace', fontWeight: 700, letterSpacing: 0.8,
          border: '1px solid rgba(255,251,0,0.4)',
        }}>
          ● SOURCE
        </div>
      </Html>
      <pointLight color="#00e5ff" intensity={4} distance={1.0} />
    </group>
  );
}

// ── Source info panel (HTML overlay) ─────────────────────────────────────────
function SourcePanel({ info }) {
  if (!info) return null;
  const { region, mm, confidence } = info;
  const confColor = confidence >= 80 ? '#22c55e' : confidence >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      position: 'absolute', top: 12, left: 12,
      background: 'rgba(0,0,0,0.78)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(239,68,68,0.45)',
      borderRadius: 10,
      padding: '10px 14px',
      color: '#fff',
      fontSize: 12,
      fontFamily: 'ui-monospace, monospace',
      minWidth: 210,
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 10, letterSpacing: 1.5, marginBottom: 6 }}>
        ● SOURCE LOCALIZATION
      </div>
      <div style={{ color: '#f97316', fontWeight: 700, fontSize: 14, marginBottom: 10, lineHeight: 1.3 }}>
        {region}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5e1', fontSize: 11 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>X (L→R)</span>
          <span>{mm.x} mm</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Y (Ant→Post)</span>
          <span>{mm.y} mm</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Z (Apex→Base)</span>
          <span>{mm.z} mm</span>
        </div>
      </div>
      <div style={{
        marginTop: 10, paddingTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: '#64748b', fontSize: 11 }}>AI Confidence</span>
        <span style={{ color: confColor, fontWeight: 700, fontSize: 13 }}>{confidence}%</span>
      </div>
    </div>
  );
}

// ── Activation map colour legend ──────────────────────────────────────────────
function ColorLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '7px 12px',
      fontSize: 11,
      fontFamily: 'ui-monospace, monospace',
      color: '#94a3b8',
      zIndex: 10,
      pointerEvents: 'none',
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

// ── AHA node toggle button ────────────────────────────────────────────────────
function NodeToggle({ showLabels, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'absolute', top: 12, right: 12,
        background: showLabels ? 'rgba(0,229,255,0.15)' : 'rgba(0,0,0,0.6)',
        border: `1px solid ${showLabels ? '#00e5ff' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 7,
        color: showLabels ? '#00e5ff' : '#64748b',
        fontSize: 10,
        fontFamily: 'ui-monospace, monospace',
        padding: '5px 9px',
        cursor: 'pointer',
        zIndex: 10,
        letterSpacing: 0.8,
      }}
    >
      AHA NODES {showLabels ? 'ON' : 'OFF'}
    </button>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
const HeartModel3D = () => {
  const [sourceInfo, setSourceInfo]   = useState(null);
  const [meshData,   setMeshData]     = useState(null);
  const [showLabels, setShowLabels]   = useState(false);

  useEffect(() => {
    fetch('/models/cardiac_mesh.json')
      .then((r) => r.json())
      .then(setMeshData)
      .catch((err) => console.error('cardiac_mesh.json load failed:', err));
  }, []);

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative">
      <Canvas
        shadows
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        gl={{ antialias: true }}
        scene={{ background: new THREE.Color(0x0a0a12) }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]}   intensity={1.0} />
          <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#6366f1" />
          <pointLight      position={[0, 3, 0]}     intensity={0.5} color="#0ea5e9" />
          <CardiacMesh meshData={meshData} />
          <AHANodes    meshData={meshData} showLabels={showLabels} />
          <PulsingHotspot meshData={meshData} onUpdate={setSourceInfo} />
          <OrbitControls enableZoom={true} autoRotate={false} />
        </Suspense>
      </Canvas>
      <SourcePanel info={sourceInfo} />
      <ColorLegend />
      <NodeToggle showLabels={showLabels} onToggle={() => setShowLabels((v) => !v)} />
    </div>
  );
};

export default HeartModel3D;
