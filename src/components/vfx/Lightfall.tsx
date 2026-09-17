import { useCanvas, rgba } from "./useCanvas";

interface LightfallProps {
  colors?: string[];
  backgroundColor?: string;
  speed?: number;
  streakCount?: number;
  streakWidth?: number;
  streakLength?: number;
  glow?: number;
  density?: number;
  twinkle?: number;
  opacity?: number;
  className?: string;
}

/** Falling light streaks — canvas engine (no WebGL dependency). */
export default function Lightfall({
  colors = ["#A6C8FF", "#5227FF", "#FF9FFC"],
  backgroundColor = "transparent",
  speed = 0.5,
  streakCount = 2,
  streakWidth = 1,
  streakLength = 1,
  glow = 1,
  density = 0.6,
  twinkle = 1,
  opacity = 1,
  className = "",
}: LightfallProps) {
  const ref = useCanvas(
    (w, h) => {
      const total = Math.round(40 * density * Math.max(1, streakCount) * (w / 1200 + 0.6));
      const streaks = Array.from({ length: total }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: (60 + Math.random() * 180) * streakLength,
        v: (60 + Math.random() * 220) * speed,
        w: (0.6 + Math.random() * 1.8) * streakWidth,
        c: colors[Math.floor(Math.random() * colors.length)],
        p: Math.random() * Math.PI * 2,
      }));

      return (ctx, t) => {
        if (backgroundColor !== "transparent") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.clearRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = "lighter";
        for (const s of streaks) {
          s.y += (s.v / 60) * 1;
          if (s.y - s.len > h) {
            s.y = -s.len;
            s.x = Math.random() * w;
          }
          const tw = 1 - twinkle * 0.5 * (0.5 + 0.5 * Math.sin(t * 3 + s.p));
          const grad = ctx.createLinearGradient(s.x, s.y - s.len, s.x, s.y);
          grad.addColorStop(0, rgba(s.c, 0));
          grad.addColorStop(1, rgba(s.c, opacity * tw));
          ctx.strokeStyle = grad;
          ctx.lineWidth = s.w;
          ctx.shadowBlur = 12 * glow;
          ctx.shadowColor = rgba(s.c, 0.7);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - s.len);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = "source-over";
      };
    },
    [colors.join(), backgroundColor, speed, streakCount, streakWidth, streakLength, glow, density, twinkle, opacity],
  );

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />;
}
