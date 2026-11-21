import { useEffect } from "react";
import CanvasBoard from "./components/CanvasBoard";
import LayersPanel from "./components/LayersPanel";
import PropertiesPanel from "./components/PropertiesPanel";
import ToolRail from "./components/ToolRail";
import TopBar from "./components/TopBar";
import { AUTOSAVE_KEY, StudioProvider, useStudio } from "./state/store";

function Autosave() {
  const { state, dispatch } = useStudio();

  // Debounced autosave: persist layer snapshots + canvas size to localStorage.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedAt = new Date().toISOString();
        window.localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({
            layers: state.layers,
            canvasSize: state.canvasSize,
            savedAt,
          }),
        );
        dispatch({ type: "SET_SAVED_AT", savedAt });
      } catch {
        // Storage full or unavailable: drawing keeps working in memory.
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [state.layers, state.canvasSize, dispatch]);

  return null;
}

function KeyboardShortcuts() {
  const { dispatch } = useStudio();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = e.metaKey;
      const mod = e.ctrlKey || isMac;
      if (!mod || e.key.toLowerCase() !== "z") return;
      // Don't hijack undo while typing in an input/select.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) dispatch({ type: "REDO" });
      else dispatch({ type: "UNDO" });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch]);

  return null;
}

/** Slim status bar — autosave state on the left, shortcuts on the right. */
function StatusBar() {
  const { state } = useStudio();
  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-line bg-surface px-[13px] text-[11px] text-ink-faint">
      <span>
        {state.savedAt
          ? `Autosaved ${new Date(state.savedAt).toLocaleTimeString()} — your drawing is stored in this browser.`
          : "Your drawing autosaves to this browser as you work."}
      </span>
      <span className="hidden sm:inline">
        Ctrl+Z undo · Ctrl+Shift+Z redo
      </span>
    </footer>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <Autosave />
      <KeyboardShortcuts />
      {/* Figma anatomy: top chrome, left tool rail, canvas hero, right pane */}
      <div className="flex h-full flex-col bg-ground text-ink">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <ToolRail />
          <CanvasBoard />
          <aside className="flex w-[233px] shrink-0 flex-col overflow-y-auto border-l border-line bg-surface">
            <PropertiesPanel />
            <LayersPanel />
          </aside>
        </div>
        <StatusBar />
      </div>
    </StudioProvider>
  );
}
