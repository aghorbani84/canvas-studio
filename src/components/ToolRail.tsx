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
      className="flex w-[55px] shrink-0 flex-col items-center gap-1 border-r border-line bg-surface py-[13px]"
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
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg transition-all duration-150 ${
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
