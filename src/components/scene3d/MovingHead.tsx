import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { FixtureId, LightState } from '../../types';

interface MovingHeadProps {
  fixtureId: FixtureId;
  state: LightState;
  selected: boolean;
  onSelect: () => void;
}

export function MovingHead({ fixtureId, state, selected, onSelect }: MovingHeadProps) {
  const panGroupRef = useRef<THREE.Group>(null);
  const tiltGroupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  const color = useMemo(
    () => new THREE.Color(state.colorR / 255, state.colorG / 255, state.colorB / 255),
    [state.colorR, state.colorG, state.colorB],
  );

  const intensity = (state.intensity / 100) * 5;
  const panRad = (state.pan * Math.PI) / 180;
  const tiltRad = (state.tilt * Math.PI) / 180;

  if (panGroupRef.current) panGroupRef.current.rotation.y = panRad;
  if (tiltGroupRef.current) tiltGroupRef.current.rotation.x = tiltRad;
  if (lightRef.current) {
    lightRef.current.color = color;
    lightRef.current.intensity = intensity;
    const tx = -Math.sin(panRad) * Math.cos(tiltRad) * 20;
    const ty = -1 + Math.sin(tiltRad) * 20;
    const tz = -Math.cos(panRad) * Math.cos(tiltRad) * 20;
    if (targetRef.current) {
      targetRef.current.position.set(tx, ty - 1, tz);
    }
  }

  const patternTexture = useMemo(() => getPatternTexture(state.pattern), [state.pattern]);

  const BEAM_LENGTH = 15;

  return (
    <group>
      <group position={[0, -0.4, 0]}>
        <mesh>
          <boxGeometry args={[0.7, 0.15, 0.7]} />
          <meshStandardMaterial color="#252a38" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.04, 12]} />
          <meshStandardMaterial color="#3a4052" metalness={0.95} roughness={0.2} />
        </mesh>
      </group>

      <group ref={panGroupRef} position={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.38, 0.3, 12]} />
          <meshStandardMaterial
            color={selected ? '#ffc107' : '#2c3244'}
            metalness={0.85}
            roughness={0.3}
            emissive={selected ? '#ffc107' : '#000'}
            emissiveIntensity={selected ? 0.25 : 0}
          />
        </mesh>

        <group position={[0, 0.2, 0]}>
          <mesh position={[-0.32, 0.28, 0]}>
            <boxGeometry args={[0.08, 0.56, 0.48]} />
            <meshStandardMaterial color="#1e2433" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0.32, 0.28, 0]}>
            <boxGeometry args={[0.08, 0.56, 0.48]} />
            <meshStandardMaterial color="#1e2433" metalness={0.9} roughness={0.25} />
          </mesh>

          <group ref={tiltGroupRef} position={[0, 0.28, 0]}>
            <mesh>
              <boxGeometry args={[0.48, 0.48, 0.72]} />
              <meshStandardMaterial color="#2a3041" metalness={0.85} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.42]}>
              <cylinderGeometry args={[0.33, 0.3, 0.2, 16]} />
              <meshStandardMaterial color="#0d1018" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, 0.54]}>
              <ringGeometry args={[0.18, 0.3, 24]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={intensity * 0.4}
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>

            <group position={[0, 0, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
              <spotLight
                ref={lightRef}
                color={color}
                intensity={intensity}
                distance={40}
                angle={0.35}
                penumbra={0.35}
                decay={1.4}
                castShadow={false}
                target={(targetRef.current = new THREE.Object3D())}
              />
              {targetRef.current && <primitive object={targetRef.current} />}
            </group>

            <mesh
              position={[0, 0, BEAM_LENGTH / 2 + 0.55]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <coneGeometry args={[BEAM_LENGTH * Math.tan(0.35), BEAM_LENGTH, 24, 1, true]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={Math.min(0.22, intensity * 0.035)}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            <mesh position={[0, 0, BEAM_LENGTH * 0.4 + 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, BEAM_LENGTH * 0.7 * Math.tan(0.35), BEAM_LENGTH * 0.7, 16, 1, true]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={Math.min(0.5, intensity * 0.08)}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {patternTexture && state.pattern > 0 && (
              <mesh position={[0, 0, BEAM_LENGTH + 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[BEAM_LENGTH * 1.2, BEAM_LENGTH * 1.2]} />
                <meshBasicMaterial
                  map={patternTexture}
                  transparent
                  opacity={Math.min(0.35, intensity * 0.05)}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            )}
          </group>
        </group>
      </group>

      <group position={[0, -0.75, 0]} onClick={onSelect}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
          <meshStandardMaterial
            color={selected ? '#ffc107' : '#222836'}
            emissive={selected ? '#ffc107' : `rgb(${fixtureId * 25},${fixtureId * 15},100)`}
            emissiveIntensity={selected ? 0.4 : 0.15}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

function getPatternTexture(index: number): THREE.Texture | null {
  if (index <= 0 || index > 7) return null;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  switch (index) {
    case 1:
      for (let i = 0; i < 12; i++) {
        const r = 20 + i * 25;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.7 - i * 0.05})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      break;
    case 2:
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i * Math.PI) / 8);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(-6, -size, 12, size * 2);
        ctx.restore();
      }
      break;
    case 3:
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((i * Math.PI) / 5);
        ctx.beginPath();
        for (let s = 0; s < 10; s++) {
          const angle = (s * Math.PI) / 5;
          const r = s % 2 === 0 ? size * 0.45 : size * 0.2;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fill();
        ctx.restore();
      }
      break;
    case 4:
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      for (let gx = 0; gx <= size; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, size);
        ctx.stroke();
      }
      for (let gy = 0; gy <= size; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(size, gy);
        ctx.stroke();
      }
      break;
    case 5:
      for (let y = 0; y < size; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= size; x += 4) {
          ctx.lineTo(x, y + Math.sin(x * 0.03 + y * 0.02) * 8);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.5 + Math.sin(y * 0.05) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      break;
    case 6:
      for (let r = 0; r < 14; r++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(r * 0.3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 0.48, -10 - r);
        ctx.lineTo(size * 0.48, 10 + r);
        ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${0.55 - r * 0.03})`;
        ctx.fill();
        ctx.restore();
      }
      break;
    case 7:
      for (let r = 20; r < size * 0.5; r += 10) {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.1) {
          const rr = r + Math.sin(a * (2 + r * 0.02)) * 8;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255,255,255,${0.6 - r * 0.001})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      break;
  }
  ctx.fillStyle = grad;
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
