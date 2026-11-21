import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { useStudio } from "../state/store";

/**
 * Layers panel — Figma-style layer list. Rows are 26px+ lanes (the kit's
 * row height): eye toggle, name, and reorder/delete controls in one line,
 * opacity on its own line beneath. The active layer is lifted: accent
 * tint + accent ring, the way a picked-up card reads in freeform-drag.
 * All dispatches are unchanged from the original panel.
 */
export default function LayersPanel() {
  const { state, dispatch } = useStudio();

  // Layers are stored bottom-to-top; the panel shows the top layer first.
  const displayLayers = [...state.layers].reverse();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-[13px] py-[8px]">
        <h2 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
          <Layers size={13} strokeWidth={1.8} />
          Layers
          <span className="rounded-full bg-neutral-100 px-1.5 py-px text-[11px] font-semibold text-ink-soft tabular-nums">
            {state.layers.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => dispatch({ type: "ADD_LAYER" })}
          className="flex h-[26px] items-center gap-1 rounded-md bg-accent px-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent-hover"
        >
          <Plus size={13} strokeWidth={2} />
          Add
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-[8px]">
        {displayLayers.map((layer, displayIndex) => {
          const isActive = layer.id === state.activeLayerId;
          const isTop = displayIndex === 0;
          const isBottom = displayIndex === displayLayers.length - 1;
          const rowBtn =
            "flex h-[22px] w-[22px] items-center justify-center rounded text-ink-faint transition-colors hover:bg-neutral-100 hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent";
          return (
            <li
              key={layer.id}
              onClick={() =>
                dispatch({ type: "SET_ACTIVE_LAYER", id: layer.id })
              }
              className={`mb-[5px] cursor-pointer rounded-lg border px-2 py-[8px] transition-all duration-150 ${
                isActive
                  ? "border-accent-ring bg-accent-soft shadow-sm"
                  : "border-transparent bg-transparent hover:bg-neutral-50"
              }`}
            >
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  title={layer.visible ? "Hide layer" : "Show layer"}
                  aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.name}`}
                  aria-pressed={layer.visible}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({
                      type: "TOGGLE_LAYER_VISIBILITY",
                      id: layer.id,
                    });
                  }}
                  className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded text-ink-soft transition-colors hover:bg-neutral-100 hover:text-ink"
                >
                  {layer.visible ? (
                    <Eye size={15} strokeWidth={1.8} />
                  ) : (
                    <EyeOff size={15} strokeWidth={1.8} />
                  )}
                </button>
                <span
                  className={`min-w-0 flex-1 truncate text-[13px] ${
                    isActive ? "font-semibold text-ink" : "font-medium text-ink-soft"
                  }`}
                >
                  {layer.name}
                </span>
                <button
                  type="button"
                  title="Move layer up"
                  aria-label={`Move ${layer.name} up`}
                  disabled={isTop}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "MOVE_LAYER", id: layer.id, direction: "up" });
                  }}
                  className={rowBtn}
                >
                  <ChevronUp size={15} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  title="Move layer down"
                  aria-label={`Move ${layer.name} down`}
                  disabled={isBottom}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({
                      type: "MOVE_LAYER",
                      id: layer.id,
                      direction: "down",
                    });
                  }}
                  className={rowBtn}
                >
                  <ChevronDown size={15} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  title="Delete layer"
                  aria-label={`Delete ${layer.name}`}
                  disabled={state.layers.length <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "DELETE_LAYER", id: layer.id });
                  }}
                  className={`${rowBtn} hover:text-danger`}
                >
                  <Trash2 size={14} strokeWidth={1.8} />
                </button>
              </div>
              <label className="mt-[8px] flex items-center gap-[8px] pl-[30px] text-[11px] text-ink-faint">
                <span className="shrink-0">Opacity</span>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={layer.opacity}
                  aria-label={`${layer.name} opacity`}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_LAYER_OPACITY",
                      id: layer.id,
                      opacity: Number(e.target.value),
                    })
                  }
                  className="min-w-0 flex-1"
                />
                <span className="w-[30px] shrink-0 text-right tabular-nums">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="shrink-0 border-t border-line px-[13px] py-[8px] text-[11px] leading-relaxed text-ink-faint">
        <p>
          {state.layers.length} layer{state.layers.length === 1 ? "" : "s"} ·{" "}
          {state.undoStack.length} undo step
          {state.undoStack.length === 1 ? "" : "s"} available
        </p>
      </div>
    </div>
  );
}
