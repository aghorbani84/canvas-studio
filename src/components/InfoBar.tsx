import { useStudio } from "../state/store";

/**
 * Proof strip — Round 2 (rank-1 lesson: proof rendered IN the UI).
 * Every number comes straight from the reducer state: layer count from
 * `layers`, stroke count from `strokeCount` (BEGIN_STROKE), canvas size
 * from `canvasSize`, unsaved edits from `unsavedChanges` (reset to 0 by
 * the autosave's SET_SAVED_AT). It recomputes on every state change
 * because this component subscribes to the same Studio context.
 *
 * Format: "3 layers · 128 strokes · 1200×800 canvas · 0 unsaved changes"
 */
export default function InfoBar() {
  const { state } = useStudio();
  const activeLayer =
    state.layers.find((l) => l.id === state.activeLayerId) ?? state.layers[0];

  const plural = (n: number, singular: string) =>
    `${n} ${singular}${n === 1 ? "" : "s"}`;

  return (
    <div
      className="flex h-8 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-[13px] text-[12px]"
      role="status"
      aria-label="Document proof strip"
    >
      <p className="min-w-0 truncate text-ink-soft tabular-nums">
        <span className="font-semibold text-ink">
          {plural(state.layers.length, "layer")}
        </span>
        {" · "}
        <span className="font-semibold text-ink">
          {plural(state.strokeCount, "stroke")}
        </span>
        {" · "}
        <span className="font-semibold text-ink">
          {state.canvasSize.width}×{state.canvasSize.height} canvas
        </span>
        {" · "}
        <span
          className={
            state.unsavedChanges > 0
              ? "font-semibold text-danger"
              : "font-medium text-ink-faint"
          }
        >
          {state.unsavedChanges > 0 ? "● " : "✓ "}
          {plural(state.unsavedChanges, "unsaved change")}
        </span>
      </p>
      <p className="hidden shrink-0 text-ink-faint tabular-nums md:block">
        {activeLayer?.name ?? "—"} · {state.tool} · {state.brushSize}px ·{" "}
        <span className="uppercase">{state.color}</span>
        {" · "}
        {plural(state.undoStack.length, "undo step")} ·{" "}
        {plural(state.redoStack.length, "redo step")}
      </p>
    </div>
  );
}
