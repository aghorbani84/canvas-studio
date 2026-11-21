import { useState } from "react";
import {
  CANVAS_SIZE_PRESETS,
  useStudio,
  type Tool,
} from "../state/store";
import { exportAsPng } from "../utils/canvas";

const TOOLS: Array<{ id: Tool; label: string; icon: string }> = [
  { id: "brush", label: "Brush", icon: "🖌️" },
  { id: "eraser", label: "Eraser", icon: "🧽" },
  { id: "line", label: "Line", icon: "📏" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "circle", label: "Circle", icon: "◯" },
  { id: "fill", label: "Fill", icon: "🪣" },
];

export default function Toolbar() {
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
      window.confirm(
        "Clear every layer? This can be undone with Ctrl+Z.",
      )
    ) {
      dispatch({ type: "CLEAR_ALL" });
    }
  }

  const toolButton =
    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors";
  const activeTool = "bg-indigo-600 text-white";
  const idleTool = "bg-gray-700 text-gray-200 hover:bg-gray-600";

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-700 bg-gray-900 px-4 py-2 text-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-tight">
          Canvas Studio
        </span>
        <span className="rounded bg-indigo-600/20 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-300">
          React + Canvas
        </span>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1" role="toolbar" aria-label="Drawing tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.label}
            aria-pressed={state.tool === t.id}
            onClick={() => dispatch({ type: "SET_TOOL", tool: t.id })}
            className={`${toolButton} ${state.tool === t.id ? activeTool : idleTool}`}
          >
            <span aria-hidden="true">{t.icon}</span>
            <span className="hidden xl:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="color"
            value={state.color}
            aria-label="Brush color"
            onChange={(e) =>
              dispatch({ type: "SET_COLOR", color: e.target.value })
            }
            className="h-8 w-9 cursor-pointer rounded border border-gray-600 bg-transparent p-0.5"
          />
          <span className="font-mono text-xs uppercase">{state.color}</span>
        </label>
        <div className="flex max-w-44 flex-wrap items-center gap-1">
          {state.palette.map((c) => (
            <button
              key={c}
              type="button"
              title={`Use ${c}`}
              aria-label={`Use color ${c}`}
              onClick={() => dispatch({ type: "SET_COLOR", color: c })}
              onContextMenu={(e) => {
                e.preventDefault();
                dispatch({ type: "REMOVE_PALETTE_COLOR", color: c });
              }}
              className={`h-5 w-5 rounded-full border ${
                state.color === c
                  ? "border-white ring-2 ring-indigo-400"
                  : "border-gray-500"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            type="button"
            title="Add current color to palette"
            onClick={() =>
              dispatch({ type: "ADD_PALETTE_COLOR", color: state.color })
            }
            className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-gray-400 text-xs text-gray-300 hover:bg-gray-700"
          >
            +
          </button>
        </div>
        <span className="hidden text-[11px] text-gray-400 lg:inline">
          Right-click a swatch to remove it
        </span>
      </div>

      {/* Brush size + opacity */}
      <div className="flex items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          Size
          <input
            type="range"
            min={1}
            max={64}
            value={state.brushSize}
            aria-label="Brush size"
            onChange={(e) =>
              dispatch({
                type: "SET_BRUSH_SIZE",
                size: Number(e.target.value),
              })
            }
            className="w-24"
          />
          <span className="w-8 text-xs text-gray-300">{state.brushSize}px</span>
        </label>
        <label className="flex items-center gap-2">
          Opacity
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={state.opacity}
            aria-label="Brush opacity"
            onChange={(e) =>
              dispatch({ type: "SET_OPACITY", opacity: Number(e.target.value) })
            }
            className="w-24"
          />
          <span className="w-9 text-xs text-gray-300">
            {Math.round(state.opacity * 100)}%
          </span>
        </label>
      </div>

      {/* History */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => dispatch({ type: "UNDO" })}
          disabled={state.undoStack.length === 0}
          className="rounded-md bg-gray-700 px-2.5 py-1.5 text-sm font-medium hover:bg-gray-600 disabled:opacity-40"
          title="Undo (Ctrl+Z)"
        >
          ↩ Undo
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "REDO" })}
          disabled={state.redoStack.length === 0}
          className="rounded-md bg-gray-700 px-2.5 py-1.5 text-sm font-medium hover:bg-gray-600 disabled:opacity-40"
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪ Redo
        </button>
      </div>

      {/* Canvas size + zoom */}
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-1.5">
          Canvas
          <select
            value={state.canvasSize.label}
            aria-label="Canvas size preset"
            onChange={(e) => {
              const size = CANVAS_SIZE_PRESETS.find(
                (s) => s.label === e.target.value,
              );
              if (size) dispatch({ type: "SET_CANVAS_SIZE", size });
            }}
            className="rounded-md border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm"
          >
            {CANVAS_SIZE_PRESETS.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() =>
              dispatch({ type: "SET_ZOOM", zoom: state.zoom - 0.25 })
            }
            className="rounded-md bg-gray-700 px-2 py-1.5 hover:bg-gray-600"
          >
            −
          </button>
          <button
            type="button"
            title="Reset zoom to 100%"
            onClick={() => dispatch({ type: "SET_ZOOM", zoom: 1 })}
            className="w-14 rounded-md bg-gray-700 px-2 py-1.5 text-xs hover:bg-gray-600"
          >
            {Math.round(state.zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() =>
              dispatch({ type: "SET_ZOOM", zoom: state.zoom + 0.25 })
            }
            className="rounded-md bg-gray-700 px-2 py-1.5 hover:bg-gray-600"
          >
            +
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md bg-red-600/80 px-3 py-1.5 text-sm font-medium hover:bg-red-600"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {exporting ? "Exporting…" : "Export PNG"}
        </button>
      </div>
      {exportError && (
        <p className="w-full text-xs text-red-400" role="alert">
          {exportError}
        </p>
      )}
    </header>
  );
}
