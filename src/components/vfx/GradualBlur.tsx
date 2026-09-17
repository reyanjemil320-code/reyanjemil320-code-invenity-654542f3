interface GradualBlurProps {
  position?: "bottom" | "top";
  height?: string;
  strength?: number;
  divCount?: number;
  opacity?: number;
  className?: string;
}

/** Layered progressive blur that fades content into the background. */
export default function GradualBlur({
  position = "bottom",
  height = "7rem",
  strength = 2,
  divCount = 5,
  opacity = 1,
  className = "",
}: GradualBlurProps) {
  const layers = Array.from({ length: divCount }, (_, i) => {
    const p = (i + 1) / divCount;
    const blur = Math.pow(p, 1.6) * strength * 4;
    const from = position === "bottom" ? (1 - p) * 100 : 0;
    return { blur, p, from };
  });

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-20 ${position === "bottom" ? "bottom-0" : "top-0"} ${className}`}
      style={{ height, opacity }}
      aria-hidden
    >
      {layers.map((l, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${l.blur}px)`,
            WebkitBackdropFilter: `blur(${l.blur}px)`,
            maskImage:
              position === "bottom"
                ? `linear-gradient(to top, rgba(0,0,0,1) ${l.from}%, rgba(0,0,0,0) ${l.from + 100 / divCount}%)`
                : `linear-gradient(to bottom, rgba(0,0,0,1) ${l.from}%, rgba(0,0,0,0) ${l.from + 100 / divCount}%)`,
            WebkitMaskImage:
              position === "bottom"
                ? `linear-gradient(to top, rgba(0,0,0,1) ${l.from}%, rgba(0,0,0,0) ${l.from + 100 / divCount}%)`
                : `linear-gradient(to bottom, rgba(0,0,0,1) ${l.from}%, rgba(0,0,0,0) ${l.from + 100 / divCount}%)`,
          }}
        />
      ))}
    </div>
  );
}
