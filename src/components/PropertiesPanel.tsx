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
            className="cs-swatch h-[34px] w-[34px] shrink-0"
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
              className={`h-5 w-5 rounded-md transition-transform duration-150 hover:scale-110 ${
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
            className="flex h-5 w-5 items-center justify-center rounded-md border border-dashed border-line-strong text-ink-faint transition-colors hover:border-accent hover:text-accent"
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
    </div>
  );
}
