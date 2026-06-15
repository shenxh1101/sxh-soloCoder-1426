import * as THREE from 'three';

export function Stage() {
  const WIDTH = 20;
  const DEPTH = 10;
  const HEIGHT = 1;

  return (
    <group>
      <mesh position={[0, HEIGHT / 2 - 0.01, 0]} receiveShadow>
        <boxGeometry args={[WIDTH, HEIGHT, DEPTH]} />
        <meshStandardMaterial
          color="#1a1d25"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      <mesh position={[0, HEIGHT + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WIDTH - 0.2, DEPTH - 0.2]} />
        <meshStandardMaterial
          color="#2a2f3a"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      <gridHelper args={[WIDTH, 20, '#3a4050', '#222732']} position={[0, HEIGHT + 0.01, 0]} />

      {Array.from({ length: 11 }).map((_, i) => {
        const x = -WIDTH / 2 + i * 2;
        return (
          <mesh key={`edge-x-${i}`} position={[x, HEIGHT + 0.02, DEPTH / 2 - 0.05]}>
            <boxGeometry args={[0.08, 0.04, 0.08]} />
            <meshStandardMaterial color="#ffc107" emissive="#ffc107" emissiveIntensity={0.6} />
          </mesh>
        );
      })}

      {[-WIDTH / 2 - 0.3, WIDTH / 2 + 0.3].map((x, idx) => (
        <group key={`side-${idx}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[x, 0.4 + i * 0.4, 0]}>
              <boxGeometry args={[0.15, 0.3, DEPTH + 0.6]} />
              <meshStandardMaterial color="#141820" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[0, -0.5, -DEPTH / 2 - 1.5]}>
        <boxGeometry args={[WIDTH + 2, 8, 0.3]} />
        <meshStandardMaterial color="#0c0f17" metalness={0.5} roughness={0.6} />
      </mesh>

      {[
        [-10, 1, -10], [10, 1, -10], [-10, 1, 10], [10, 1, 10],
      ].map((pos, i) => (
        <group key={`corner-${i}`} position={pos as [number, number, number]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.2, 6, 8]} />
            <meshStandardMaterial color="#0e121b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 3.05, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.1, 8]} />
            <meshStandardMaterial color="#ffc107" emissive="#ffc107" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
