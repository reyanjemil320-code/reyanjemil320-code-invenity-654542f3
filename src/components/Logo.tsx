import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * INVENITY emblem — an electric lightbulb rising inside a gold orbital ring.
 * Pure SVG: weighs ~1KB instead of the old 2.17MB PNG and inherits the theme.
 */
export const Logo = forwardRef<HTMLButtonElement, LogoProps>(
  ({ showText = true, size = "md" }, ref) => {
    const navigate = useNavigate();

    const sizeMap = {
      sm: { svg: "h-7 w-7", text: "text-base" },
      md: { svg: "h-9 w-9", text: "text-xl" },
      lg: { svg: "h-14 w-14", text: "text-2xl" },
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label="Invenity home"
        className="group flex items-center gap-2.5"
        onClick={() => navigate("/")}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className={`${sizeMap[size].svg} transition-transform duration-500 group-hover:rotate-12 group-hover:scale-105`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ivg-blue" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(217 96% 62%)" />
              <stop offset="1" stopColor="hsl(232 96% 70%)" />
            </linearGradient>
            <linearGradient id="ivg-gold" x1="12" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="hsl(40 96% 52%)" />
              <stop offset="1" stopColor="hsl(50 100% 70%)" />
            </linearGradient>
            <linearGradient id="ivg-word" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="hsl(var(--foreground))" />
              <stop offset="1" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>

          {/* orbital ring */}
          <ellipse
            cx="24"
            cy="24"
            rx="20"
            ry="9"
            stroke="url(#ivg-gold)"
            strokeWidth="1.6"
            opacity="0.8"
            transform="rotate(-18 24 24)"
          />
          {/* bulb body */}
          <circle cx="24" cy="20" r="10.5" fill="url(#ivg-blue)" opacity="0.16" />
          <circle cx="24" cy="20" r="10.5" stroke="url(#ivg-blue)" strokeWidth="2" />
          {/* filament spark */}
          <path
            d="M24 13.5l2.2 4.8 5.2.5-3.9 3.5 1.1 5.1-4.6-2.6-4.6 2.6 1.1-5.1-3.9-3.5 5.2-.5z"
            fill="url(#ivg-gold)"
          />
          {/* bulb base */}
          <path d="M20.5 30.5h7M21.5 33.5h5M22.5 36.5h3" stroke="url(#ivg-gold)" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {showText && (
          <span className={`${sizeMap[size].text} font-bold tracking-tight`}>
            <span className="text-[hsl(var(--foreground))]">INVE</span>
            <span className="gold-text">NITY</span>
          </span>
        )}
      </button>
    );
  },
);
Logo.displayName = "Logo";
