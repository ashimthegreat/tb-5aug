"use client";

import {
  Suspense,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  Component,
  type ReactNode,
  type FC,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  RoundedBox,
  Center,
  Billboard,
} from "@react-three/drei";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial } from "three";

const BRAND = "#f06020";
const BRAND_DEEP = "#c2400f";
const BRAND_SOFT = "#ffb38a";
const SLATE = "#1e2433";

const RACK_SPEED = 0.55;

const LED_COLORS = ["#ffffff", "#f06020", "#ffffff", "#f06020", "#ffffff"];

function useElapsed() {
  const [timer] = useState(() => new THREE.Timer());
  return timer;
}

function ServerUnit({
  position,
  reduced,
}: {
  position: [number, number, number];
  reduced: boolean;
}) {
  const ledRefs = useRef<(Mesh | null)[]>([]);
  const timer = useElapsed();

  useFrame(() => {
    if (reduced) return;
    const blink = timer.update().getElapsed();
    ledRefs.current.forEach((led, i) => {
      if (!led) return;
      const phase = Math.sin(blink * (1.2 + i * 0.3) + i * 1.3);
      (led.material as MeshStandardMaterial).emissiveIntensity =
        1 + 0.8 * Math.max(0, Math.sin(phase));
    });
  });

  return (
    <group position={position} rotation={[0, 0.12, 0]}>
      <RoundedBox args={[1.7, 0.44, 1.05]} radius={0.06} smoothness={3}>
        <meshPhysicalMaterial
          color={BRAND}
          metalness={0.35}
          roughness={0.28}
          clearcoat={0.35}
          emissive={BRAND_DEEP}
          emissiveIntensity={0.18}
        />
      </RoundedBox>

      <RoundedBox
        args={[1.55, 0.3, 0.08]}
        radius={0.03}
        position={[0, 0.02, 0.53]}
      >
        <meshPhysicalMaterial color={SLATE} metalness={0.5} roughness={0.4} />
      </RoundedBox>

      <RoundedBox
        args={[0.52, 0.14, 0.02]}
        radius={0.01}
        position={[0.4, 0.02, 0.585]}
      >
        <meshPhysicalMaterial color="#0b0f17" metalness={0.6} roughness={0.45} />
      </RoundedBox>

      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            ledRefs.current[i] = el;
          }}
          position={[0.4 - 0.13 * i, 0.065, 0.6]}
        >
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial
            color={LED_COLORS[i]}
            emissive={LED_COLORS[i]}
            emissiveIntensity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function ServerRack({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current || reduced) return;
    group.current.rotation.y += delta * RACK_SPEED;
  });

  return (
    <group ref={group}>
      <ServerUnit position={[0, 0.62, 0]} reduced={reduced} />
      <ServerUnit position={[0, 0.18, 0]} reduced={reduced} />
      <ServerUnit position={[0, -0.18, 0]} reduced={reduced} />
      <ServerUnit position={[0, -0.62, 0]} reduced={reduced} />
    </group>
  );
}

function Microchip() {
  return (
    <group>
      <RoundedBox args={[0.32, 0.2, 0.08]} radius={0.02} smoothness={2}>
        <meshPhysicalMaterial
          color={BRAND}
          metalness={0.5}
          roughness={0.3}
          emissive={BRAND_DEEP}
          emissiveIntensity={0.15}
        />
      </RoundedBox>
      {Array.from({ length: 8 }).map((_, i) => {
        const pos: [number, number, number] = [
          0,
          ((i % 4) - 1.5) * 0.12,
          0.24,
        ];
        return (
          <mesh key={i} position={pos}>
            <boxGeometry args={[0.03, 0.03, 0.16]} />
            <meshStandardMaterial color="#e5eaf2" metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function Shield() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <cylinderGeometry args={[0.18, 0.22, 0.05, 4]} />
      <meshPhysicalMaterial
        color={BRAND}
        metalness={0.5}
        roughness={0.3}
        emissive={BRAND_DEEP}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function Cloud() {
  const bits = useMemo(
    () => [
      [0, 0.03, 0],
      [0.12, -0.04, 0],
      [-0.12, -0.05, 0],
      [-0.04, 0.09, 0],
      [0.08, 0.07, 0],
    ],
    []
  );
  return (
    <group>
      {bits.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshPhysicalMaterial color="#ffffff" metalness={0.2} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function NetworkIcon() {
  const nodes: [number, number][] = [
    [0, 0.18],
    [-0.18, -0.1],
    [0.18, -0.1],
  ];
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.36, 0.025, 0.025]} />
        <meshStandardMaterial color={SLATE} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.09, 0.04, 0]} rotation={[0, 0, Math.atan2(0.28, 0.18)]}>
        <boxGeometry args={[0.34, 0.025, 0.025]} />
        <meshStandardMaterial color={SLATE} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.09, 0.04, 0]} rotation={[0, 0, -Math.atan2(0.28, 0.18)]}>
        <boxGeometry args={[0.34, 0.025, 0.025]} />
        <meshStandardMaterial color={SLATE} metalness={0.7} roughness={0.3} />
      </mesh>
      {nodes.map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1], 0]}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshPhysicalMaterial
            color={BRAND}
            metalness={0.5}
            roughness={0.3}
            emissive={BRAND_DEEP}
            emissiveIntensity={0.18}
          />
        </mesh>
      ))}
    </group>
  );
}

