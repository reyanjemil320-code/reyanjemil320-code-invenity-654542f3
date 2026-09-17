import { useCanvas, rgba } from "./useCanvas";

interface HyperspeedProps {
  speedUp?: boolean;
  roadWidth?: number;
  lanesPerRoad?: number;
  className?: string;
  colors?: {
    leftCars?: string[];
    rightCars?: string[];
    lines?: string;
  };
}

/** Perspective road with light-speed car streaks. */
export default function Hyperspeed({
  speedUp = false,
  roadWidth = 10,
  lanesPerRoad = 4,
  colors,
  className = "",
}: HyperspeedProps) {
  const left = colors?.leftCars ?? ["#D856BF", "#6750A2", "#C247AC"];
  const right = colors?.rightCars ?? ["#03B3C3", "#0E5EA5", "#324555"];
  const lineColor = colors?.lines ?? "#FFFFFF";

  const ref = useCanvas(
    (w, h) => {
      const horizon = h * 0.45;
      const project = (z: number, x: number) => {
        const scale = 1 / Math.max(z, 0.05);
        return { px: w / 2 + x * scale * (w * 0.5), py: horizon + scale * (h * 0.55), s: scale };
      };

      const cars = Array.from({ length: 60 }, () => {
        const isLeft = Math.random() < 0.5;
        return {
          z: Math.random() * 3 + 0.1,
          x: (isLeft ? -1 : 1) * (0.08 + Math.random() * (roadWidth / 40)),
          v: (isLeft ? 1 : 1.6) * (0.4 + Math.random() * 0.8),
          c: (isLeft ? left : right)[Math.floor(Math.random() * 3)],
          len: 0.15 + Math.random() * 0.5,
        };
      });

      const sticks = Array.from({ length: 24 }, (_, i) => ({ z: 0.1 + i * 0.14, side: i % 2 ? 1 : -1 }));

      return (ctx, _t) => {
        const boost = speedUp ? 3.2 : 1;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, w, h);

        // road
        ctx.fillStyle = "#080808";
        ctx.beginPath();
        ctx.moveTo(w / 2 - 6, horizon);
        ctx.lineTo(w / 2 + 6, horizon);
        ctx.lineTo(w * 1.35, h);
        ctx.lineTo(-w * 0.35, h);
        ctx.closePath();
        ctx.fill();

        ctx.globalCompositeOperation = "lighter";

        // lane lines
        for (let lane = 1; lane < lanesPerRoad; lane++) {
          const lx = (lane / lanesPerRoad) * 2 - 1;
          ctx.strokeStyle = rgba(lineColor, 0.14);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(w / 2 + lx * 6, horizon);
          ctx.lineTo(w / 2 + lx * w * 0.85, h);
          ctx.stroke();
        }

        // side light sticks
        for (const st of sticks) {
          st.z -= 0.012 * boost;
          if (st.z < 0.08) st.z += 3.4;
          const p = project(st.z, st.side * 0.55);
          const hgt = p.s * h * 0.09;
          ctx.strokeStyle = rgba("#03B3C3", Math.min(1, p.s * 0.9));
          ctx.lineWidth = Math.max(1, p.s * 5);
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.px, p.py - hgt);
          ctx.stroke();
        }

        // car light streaks
        for (const c of cars) {
          c.z -= 0.012 * c.v * boost;
          if (c.z < 0.08) c.z += 3.2;
          const a = project(c.z, c.x);
          const b = project(c.z + c.len, c.x);
          const grad = ctx.createLinearGradient(a.px, a.py, b.px, b.py);
          grad.addColorStop(0, rgba(c.c, Math.min(1, a.s)));
          grad.addColorStop(1, rgba(c.c, 0));
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(1, a.s * 8);
          ctx.beginPath();
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
          ctx.stroke();
        }

        // horizon glow
        const g = ctx.createRadialGradient(w / 2, horizon, 0, w / 2, horizon, w * 0.5);
        g.addColorStop(0, rgba("#03B3C3", speedUp ? 0.4 : 0.18));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = "source-over";
      };
    },
    [speedUp, roadWidth, lanesPerRoad, left.join(), right.join(), lineColor],
  );

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />;
}
