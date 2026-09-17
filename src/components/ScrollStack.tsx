import { useEffect, useRef, type ReactNode } from "react";

interface ScrollStackProps {
  children: ReactNode;
  className?: string;
}

export function ScrollStackItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-scroll-stack-item
      className={`sticky top-24 mb-8 rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl elegant-shadow will-change-transform md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

/** 3D scroll-snapping card stack — cards tilt and stack as you scroll past them. */
export default function ScrollStack({ children, className = "" }: ScrollStackProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-stack-item]"));
    let raf = 0;

    const update = () => {
      raf = 0;
      const stickyTop = 96;
      items.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        // progress 0 while below the sticky line, ramps to 1 once fully stacked
        const p = Math.min(1, Math.max(0, (stickyTop - rect.top) / (rect.height || 1) + 0));
        const depth = Math.min(1, p * 1.4);
        const scale = 1 - depth * 0.08;
        const rotate = depth * -5;
        const translate = depth * -18;
        el.style.transform = `perspective(1200px) translateY(${translate}px) scale(${scale}) rotateX(${rotate}deg)`;
        el.style.opacity = String(1 - depth * 0.35);
        el.style.zIndex = String(i + 1);
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [children]);

  return (
    <div ref={ref} className={`relative [transform-style:preserve-3d] ${className}`}>
      {children}
    </div>
  );
}