function ChartIcon() {
  const bars = [
    { x: -0.14, h: 0.1 },
    { x: 0, h: 0.18 },
    { x: 0.14, h: 0.28 },
  ];
  return (
    <group>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 0.13, 0]}>
          <boxGeometry args={[0.09, b.h, 0.09]} />
          <meshPhysicalMaterial
            color={i === bars.length - 1 ? BRAND : SLATE}
            metalness={0.6}
            roughness={0.3}
            emissive={i === bars.length - 1 ? BRAND_DEEP : "#000000"}
            emissiveIntensity={i === bars.length - 1 ? 0.25 : 0}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.1]} />
        <meshStandardMaterial color={SLATE} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function CpuIcon() {
  return (
    <group>
      <RoundedBox args={[0.36, 0.26, 0.08]} radius={0.02} smoothness={2}>
        <meshPhysicalMaterial
          color={BRAND}
          metalness={0.5}
          roughness={0.3}
          emissive={BRAND_DEEP}
          emissiveIntensity={0.18}
        />
      </RoundedBox>
      {Array.from({ length: 14 }).map((_, i) => {
        const col = i % 7;
        const row = Math.floor(i / 7);
        const x = (col - 3) * 0.05;
        const y = (row === 0 ? -1 : 1) * 0.11;
        return (
          <mesh key={i} position={[x, y, 0.04]}>
            <boxGeometry args={[0.025, 0.025, 0.12]} />
            <meshStandardMaterial color="#e5eaf2" metalness={0.6} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

function BriefcaseIcon() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.32, 0.22, 0.18]} />
        <meshPhysicalMaterial
          color={BRAND}
          metalness={0.5}
          roughness={0.3}
          emissive={BRAND_DEEP}
          emissiveIntensity={0.18}
        />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.14, 0.05, 0.06]} />
        <meshStandardMaterial color={SLATE} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.155, 0]}>
        <torusGeometry args={[0.05, 0.012, 8, 20, Math.PI]} />
        <meshStandardMaterial color={SLATE} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function BookIcon() {
  return (
    <group>
      <mesh position={[-0.09, 0, 0]} rotation={[0, 0, -0.14]}>
        <boxGeometry args={[0.2, 0.28, 0.05]} />
        <meshPhysicalMaterial
          color={BRAND}
          metalness={0.5}
          roughness={0.3}
          emissive={BRAND_DEEP}
          emissiveIntensity={0.18}
        />
      </mesh>
      <mesh position={[0.09, 0, 0]} rotation={[0, 0, 0.14]}>
        <boxGeometry args={[0.2, 0.28, 0.05]} />
        <meshPhysicalMaterial
          color={BRAND_DEEP}
          metalness={0.5}
          roughness={0.3}
          emissive={BRAND_DEEP}
          emissiveIntensity={0.18}
        />
      </mesh>
    </group>
  );
}

const ICONS: Record<string, FC> = {
  chip: Microchip,
  network: NetworkIcon,
  shield: Shield,
  cloud: Cloud,
  chart: ChartIcon,
  cpu: CpuIcon,
  briefcase: BriefcaseIcon,
  book: BookIcon,
};

