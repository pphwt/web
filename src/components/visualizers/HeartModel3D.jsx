import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStream } from '../../context/StreamContext';
import { MODEL_API_BASE } from '../../services/modelApi';

const API_BASE = MODEL_API_BASE;
const HEART_SCALE = 1.5;

function normToScene(n, bbRef) {
  if (!bbRef.current) return new THREE.Vector3(0, 0, 0);
  const { bb, scale } = bbRef.current;
  const mn = bb.min.clone().multiplyScalar(scale);
  const mx = bb.max.clone().multiplyScalar(scale);
  return new THREE.Vector3(
    mn.x + n.x * (mx.x - mn.x),
    mn.y + n.y * (mx.y - mn.y),
    mn.z + n.z * (mx.z - mn.z),
  );
}

function regionFromAHA(seg) {
  if (!seg || seg === 0) return 'Localizing…';
  const labels = {
    1:'Basal Anterior',2:'Basal Anteroseptal',3:'Basal Inferoseptal',
    4:'Basal Inferior',5:'Basal Inferolateral',6:'Basal Anterolateral',
    7:'Mid Anterior',8:'Mid Anteroseptal',9:'Mid Inferoseptal',
    10:'Mid Inferior',11:'Mid Inferolateral',12:'Mid Anterolateral',
    13:'Apical Anterior',14:'Apical Septal',15:'Apical Inferior',
    16:'Apical Lateral',17:'Apex',
  };
  return labels[seg] ?? 'Unknown';
}

// ── Heart ─────────────────────────────────────────────────────────────────────
function Heart({ bbRef }) {
  const { scene }  = useGLTF('/models/heart.glb');
  const { events } = useStream();
  const meshRef    = useRef();
  const qrsRef     = useRef(0);

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
    bbRef.current = { bb, scale: HEART_SCALE };
  }, [scene, bbRef]);

  useEffect(() => {
    const handler = (e) => { if (e.detail?.qrs_detected) qrsRef.current = 1.0; };
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
  }, [events]);

  useFrame(({ clock }, dt) => {
    if (!meshRef.current) return;
    const t    = clock.getElapsedTime();
    const beat = 1 + Math.sin(t * Math.PI * 1.2) * 0.022;
    meshRef.current.scale.setScalar(HEART_SCALE * beat);
    qrsRef.current = Math.max(0, qrsRef.current - dt * 3.5);
    scene?.traverse((child) => {
      if (!child.isMesh) return;
      child.material.emissiveIntensity = 0.18 + qrsRef.current * 0.55;
    });
  });

  return <primitive ref={meshRef} object={scene} scale={HEART_SCALE} />;
}

// ── Activation sphere cluster ─────────────────────────────────────────────────
function ActivationMap({ bbRef, nodePositions, activationMap }) {
  const meshRef = useRef();
  const count   = nodePositions.length;
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const colors  = useMemo(() => new Float32Array(count * 3), [count]);
  const color   = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    if (!meshRef.current || !bbRef.current || count === 0) return;
    for (let i = 0; i < count; i++) {
      const pos = normToScene(nodePositions[i].norm, bbRef);
      dummy.position.copy(pos);
      dummy.scale.setScalar(0.07);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      const t = activationMap[i] ?? 0.5;
      color.setHSL((1 - t) * 0.66, 1.0, 0.55);
      color.toArray(colors, i * 3);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  }, [nodePositions, activationMap, bbRef, dummy, colors, color, count]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} renderOrder={10}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </sphereGeometry>
      <meshBasicMaterial vertexColors depthTest={false} transparent opacity={0.82} />
    </instancedMesh>
  );
}

// ── Top-5 markers ─────────────────────────────────────────────────────────────
function Top5Markers({ bbRef, top5 }) {
  if (!top5 || top5.length === 0) return null;
  return top5.map((node, rank) => {
    const pos     = normToScene(node.coords, bbRef);
    const opacity = 1 - rank * 0.18;
    const size    = 0.10 - rank * 0.015;
    return (
      <mesh key={node.node} position={pos} renderOrder={990 - rank}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={opacity} depthTest={false} />
      </mesh>
    );
  });
}

