import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Tool =
  | "brush"
  | "eraser"
  | "line"
  | "rectangle"
  | "circle"
  | "fill";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0..1
  /** PNG data URL snapshot of the layer contents, or null when blank. */
  dataUrl: string | null;
}

export interface CanvasSize {
  label: string;
  width: number;
  height: number;
}

export const CANVAS_SIZE_PRESETS: CanvasSize[] = [
  { label: "800 × 600", width: 800, height: 600 },
  { label: "1024 × 768", width: 1024, height: 768 },
  { label: "1280 × 720", width: 1280, height: 720 },
  { label: "1920 × 1080", width: 1920, height: 1080 },
  { label: "512 × 512", width: 512, height: 512 },
];

export const DEFAULT_PALETTE: string[] = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#78350f",
  "#6b7280",
];

export const AUTOSAVE_KEY = "canvas-studio-autosave-v1";

/** Max undo steps kept in memory (each step stores full layer snapshots). */
const MAX_HISTORY = 50;

export interface StudioState {
  tool: Tool;
  color: string;
  brushSize: number; // px, 1..64
  opacity: number; // 0..1
  palette: string[];
  layers: Layer[];
  activeLayerId: string;
  zoom: number; // 0.25..3
  canvasSize: CanvasSize;
  undoStack: Layer[][];
  redoStack: Layer[][];
  savedAt: string | null;
}

export type StudioAction =
  | { type: "SET_TOOL"; tool: Tool }
  | { type: "SET_COLOR"; color: string }
  | { type: "SET_BRUSH_SIZE"; size: number }
  | { type: "SET_OPACITY"; opacity: number }
  | { type: "ADD_PALETTE_COLOR"; color: string }
  | { type: "REMOVE_PALETTE_COLOR"; color: string }
  | { type: "ADD_LAYER" }
  | { type: "DELETE_LAYER"; id: string }
  | { type: "TOGGLE_LAYER_VISIBILITY"; id: string }
  | { type: "SET_LAYER_OPACITY"; id: string; opacity: number }
  | { type: "MOVE_LAYER"; id: string; direction: "up" | "down" }
  | { type: "SET_ACTIVE_LAYER"; id: string }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_CANVAS_SIZE"; size: CanvasSize }
  | { type: "BEGIN_STROKE" }
  | { type: "UPDATE_LAYER_DATA"; id: string; dataUrl: string | null }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_ALL" }
  | { type: "RESTORE"; layers: Layer[]; canvasSize: CanvasSize }
  | { type: "SET_SAVED_AT"; savedAt: string };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

let layerCounter = 0;

function createLayer(name: string): Layer {
  layerCounter += 1;
  return {
    id: `layer-${Date.now()}-${layerCounter}`,
    name,
    visible: true,
    opacity: 1,
    dataUrl: null,
  };
}

function cloneLayers(layers: Layer[]): Layer[] {
  return layers.map((l) => ({ ...l }));
}

/** Push the current layers onto the undo stack and clear redo. */
function pushHistory(state: StudioState): Pick<StudioState, "undoStack" | "redoStack"> {
  const next = [...state.undoStack, cloneLayers(state.layers)];
  if (next.length > MAX_HISTORY) next.shift();
  return { undoStack: next, redoStack: [] };
}

function initialState(): StudioState {
  const first = createLayer("Layer 1");
  let state: StudioState = {
    tool: "brush",
    color: "#000000",
    brushSize: 8,
    opacity: 1,
    palette: DEFAULT_PALETTE,
    layers: [first],
    activeLayerId: first.id,
    zoom: 1,
    canvasSize: CANVAS_SIZE_PRESETS[0],
    undoStack: [],
    redoStack: [],
    savedAt: null,
  };

  // Restore an autosaved drawing, if one exists.
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as {
        layers?: Layer[];
        canvasSize?: CanvasSize;
        savedAt?: string;
      };
      if (Array.isArray(saved.layers) && saved.layers.length > 0) {
        const layers = saved.layers.filter(
          (l) => l && typeof l.id === "string",
        );
        if (layers.length > 0) {
          state = {
            ...state,
            layers,
            activeLayerId: layers[layers.length - 1].id,
            canvasSize: saved.canvasSize ?? state.canvasSize,
            savedAt: saved.savedAt ?? null,
          };
        }
      }
    }
  } catch {
    // Corrupt or unavailable storage: start with a blank canvas.
  }
  return state;
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

