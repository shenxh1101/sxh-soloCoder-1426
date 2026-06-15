import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Stage } from './Stage';
import { Truss } from './Truss';
import { MovingHead } from './MovingHead';
import { VirtualPerformer } from './VirtualPerformer';
import { FIXTURE_IDS, FIXTURE_POSITIONS } from '../../types';
import { useLightingStore } from '../../store/useLightingStore';

function CaptureThumbnail() {
  const { gl } = useThree();
  const activeShowId = useLightingStore((s) => s.activeShowId);
  const isPlaying = useLightingStore((s) => s.isPlaying);
  const updateThumbnail = useLightingStore((s) => s.updateThumbnail);
  const timerRef = useRef<number | null>(null);
  const lastCapturedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeShowId) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const capture = () => {
      try {
        const canvas = gl.domElement;
        if (!canvas || canvas.width === 0 || canvas.height === 0) return;
        const url = canvas.toDataURL('image/jpeg', 0.6);
        if (url && url.length > 100) {
          updateThumbnail(activeShowId, url);
          lastCapturedIdRef.current = activeShowId;
        }
      } catch {
      }
    };

    timerRef.current = window.setTimeout(capture, activeShowId === lastCapturedIdRef.current ? 800 : 2500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeShowId, gl, updateThumbnail, isPlaying]);

  return null;
}

export function StageCanvas() {
  const selectedFixtureId = useLightingStore((s) => s.selectedFixtureId);
  const selectFixture = useLightingStore((s) => s.selectFixture);
  const previewState = useLightingStore((s) => s.previewState);

  return (
    <div className="w-full h-full relative bg-[#05070d]">
      <Canvas
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        linear
      >
        <PerspectiveCamera makeDefault position={[0, 9, 24]} fov={50} />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 1.5, 0]}
        />
        <fog attach="fog" args={['#05070d', 15, 60]} />
        <color attach="background" args={['#05070d']} />

        <ambientLight intensity={0.08} />

        <Suspense fallback={null}>
          <Stage />
          <Truss />

          {FIXTURE_IDS.map((fid) => {
            const pos = FIXTURE_POSITIONS[fid];
            const state = previewState[fid];
            return (
              <group key={fid} position={[pos.x, pos.y, pos.z]}>
                <MovingHead
                  fixtureId={fid}
                  state={state}
                  selected={selectedFixtureId === fid}
                  onSelect={() => selectFixture(fid)}
                />
              </group>
            );
          })}

          <VirtualPerformer index={0} position={[-4, 0, 0]} color="#ff6b9d" />
          <VirtualPerformer index={1} position={[0, 0, -1]} color="#6bcbff" />
          <VirtualPerformer index={2} position={[4, 0, 1]} color="#ffd166" />

          <CaptureThumbnail />

          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom
              intensity={1.3}
              luminanceThreshold={0.25}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.25} darkness={0.85} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
