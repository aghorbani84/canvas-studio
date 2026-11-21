import { useState } from "react";
import {
  ChevronDown,
  Download,
  Redo2,
  Trash2,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { CANVAS_SIZE_PRESETS, useStudio } from "../state/store";
import { exportAsPng } from "../utils/canvas";

/**
 * Top bar — the window chrome (40px, Figma-style unified toolbar).
 * Wordmark, history, canvas size, zoom, and the two actions.
 * Everything here dispatches the same actions the old toolbar did.
 */
export default function TopBar() {
  const { state, dispatch } = useStudio();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await exportAsPng(
        state.layers,
        state.canvasSize.width,
        state.canvasSize.height,
      );
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  function handleClear() {
    if (
      window.confirm("Clear every layer? This can be undone with Ctrl+Z.")
    ) {
      dispatch({ type: "CLEAR_ALL" });
    }
  }

  const iconBtn =
    "flex h-[30px] w-[30px] items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent";
  const divider = "h-5 w-px bg-neutral-200";

  return (
    <>
      <header className="flex h-10 shrink-0 items-center gap-[13px] border-b border-line bg-surface px-[13px] text-ink">
        {/* Wordmark — plain text, no invented logo */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold tracking-tight">
            Canvas Studio
          </span>
          <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent">
            React + Canvas
          </span>
        </div>

        <span className={divider} aria-hidden="true" />

        {/* History */}
        <div className="flex items-center gap-0.5" aria-label="History">
          <button
            type="button"
            onClick={() => dispatch({ type: "UNDO" })}
            disabled={state.undoStack.length === 0}
            className={iconBtn}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "REDO" })}
            disabled={state.redoStack.length === 0}
            className={iconBtn}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <Redo2 size={16} strokeWidth={1.8} />
          </button>
        </div>

        <span className={divider} aria-hidden="true" />

        {/* Canvas size */}
        <label className="relative flex items-center">
          <span className="sr-only">Canvas size</span>
          <select
            value={state.canvasSize.label}
            aria-label="Canvas size preset"
            onChange={(e) => {
              const size = CANVAS_SIZE_PRESETS.find(
                (s) => s.label === e.target.value,
              );
              if (size) dispatch({ type: "SET_CANVAS_SIZE", size });
            }}
            className="h-[30px] cursor-pointer appearance-none rounded-md border border-line bg-surface pr-7 pl-2.5 text-[13px] text-ink transition-colors hover:border-line-strong focus:border-accent focus:outline-none"
          >
            {CANVAS_SIZE_PRESETS.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            strokeWidth={1.8}
            className="pointer-events-none absolute right-2 text-ink-faint"
          />
        </label>

        {/* Zoom — segmented control */}
        <div
          className="flex h-[30px] items-center rounded-md bg-neutral-100 p-0.5"
          aria-label="Zoom"
        >
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() =>
              dispatch({ type: "SET_ZOOM", zoom: state.zoom - 0.25 })
            }
            className="flex h-full w-7 items-center justify-center rounded-[5px] text-neutral-600 transition-colors hover:bg-white hover:text-neutral-900 hover:shadow-sm"
          >
            <ZoomOut size={15} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            title="Reset zoom to 100%"
            onClick={() => dispatch({ type: "SET_ZOOM", zoom: 1 })}
            className="w-[52px] rounded-[5px] px-1 py-1 text-center text-xs font-medium text-ink tabular-nums transition-colors hover:bg-white hover:shadow-sm"
          >
            {Math.round(state.zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() =>
              dispatch({ type: "SET_ZOOM", zoom: state.zoom + 0.25 })
            }
            className="flex h-full w-7 items-center justify-center rounded-[5px] text-neutral-600 transition-colors hover:bg-white hover:text-neutral-900 hover:shadow-sm"
          >
            <ZoomIn size={15} strokeWidth={1.8} />
          </button>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex h-[30px] items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            <Trash2 size={15} strokeWidth={1.8} />
            Clear
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex h-[30px] items-center gap-1.5 rounded-md bg-accent px-3 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <Download size={15} strokeWidth={1.8} />
            {exporting ? "Exporting…" : "Export PNG"}
          </button>
        </div>
      </header>

      {/* Export error — floating toast, not a full-width band */}
      {exportError && (
        <div
          role="alert"
          className="fixed right-[21px] bottom-[41px] z-50 flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-[13px] text-white shadow-lg"
        >
          {exportError}
          <button
            type="button"
            onClick={() => setExportError(null)}
            aria-label="Dismiss"
            className="flex items-center rounded px-1 py-0.5 text-neutral-300 hover:text-white"
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </>
  );
}
