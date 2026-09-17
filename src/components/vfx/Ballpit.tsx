import { useCanvas, rgba } from "./useCanvas";

interface BallpitProps {
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  followCursor?: boolean;
  colors?: string[];
  className?: string;
}

/** Bouncing glowing orbs with soft collisions. */
export default function Ballpit({
  count = 100,
  gravity = 0.01,
  friction = 0.9975,
  wallBounce = 0.95,
  followCursor = false,
  colors = ["#5227FF", "#A6C8FF", "#FF9FFC", "#22D3EE"],
  className = "",
}: BallpitProps) {
  const ref = useCanvas(
    (w, h) => {
      const n = Math.min(count, 140);
      const balls = Array.from({ length: n }, () => {
        const r = 6 + Math.random() * 22;
        return {
          x: r + Math.random() * (w - 2 * r),
          y: r + Math.random() * (h - 2 * r),
          vx: (Math.random() - 0.5) * 2.4,
          vy: (Math.random() - 0.5) * 2.4,
          r,
          c: colors[Math.floor(Math.random() * colors.length)],
        };
      });

      const mouse = { x: -9999, y: -9999 };
      if (followCursor) {
        window.addEventListener("pointermove", (e) => {
          mouse.x = e.clientX;
          mouse.y = e.clientY;
        });
      }

      return (ctx) => {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < balls.length; i++) {
          const b = balls[i];
          b.vy += gravity * 60 * 0.016;
          b.vx *= friction;
          b.vy *= friction;

          if (followCursor && mouse.x > -1000) {
            const dx = b.x - mouse.x;
            const dy = b.y - mouse.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 160) {
              b.vx += (dx / d) * 0.6;
              b.vy += (dy / d) * 0.6;
            }
          }

          b.x += b.vx;
          b.y += b.vy;

          if (b.x - b.r < 0) { b.x = b.r; b.vx = -b.vx * wallBounce; }
          if (b.x + b.r > w) { b.x = w - b.r; b.vx = -b.vx * wallBounce; }
          if (b.y - b.r < 0) { b.y = b.r; b.vy = -b.vy * wallBounce; }
          if (b.y + b.r > h) { b.y = h - b.r; b.vy = -b.vy * wallBounce; }

          for (let j = i + 1; j < balls.length; j++) {
            const o = balls[j];
            const dx = o.x - b.x;
            const dy = o.y - b.y;
            const d = Math.hypot(dx, dy) || 1;
            const min = b.r + o.r;
            if (d < min) {
              const nx = dx / d;
              const ny = dy / d;
              const push = (min - d) / 2;
              b.x -= nx * push; b.y -= ny * push;
              o.x += nx * push; o.y += ny * push;
              const p = (b.vx - o.vx) * nx + (b.vy - o.vy) * ny;
              b.vx -= p * nx; b.vy -= p * ny;
              o.vx += p * nx; o.vy += p * ny;
            }
          }
        }

        ctx.globalCompositeOperation = "lighter";
        for (const b of balls) {
          const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, b.x, b.y, b.r);
          g.addColorStop(0, rgba(b.c, 0.95));
          g.addColorStop(1, rgba(b.c, 0.05));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      };
    },
    [count, gravity, friction, wallBounce, followCursor, colors.join()],
  );

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />;
}
