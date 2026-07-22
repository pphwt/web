import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useStream } from '../../context/StreamContext';
import { MODEL_API_BASE } from '../../services/modelApi';

const API_BASE = MODEL_API_BASE;
const HEART_MODEL_SIZE = 3.1;
const HEART_MODELS = {
  open: {
    obj: '/models/heart/open/openheartLD1.obj',
    mtl: '/models/heart/open/openheartLD1.mtl',
  },
  normal: {
    obj: '/models/heart/normal/heart1.obj',
    mtl: '/models/heart/normal/heart1.mtl',
  },
};

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
function Heart({ bbRef, variant = 'normal', onToggle }) {
  const model = HEART_MODELS[variant] ?? HEART_MODELS.open;
  const materials = useLoader(MTLLoader, model.mtl);
  const object = useLoader(OBJLoader, model.obj, (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return undefined;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [hovered]);

  const scene = useMemo(() => {
    const content = object.clone(true);
    content.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const clonedMaterials = sourceMaterials.map((material) => {
        const cloned = material.clone();
        // Preserve the anatomical texture's real colour instead of tinting it
        // with the dark scene or the former purple fill light.
        cloned.color?.set(0xffffff);
        if (cloned.map) cloned.map.colorSpace = THREE.SRGBColorSpace;
        if (!cloned.emissive) cloned.emissive = new THREE.Color(0x000000);
        cloned.emissive.set(0x000000);
        cloned.emissiveIntensity = 0;
        if ('shininess' in cloned) cloned.shininess = 18;
        if ('specular' in cloned) cloned.specular.set(0x4a3530);
        if ('roughness' in cloned) cloned.roughness = Math.max(cloned.roughness ?? 0.5, 0.45);
        if ('metalness' in cloned) cloned.metalness = Math.min(cloned.metalness ?? 0, 0.10);
        return cloned;
      });
      child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
    });

    // Both OBJ assets use Z as their vertical axis and have very different
    // source dimensions. Rotate, centre, and fit them into the same scene box.
    content.rotation.x = -Math.PI / 2;
    const root = new THREE.Group();
    root.add(content);
    root.updateMatrixWorld(true);

    const sourceBox = new THREE.Box3().setFromObject(root);
    const size = sourceBox.getSize(new THREE.Vector3());
    const center = sourceBox.getCenter(new THREE.Vector3());
    const fitScale = HEART_MODEL_SIZE / Math.max(size.x, size.y, size.z, 1);
    root.scale.setScalar(fitScale);
    root.position.copy(center).multiplyScalar(-fitScale);
    root.updateMatrixWorld(true);

    return root;
  }, [object]);

  useEffect(() => {
    if (!scene) return;
    const bb = new THREE.Box3().setFromObject(scene);
    bbRef.current = { bb, scale: 1 };
  }, [scene, bbRef]);

  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onToggle?.();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={scene} />
    </group>
  );
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
  const [heartVariant, setHeartVariant] = useState('normal');
  
  const [calibration] = useState(() => {
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

  const bbRef      = useRef(null);
  const { events } = useStream();

  useEffect(() => {
    setHeartVariant('normal');
  }, [result]);

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
      <WebGLErrorBoundary>
        <Canvas
          shadows
          camera={{ position: [0, 0.35, 4.2], fov: 40 }}
          gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.25 }}
          scene={{ background: new THREE.Color(0xf7f3eb) }}
        >
          <Suspense fallback={null}>
            <hemisphereLight args={['#fff8f2', '#5c3030', 1.15]} />
            <ambientLight intensity={1.0} color="#fffaf5" />
            <directionalLight position={[3, 5, 4]} intensity={2.0} color="#fff4eb" castShadow />
            <directionalLight position={[-4, 1, 3]} intensity={0.9} color="#f8fbff" />
            <pointLight position={[0, -2, 3]} intensity={0.55} color="#ffd8ca" />
            <Heart
              bbRef={bbRef}
              variant={heartVariant}
              onToggle={() => setHeartVariant((current) => current === 'normal' ? 'open' : 'normal')}
            />
            <ActivationMap bbRef={bbRef} nodePositions={nodePositions} activationMap={activationMap} calibration={calibration} />
            <Top5Markers bbRef={bbRef} top5={top5Nodes} calibration={calibration} />
            <PinMarker bbRef={bbRef} result={result} onUpdate={() => {}} calibration={calibration} />
            <OrbitControls enableZoom minDistance={2} maxDistance={8} autoRotate autoRotateSpeed={0.5} />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(4,10,24,0.72)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
        padding: '6px 10px', color: '#cbd5e1', zIndex: 10,
        fontFamily: 'ui-monospace,monospace', fontSize: 9,
        pointerEvents: 'none', letterSpacing: 0.4,
      }}>
        {heartVariant === 'normal' ? 'Click the heart to open' : 'Click the heart to close'}
      </div>
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