function Orbit({
  radius,
  tilt,
  speed,
  ordered,
  reduced,
}: {
  radius: number;
  tilt: number;
  speed: number;
  ordered: string[];
  reduced: boolean;
}) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current || reduced) return;
    group.current.rotation.y += delta * speed;
  });

  return (
    <group ref={group} rotation={[tilt, 0, 0]} position={[0, 0.15, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.014, 16, 100]} />
        <meshStandardMaterial
          color={SLATE}
          metalness={0.85}
          roughness={0.3}
          emissive={BRAND}
          emissiveIntensity={0.25}
        />
      </mesh>
      {ordered.map((name, i) => {
        const Icon = ICONS[name];
        if (!Icon) return null;
        const a = (i / ordered.length) * Math.PI * 2;
        const pos: [number, number, number] = [
          Math.cos(a) * radius,
          0.18,
          Math.sin(a) * radius,
        ];
        return (
          <group key={name} position={pos}>
            <Billboard>
              <Float speed={1.5} rotationIntensity={0} floatIntensity={0.2}>
                <Center scale={[0.9, 0.9, 0.9]}>
                  <Icon />
                </Center>
              </Float>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

function GlowRing() {
  return (
    <group position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[1.35, 1.75, 48]} />
        <meshBasicMaterial
          color={BRAND}
          transparent
          opacity={0.35}
          side={2}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[1.75, 1.95, 48]} />
        <meshBasicMaterial color={BRAND_SOFT} transparent opacity={0.12} side={2} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshBasicMaterial color={BRAND} transparent opacity={0.08} side={2} />
      </mesh>
    </group>
  );
}

function Scene({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  const group = useRef<Group>(null);
  const size = useThree((s) => s.size);

  const orbitA = compact ? 1.28 : 1.7;
  const orbitB = compact ? 1.72 : 2.15;
  const rackScale = compact ? 0.8 : 1;
  const sparkles = compact ? 12 : 36;

  useFrame((state, delta) => {
    if (!group.current || reduced) return;
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y += (px * 0.18 - group.current.rotation.y) * delta * 2;
    group.current.rotation.x +=
      (py * 0.12 - group.current.rotation.x) * delta * 2;
  });

  return (
    <group ref={group} scale={size.width < 360 ? 0.85 : 1}>
      <Float speed={0.9} rotationIntensity={0.03} floatIntensity={0.25}>
        <Center scale={rackScale}>
          <ServerRack reduced={reduced} />
        </Center>
      </Float>

      <Orbit
        radius={orbitA}
        tilt={1.15}
        speed={0.5}
        ordered={["chip", "network", "shield", "cloud"]}
        reduced={reduced}
      />
      <Orbit
        radius={orbitB}
        tilt={0.55}
        speed={-0.35}
        ordered={["chart", "cpu", "briefcase", "book"]}
        reduced={reduced}
      />

      <GlowRing />

      {!reduced && (
        <Sparkles
          count={sparkles}
          scale={5.5}
          size={1.6}
          speed={0.25}
          opacity={0.45}
          color="#ffffff"
        />
      )}
    </group>
  );
}

function Rig({ reduced }: { reduced: boolean }) {
  useFrame((state, delta) => {
    if (reduced) return;
    const target = state.pointer;
    state.camera.position.lerp(
      { x: target.x * 0.35, y: 2.5 - target.y * 0.2, z: 6 - target.y * 0.05 },
      Math.min(1, delta * 2.5)
    );
    state.camera.lookAt(0, 0.1, 0);
  });
  return null;
}

class CanvasBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function FallbackArt() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative flex aspect-square w-full max-w-[16rem] items-center justify-center sm:max-w-[19rem]">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#f06020,#ffb38a,#1e2433,#f06020)] opacity-90 blur-[2px]" />
        <div className="absolute inset-3 rounded-full bg-white" />
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-300 text-white shadow-lg shadow-brand-500/25 sm:h-20 sm:w-20">
            <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 sm:h-10 sm:w-10" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="4" width="18" height="6" rx="1.5" />
              <rect x="3" y="14" width="18" height="6" rx="1.5" />
              <circle cx="7" cy="7" r="1" fill="currentColor" />
              <circle cx="7" cy="17" r="1" fill="currentColor" />
            </svg>
          </span>
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            TechBucket Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}

type DevicePrefs = { small: boolean; reduced: boolean };

const DEFAULT_PREFS: DevicePrefs = { small: false, reduced: false };

let snapshot: DevicePrefs = DEFAULT_PREFS;
let snapshotInitialized = false;

function readPrefs(): DevicePrefs {
  return {
    small: window.innerWidth < 768,
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

function subscribeDevicePrefs(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    snapshot = readPrefs();
    callback();
  };
  window.addEventListener("resize", handler);
  mq.addEventListener("change", handler);
  return () => {
    window.removeEventListener("resize", handler);
    mq.removeEventListener("change", handler);
  };
}

function getDevicePrefsSnapshot() {
  if (!snapshotInitialized) {
    snapshotInitialized = true;
    snapshot = readPrefs();
  }
  return snapshot;
}

function getDevicePrefsServerSnapshot() {
  return DEFAULT_PREFS;
}

function useDevicePrefs(): DevicePrefs {
  return useSyncExternalStore(
    subscribeDevicePrefs,
    getDevicePrefsSnapshot,
    getDevicePrefsServerSnapshot
  );
}

export default function ThreeHero() {
  const { small, reduced } = useDevicePrefs();

  return (
    <div
      className="reveal relative h-full min-h-[18rem] w-full sm:min-h-[24rem] lg:min-h-[30rem]"
      aria-hidden="true"
    >
      <CanvasBoundary fallback={<FallbackArt />}>
        <Canvas
          dpr={small ? [1, 1] : [1, 1.5]}
          camera={{ position: [0, 2.5, 6], fov: 38 }}
          gl={{
            antialias: !small,
            alpha: true,
            powerPreference: small ? "low-power" : "high-performance",
          }}
          style={{ background: "transparent" }}
          frameloop={reduced ? "demand" : "always"}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 3]} intensity={1.2} color="#fff4ee" />
          <directionalLight position={[-5, 2, -3]} intensity={0.4} color="#ffd9c4" />
          <pointLight position={[0, 0, 3]} intensity={0.5} color="#ffffff" />
          <pointLight position={[0, -2, 1.5]} intensity={0.6} color={BRAND} />
          <Suspense fallback={null}>
            <Scene compact={small} reduced={reduced} />
            <Rig reduced={reduced} />
          </Suspense>
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}