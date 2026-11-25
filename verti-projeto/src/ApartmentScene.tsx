import {
  Component,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
type V3 = [number, number, number];
type Props = {
  penthouse: boolean;
  activeRoom: number | null;
  onRoom: (room: number) => void;
  zoom: number;
  reset: number;
};
const palette = {
  wall: "#e9e0ce",
  floor: "#d2bea0",
  wood: "#a17d53",
  lightWood: "#c2a47e",
  linen: "#f1e9d7",
  green: "#747e59",
  dark: "#3e352b",
  stone: "#d7c9ad",
};
function Box({
  p,
  s,
  color = palette.wall,
  ...props
}: {
  p: V3;
  s: V3;
  color?: string;
  rotation?: V3;
}) {
  return (
    <mesh position={p} castShadow receiveShadow {...props}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={color} roughness={0.83} />
    </mesh>
  );
}
function Soft({
  p,
  s,
  color = palette.linen,
  radius = 0.09,
  rotation,
}: {
  p: V3;
  s: V3;
  color?: string;
  radius?: number;
  rotation?: V3;
}) {
  return (
    <RoundedBox
      position={p}
      args={s}
      radius={radius}
      smoothness={2}
      castShadow
      receiveShadow
      rotation={rotation}
    >
      <meshStandardMaterial color={color} roughness={0.92} />
    </RoundedBox>
  );
}
function Cylinder({
  p,
  r,
  h,
  color = palette.wood,
}: {
  p: V3;
  r: number;
  h: number;
  color?: string;
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, 32]} />
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  );
}
function Plant({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.19, 0.5, 16]} />
        <meshStandardMaterial color="#b9a88e" roughness={0.9} />
      </mesh>
      <Cylinder p={[0, 0.7, 0]} r={0.035} h={0.8} color="#665f40" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = i * 2.4;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * 0.24,
              0.75 + (i % 3) * 0.22,
              Math.sin(a) * 0.24,
            ]}
            rotation={[Math.cos(a) * 0.5, a, 0.5]}
            scale={[0.24, 0.4, 0.09]}
            castShadow
          >
            <sphereGeometry args={[1, 14, 12]} />
            <meshStandardMaterial
              color={["#536444", "#71815b", "#8c9268"][i % 3]}
              roughness={0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}
