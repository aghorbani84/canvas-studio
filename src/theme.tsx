import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ShowcaseStyle = "achaemenid" | "modern";
export type ShowcaseMode = "light" | "dark";

export const STYLE_KEY = "showcase-style";
export const MODE_KEY = "showcase-mode";

/** Fired on window whenever the theme changes (CanvasBoard re-reads
 *  computed colors and redraws on this event). */
export const THEME_CHANGE_EVENT = "canvas-studio:theme-change";

export interface ThemeChangeDetail {
  style: ShowcaseStyle;
  mode: ShowcaseMode;
}

function readStored(): { style: ShowcaseStyle; mode: ShowcaseMode } {
  let style: ShowcaseStyle = "modern";
  let mode: ShowcaseMode = "light";
  try {
    const s = window.localStorage.getItem(STYLE_KEY);
    if (s === "achaemenid" || s === "modern") style = s;
    const m = window.localStorage.getItem(MODE_KEY);
    if (m === "light" || m === "dark") {
      mode = m;
    } else if (
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      mode = "dark";
    }
  } catch {
    // Storage unavailable: fall back to the defaults above.
  }
  return { style, mode };
}

export function applyTheme(style: ShowcaseStyle, mode: ShowcaseMode): void {
  const root = document.documentElement;
  root.setAttribute("data-style", style);
  root.setAttribute("data-mode", mode);
  window.dispatchEvent(
    new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, {
      detail: { style, mode },
    }),
  );
}

interface ThemeContextValue {
  style: ShowcaseStyle;
  mode: ShowcaseMode;
  setStyle: (style: ShowcaseStyle) => void;
  setMode: (mode: ShowcaseMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(readStored);

  useEffect(() => {
    applyTheme(theme.style, theme.mode);
    try {
      window.localStorage.setItem(STYLE_KEY, theme.style);
      window.localStorage.setItem(MODE_KEY, theme.mode);
    } catch {
      // Storage unavailable: the theme still applies for this session.
    }
  }, [theme]);

  const setStyle = useCallback(
    (style: ShowcaseStyle) => setTheme((t) => ({ ...t, style })),
    [],
  );
  const setMode = useCallback(
    (mode: ShowcaseMode) => setTheme((t) => ({ ...t, mode })),
    [],
  );
  const toggleMode = useCallback(
    () => setTheme((t) => ({ ...t, mode: t.mode === "dark" ? "light" : "dark" })),
    [],
  );

  const value = useMemo(
    () => ({ style: theme.style, mode: theme.mode, setStyle, setMode, toggleMode }),
    [theme, setStyle, setMode, toggleMode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
