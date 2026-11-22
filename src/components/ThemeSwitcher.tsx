import { Landmark, Moon, Sparkles, Sun } from "lucide-react";
import { useTheme, type ShowcaseStyle } from "../theme";

/**
 * Theme switcher — always visible in the header (spec §5).
 * a. Style: segmented control Achaemenid | Modern (icon + text label).
 * b. Mode: light/dark toggle button (Sun / Moon, aria-pressed).
 * Hand-rolled with lucide icons; state lives in ThemeProvider and
 * persists to localStorage (`showcase-style` / `showcase-mode`).
 */
export default function ThemeSwitcher() {
  const { style, mode, setStyle, toggleMode } = useTheme();

  const segBtn = (active: boolean) =>
    `flex h-[26px] items-center gap-1.5 rounded-[5px] px-2 text-xs font-medium whitespace-nowrap transition-colors ${
      active
        ? "bg-surface text-ink shadow-sm"
        : "text-ink-soft hover:text-ink"
    }`;

  const segment = (id: ShowcaseStyle, label: string, Icon: typeof Landmark) => (
    <button
      key={id}
      type="button"
      aria-label={`${label} style`}
      aria-pressed={style === id}
      onClick={() => setStyle(id)}
      className={segBtn(style === id)}
    >
      <Icon size={14} strokeWidth={1.8} />
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-[30px] items-center rounded-md bg-panel p-0.5"
        role="group"
        aria-label="Visual style"
      >
        {segment("achaemenid", "Achaemenid", Landmark)}
        {segment("modern", "Modern", Sparkles)}
      </div>
      <button
        type="button"
        onClick={toggleMode}
        aria-label="Toggle dark mode"
        aria-pressed={mode === "dark"}
        title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-panel hover:text-ink"
      >
        {mode === "dark" ? (
          <Sun size={16} strokeWidth={1.8} />
        ) : (
          <Moon size={16} strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}
