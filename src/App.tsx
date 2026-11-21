import { useEffect } from "react";
import CanvasBoard from "./components/CanvasBoard";
import LayersPanel from "./components/LayersPanel";
import Toolbar from "./components/Toolbar";
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

export default function App() {
  return (
    <StudioProvider>
      <Autosave />
      <KeyboardShortcuts />
      <div className="flex h-full flex-col bg-gray-950">
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <CanvasBoard />
          <LayersPanel />
        </div>
        <footer className="border-t border-gray-700 bg-gray-900 px-4 py-1.5 text-center text-xs text-gray-400">
          Canvas Studio — a browser drawing app. Brush, eraser, shapes and
          fill on stacked layers, with undo/redo, autosave and PNG export.
          Everything stays in your browser.
        </footer>
      </div>
    </StudioProvider>
  );
}
