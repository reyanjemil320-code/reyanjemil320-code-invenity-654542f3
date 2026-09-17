import { useCanvas, rgba } from "./useCanvas";

interface ParticlesProps {
  particleColors?: string[];
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleBaseSize?: number;
  moveParticlesOnHover?: boolean;
  alphaParticles?: boolean;
  className?: string;
}

/** Floating dots with depth parallax and hover push. */
export default function Particles({
  particleColors = ["#ffffff"],
  particleCount = 200,
  particleSpread = 10,
  speed = 0.1,
  particleBaseSize = 100,
  moveParticlesOnHover = true,
  alphaParticles = false,
  className = "",
}: ParticlesProps) {
  const ref = useCanvas(
    (w, h) => {
      const n = Math.min(particleCount, 260);
      const parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.2 + Math.random() * 0.8,
        a: Math.random() * Math.PI * 2,
        c: particleColors[Math.floor(Math.random() * particleColors.length)],
      }));

      const mouse = { x: -9999, y: -9999 };
      const onMove = (e: PointerEvent) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      };
      if (moveParticlesOnHover) window.addEventListener("pointermove", onMove);

      return (ctx, t) => {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (const p of parts) {
          p.x += Math.cos(p.a + t * 0.2) * speed * particleSpread * 0.12 * p.z;
          p.y += Math.sin(p.a + t * 0.17) * speed * particleSpread * 0.12 * p.z;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          let dx = 0;
          let dy = 0;
          if (moveParticlesOnHover && mouse.x > -1000) {
            const ox = p.x - mouse.x;
            const oy = p.y - mouse.y;
            const d = Math.hypot(ox, oy) || 1;
            if (d < 140) {
              dx = (ox / d) * (140 - d) * 0.25;
              dy = (oy / d) * (140 - d) * 0.25;
            }
          }

          const r = (particleBaseSize / 100) * (0.6 + p.z * 1.6);
          const alpha = alphaParticles ? 0.25 + p.z * 0.4 : 0.35 + p.z * 0.55;
          ctx.fillStyle = rgba(p.c, alpha);
          ctx.beginPath();
          ctx.arc(p.x + dx, p.y + dy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      };
    },
    [particleColors.join(), particleCount, particleSpread, speed, particleBaseSize, moveParticlesOnHover, alphaParticles],
  );

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />;
}
