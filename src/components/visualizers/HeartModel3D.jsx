import React, { Suspense, useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useStream } from '../../context/StreamContext';
import { MODEL_API_BASE } from '../../services/modelApi';
import { partsForVariant } from './heartAnatomyCatalog';

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

// These teaching hotspots are deliberately anatomical landmarks, not disease
// predictions. Their positions are normalized into the loaded model bounding
// box so they remain usable with both the open and external heart assets.
const ANATOMY_PARTS = [
  {
    id: 'right-atrium',
    name: 'Right Atrium (RA)',
    thai: 'หัวใจห้องบนขวา',
    description: 'รับเลือดที่มีออกซิเจนต่ำจากร่างกายผ่าน superior และ inferior vena cava แล้วส่งต่อไปยัง right ventricle',
    function: 'รับเลือดจากระบบหลอดเลือดดำ',
    view: 'internal',
    position: { x: 0.27, y: 0.68, z: 0.72 },
  },
  {
    id: 'left-atrium',
    name: 'Left Atrium (LA)',
    thai: 'หัวใจห้องบนซ้าย',
    description: 'รับเลือดที่มีออกซิเจนสูงจากปอดผ่าน pulmonary veins แล้วส่งต่อไปยัง left ventricle',
    function: 'รับเลือดที่ผ่านการแลกเปลี่ยนก๊าซจากปอด',
    view: 'internal',
    position: { x: 0.70, y: 0.68, z: 0.72 },
  },
  {
    id: 'right-ventricle',
    name: 'Right Ventricle (RV)',
    thai: 'หัวใจห้องล่างขวา',
    description: 'สูบฉีดเลือดที่มีออกซิเจนต่ำไปยังปอดผ่าน pulmonary artery',
    function: 'ส่งเลือดไปปอดเพื่อรับออกซิเจน',
    view: 'internal',
    position: { x: 0.34, y: 0.42, z: 0.36 },
  },
  {
    id: 'left-ventricle',
    name: 'Left Ventricle (LV)',
    thai: 'หัวใจห้องล่างซ้าย',
    description: 'ห้องกล้ามเนื้อหลักที่สูบฉีดเลือดที่มีออกซิเจนสูงออกไปทั่วร่างกายผ่าน aorta',
    function: 'สร้างแรงดันหลักของการไหลเวียนระบบใหญ่',
    view: 'internal',
    position: { x: 0.66, y: 0.40, z: 0.34 },
  },
  {
    id: 'aorta',
    name: 'Aorta',
    thai: 'หลอดเลือดแดงใหญ่เอออร์ตา',
    description: 'หลอดเลือดแดงขนาดใหญ่ที่นำเลือดจาก left ventricle ไปเลี้ยงสมอง อวัยวะ และเนื้อเยื่อทั่วร่างกาย',
    function: 'กระจายเลือดที่มีออกซิเจนสูงออกจากหัวใจ',
    view: 'external',
    position: { x: 0.59, y: 0.91, z: 0.80 },
  },
  {
    id: 'pulmonary-artery',
    name: 'Pulmonary Artery',
    thai: 'หลอดเลือดแดงปอด',
    description: 'นำเลือดที่มีออกซิเจนต่ำจาก right ventricle ไปยังปอด',
    function: 'นำเลือดไปแลกเปลี่ยนก๊าซที่ปอด',
    view: 'external',
    position: { x: 0.42, y: 0.88, z: 0.78 },
  },
  {
    id: 'septum',
    name: 'Interventricular Septum',
    thai: 'ผนังกั้นหัวใจห้องล่าง',
    description: 'ผนังกล้ามเนื้อที่กั้นระหว่าง right ventricle และ left ventricle ช่วยไม่ให้เลือดสองฝั่งปะปนกัน',
    function: 'แบ่งห้องสูบฉีดและเป็นส่วนหนึ่งของระบบนำไฟฟ้า',
    view: 'internal',
    position: { x: 0.51, y: 0.42, z: 0.40 },
  },
  {
    id: 'apex',
    name: 'Cardiac Apex',
    thai: 'ปลายหัวใจ',
    description: 'ปลายล่างของหัวใจ เกิดจากส่วนปลายของ left ventricle เป็นจุดอ้างอิงสำคัญในการดูทิศทางและการเคลื่อนไหวของหัวใจ',
    function: 'จุดปลายของแนวแกนหัวใจ',
    view: 'internal',
    position: { x: 0.53, y: 0.13, z: 0.18 },
  },
  {
    id: 'superior-vena-cava',
    name: 'Superior Vena Cava',
    thai: 'หลอดเลือดดำใหญ่ส่วนบน',
    description: 'นำเลือดที่มีออกซิเจนต่ำจากศีรษะ คอ และแขนกลับเข้าสู่ right atrium',
    function: 'รับเลือดดำจากส่วนบนของร่างกาย',
    view: 'external',
    position: { x: 0.28, y: 0.96, z: 0.79 },
  },
  {
    id: 'inferior-vena-cava',
    name: 'Inferior Vena Cava',
    thai: 'หลอดเลือดดำใหญ่ส่วนล่าง',
    description: 'นำเลือดที่มีออกซิเจนต่ำจากลำตัวและขากลับเข้าสู่ right atrium',
    function: 'รับเลือดดำจากส่วนล่างของร่างกาย',
    view: 'external',
    position: { x: 0.28, y: 0.51, z: 0.68 },
  },
  {
    id: 'pulmonary-veins',
    name: 'Pulmonary Veins',
    thai: 'หลอดเลือดดำปอด',
    description: 'นำเลือดที่มีออกซิเจนสูงจากปอดเข้าสู่ left atrium',
    function: 'นำเลือดแดงกลับจากปอดสู่หัวใจ',
    view: 'external',
    position: { x: 0.77, y: 0.71, z: 0.69 },
  },
  {
    id: 'coronary-arteries',
    name: 'Coronary Arteries',
    thai: 'หลอดเลือดโคโรนารี',
    description: 'หลอดเลือดที่นำออกซิเจนไปเลี้ยงกล้ามเนื้อหัวใจโดยตรง',
    function: 'เลี้ยงกล้ามเนื้อหัวใจ',
    view: 'external',
    position: { x: 0.51, y: 0.53, z: 0.20 },
  },
  {
    id: 'tricuspid-valve',
    name: 'Tricuspid Valve',
    thai: 'ลิ้นไตรคัสปิด',
    description: 'ลิ้นหัวใจระหว่าง right atrium และ right ventricle ช่วยป้องกันเลือดไหลย้อนกลับ',
    function: 'ควบคุมการไหลผ่านฝั่งขวา',
    view: 'internal',
    position: { x: 0.37, y: 0.56, z: 0.46 },
  },
  {
    id: 'mitral-valve',
    name: 'Mitral Valve',
    thai: 'ลิ้นไมตรัล',
    description: 'ลิ้นหัวใจระหว่าง left atrium และ left ventricle ช่วยป้องกันเลือดไหลย้อนกลับ',
    function: 'ควบคุมการไหลผ่านฝั่งซ้าย',
    view: 'internal',
    position: { x: 0.63, y: 0.56, z: 0.46 },
  },
  {
    id: 'aortic-valve',
    name: 'Aortic Valve',
    thai: 'ลิ้นเอออร์ตา',
    description: 'ลิ้นระหว่าง left ventricle และ aorta เปิดให้เลือดออกสู่ระบบใหญ่และป้องกันการไหลย้อนกลับ',
    function: 'ควบคุมทางออกจาก left ventricle',
    view: 'internal',
    position: { x: 0.58, y: 0.77, z: 0.64 },
  },
  {
    id: 'pulmonary-valve',
    name: 'Pulmonary Valve',
    thai: 'ลิ้นพัลโมนารี',
    description: 'ลิ้นระหว่าง right ventricle และ pulmonary artery เปิดให้เลือดไปปอดและป้องกันการไหลย้อนกลับ',
    function: 'ควบคุมทางออกจาก right ventricle',
    view: 'internal',
    position: { x: 0.43, y: 0.77, z: 0.65 },
  },
];

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
function Heart({ bbRef, variant = 'normal', onToggle, onReady, controlsRef, calibrationMode, onCalibrate }) {
  const { camera } = useThree();
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
    onReady?.();
  }, [scene, bbRef, onReady]);

  return (
    <group
      onPointerDown={(event) => {
        if (!calibrationMode || !event.nativeEvent?.altKey || !event.point) return;
        event.stopPropagation();
        onCalibrate?.({
          point: event.point.toArray(),
          cameraPosition: camera.position.toArray(),
          cameraTarget: controlsRef.current?.target?.toArray?.() ?? [0, 0, 0],
        });
      }}
      onClick={(event) => {
        event.stopPropagation();
        if ((event.delta ?? 0) <= 3) onToggle?.();
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

function anatomyAnchorToScene(anchor, bbRef) {
  if (!bbRef.current) return new THREE.Vector3(0, 0, 0);
  const { bb, scale } = bbRef.current;
  const mn = bb.min.clone().multiplyScalar(scale);
  const mx = bb.max.clone().multiplyScalar(scale);
  return new THREE.Vector3(
    THREE.MathUtils.lerp(mn.x, mx.x, anchor[0]),
    THREE.MathUtils.lerp(mn.y, mx.y, anchor[1]),
    THREE.MathUtils.lerp(mn.z, mx.z, anchor[2]),
  );
}

function LegacyAnatomyHotspots({ bbRef, variant = 'normal', selectedId, onSelect }) {
  const [hoveredId, setHoveredId] = useState(null);
  if (!bbRef.current) return null;
  const visibleParts = ANATOMY_PARTS.filter((part) => (
    variant === 'open' ? part.view === 'internal' : part.view === 'external'
  ));
  return visibleParts.map((part) => {
    const position = normToScene(part.position, bbRef, null);
    const selected = selectedId === part.id;
    return (
      <group key={part.id} position={position} renderOrder={1200}>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.(part);
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHoveredId(part.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => { setHoveredId(null); document.body.style.cursor = ''; }}
          renderOrder={1200}
        >
          <sphereGeometry args={[selected ? 0.13 : 0.095, 16, 16]} />
          <meshBasicMaterial
            color={selected ? '#38bdf8' : '#f8fafc'}
            transparent
            opacity={selected ? 0.95 : 0.72}
            depthTest={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={1199}>
          <ringGeometry args={[selected ? 0.15 : 0.115, selected ? 0.18 : 0.135, 24]} />
          <meshBasicMaterial color={selected ? '#38bdf8' : '#0ea5e9'} transparent opacity={0.8} depthTest={false} side={THREE.DoubleSide} />
        </mesh>
        {hoveredId === part.id && !selected && (
          <Html position={[0.13, 0.12, 0]} distanceFactor={5} style={{ pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(4,10,24,0.92)', border: '1px solid rgba(125,211,252,0.7)', borderRadius: 6, color: '#f8fafc', padding: '5px 8px', whiteSpace: 'nowrap', fontFamily: 'sans-serif', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
              <div style={{ color: '#7dd3fc', fontSize: 10, fontWeight: 800 }}>{part.name}</div>
              <div style={{ color: '#cbd5e1', fontSize: 9, marginTop: 2 }}>คลิกเพื่อดู Detail</div>
            </div>
          </Html>
        )}
      </group>
    );
  });
}

function AnatomyHotspots({ bbRef, variant = 'normal', selectedId, onSelect }) {
  const [hoveredId, setHoveredId] = useState(null);
  if (!bbRef.current) return null;
  return partsForVariant(variant).map((part) => {
    const anchor = anatomyAnchorToScene(part.anchor, bbRef);
    const label = anchor.clone().add(new THREE.Vector3(...part.labelOffset));
    const selected = selectedId === part.id;
    return (
      <group key={part.id} renderOrder={1200}>
        <Line points={[anchor, label]} color={selected ? '#38bdf8' : '#0ea5e9'} lineWidth={selected ? 1.8 : 1} transparent opacity={0.82} depthTest={false} raycast={() => null} />
        <mesh position={anchor} renderOrder={1200} raycast={() => null}>
          <sphereGeometry args={[selected ? 0.13 : 0.095, 16, 16]} />
          <meshBasicMaterial color={selected ? '#38bdf8' : '#0ea5e9'} transparent opacity={selected ? 0.95 : 0.78} depthTest={false} />
        </mesh>
        <Html position={label} center occlude={false} zIndexRange={[1000, 0]} style={{ pointerEvents: 'auto' }}>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
            <button
              type="button"
              aria-label={`จุด ${part.number}: ${part.nameEn}`}
              aria-pressed={selected}
              title={`${part.nameEn} — คลิกเพื่อดูรายละเอียด`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(part);
              }}
              onMouseEnter={() => setHoveredId(part.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(part.id)}
              onBlur={() => setHoveredId(null)}
              style={{ width: selected ? 38 : 32, height: selected ? 38 : 32, borderRadius: '50%', border: `2px solid ${selected ? '#e0f2fe' : '#0ea5e9'}`, background: selected ? '#0284c7' : 'rgba(4,10,24,0.90)', color: '#f8fafc', cursor: 'pointer', fontSize: selected ? 14 : 12, fontWeight: 900, boxShadow: selected ? '0 0 0 5px rgba(56,189,248,0.28), 0 4px 14px rgba(0,0,0,0.35)' : '0 3px 10px rgba(0,0,0,0.35)', padding: 0 }}
            >
              {part.number}
            </button>
            {hoveredId === part.id && !selected && (
              <div style={{ marginTop: 5, background: 'rgba(4,10,24,0.94)', border: '1px solid rgba(125,211,252,0.7)', borderRadius: 6, color: '#f8fafc', padding: '5px 8px', whiteSpace: 'nowrap', fontFamily: 'sans-serif', boxShadow: '0 4px 14px rgba(0,0,0,0.25)', textAlign: 'center' }}>
                <div style={{ color: '#7dd3fc', fontSize: 10, fontWeight: 800 }}>{part.nameEn}</div>
                <div style={{ color: '#cbd5e1', fontSize: 9, marginTop: 2 }}>คลิกเพื่อดูรายละเอียด</div>
              </div>
            )}
          </div>
        </Html>
      </group>
    );
  });
}

// Smoothly moves the camera to the selected landmark instead of snapping the
// view. The hotspot and camera use the same normalized coordinate transform, so
// the selected pin remains attached to the anatomical location while orbiting.
function CameraFocus({ bbRef, selectedPart, controlsRef, resetToken, cancelRef }) {
  const { camera } = useThree();
  const animationRef = useRef(null);

  useEffect(() => {
    if (!cancelRef) return undefined;
    cancelRef.current = () => { animationRef.current = null; };
    return () => { cancelRef.current = null; };
  }, [cancelRef]);

  useEffect(() => {
    if (!bbRef.current) return;
    const target = selectedPart
      ? anatomyAnchorToScene(selectedPart.anchor, bbRef)
      : new THREE.Vector3(0, 0, 0);
    const direction = selectedPart
      ? new THREE.Vector3(...selectedPart.cameraDirection).normalize()
      : new THREE.Vector3(0, 0.35, 4.2).normalize();
    const distance = selectedPart ? 1.65 : 4.2;
    animationRef.current = {
      position: target.clone().add(direction.multiplyScalar(distance)),
      target,
    };
  }, [bbRef, camera, controlsRef, resetToken, selectedPart]);

  useFrame((_, delta) => {
    const animation = animationRef.current;
    const controls = controlsRef.current;
    if (!animation || !controls) return;
    const alpha = Math.min(1, delta * 5);
    camera.position.lerp(animation.position, alpha);
    controls.target.lerp(animation.target, alpha);
    controls.update();
    if (camera.position.distanceTo(animation.position) < 0.01 && controls.target.distanceTo(animation.target) < 0.01) {
      camera.position.copy(animation.position);
      controls.target.copy(animation.target);
      animationRef.current = null;
    }
  });

  return null;
}

function AnatomyNavigator({ parts, selectedId, onSelect }) {
  const selectedIndex = Math.max(0, parts.findIndex((part) => part.id === selectedId));
  const move = (delta) => {
    if (!parts.length) return;
    const nextIndex = (selectedIndex + delta + parts.length) % parts.length;
    onSelect(parts[nextIndex]);
  };

  return (
    <nav
      aria-label="เลือกจุดกายวิภาคหัวใจ"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
        if (event.key === 'Escape') { event.preventDefault(); onSelect(null); }
      }}
      style={{ position: 'absolute', bottom: 58, left: 12, right: 12, zIndex: 25, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', borderRadius: 9, background: 'rgba(4,10,24,0.90)', border: '1px solid rgba(125,211,252,0.35)', boxShadow: '0 6px 24px rgba(0,0,0,0.22)', overflowX: 'auto', fontFamily: 'sans-serif' }}
    >
      <button type="button" title="จุดก่อนหน้า" aria-label="จุดก่อนหน้า" onClick={() => move(-1)} style={{ flex: '0 0 auto', width: 28, height: 28, border: 0, borderRadius: 6, background: 'rgba(148,163,184,0.18)', color: '#e0f2fe', cursor: 'pointer', fontSize: 16 }}>‹</button>
      {parts.map((part) => {
        const selected = selectedId === part.id;
        return (
          <button
            key={part.id}
            type="button"
            aria-label={`จุด ${part.number}: ${part.nameEn}`}
            aria-current={selected ? 'step' : undefined}
            title={`${part.nameEn} — ${part.nameTh}`}
            onClick={() => onSelect(part)}
            style={{ flex: '0 0 auto', minWidth: 30, height: 28, padding: '0 7px', border: `1px solid ${selected ? '#7dd3fc' : 'rgba(148,163,184,0.35)'}`, borderRadius: 6, background: selected ? '#0284c7' : 'rgba(148,163,184,0.12)', color: selected ? '#f0f9ff' : '#cbd5e1', cursor: 'pointer', fontSize: 11, fontWeight: 900, boxShadow: selected ? '0 0 0 2px rgba(56,189,248,0.22)' : 'none' }}
          >
            {part.number}
          </button>
        );
      })}
      <button type="button" title="จุดถัดไป" aria-label="จุดถัดไป" onClick={() => move(1)} style={{ flex: '0 0 auto', width: 28, height: 28, border: 0, borderRadius: 6, background: 'rgba(148,163,184,0.18)', color: '#e0f2fe', cursor: 'pointer', fontSize: 16 }}>›</button>
      <span style={{ flex: '0 0 auto', marginLeft: 5, color: '#94a3b8', fontSize: 9, whiteSpace: 'nowrap' }}>{selectedId ? parts[selectedIndex]?.nameEn : 'เลือกหมายเลขเพื่อดูรายละเอียด'}</span>
    </nav>
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
    if (detail?.localization_supported === false) {
      posRef.current = null;
      setInfo(null);
      return;
    }
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
      compactness: Math.round(conf * 100),
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
  if (result?.localization_supported === false) return null;
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
            Activation compactness {info.compactness}%
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
  const [selectedAnatomy, setSelectedAnatomy] = useState(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [calibrationNotice, setCalibrationNotice] = useState('');
  const [, setModelReady] = useState(false);
  const markModelReady = useCallback(() => setModelReady(true), []);
  
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
  const controlsRef = useRef(null);
  const cancelFocusRef = useRef(null);
  const { events } = useStream();
  const activeParts = partsForVariant(heartVariant);
  const calibrationMode = import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('heartCalibrate') === '1';

  const resetView = useCallback(() => {
    setSelectedAnatomy(null);
    setCameraResetToken((value) => value + 1);
  }, []);

  const selectAnatomy = useCallback((part) => {
    setSelectedAnatomy(part);
    setCameraResetToken((value) => value + 1);
  }, []);

  const zoomBy = useCallback((factor) => {
    const controls = controlsRef.current;
    if (!controls?.object || !controls?.target) return;
    const direction = controls.object.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(direction.length() * factor, 1.1, 8);
    if (direction.lengthSq() < 0.001) direction.set(0, 0, 1);
    controls.object.position.copy(controls.target).add(direction.normalize().multiplyScalar(distance));
    controls.update();
  }, []);

  const captureAnchor = useCallback((payload) => {
    const part = selectedAnatomy;
    const bounds = bbRef.current;
    if (!part || !bounds) return;
    const mn = bounds.bb.min.clone().multiplyScalar(bounds.scale);
    const mx = bounds.bb.max.clone().multiplyScalar(bounds.scale);
    const anchor = [
      (payload.point[0] - mn.x) / Math.max(mx.x - mn.x, 1e-6),
      (payload.point[1] - mn.y) / Math.max(mx.y - mn.y, 1e-6),
      (payload.point[2] - mn.z) / Math.max(mx.z - mn.z, 1e-6),
    ].map((value) => Number(value.toFixed(5)));
    const cameraDirection = new THREE.Vector3(...payload.cameraPosition).sub(new THREE.Vector3(...payload.cameraTarget)).normalize().toArray().map((value) => Number(value.toFixed(5)));
    const capture = { variant: heartVariant, id: part.id, anchor, cameraDirection, cameraTarget: payload.cameraTarget };
    console.info('[heart-calibration] captured anchor', capture);
    navigator.clipboard?.writeText(JSON.stringify(capture, null, 2)).catch(() => {});
    setCalibrationNotice(`บันทึก anchor ของจุด ${part.number} แล้ว — ตรวจค่าใน Console ก่อนนำไปใส่ catalog`);
  }, [heartVariant, selectedAnatomy]);

  useEffect(() => {
    setHeartVariant('normal');
    resetView();
  }, [resetView, result]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/localization/nodes`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.nodes) setNodePositions(d.nodes); })
      .catch(() => {});
  }, []);

  // Static mode: drive activation/top5 from the analyze result
  useEffect(() => {
    if (!result) return;
    const supported = result.localization_supported !== false;
    setActivationMap(supported && result.activation_map ? result.activation_map : Array(75).fill(0.5));
    setTop5Nodes(supported && result.top5_nodes ? result.top5_nodes : []);
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
              onReady={markModelReady}
              controlsRef={controlsRef}
              calibrationMode={calibrationMode}
              onCalibrate={captureAnchor}
              onToggle={() => {
                setHeartVariant((current) => current === 'normal' ? 'open' : 'normal');
                resetView();
              }}
            />
            <AnatomyHotspots
              bbRef={bbRef}
              variant={heartVariant}
              selectedId={selectedAnatomy?.id}
              onSelect={selectAnatomy}
            />
            <CameraFocus bbRef={bbRef} selectedPart={selectedAnatomy} controlsRef={controlsRef} resetToken={cameraResetToken} cancelRef={cancelFocusRef} />
            {result?.localization_supported !== false && (
              <ActivationMap bbRef={bbRef} nodePositions={nodePositions} activationMap={activationMap} calibration={calibration} />
            )}
            {result?.localization_supported !== false && (
              <Top5Markers bbRef={bbRef} top5={top5Nodes} calibration={calibration} />
            )}
            <PinMarker bbRef={bbRef} result={result} onUpdate={() => {}} calibration={calibration} />
            <OrbitControls
              ref={controlsRef}
              enableZoom
              enableDamping
              dampingFactor={0.08}
              enablePan={false}
              minDistance={1.1}
              maxDistance={8}
              target={[0, 0, 0]}
              autoRotate={autoRotate && !selectedAnatomy}
              autoRotateSpeed={0.5}
              onStart={() => cancelFocusRef.current?.()}
            />
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
        {heartVariant === 'normal' ? 'โหมดภายนอก: หลอดเลือดและหลอดเลือดเลี้ยงหัวใจ' : 'โหมดภายใน: ห้องและลิ้นหัวใจ'} • คลิกจุดสีขาวเพื่อดูรายละเอียด
      </div>
      <div
        aria-label="ตัวควบคุมโมเดลหัวใจ"
        style={{
          position: 'absolute', top: 48, left: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5,
          background: 'rgba(4,10,24,0.82)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: 5, zIndex: 15, fontFamily: 'sans-serif',
        }}
      >
        <button type="button" title="ดูโครงสร้างภายนอก" onClick={() => { setHeartVariant('normal'); resetView(); }} style={{ border: 0, borderRadius: 5, padding: '5px 8px', cursor: 'pointer', color: heartVariant === 'normal' ? '#082f49' : '#cbd5e1', background: heartVariant === 'normal' ? '#7dd3fc' : 'rgba(148,163,184,0.15)', fontSize: 10, fontWeight: 800 }}>ภายนอก</button>
        <button type="button" title="เปิดดูห้องและลิ้นหัวใจ" onClick={() => { setHeartVariant('open'); resetView(); }} style={{ border: 0, borderRadius: 5, padding: '5px 8px', cursor: 'pointer', color: heartVariant === 'open' ? '#082f49' : '#cbd5e1', background: heartVariant === 'open' ? '#7dd3fc' : 'rgba(148,163,184,0.15)', fontSize: 10, fontWeight: 800 }}>ภายใน</button>
        <span style={{ width: 1, height: 18, background: 'rgba(148,163,184,0.3)' }} />
        <button type="button" title="ซูมเข้า" onClick={() => zoomBy(0.78)} style={{ border: 0, borderRadius: 5, width: 25, height: 25, cursor: 'pointer', color: '#e0f2fe', background: 'rgba(14,165,233,0.2)', fontSize: 16, lineHeight: 1 }}>+</button>
        <button type="button" title="ซูมออก" onClick={() => zoomBy(1.28)} style={{ border: 0, borderRadius: 5, width: 25, height: 25, cursor: 'pointer', color: '#e0f2fe', background: 'rgba(14,165,233,0.2)', fontSize: 16, lineHeight: 1 }}>−</button>
        <button type="button" title="กลับมุมมองเต็ม" onClick={resetView} style={{ border: 0, borderRadius: 5, padding: '5px 8px', cursor: 'pointer', color: '#cbd5e1', background: 'rgba(148,163,184,0.15)', fontSize: 10, fontWeight: 700 }}>Reset</button>
        <button type="button" title="เปิด/ปิดการหมุนอัตโนมัติ" onClick={() => setAutoRotate((value) => !value)} style={{ border: 0, borderRadius: 5, padding: '5px 8px', cursor: 'pointer', color: autoRotate ? '#052e16' : '#cbd5e1', background: autoRotate ? '#86efac' : 'rgba(148,163,184,0.15)', fontSize: 10, fontWeight: 700 }}>{autoRotate ? 'หยุดหมุน' : 'หมุนอัตโนมัติ'}</button>
        <span style={{ color: '#94a3b8', fontSize: 9, padding: '0 3px' }}>ลากเพื่อหมุน • ล้อเมาส์เพื่อซูม</span>
      </div>
      <AnatomyNavigator parts={activeParts} selectedId={selectedAnatomy?.id} onSelect={selectAnatomy} />
      {calibrationMode && (
        <div style={{ position: 'absolute', top: 94, left: 12, right: 12, zIndex: 16, maxWidth: 520, padding: '7px 10px', borderRadius: 7, background: 'rgba(120,53,15,0.92)', border: '1px solid rgba(251,191,36,0.65)', color: '#fef3c7', fontSize: 10, fontFamily: 'sans-serif' }}>
          <strong>Calibration mode:</strong> เลือกเลขด้านล่าง แล้วกด Alt+click บนผิวโครงสร้างจริงเพื่อคัดลอก anchor ไปที่ Console
          {calibrationNotice && <div style={{ marginTop: 3, color: '#bbf7d0' }}>{calibrationNotice}</div>}
        </div>
      )}
      {selectedAnatomy && (
        <aside
          role="region"
          aria-live="polite"
          aria-label={`ข้อมูล ${selectedAnatomy.nameEn}`}
          style={{
            position: 'absolute', top: 52, right: 12, width: 'min(280px, calc(100% - 24px))',
            background: 'rgba(4,10,24,0.94)', backdropFilter: 'blur(14px)',
            border: '1px solid rgba(56,189,248,0.7)', borderRadius: 12,
            padding: '12px 14px', color: '#e2e8f0', zIndex: 30,
            fontFamily: 'sans-serif', boxShadow: '0 8px 30px rgba(0,0,0,0.28)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ color: '#7dd3fc', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Anatomy</div>
              <div style={{ color: '#7dd3fc', fontSize: 10, marginTop: 2 }}>จุด {selectedAnatomy.number} · {selectedAnatomy.category}</div>
              <h3 style={{ margin: '3px 0 0', color: '#f8fafc', fontSize: 15, lineHeight: 1.25 }}>{selectedAnatomy.nameEn}</h3>
              <div style={{ color: '#cbd5e1', fontSize: 11, marginTop: 2 }}>{selectedAnatomy.nameTh}</div>
            </div>
            <button
              type="button"
              aria-label="ปิดข้อมูลกายวิภาค"
              onClick={() => selectAnatomy(null)}
              style={{ background: 'transparent', border: 0, color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}
            >×</button>
          </div>
          <div style={{ color: '#e2e8f0', fontSize: 11, lineHeight: 1.55, margin: '10px 0 8px' }}><strong>ตำแหน่ง:</strong> {selectedAnatomy.location}</div>
          <p style={{ color: '#e2e8f0', fontSize: 11, lineHeight: 1.55, margin: '8px 0' }}><strong>หน้าที่:</strong> {selectedAnatomy.function}</p>
          <div style={{ color: '#bae6fd', fontSize: 10, lineHeight: 1.45, padding: '7px 8px', borderRadius: 6, background: 'rgba(14,165,233,0.12)' }}><strong>การไหลเวียน:</strong> {selectedAnatomy.flow}</div>
          <div style={{ borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: 8, color: '#7dd3fc', fontSize: 10 }}>
            จุดนี้เป็นคำอธิบายกายวิภาคของโมเดล ไม่ใช่ตำแหน่งโรคหรือผลวินิจฉัยจาก ECG
          </div>
          <div style={{ color: '#94a3b8', fontSize: 9, marginTop: 8 }}>
            ข้อมูลนี้เป็นคำอธิบายกายวิภาค ไม่ใช่การวินิจฉัยจาก ECG
          </div>
          <button
            type="button"
            onClick={() => selectAnatomy(null)}
            style={{ marginTop: 10, width: '100%', border: '1px solid rgba(125,211,252,0.35)', borderRadius: 6, background: 'rgba(14,165,233,0.12)', color: '#bae6fd', cursor: 'pointer', padding: '6px 8px', fontSize: 10, fontWeight: 700 }}
          >
            กลับมุมมองเต็ม / Reset view
          </button>
        </aside>
      )}
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
      {result?.localization_supported === false && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12, left: 12,
          background: 'rgba(180,83,9,0.94)', backdropFilter: 'blur(8px)',
          border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12,
          padding: '10px 14px', fontFamily: 'sans-serif',
          color: '#fff', zIndex: 20, fontSize: 11,
          textAlign: 'center', boxShadow: '0 4px 20px rgba(180,83,9,0.25)',
          fontWeight: 'bold'
        }}>
          3D localization unavailable: {result.localization_note || 'this input is outside the validated localizer domain.'}
        </div>
      )}
    </div>
  );
};

export default HeartModel3D;
