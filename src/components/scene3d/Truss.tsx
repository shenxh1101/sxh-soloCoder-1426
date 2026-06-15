export function Truss() {
  const FRONT_Z = -8;
  const BACK_Z = 8;
  const FRONT_HEIGHT = 8;
  const BACK_HEIGHT = 9;
  const SPAN_X = 18;

  function SquareTrussBeam({
    position,
    rotation,
    length,
    thickness = 0.18,
  }: {
    position: [number, number, number];
    rotation?: [number, number, number];
    length: number;
    thickness?: number;
  }) {
    const halfLen = length / 2;
    const t = thickness;
    const diagT = thickness * 0.55;
    return (
      <group position={position} rotation={rotation || [0, 0, 0]}>
        {[
          [-t / 2, -t / 2], [t / 2, -t / 2], [-t / 2, t / 2], [t / 2, t / 2],
        ].map(([y, z], i) => (
          <mesh key={`chord-${i}`} position={[0, y, z]}>
            <cylinderGeometry args={[thickness * 0.18, thickness * 0.18, length, 6]} />
            <meshStandardMaterial color="#2a3040" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        {Array.from({ length: Math.max(3, Math.floor(length / 0.8)) }).map((_, idx) => {
          const x = -halfLen + (idx + 0.5) * (length / Math.floor(length / 0.8));
          return (
            <group key={`brace-${idx}`} position={[x, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[diagT * 0.12, diagT * 0.12, t * 1.4, 4]} />
                <meshStandardMaterial color="#3a4255" metalness={0.85} roughness={0.3} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[diagT * 0.12, diagT * 0.12, t * 1.4, 4]} />
                <meshStandardMaterial color="#3a4255" metalness={0.85} roughness={0.3} />
              </mesh>
              {[
                [1, 1, t * 0.7, t * 0.7],
                [-1, 1, -t * 0.7, t * 0.7],
              ].map(([sy, sz, dy, dz], j) => (
                <mesh
                  key={`d-${j}`}
                  position={[0, (sy * t) / 4, (sz * t) / 4]}
                  rotation={[0, 0, (sy * Math.PI) / 4]}
                >
                  <cylinderGeometry args={[diagT * 0.1, diagT * 0.1, t * 1.1, 4]} />
                  <meshStandardMaterial color="#454d62" metalness={0.8} roughness={0.35} />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>
    );
  }

  function VerticalPillar({ x, z, height }: { x: number; z: number; height: number }) {
    return (
      <group>
        <SquareTrussBeam
          position={[x, height / 2, z]}
          rotation={[0, 0, Math.PI / 2]}
          length={height}
          thickness={0.22}
        />
        <mesh position={[x, 0.1, z]}>
          <boxGeometry args={[0.7, 0.2, 0.7]} />
          <meshStandardMaterial color="#1a1e28" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <VerticalPillar x={-SPAN_X / 2} z={FRONT_Z} height={FRONT_HEIGHT} />
      <VerticalPillar x={SPAN_X / 2} z={FRONT_Z} height={FRONT_HEIGHT} />
      <SquareTrussBeam
        position={[0, FRONT_HEIGHT, FRONT_Z]}
        length={SPAN_X}
        thickness={0.26}
      />

      <VerticalPillar x={-SPAN_X / 2} z={BACK_Z} height={BACK_HEIGHT} />
      <VerticalPillar x={SPAN_X / 2} z={BACK_Z} height={BACK_HEIGHT} />
      <SquareTrussBeam
        position={[0, BACK_HEIGHT, BACK_Z]}
        length={SPAN_X}
        thickness={0.26}
      />

      {[-1, 0, 1].map((i) => (
        <SquareTrussBeam
          key={`cross-${i}`}
          position={[0, (FRONT_HEIGHT + BACK_HEIGHT) / 2, i * 5]}
          rotation={[0, Math.PI / 2, 0]}
          length={16}
          thickness={0.2}
        />
      ))}

      {[
        [-SPAN_X / 2 + 0.5, FRONT_HEIGHT, FRONT_Z],
        [SPAN_X / 2 - 0.5, FRONT_HEIGHT, FRONT_Z],
        [-SPAN_X / 2 + 0.5, BACK_HEIGHT, BACK_Z],
        [SPAN_X / 2 - 0.5, BACK_HEIGHT, BACK_Z],
      ].map((pos, i) => (
        <mesh key={`hook-${i}`} position={pos as [number, number, number]}>
          <torusGeometry args={[0.12, 0.03, 6, 12]} />
          <meshStandardMaterial color="#8b7355" metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
}