// ── Primary pin marker ────────────────────────────────────────────────────────
function PinMarker({ bbRef, result, onUpdate }) {
  const groupRef        = useRef();
  const posRef          = useRef(null);
  const [info, setInfo] = useState(null);
  const { events }      = useStream();

  // Build pin info from a stream-shaped payload (live frame OR static analyze result)
  const applyDetail = (detail) => {
    const coords = detail?.localization_coords;
    const conf   = detail?.ai_confidence ?? 0;
    const aha    = detail?.aha;
    if (!coords || !bbRef.current) return;

    posRef.current = normToScene(coords, bbRef);

    const territory = aha?.territory ?? '—';
    const risk      = aha?.risk ?? 'LOW';
    const label     = aha?.label ?? regionFromAHA(aha?.segment);
    const nextInfo  = {
      coords,
      mm: {
        x: (coords.x * 103.2).toFixed(1),
        y: (coords.y * 92.2).toFixed(1),
        z: (coords.z * 72.0).toFixed(1),
      },
      segment:    aha?.segment ?? 0,
      region:     label,
      territory,
      risk,
      confidence: Math.round(conf * 100),
      aha,
    };
    setInfo(nextInfo);
    onUpdate?.(nextInfo);
  };

  // Static mode: a single analyze result drives the pin (no live stream)
  useEffect(() => {
    if (result) applyDetail(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, bbRef.current]);

  // Live mode: subscribe to the 20 Hz stream (only when no static result)
  useEffect(() => {
    if (result) return;
    const handler = (e) => applyDetail(e.detail);
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, bbRef, onUpdate, result]);

  useFrame(() => {
    if (!groupRef.current || !posRef.current) return;
    groupRef.current.position.lerp(posRef.current, 0.06);
  });

  if (!info) return null;

  const RISK_COLOR = { HIGH: '#ef4444', MODERATE: '#f59e0b', LOW: '#22c55e' };
  const TERR_COLOR = { LAD: '#ef4444', RCA: '#22c55e', LCx: '#f59e0b' };
  const riskColor  = RISK_COLOR[info.risk] ?? '#60a5fa';
  const terrColor  = TERR_COLOR[info.territory] ?? '#60a5fa';

  return (
    <group ref={groupRef} renderOrder={999}>
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={999}>
        <ringGeometry args={[0.12, 0.18, 48]} />
        <meshBasicMaterial color={riskColor} transparent opacity={0.9} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={998}>
        <ringGeometry args={[0.19, 0.26, 48]} />
        <meshBasicMaterial color={riskColor} transparent opacity={0.4} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.45, 0]} renderOrder={999}>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 8]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </mesh>
      <mesh position={[0, 0.74, 0]} renderOrder={999}>
        <sphereGeometry args={[0.075, 20, 20]} />
        <meshBasicMaterial color={riskColor} depthTest={false} />
      </mesh>
      <mesh position={[0, 0.74, 0]} renderOrder={999}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#ffffff" depthTest={false} />
      </mesh>
      <Html position={[0.28, 0.80, 0]} distanceFactor={5} style={{ pointerEvents: 'none' }} occlude={false}>
        <div style={{
          background: 'rgba(4,10,24,0.93)', backdropFilter: 'blur(12px)',
          border: `1.5px solid ${riskColor}`, borderRadius: 8,
          padding: '6px 10px', color: '#fff',
          fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap',
          lineHeight: 1.5, boxShadow: `0 0 16px ${riskColor}44`, minWidth: 160,
        }}>
          <div style={{ color: riskColor, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, marginBottom: 2 }}>
            &#9899; {info.risk} RISK
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>
            Seg {info.segment} &mdash; {info.region}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: terrColor }} />
            <span style={{ fontSize: 10, color: terrColor, fontWeight: 700 }}>{info.territory} territory</span>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            {info.mm.x} / {info.mm.y} / {info.mm.z} mm
          </div>
          <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, marginTop: 3 }}>
            AI {info.confidence}%
          </div>
        </div>
      </Html>
      <pointLight color={riskColor} intensity={12} distance={2.0} />
    </group>
  );
}

function ColorLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12,
      background: 'rgba(4,10,24,0.82)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
      padding: '7px 12px', fontFamily: 'ui-monospace,monospace',
      color: '#94a3b8', zIndex: 10, pointerEvents: 'none',
    }}>
      <div style={{ marginBottom: 4, color: '#475569', fontSize: 9, fontWeight: 700, letterSpacing: 1.2 }}>
        ACTIVATION MAP
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        <div style={{ width: 40, height: 6, borderRadius: 3,
          background: 'linear-gradient(to right, #ef4444, #3b82f6)' }} />
        <span style={{ fontSize: 8, color: '#64748b' }}>Early &rarr; Late</span>
      </div>
      {[['#ef4444','HIGH — Ant/Septal (LAD)'],['#f59e0b','MODERATE'],['#22c55e','LOW']].map(([c,l]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c }} />
          <span style={{ fontSize: 8, color: '#64748b' }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const HeartModel3D = ({ result = null }) => {
  const [nodePositions, setNodePositions] = useState([]);
  const [activationMap, setActivationMap] = useState(Array(75).fill(0.5));
  const [top5Nodes,     setTop5Nodes]     = useState([]);
  const bbRef      = useRef(null);
  const { events } = useStream();

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/localization/nodes`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.nodes) setNodePositions(d.nodes); })
      .catch(() => {});
  }, []);

  // Static mode: drive activation/top5 from the analyze result
  useEffect(() => {
    if (!result) return;
    if (result.activation_map) setActivationMap(result.activation_map);
    if (result.top5_nodes)     setTop5Nodes(result.top5_nodes);
  }, [result]);

  // Live mode: subscribe to the stream (only when no static result)
  useEffect(() => {
    if (result) return;
    const handler = (e) => {
      if (e.detail?.activation_map) setActivationMap(e.detail.activation_map);
      if (e.detail?.top5_nodes)     setTop5Nodes(e.detail.top5_nodes);
    };
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
  }, [events, result]);

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
          <directionalLight position={[3, 5, 4]}    intensity={1.3} castShadow />
          <directionalLight position={[-4, -2, -3]}  intensity={0.3} color="#8b5cf6" />
          <pointLight       position={[0, 4, 1]}     intensity={0.5} color="#e2e8f0" />
          <Heart bbRef={bbRef} />
          <ActivationMap bbRef={bbRef} nodePositions={nodePositions} activationMap={activationMap} />
          <Top5Markers bbRef={bbRef} top5={top5Nodes} />
          <PinMarker bbRef={bbRef} result={result} onUpdate={() => {}} />
          <OrbitControls enableZoom minDistance={2} maxDistance={8} autoRotate autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>
      <ColorLegend />
    </div>
  );
};

export default HeartModel3D;
