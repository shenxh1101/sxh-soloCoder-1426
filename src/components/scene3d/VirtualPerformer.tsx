import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface VirtualPerformerProps {
  index: number;
  position: [number, number, number];
  color: string;
}

export function VirtualPerformer({ index, position, color }: VirtualPerformerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const phaseOffset = index * 1.3;

  useFrame((state) => {
    const t = state.clock.elapsedTime + phaseOffset;
    if (!groupRef.current) return;
    const baseX = position[0];
    const baseZ = position[2];
    const dx = Math.sin(t * 0.6) * 2.5;
    const dz = Math.cos(t * 0.45) * 1.8;
    groupRef.current.position.x = baseX + dx;
    groupRef.current.position.z = baseZ + dz;
    const bob = Math.abs(Math.sin(t * 2.2)) * 0.15;
    groupRef.current.position.y = position[1] + 1 + bob;
    groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.4;

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.2) * 0.25;
    }
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(t * 3) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], position[1] + 1, position[2]]}>
      <mesh ref={bodyRef} position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.7, 24, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      <mesh ref={headRef} position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.45, 24, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[-0.15, 1.0, 0.35]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.15, 1.0, 0.35]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.15, 1.0, 0.4]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.15, 1.0, 0.4]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0, 0.75, 0.55]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.12, 0.03, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
      </mesh>

      <pointLight
        color={color}
        intensity={0.6}
        distance={5}
        decay={2}
        position={[0, 0.5, 0]}
      />
    </group>
  );
}
