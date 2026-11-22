import { Plus } from "lucide-react";
import { useStudio } from "../state/store";

/**
 * Properties panel — the Figma-style right pane (233px = 144×φ).
 * Two sections, one job each: Color (picker + palette) and Brush
 * (size + opacity). Section titles are 11px semibold, sentence case.
 */
function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
      {children}
    </h2>
  );
}

export default function PropertiesPanel() {
  const { state, dispatch } = useStudio();

  return (
    <div className="flex flex-col">
      {/* Color */}
      <section className="border-b border-line px-[13px] py-[13px]">
        <SectionTitle>Color</SectionTitle>
        <div className="mt-[8px] flex items-center gap-[8px]">
          <input
            type="color"
            value={state.color}
            aria-label="Brush color"
            onChange={(e) =>
              dispatch({ type: "SET_COLOR", color: e.target.value })
            }
            className="cs-swatch h-11 w-11 shrink-0 sm:h-[34px] sm:w-[34px]"
          />
          <span className="font-mono text-xs text-ink-soft uppercase">
            {state.color}
          </span>
        </div>
        <div className="mt-[13px] flex flex-wrap items-center gap-[5px]">
          {state.palette.map((c) => (
            <button
              key={c}
              type="button"
              title={`Use ${c}`}
              aria-label={`Use color ${c}`}
              aria-pressed={state.color === c}
              onClick={() => dispatch({ type: "SET_COLOR", color: c })}
              onContextMenu={(e) => {
                e.preventDefault();
                dispatch({ type: "REMOVE_PALETTE_COLOR", color: c });
              }}
              className={`h-7 w-7 rounded-md transition-transform duration-150 hover:scale-110 sm:h-5 sm:w-5 ${
                state.color === c
                  ? "ring-2 ring-accent ring-offset-1 ring-offset-surface"
                  : "ring-1 ring-black/10"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            type="button"
            title="Add current color to palette"
            aria-label="Add current color to palette"
            onClick={() =>
              dispatch({ type: "ADD_PALETTE_COLOR", color: state.color })
            }
            className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-line-strong text-ink-faint transition-colors hover:border-accent hover:text-accent sm:h-5 sm:w-5"
          >
            <Plus size={13} strokeWidth={1.8} />
          </button>
        </div>
        <p className="mt-[8px] text-[11px] leading-relaxed text-ink-faint">
          Right-click a swatch to remove it.
        </p>
      </section>

      {/* Brush */}
      <section className="border-b border-line px-[13px] py-[13px]">
        <SectionTitle>Brush</SectionTitle>
        <label className="mt-[13px] flex items-center gap-[8px] text-[13px] text-ink">
          <span className="w-[52px] shrink-0 text-ink-soft">Size</span>
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
            className="min-w-0 flex-1"
          />
          <span className="w-[34px] shrink-0 text-right text-xs text-ink-soft tabular-nums">
            {state.brushSize}px
          </span>
        </label>
        <label className="mt-[13px] flex items-center gap-[8px] text-[13px] text-ink">
          <span className="w-[52px] shrink-0 text-ink-soft">Opacity</span>
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
            className="min-w-0 flex-1"
          />
          <span className="w-[34px] shrink-0 text-right text-xs text-ink-soft tabular-nums">
            {Math.round(state.opacity * 100)}%
          </span>
        </label>
        {/* Brush preview — the size and color, at rest */}
        <div className="mt-[13px] flex h-[34px] items-center justify-center rounded-md bg-panel">
          <span
            className="rounded-full transition-all duration-150"
            style={{
              width: Math.max(4, Math.min(24, state.brushSize / 2)),
              height: Math.max(4, Math.min(24, state.brushSize / 2)),
              backgroundColor: state.color,
              opacity: state.opacity,
            }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Presets — one-tap brush sizes and opacities */}
      <section className="border-b border-line px-[13px] py-[13px]">
        <SectionTitle>Presets</SectionTitle>
        <div
          className="mt-[13px] flex flex-wrap gap-[5px]"
          role="group"
          aria-label="Brush size presets"
        >
          {[2, 4, 8, 16, 32].map((size) => (
            <button
              key={size}
              type="button"
              aria-label={`Brush size ${size}px`}
              aria-pressed={state.brushSize === size}
              onClick={() => dispatch({ type: "SET_BRUSH_SIZE", size })}
              className={`h-11 rounded-md px-2 text-xs font-medium tabular-nums transition-colors sm:h-[26px] ${
                state.brushSize === size
                  ? "bg-accent text-accent-contrast shadow-sm"
                  : "bg-panel text-ink-soft hover:bg-line hover:text-ink"
              }`}
            >
              {size}px
            </button>
          ))}
        </div>
        <div
          className="mt-[8px] flex flex-wrap gap-[5px]"
          role="group"
          aria-label="Opacity presets"
        >
          {[0.25, 0.5, 0.75, 1].map((op) => (
            <button
              key={op}
              type="button"
              aria-label={`Opacity ${Math.round(op * 100)} percent`}
              aria-pressed={state.opacity === op}
              onClick={() => dispatch({ type: "SET_OPACITY", opacity: op })}
              className={`h-11 rounded-md px-2 text-xs font-medium tabular-nums transition-colors sm:h-[26px] ${
                state.opacity === op
                  ? "bg-accent text-accent-contrast shadow-sm"
                  : "bg-panel text-ink-soft hover:bg-line hover:text-ink"
              }`}
            >
              {Math.round(op * 100)}%
            </button>
          ))}
        </div>
      </section>

      {/* Document — live values, straight from the reducer state */}
      <section className="border-b border-line px-[13px] py-[13px]">
        <SectionTitle>Document</SectionTitle>
        <dl className="mt-[8px] space-y-[5px] text-[13px]">
          {(
            [
              ["Canvas", `${state.canvasSize.width} × ${state.canvasSize.height}`],
              ["Zoom", `${Math.round(state.zoom * 100)}%`],
              [
                "Active layer",
                state.layers.find((l) => l.id === state.activeLayerId)?.name ??
                  "—",
              ],
              ["Tool", state.tool],
              ["Strokes", String(state.strokeCount)],
              ["Layers", String(state.layers.length)],
              ["Unsaved changes", String(state.unsavedChanges)],
              ["Undo / Redo", `${state.undoStack.length} / ${state.redoStack.length}`],
            ] as Array<[string, string]>
          ).map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-2">
              <dt className="shrink-0 text-ink-soft">{label}</dt>
              <dd className="min-w-0 truncate text-right font-medium text-ink tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