export function reducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "SET_TOOL":
      return { ...state, tool: action.tool };
    case "SET_COLOR":
      return { ...state, color: action.color };
    case "SET_BRUSH_SIZE":
      return { ...state, brushSize: Math.min(64, Math.max(1, action.size)) };
    case "SET_OPACITY":
      return { ...state, opacity: Math.min(1, Math.max(0, action.opacity)) };
    case "ADD_PALETTE_COLOR":
      if (state.palette.includes(action.color)) return state;
      return { ...state, palette: [...state.palette, action.color] };
    case "REMOVE_PALETTE_COLOR":
      return {
        ...state,
        palette: state.palette.filter((c) => c !== action.color),
      };

    case "ADD_LAYER": {
      const layer = createLayer(`Layer ${state.layers.length + 1}`);
      // New layer goes on top (end of the array = top of the stack).
      return {
        ...state,
        ...pushHistory(state),
        layers: [...state.layers, layer],
        activeLayerId: layer.id,
      };
    }
    case "DELETE_LAYER": {
      if (state.layers.length <= 1) return state;
      const layers = state.layers.filter((l) => l.id !== action.id);
      const activeLayerId =
        state.activeLayerId === action.id
          ? layers[layers.length - 1].id
          : state.activeLayerId;
      return { ...state, ...pushHistory(state), layers, activeLayerId };
    }
    case "TOGGLE_LAYER_VISIBILITY":
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, visible: !l.visible } : l,
        ),
      };
    case "SET_LAYER_OPACITY":
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id
            ? { ...l, opacity: Math.min(1, Math.max(0, action.opacity)) }
            : l,
        ),
      };
    case "MOVE_LAYER": {
      const index = state.layers.findIndex((l) => l.id === action.id);
      if (index < 0) return state;
      const target = action.direction === "up" ? index + 1 : index - 1;
      if (target < 0 || target >= state.layers.length) return state;
      const layers = [...state.layers];
      const [moved] = layers.splice(index, 1);
      layers.splice(target, 0, moved);
      return { ...state, layers };
    }
    case "SET_ACTIVE_LAYER":
      return state.layers.some((l) => l.id === action.id)
        ? { ...state, activeLayerId: action.id }
        : state;

    case "SET_ZOOM":
      return { ...state, zoom: Math.min(3, Math.max(0.25, action.zoom)) };
    case "SET_CANVAS_SIZE":
      return { ...state, ...pushHistory(state), canvasSize: action.size };

    case "BEGIN_STROKE":
      // Snapshot the layers *before* the stroke so undo restores them.
      return { ...state, ...pushHistory(state) };
    case "UPDATE_LAYER_DATA":
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.id ? { ...l, dataUrl: action.dataUrl } : l,
        ),
      };

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const previous = state.undoStack[state.undoStack.length - 1];
      const undoStack = state.undoStack.slice(0, -1);
      const redoStack = [...state.redoStack, cloneLayers(state.layers)];
      const layers = cloneLayers(previous);
      const activeLayerId = layers.some((l) => l.id === state.activeLayerId)
        ? state.activeLayerId
        : layers[layers.length - 1].id;
      return { ...state, layers, activeLayerId, undoStack, redoStack };
    }
    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      const redoStack = state.redoStack.slice(0, -1);
      const undoStack = [...state.undoStack, cloneLayers(state.layers)];
      const layers = cloneLayers(next);
      const activeLayerId = layers.some((l) => l.id === state.activeLayerId)
        ? state.activeLayerId
        : layers[layers.length - 1].id;
      return { ...state, layers, activeLayerId, undoStack, redoStack };
    }

    case "CLEAR_ALL": {
      const blank = state.layers.map((l) => ({ ...l, dataUrl: null }));
      return { ...state, ...pushHistory(state), layers: blank };
    }
    case "RESTORE": {
      const layers = action.layers.filter((l) => l && typeof l.id === "string");
      if (layers.length === 0) return state;
      return {
        ...state,
        layers,
        activeLayerId: layers[layers.length - 1].id,
        canvasSize: action.canvasSize,
        undoStack: [],
        redoStack: [],
      };
    }
    case "SET_SAVED_AT":
      return { ...state, savedAt: action.savedAt };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Context + provider                                                  */
/* ------------------------------------------------------------------ */

interface StudioContextValue {
  state: StudioState;
  dispatch: React.Dispatch<StudioAction>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used inside StudioProvider");
  return ctx;
}
