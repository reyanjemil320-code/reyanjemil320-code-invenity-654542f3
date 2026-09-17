import { forwardRef, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/invenity-logo.png";
import { toast } from "sonner";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const ADMIN_PASSWORD = "ALLAHUAKBER1!";
const CLICKS_REQUIRED = 5;
const WINDOW_MS = 2000;

export const Logo = forwardRef<HTMLButtonElement, LogoProps>(
  ({ showText = true, size = "md" }, ref) => {
    const navigate = useNavigate();
    const clicks = useRef<number[]>([]);

    const handleClick = () => {
      const now = Date.now();
      clicks.current = [...clicks.current, now].filter((t) => now - t <= WINDOW_MS);

      if (clicks.current.length < CLICKS_REQUIRED) return;
      clicks.current = [];

      const input = window.prompt("Admin password:");
      if (input === null) return;
      if (input === ADMIN_PASSWORD) {
        sessionStorage.setItem("admin_unlocked", "1");
        toast.success("Admin unlocked");
        navigate("/admin");
      } else {
        toast.error("Incorrect password");
      }
    };

    const sizeMap = {
      sm: { img: "h-7 w-7", text: "text-base" },
      md: { img: "h-9 w-9", text: "text-xl" },
      lg: { img: "h-12 w-12", text: "text-2xl" },
    };

    return (
      <button ref={ref} type="button" className="flex items-center gap-2 group" onClick={handleClick}>
        <img
          src={logo}
          alt="Invenity"
          className={`${sizeMap[size].img} object-contain transition-smooth group-hover:scale-105`}
        />
        {showText && (
          <span className={`${sizeMap[size].text} font-bold tracking-tight`}>
            INVENITY
          </span>
        )}
      </button>
    );
  }
);
Logo.displayName = "Logo";
