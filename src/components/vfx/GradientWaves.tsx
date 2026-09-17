import { useCanvas, rgba } from "./useCanvas";

interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  speed?: number;
  amplitude?: number;
  waveScale?: number;
  turbulence?: number;
  opacity?: number;
  grain?: boolean;
  grainIntensity?: number;
  className?: string;
}

/** Flowing neon wave lines with a glowing horizon. */
export default function GradientWaves({
  horizonColor = "#5227FF",
  waveColor = "#FF9FFC",
  crestColor = "#FFFFFF",
  speed = 0.4,
  amplitude = 2.5,
  waveScale = 0.6,
  turbulence = 20,
  opacity = 1,
  grain = true,
  grainIntensity = 0.05,
  className = "",
}: GradientWavesProps) {
  const ref = useCanvas(
    (w, h) => {
      const lines = 34;
      return (ctx, t) => {
        ctx.clearRect(0, 0, w, h);

        // horizon glow
        const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.6);
        g.addColorStop(0, rgba(horizonColor, 0.35 * opacity));
        g.addColorStop(1, rgba(horizonColor, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < lines; i++) {
          const p = i / (lines - 1);
          const y0 = h * 0.42 + Math.pow(p, 1.8) * h * 0.7;
          const amp = (8 + p * 46) * amplitude * 0.5;
          const alpha = (0.06 + p * 0.32) * opacity;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 8) {
            const k = x * 0.006 * waveScale;
            const y =
              y0 +
              Math.sin(k + t * speed * 2 + i * 0.25) * amp +
              Math.sin(k * 2.7 - t * speed * 1.3 + i * 0.1) * (turbulence * 0.06) * (0.3 + p);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const grad = ctx.createLinearGradient(0, 0, w, 0);
          grad.addColorStop(0, rgba(horizonColor, alpha));
          grad.addColorStop(0.5, rgba(waveColor, alpha * 1.4));
          grad.addColorStop(1, rgba(crestColor, alpha * 0.8));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.7 + p * 1.6;
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";

        if (grain) {
          ctx.fillStyle = `rgba(255,255,255,${grainIntensity * 0.15})`;
          for (let i = 0; i < 140; i++) {
            ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
          }
        }
      };
    },
    [horizonColor, waveColor, crestColor, speed, amplitude, waveScale, turbulence, opacity, grain, grainIntensity],
  );

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />;
}
