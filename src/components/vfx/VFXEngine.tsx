import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Lightfall from "./Lightfall";
import GradientWaves from "./GradientWaves";
import Ballpit from "./Ballpit";
import Particles from "./Particles";
import Hyperspeed from "./Hyperspeed";

export type VFXScene = "lightfall" | "waves" | "ballpit" | "particles" | "hyperspeed" | "none";

interface VFXContextValue {
  /** Temporarily force a scene (e.g. Hyperspeed while the AI generates). Pass null to restore. */
  setOverride: (scene: VFXScene | null) => void;
  override: VFXScene | null;
  scene: VFXScene;
}

const VFXContext = createContext<VFXContextValue>({
  setOverride: () => {},
  override: null,
  scene: "none",
});

export const useVFX = () => useContext(VFXContext);

/** Route -> background mapping. */
function sceneForPath(path: string): VFXScene {
  if (path === "/") return "lightfall";
  if (path.startsWith("/auth") || path.startsWith("/reset-password")) return "particles";
  if (path.startsWith("/browse") || path.startsWith("/inventions")) return "waves";
  if (path.startsWith("/network")) return "waves";
  if (path.startsWith("/spark-arena")) return "ballpit";
  if (path.startsWith("/ai-brainstorm")) return "particles";
  if (path.startsWith("/post")) return "lightfall";
  if (path.startsWith("/admin")) return "hyperspeed";
  return "particles";
}

function SceneRenderer({ scene }: { scene: VFXScene }) {
  switch (scene) {
    case "lightfall":
      return (
        <Lightfall
          colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
          backgroundColor="transparent"
          speed={0.5}
          streakCount={2}
          streakWidth={1}
          streakLength={1}
          glow={1}
          density={0.6}
          twinkle={1}
          opacity={0.75}
        />
      );
    case "waves":
      return (
        <GradientWaves
          horizonColor="#5227FF"
          waveColor="#FF9FFC"
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          turbulence={20}
          opacity={0.55}
          grain
          grainIntensity={0.05}
        />
      );
    case "ballpit":
      return <Ballpit count={70} gravity={0.01} friction={0.9975} wallBounce={0.95} followCursor={false} />;
    case "particles":
      return (
        <Particles
          particleColors={["#ffffff", "#A6C8FF"]}
          particleCount={160}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover
          alphaParticles={false}
        />
      );
    case "hyperspeed":
      return <Hyperspeed lanesPerRoad={4} roadWidth={10} />;
    default:
      return null;
  }
}

/** Fixed, full-viewport canvas layer that swaps per route. */
export function VFXBackground() {
  const { scene, override } = useVFX();
  const active = override ?? scene;
  if (active === "none") return null;
  return (
    <div
      key={active}
      className="pointer-events-none fixed inset-0 -z-10 opacity-70 transition-opacity duration-700 dark:opacity-100"
      aria-hidden
    >
      <SceneRenderer scene={active} />
    </div>
  );
}

export function VFXProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [override, setOverride] = useState<VFXScene | null>(null);
  const scene = sceneForPath(location.pathname);
  const value = useMemo(() => ({ scene, override, setOverride }), [scene, override]);

  return (
    <VFXContext.Provider value={value}>
      <VFXBackground />
      {children}
    </VFXContext.Provider>
  );
}

export default VFXProvider;
