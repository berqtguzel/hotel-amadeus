import { useTheme } from "../Context/ThemeContext";
import "../../css/theme-toggle.css";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";
    const nextThemeLabel = isDark ? "light" : "dark";

    return (
        <button
            onClick={toggleTheme}
            className={`ttgl ${isDark ? "is-dark" : "is-light"}`}
            aria-label={`Switch to ${nextThemeLabel} mode`}
            aria-checked={isDark}
            role="switch"
            type="button"
        >
            <span className="ttgl-track" aria-hidden="true">
                <span className="ttgl-icon ttgl-icon--sun">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle
                            cx="12"
                            cy="12"
                            r="4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        />
                        <path
                            d="M12 2.6v2.1M12 19.3v2.1M4.7 4.7l1.5 1.5M17.8 17.8l1.5 1.5M2.6 12h2.1M19.3 12h2.1M4.7 19.3l1.5-1.5M17.8 6.2l1.5-1.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                </span>
                <span className="ttgl-icon ttgl-icon--moon">
                    <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M20.7 14.3a8.5 8.5 0 1 1-11-11 1 1 0 0 1 1.3 1.2A6.8 6.8 0 0 0 19.5 13a1 1 0 0 1 1.2 1.3Z" />
                    </svg>
                </span>
                <span className="ttgl-thumb" />
            </span>
        </button>
    );
}
