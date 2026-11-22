import {
  Brush,
  Circle,
  Eraser,
  Minus,
  PaintBucket,
  Square,
  type LucideIcon,
} from "lucide-react";
import { useStudio, type Tool } from "../state/store";

/**
 * Tool rail — the Figma-style vertical toolbar, 55px wide (34×φ).
 * One icon set (lucide, 16px, stroke 1.8); the active tool is a filled
 * accent square, idle tools are quiet gray. Labels stay as tooltips so
 * the rail reads as chrome, not a menu.
 */
const TOOLS: Array<{ id: Tool; label: string; icon: LucideIcon }> = [
  { id: "brush", label: "Brush", icon: Brush },
  { id: "eraser", label: "Eraser", icon: Eraser },
  { id: "line", label: "Line", icon: Minus },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "fill", label: "Fill", icon: PaintBucket },
];

export default function ToolRail() {
  const { state, dispatch } = useStudio();

  return (
    <nav
      className="flex w-full shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-line bg-surface px-2 py-2 sm:w-[55px] sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:px-0 sm:py-[13px]"
      role="toolbar"
      aria-label="Drawing tools"
      aria-orientation="vertical"
    >
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const isActive = state.tool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            title={t.label}
            aria-label={t.label}
            aria-pressed={isActive}
            onClick={() => dispatch({ type: "SET_TOOL", tool: t.id })}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-all duration-150 sm:h-[34px] sm:w-[34px] ${
              isActive
                ? "bg-accent text-accent-contrast shadow-sm"
                : "text-ink-soft hover:bg-panel hover:text-ink"
            }`}
          >
            <Icon size={16} strokeWidth={1.8} />
          </button>
        );
      })}
    </nav>
  );
}
