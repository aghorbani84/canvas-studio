import { useStudio } from "../state/store";

export default function LayersPanel() {
  const { state, dispatch } = useStudio();

  // Layers are stored bottom-to-top; the panel shows the top layer first.
  const displayLayers = [...state.layers].reverse();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-gray-700 bg-gray-900 text-gray-100">
      <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
        <h2 className="text-sm font-semibold tracking-wide">Layers</h2>
        <button
          type="button"
          onClick={() => dispatch({ type: "ADD_LAYER" })}
          className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium hover:bg-indigo-500"
        >
          + Add layer
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto p-2">
        {displayLayers.map((layer, displayIndex) => {
          const isActive = layer.id === state.activeLayerId;
          const isTop = displayIndex === 0;
          const isBottom = displayIndex === displayLayers.length - 1;
          return (
            <li
              key={layer.id}
              onClick={() =>
                dispatch({ type: "SET_ACTIVE_LAYER", id: layer.id })
              }
              className={`mb-1 cursor-pointer rounded-md border px-2 py-2 ${
                isActive
                  ? "border-indigo-500 bg-indigo-600/20"
                  : "border-gray-700 bg-gray-800 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
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
                  className="text-base leading-none"
                >
                  {layer.visible ? "👁️" : "🚫"}
                </button>
                <span className="flex-1 truncate text-sm font-medium">
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
                  className="rounded px-1 text-gray-300 hover:bg-gray-600 disabled:opacity-30"
                >
                  ↑
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
                  className="rounded px-1 text-gray-300 hover:bg-gray-600 disabled:opacity-30"
                >
                  ↓
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
                  className="rounded px-1 text-red-400 hover:bg-gray-600 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
              <label className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                Opacity
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
                  className="flex-1"
                />
                <span className="w-8 text-right">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-gray-700 px-3 py-2 text-xs leading-relaxed text-gray-400">
        <p>
          {state.layers.length} layer{state.layers.length === 1 ? "" : "s"} ·{" "}
          {state.undoStack.length} undo step
          {state.undoStack.length === 1 ? "" : "s"} available
        </p>
        <p className="mt-1">
          {state.savedAt
            ? `Autosaved ${new Date(state.savedAt).toLocaleTimeString()} — your drawing is stored in this browser.`
            : "Your drawing autosaves to this browser as you work."}
        </p>
        <p className="mt-1">Shortcuts: Ctrl+Z undo · Ctrl+Shift+Z redo</p>
      </div>
    </aside>
  );
}
