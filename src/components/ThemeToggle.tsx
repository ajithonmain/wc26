import { useUIStore } from "../store/uiSlice";
import Icon from "./Icon";
import "../styles/themetoggle.css";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps): React.ReactElement {
  const { theme, toggleTheme } = useUIStore();
  return (
    <button
      onClick={toggleTheme}
      className={`tt-btn flex items-center justify-center w-9 h-9 rounded-full transition-colors ${className}`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}