function Bed({
  position,
  color = "#b0b69b",
  double = true,
}: {
  position: V3;
  color?: string;
  double?: boolean;
}) {
  const w = double ? 2.2 : 1.65;
  return (
    <group position={position}>
      <Soft p={[0, 0.3, 0]} s={[w, 0.45, 2.65]} color={palette.lightWood} />
      <Soft p={[0, 0.58, 0]} s={[w - 0.06, 0.26, 2.55]} />
      <Soft
        p={[0, 0.77, 0.48]}
        s={[w, 0.14, 1.45]}
        color={color}
        radius={0.055}
      />
      <Box
        p={[0, 0.75, -1.35]}
        s={[w + 0.25, 1.4, 0.16]}
        color={palette.wood}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Soft
            p={[side * w * 0.23, 0.81, -0.7]}
            s={[w * 0.43, 0.18, 0.55]}
            rotation={[0, 0, side * 0.06]}
            radius={0.06}
          />
          <Box
            p={[side * (w / 2 + 0.4), 0.35, -0.85]}
            s={[0.55, 0.65, 0.55]}
            color={palette.lightWood}
          />
          <Cylinder
            p={[side * (w / 2 + 0.4), 0.77, -0.85]}
            r={0.18}
            h={0.13}
            color="#f2e6cb"
          />
        </group>
      ))}
    </group>
  );
}
function Chair({
  position,
  rotation = 0,
  color = palette.linen,
}: {
  position: V3;
  rotation?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Soft
        p={[0, 0.52, 0]}
        s={[0.65, 0.14, 0.65]}
        color={color}
        radius={0.055}
      />
      <Soft
        p={[0, 0.9, -0.27]}
        s={[0.65, 0.65, 0.12]}
        color={color}
        radius={0.05}
      />
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <Box
            key={`${x}${z}`}
            p={[x * 0.24, 0.25, z * 0.23]}
            s={[0.045, 0.5, 0.045]}
            color={palette.dark}
          />
        )),
      )}
    </group>
  );
}
function Bookshelf() {
  return (
    <group position={[-2.1, 0, -0.94]}>
      <Box p={[0, 1.05, 0]} s={[3.2, 2.1, 0.3]} color={palette.wood} />
      {[0.25, 0.85, 1.45, 2.05].map((y) => (
        <Box
          key={y}
          p={[0, y, 0.22]}
          s={[3.25, 0.06, 0.52]}
          color={palette.lightWood}
        />
      ))}
      {[-1.57, -0.5, 0.5, 1.57].map((x) => (
        <Box
          key={x}
          p={[x, 1.12, 0.22]}
          s={[0.06, 1.9, 0.52]}
          color={palette.lightWood}
        />
      ))}
      {Array.from({ length: 27 }, (_, i) => (
        <Box
          key={i}
          p={[-1.4 + (i % 9) * 0.32, 0.51 + Math.floor(i / 9) * 0.6, 0.23]}
          s={[0.12, 0.3 + (i % 3) * 0.04, 0.23]}
          color={["#d7cfb5", "#e7dfcc", "#6b775f", "#a48566"][i % 4]}
          rotation={[0, 0, i % 4 === 0 ? 0.12 : 0]}
        />
      ))}
    </group>
  );
}
function ApartmentModel({ penthouse }: { penthouse: boolean }) {
  const root = useRef<THREE.Group>(null);
  const start = useRef(0);
  const reduced = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  useFrame((_, delta) => {
    if (!root.current) return;
    start.current = Math.min(1, start.current + delta * 1.2);
    const t = 1 - Math.pow(1 - start.current, 3);
    root.current.scale.setScalar(reduced ? 1 : 0.78 + t * 0.22);
    root.current.rotation.y = reduced ? 0 : (1 - t) * -0.22;
  });
  return (
    <group ref={root}>
      <Box p={[0, -0.25, 0]} s={[16.5, 0.48, 11.6]} color="#8c806a" />
      <Box p={[0, 0.015, -0.8]} s={[16.1, 0.07, 9.75]} color={palette.floor} />
      {Array.from({ length: 32 }, (_, i) => (
        <Box
          key={`plank${i}`}
          p={[-7.75 + i * 0.5, 0.056, -0.8]}
          s={[0.015, 0.008, 9.7]}
          color="#bba686"
        />
      ))}
      <Box p={[0, 0.025, 4.55]} s={[16.1, 0.1, 2.1]} color="#b59a74" />
      {Array.from({ length: 13 }, (_, i) => (
        <Box
          key={`deck${i}`}
          p={[0, 0.079, 3.65 + i * 0.15]}
          s={[16, 0.008, 0.012]}
          color="#867452"
        />
      ))}
      <Box p={[0, 1.08, -5.45]} s={[16.25, 2.16, 0.18]} />
      <Box p={[-8, 1.08, -0.9]} s={[0.18, 2.16, 9.15]} />
      <Box p={[8, 0.7, -0.9]} s={[0.18, 1.4, 9.15]} />
      {[-3.8, -0.3, 3.6].map((x) => (
        <Box key={x} p={[x, 0.88, -3.3]} s={[0.13, 1.76, 4.2]} />
      ))}
      {[
        [-6.4, 2.9],
        [-2.1, 1.8],
        [1.55, 2.1],
        [5.9, 2.2],
      ].map(([x, w]) => (
        <Box key={x} p={[x, 0.8, -1.25]} s={[w, 1.6, 0.15]} />
      ))}
      <Box p={[3.6, 0.75, 0.25]} s={[0.13, 1.5, 2.8]} />
      {[-7.9, -3.87, -0.37, 3.67].map((x) => (
        <Box
          key={x}
          p={[x, 0.82, -2.1]}
          s={[0.13, 1.64, 0.7]}
          color={palette.lightWood}
        />
      ))}
      <Bed position={[-5.9, 0.08, -3.7]} />
      <Bed position={[1.7, 0.08, -3.7]} color="#c5ae8d" double={false} />
      <Box
        p={[-5.8, 1.02, -5.27]}
        s={[3.6, 2, 0.16]}
        color={palette.lightWood}
      />
      {[-7.4, -6.7, -6, -5.3, -4.6].map((x) => (
        <Box
          key={x}
          p={[x, 1.02, -5.17]}
          s={[0.016, 1.9, 0.02]}
          color="#927957"
        />
      ))}
      <Box p={[-2.03, 0.07, -3.35]} s={[3.35, 0.05, 3.95]} color="#dbd6c8" />
      <Box
        p={[-2.05, 0.48, -4.78]}
        s={[2.7, 0.8, 0.8]}
        color={palette.lightWood}
      />
      <Box p={[-2.05, 0.92, -4.78]} s={[2.8, 0.09, 0.9]} color="#ede7db" />
      {[-2.75, -1.35].map((x) => (
        <group key={x}>
          <Soft
            p={[x, 0.99, -4.75]}
            s={[0.75, 0.12, 0.5]}
            color="#f9f5e9"
            radius={0.1}
          />
          <Box p={[x, 1.13, -5]} s={[0.04, 0.25, 0.04]} color="#82775e" />
        </group>
      ))}
      <Box p={[-2, 1.45, -5.32]} s={[2.8, 0.75, 0.02]} color="#9ca8a0" />
      <Soft
        p={[-2.4, 0.4, -2.4]}
        s={[1.65, 0.65, 0.85]}
        color="#f2efe5"
        radius={0.16}
      />
      <Soft
        p={[-2.4, 0.74, -2.4]}
        s={[1.3, 0.035, 0.58]}
        color="#d1dad7"
        radius={0.14}
      />
      {!penthouse && (
        <Bed position={[5.25, 0.08, -3.7]} color="#b9aa8c" double={false} />
      )}
      <group position={[7.4, 0.08, -2.9]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 0.8, 0]} s={[1.7, 0.12, 0.7]} color={palette.wood} />
        {[-0.7, 0.7].map((x) => (
          <Box
            key={x}
            p={[x, 0.4, 0]}
            s={[0.08, 0.8, 0.6]}
            color={palette.dark}
          />
        ))}
        <Box p={[0, 1.12, -0.18]} s={[0.65, 0.45, 0.05]} color="#3a413a" />
        <Box p={[0, 0.9, -0.18]} s={[0.06, 0.2, 0.07]} color={palette.dark} />
        <Chair
          position={[0, 0, 0.85]}
          rotation={Math.PI}
          color={palette.green}
        />
      </group>
      <Plant position={[7.4, 0.08, -4.8]} scale={0.75} />
      <Box p={[1.6, 0.07, -3.3]} s={[3.2, 0.025, 3.8]} color="#ccb89c" />
      <Box p={[-4.5, 0.085, 1.25]} s={[5.5, 0.035, 3.9]} color="#ddd4bb" />
      {Array.from({ length: 17 }, (_, i) => (
        <Box
          key={`rug${i}`}
          p={[-4.5, 0.107, -0.55 + i * 0.22]}
          s={[5.5, 0.005, 0.015]}
          color="#c5bea7"
        />
      ))}
      <group position={[-6.5, 0.1, 1.1]} rotation={[0, Math.PI / 2, 0]}>
        <Soft p={[0, 0.34, 0]} s={[3.4, 0.6, 1.1]} />
        <Soft p={[0, 0.8, -0.42]} s={[3.4, 0.8, 0.25]} />
        <Soft p={[-1.58, 0.65, 0]} s={[0.24, 0.66, 1.1]} />
        <Soft p={[1.58, 0.65, 0]} s={[0.24, 0.66, 1.1]} />
        {[-1, 0, 1].map((x) => (
          <group key={x}>
            <Soft p={[x, 0.65, 0.06]} s={[0.94, 0.18, 0.8]} color="#e1d8c3" />
            <Soft
              p={[x, 0.95, -0.27]}
              s={[0.7, 0.48, 0.18]}
              color={x === 0 ? "#858e70" : "#e9dec4"}
              rotation={[-0.15, 0, 0.05]}
            />
          </group>
        ))}
      </group>
      <Cylinder p={[-4.3, 0.38, 1.2]} r={0.85} h={0.58} color={palette.stone} />
      <Cylinder p={[-3.3, 0.25, 1.9]} r={0.5} h={0.35} color="#9c845e" />
      <Box p={[-4.4, 0.7, 1.1]} s={[0.5, 0.06, 0.35]} color="#e9e4d4" />
      <Cylinder p={[-4, 0.79, 1.3]} r={0.12} h={0.23} color="#786747" />
      <group position={[-2.55, 0.1, 2.35]} rotation={[0, -0.4, 0]}>
        <Soft p={[0, 0.4, 0]} s={[0.9, 0.7, 0.95]} color={palette.green} />
        <Soft p={[0, 0.92, 0.35]} s={[0.9, 0.65, 0.2]} color={palette.green} />
        <Soft p={[-0.4, 0.7, 0]} s={[0.15, 0.45, 0.85]} color={palette.green} />
        <Soft p={[0.4, 0.7, 0]} s={[0.15, 0.45, 0.85]} color={palette.green} />
      </group>
      <Bookshelf />
      <Plant position={[-7.45, 0.1, 2.95]} scale={1.25} />
      <group position={[1.15, 0.1, 1.3]}>
        <Soft
          p={[0, 0.88, 0]}
          s={[2.7, 0.16, 1.25]}
          color={palette.lightWood}
          radius={0.1}
        />
        {[-0.9, 0.9].map((x) => (
          <Box
            key={x}
            p={[x, 0.42, 0]}
            s={[0.15, 0.82, 0.75]}
            color={palette.wood}
          />
        ))}
        {[-0.88, 0, 0.88].flatMap((x) =>
          [-1, 1].map((z) => (
            <Chair
              key={`${x}${z}`}
              position={[x, 0, z * 0.97]}
              rotation={z < 0 ? Math.PI : 0}
            />
          )),
        )}
        <Cylinder p={[0, 1.11, 0]} r={0.16} h={0.28} color="#d4cab0" />
      </group>
      <Box p={[6, 0.48, -0.73]} s={[3.65, 0.88, 0.85]} color={palette.wood} />
      <Box p={[6, 0.97, -0.73]} s={[3.7, 0.1, 0.9]} color="#e8dfcd" />
      {Array.from({ length: 6 }, (_, i) => (
        <Box
          key={i}
          p={[4.4 + i * 0.6, 0.5, -0.285]}
          s={[0.015, 0.85, 0.012]}
          color="#7c6243"
        />
      ))}
      <Box
        p={[7.45, 0.5, 1.1]}
        s={[0.85, 0.9, 2.6]}
        color={palette.lightWood}
      />
      <Box p={[7.45, 1, 1.1]} s={[0.92, 0.1, 2.7]} color="#e8dfcd" />
      <Box p={[5.3, 0.5, 1.6]} s={[1.7, 0.9, 0.9]} color={palette.wood} />
      <Box p={[5.3, 1, 1.6]} s={[2, 0.12, 1.1]} color={palette.stone} />
      <Box p={[6.4, 1.04, -0.73]} s={[0.8, 0.02, 0.65]} color="#353b36" />
      {[6.2, 6.6].flatMap((x) =>
        [-0.9, -0.55].map((z) => (
          <Cylinder
            key={`${x}${z}`}
            p={[x, 1.06, z]}
            r={0.12}
            h={0.015}
            color="#797972"
          />
        )),
      )}
      <Soft
        p={[4.65, 1.04, -0.73]}
        s={[0.66, 0.05, 0.55]}
        color="#9da49a"
        radius={0.07}
      />
      <Box p={[4.65, 1.2, -1]} s={[0.04, 0.32, 0.04]} color="#897b61" />
      <Chair position={[4.8, 0.1, 2.8]} color="#b9bca5" />
      <Chair position={[5.7, 0.1, 2.8]} color="#b9bca5" />
      <Box p={[0.2, 1.12, 3.5]} s={[15.75, 0.05, 0.045]} color={palette.dark} />
      <Box p={[0.2, 0.12, 3.5]} s={[15.75, 0.05, 0.045]} color={palette.dark} />
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={`frame${i}`}
          p={[-7.7 + i * 1.95, 0.62, 3.5]}
          s={[0.035, 1.05, 0.04]}
          color={palette.dark}
        />
      ))}
      <mesh position={[0.1, 0.62, 3.5]}>
        <boxGeometry args={[15.8, 1, 0.015]} />
        <meshPhysicalMaterial
          color="#c4d5ce"
          transparent
          opacity={0.12}
          roughness={0.1}
          depthWrite={false}
        />
      </mesh>
      <Box p={[0, 0.6, 5.55]} s={[16.2, 0.04, 0.04]} color={palette.dark} />
      <Box p={[0, 0.12, 5.55]} s={[16.2, 0.04, 0.04]} color={palette.dark} />
      {Array.from({ length: 11 }, (_, i) => (
        <Box
          key={`rail${i}`}
          p={[-8 + i * 1.6, 0.36, 5.55]}
          s={[0.03, 0.5, 0.03]}
          color={palette.dark}
        />
      ))}
      {[-7.5, -3, 2.5, 7.4].map((x) => (
        <Plant key={x} position={[x, 0.1, 5.03]} scale={0.65} />
      ))}
      {penthouse ? (
        <group>
          <Box p={[3, 0.15, 4.55]} s={[5.4, 0.28, 1.65]} color="#b9b19b" />
          <mesh position={[3, 0.31, 4.55]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[5.1, 1.4]} />
            <meshPhysicalMaterial
              color="#4caaa5"
              metalness={0.2}
              roughness={0.15}
              transparent
              opacity={0.9}
            />
          </mesh>
          <Soft p={[-4.5, 0.32, 4.55]} s={[1.9, 0.25, 0.68]} color="#ede6d5" />
          <Soft p={[-1.9, 0.32, 4.55]} s={[1.9, 0.25, 0.68]} color="#ede6d5" />
        </group>
      ) : (
        <group>
          <Cylinder
            p={[-0.8, 0.55, 4.55]}
            r={0.52}
            h={0.08}
            color={palette.stone}
          />
          <Cylinder p={[-0.8, 0.3, 4.55]} r={0.12} h={0.5} />
          <Chair position={[-1.8, 0.1, 4.6]} rotation={Math.PI / 2} />
          <Chair position={[0.2, 0.1, 4.6]} rotation={-Math.PI / 2} />
          <Soft p={[5.1, 0.35, 4.65]} s={[2.25, 0.5, 0.7]} color="#acae91" />
        </group>
      )}
    </group>
  );
}
const roomTargets: V3[] = [
  [-4.4, 0, 1.1],
  [5.6, 0, 1],
  [-5.7, 0, -3.4],
  [-2.1, 0, -3.4],
  [6.9, 0, -2.7],
  [0, 0, 4.5],
];
function Scene({
  penthouse,
  activeRoom,
  zoom,
  reset,
  hotspotRefs,
}: Props & { hotspotRefs: RefObject<(HTMLButtonElement | null)[]> }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const move = useRef(1);
  const desired = useRef(new THREE.Vector3(17, 20, 24));
  const target = useRef(new THREE.Vector3());
  const isMobile = useMemo(() => window.innerWidth < 700, []);
  useEffect(() => {
    const point = activeRoom === null ? [0, 0, 0] : roomTargets[activeRoom];
    target.current.set(point[0] * 0.65, 0, point[2] * 0.65);
    const factor =
      (activeRoom === null ? 0.83 : 0.67) *
      Math.pow(0.88, zoom) *
      (isMobile ? 1.15 : 1);
    desired.current.set(
      target.current.x + 17 * factor,
      20 * factor,
      target.current.z + 24 * factor,
    );
    move.current = 1;
  }, [activeRoom, zoom, reset, isMobile]);
  useFrame(({ camera, size }, delta) => {
    roomTargets.forEach((p, i) => {
      const el = hotspotRefs.current[i];
      if (!el) return;
      const v = new THREE.Vector3(p[0], 0.95, p[2]).project(camera);
      el.style.transform = `translate3d(${((v.x + 1) * size.width) / 2}px,${((-v.y + 1) * size.height) / 2}px,0) translate(-50%,-50%)`;
      el.style.visibility = v.z > 1 ? "hidden" : "visible";
    });
    if (!controls.current || move.current < 0.001) return;
    const speed = 1 - Math.exp(-delta * 4);
    camera.position.lerp(desired.current, speed);
    controls.current.target.lerp(target.current, speed);
    controls.current.update();
    move.current *= Math.exp(-delta * 3);
  });
  return (
    <>
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#fff5df", "#6a736a", 0.9]} />
      <directionalLight
        position={[-10, 18, 10]}
        intensity={2.7}
        color="#fff3da"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-normalBias={0.04}
      />
      <directionalLight
        position={[10, 10, -8]}
        intensity={0.9}
        color="#d3e4ff"
      />
      <ApartmentModel key={String(penthouse)} penthouse={penthouse} />
      <ContactShadows
        position={[0, -0.51, 0]}
        opacity={0.45}
        scale={35}
        blur={2.5}
        far={12}
        resolution={256}
        color="#000000"
        frames={1}
      />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={13}
        maxDistance={48}
        minPolarAngle={0.3}
        maxPolarAngle={1.2}
        enablePan={false}
        onStart={() => {
          move.current = 0;
        }}
      />
    </>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-loading">
        A visualização 3D precisa de um navegador com WebGL ativo.
        <br />
        Você ainda pode explorar as imagens e os detalhes ao lado.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function ApartmentScene(props: Props) {
  const hotspotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labels = [
    "Living e jantar",
    "Cozinha",
    "Suíte master",
    "Banho master",
    "Home office",
    props.penthouse ? "Terraço e piscina" : "Varanda gourmet",
  ];
  return (
    <SceneBoundary>
      <div className="webgl-view">
        <Canvas
          shadows="percentage"
          dpr={[1, 1.5]}
          camera={{
            position: [14.1, 16.6, 19.9],
            fov: 34,
            near: 0.1,
            far: 150,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          fallback={
            <div className="scene-loading">
              Seu navegador não oferece WebGL. Conheça os ambientes em “Ver
              imagens”.
            </div>
          }
        >
          <Scene {...props} hotspotRefs={hotspotRefs} />
        </Canvas>
        <div className="hotspot-overlay">
          {labels.map((label, i) => (
            <button
              key={label}
              ref={(el) => {
                hotspotRefs.current[i] = el;
              }}
              className={`hotspot ${props.activeRoom === i ? "active" : ""}`}
              aria-label={`Explorar ${label}`}
              onClick={() => props.onRoom(i)}
            >
              {props.activeRoom === i && (
                <span className="hotspot-label">{label}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </SceneBoundary>
  );
}
