import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStream } from '../../context/StreamContext';
import { MODEL_API_BASE } from '../../services/modelApi';

const API_BASE = MODEL_API_BASE;
const HEART_SCALE = 1.5;

function normToScene(n, bbRef, cal) {
  if (!bbRef.current) return new THREE.Vector3(0, 0, 0);
  const { bb, scale } = bbRef.current;
  const mn = bb.min.clone().multiplyScalar(scale);
  const mx = bb.max.clone().multiplyScalar(scale);
  
  const kx = (cal?.xOffset ?? 0.25) + n.x * (cal?.xScale ?? 0.50);
  const ky = (cal?.yOffset ?? 0.15) + n.y * (cal?.yScale ?? 0.40);
  const kz = (cal?.zOffset ?? 0.25) + n.z * (cal?.zScale ?? 0.50);

  return new THREE.Vector3(
    mn.x + kx * (mx.x - mn.x),
    mn.y + ky * (mx.y - mn.y),
    mn.z + kz * (mx.z - mn.z)
  );
}

function getChamberName(coords) {
  if (!coords) return 'Unknown';
  const isUpper = coords.z >= 0.5;
  const isLeft = coords.x >= 0.5;
  if (isUpper) {
    return isLeft ? 'Left Atrium (LA) / บนซ้าย' : 'Right Atrium (RA) / บนขวา';
  } else {
    return isLeft ? 'Left Ventricle (LV) / ล่างซ้าย' : 'Right Ventricle (RV) / ล่างขวา';
  }
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
function ActivationMap({ bbRef, nodePositions, activationMap, calibration }) {
  const meshRef = useRef();
  const count   = nodePositions.length;
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const colors  = useMemo(() => new Float32Array(count * 3), [count]);
  const color   = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    if (!meshRef.current || !bbRef.current || count === 0) return;
    for (let i = 0; i < count; i++) {
      const pos = normToScene(nodePositions[i].norm, bbRef, calibration);
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
  }, [nodePositions, activationMap, bbRef, dummy, colors, color, count, calibration]);

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
function Top5Markers({ bbRef, top5, calibration }) {
  if (!top5 || top5.length === 0) return null;
  return top5.map((node, rank) => {
    const pos     = normToScene(node.coords, bbRef, calibration);
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
function PinMarker({ bbRef, result, onUpdate, calibration }) {
  const groupRef        = useRef();
  const posRef          = useRef(null);
  const [info, setInfo] = useState(null);
  const [currentDetail, setCurrentDetail] = useState(null);
  const { events }      = useStream();

  // Build pin info from a stream-shaped payload (live frame OR static analyze result)
  const applyDetail = (detail) => {
    const coords = detail?.localization_coords;
    const conf   = detail?.ai_confidence ?? 0;
    const aha    = detail?.aha;
    if (!coords || !bbRef.current) return;

    posRef.current = normToScene(coords, bbRef, calibration);

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
      chamber:    getChamberName(coords),
    };
    setInfo(nextInfo);
    onUpdate?.(nextInfo);
  };

  // Static mode
  useEffect(() => {
    if (result) {
      setCurrentDetail(result);
    }
  }, [result]);

  // Live mode
  useEffect(() => {
    if (result) return;
    const handler = (e) => {
      setCurrentDetail(e.detail);
    };
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
  }, [events, result]);

  // Apply when detail, calibration, or bbRef changes
  useEffect(() => {
    if (currentDetail) {
      applyDetail(currentDetail);
    }
  }, [currentDetail, calibration, bbRef.current]);

  useFrame(() => {
    if (!groupRef.current || !posRef.current) return;
    groupRef.current.position.lerp(posRef.current, 0.06);
  });

  if (!info) return null;
  if (result?.localization_normal_gated === true) return null;

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
          <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9', marginBottom: 1 }}>
            Seg {info.segment} &mdash; {info.region}
          </div>
          <div style={{ fontSize: 10, color: '#cbd5e1', marginBottom: 3, fontWeight: 'bold' }}>
            {info.chamber}
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

class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("WebGL Error caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100%', width: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#040a18', color: '#94a3b8',
          fontFamily: 'sans-serif', fontSize: '11px',
          padding: '20px', textAlign: 'center',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '20px', marginBottom: '8px' }}>⚠️</span>
          <p style={{ fontWeight: 'bold', color: '#f1f5f9', marginBottom: '4px' }}>
            WebGL context creation failed
          </p>
          <p style={{ maxWidth: '280px', lineHeight: '1.4' }}>
            The browser has run out of WebGL contexts. Please reload the page or close other tabs to free up resources.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '12px', padding: '6px 12px',
              background: '#38bdf8', color: '#040a18',
              border: 'none', borderRadius: '4px',
              fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const HeartModel3D = ({ result = null }) => {
  const [nodePositions, setNodePositions] = useState([]);
  const [activationMap, setActivationMap] = useState(Array(75).fill(0.5));
  const [top5Nodes,     setTop5Nodes]     = useState([]);
  
  // Interactive Layer Toggles
  const [showPin, setShowPin] = useState(true);
  const [showActivation, setShowActivation] = useState(true);
  const [showTop5, setShowTop5] = useState(true);

  // Calibration State
  const [showCal, setShowCal] = useState(false);
  const [calibration, setCalibration] = useState(() => {
    const saved = localStorage.getItem('heart_3d_calibration');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      xOffset: 0.25,
      xScale: 0.50,
      yOffset: 0.15,
      yScale: 0.40,
      zOffset: 0.25,
      zScale: 0.50
    };
  });

  const updateCalibration = (key, val) => {
    setCalibration(prev => {
      const next = { ...prev, [key]: parseFloat(val) };
      localStorage.setItem('heart_3d_calibration', JSON.stringify(next));
      return next;
    });
  };

  const resetCalibration = () => {
    const defaults = {
      xOffset: 0.25,
      xScale: 0.50,
      yOffset: 0.15,
      yScale: 0.40,
      zOffset: 0.25,
      zScale: 0.50
    };
    setCalibration(defaults);
    localStorage.setItem('heart_3d_calibration', JSON.stringify(defaults));
  };

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
      {/* Interactive Layer controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        background: 'rgba(4,10,24,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
        padding: '8px 12px', fontFamily: 'ui-monospace,monospace',
        color: '#94a3b8', zIndex: 10, fontSize: 10,
        display: 'flex', flexDirection: 'column', gap: 6,
        userSelect: 'none', maxWidth: 220
      }}>
        <div style={{ color: '#475569', fontSize: 9, fontWeight: 700, letterSpacing: 1.2, marginBottom: 2 }}>
          LAYERS OVERLAY
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showPin} onChange={(e) => setShowPin(e.target.checked)} />
          <span>📍 Source Pinpoint</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showActivation} onChange={(e) => setShowActivation(e.target.checked)} />
          <span>⚡ PINN Activation Grid</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={showTop5} onChange={(e) => setShowTop5(e.target.checked)} />
          <span>🔵 Top-5 Candidates</span>
        </label>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6, marginTop: 4 }}>
          <div 
            style={{ color: '#475569', fontSize: 9, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
            onClick={() => setShowCal(!showCal)}
          >
            <span>{showCal ? '▼ CALIBRATION' : '► CALIBRATION'}</span>
            <span style={{ fontSize: 8 }}>⚙️</span>
          </div>
          {showCal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>X Off: {calibration.xOffset.toFixed(2)}</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.01" value={calibration.xOffset} onChange={(e) => updateCalibration('xOffset', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>X Scale: {calibration.xScale.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="1.5" step="0.01" value={calibration.xScale} onChange={(e) => updateCalibration('xScale', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Y Off: {calibration.yOffset.toFixed(2)}</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.01" value={calibration.yOffset} onChange={(e) => updateCalibration('yOffset', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Y Scale: {calibration.yScale.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="1.5" step="0.01" value={calibration.yScale} onChange={(e) => updateCalibration('yScale', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Z Off: {calibration.zOffset.toFixed(2)}</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.01" value={calibration.zOffset} onChange={(e) => updateCalibration('zOffset', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Z Scale: {calibration.zScale.toFixed(2)}</span>
                </div>
                <input type="range" min="0.1" max="1.5" step="0.01" value={calibration.zScale} onChange={(e) => updateCalibration('zScale', e.target.value)} style={{ width: '100%' }} />
              </div>
              <button 
                onClick={resetCalibration}
                style={{
                  marginTop: 4,
                  padding: '4px 6px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: 4,
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: 9,
                  textAlign: 'center'
                }}
              >
                Reset Defaults
              </button>
            </div>
          )}
        </div>
      </div>

      <WebGLErrorBoundary>
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
            {showActivation && (
              <ActivationMap bbRef={bbRef} nodePositions={nodePositions} activationMap={activationMap} calibration={calibration} />
            )}
            {showTop5 && (
              <Top5Markers bbRef={bbRef} top5={top5Nodes} calibration={calibration} />
            )}
            {showPin && (
              <PinMarker bbRef={bbRef} result={result} onUpdate={() => {}} calibration={calibration} />
            )}
            <OrbitControls enableZoom minDistance={2} maxDistance={8} autoRotate autoRotateSpeed={0.5} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
      <ColorLegend />
      {result?.localization_normal_gated === true && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12, left: 12,
          background: 'rgba(16,185,129,0.92)', backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12,
          padding: '10px 14px', fontFamily: 'sans-serif',
          color: '#fff', zIndex: 20, fontSize: 11,
          textAlign: 'center', boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
          fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <span>🟢</span>
          <span>Normal ECG: No active localized source abnormality expected (คลื่นไฟฟ้าหัวใจปกติ: ไม่พบจุดกำเนิดกระแสไฟฟ้าผิดปกติ)</span>
        </div>
      )}
    </div>
  );
};

export default HeartModel3D;
