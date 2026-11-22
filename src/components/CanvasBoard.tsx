import { useEffect, useRef, useState } from "react";
import { useStudio } from "../state/store";
import { THEME_CHANGE_EVENT } from "../theme";
import { floodFill, restoreLayerToCanvas } from "../utils/canvas";

interface Point {
  x: number;
  y: number;
}

interface CanvasTheme {
  /** Sheet (paper) background for the active combo. */
  sheetBg: string;
  /** Default ink color for the active combo. */
  ink: string;
}

/** Read the canvas colors from the live computed CSS variables, so the
 *  sheet and default ink always follow the active theme combo. */
function readCanvasTheme(): CanvasTheme {
  const cs = getComputedStyle(document.documentElement);
  return {
    sheetBg: cs.getPropertyValue("--canvas-bg").trim() || "#ffffff",
    ink: cs.getPropertyValue("--canvas-ink").trim() || "#0f172a",
  };
}

export default function CanvasBoard() {
  const { state, dispatch } = useStudio();
  const { layers, activeLayerId, canvasSize, zoom, tool, color, brushSize, opacity } =
    state;

  const stackRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasRefs = useRef(new Map<string, HTMLCanvasElement>());
  const strokeRef = useRef<{
    drawing: boolean;
    start: Point;
    last: Point;
  } | null>(null);

  // Theme-driven canvas colors, read from computed CSS vars.
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>(readCanvasTheme);
  const [themeVersion, setThemeVersion] = useState(0);
  const colorRef = useRef(color);
  const prevInkRef = useRef<string | null>(null);
  useEffect(() => {
    colorRef.current = color;
  });

  /* On theme change: re-read the computed colors, redraw every layer,
     and remap the brush only when it is still the theme default ink
     (plain #000000 or the previous combo's ink) — a color the user
     picked deliberately is never touched. */
  useEffect(() => {
    prevInkRef.current = readCanvasTheme().ink;
    function onThemeChange() {
      const next = readCanvasTheme();
      const prevInk = prevInkRef.current ?? next.ink;
      const current = colorRef.current.toLowerCase();
      setCanvasTheme(next);
      setThemeVersion((v) => v + 1);
      if (current === "#000000" || current === prevInk.toLowerCase()) {
        dispatch({ type: "SET_COLOR", color: next.ink });
      }
      prevInkRef.current = next.ink;
    }
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, [dispatch]);

  const activeLayer = layers.find((l) => l.id === activeLayerId) ?? layers[0];

  /* Redraw every layer canvas from its stored snapshot whenever the layer
     data, size, or stack changes (undo/redo, restore, clear, resize) —
     and whenever the theme changes, so artwork follows the active combo. */
  useEffect(() => {
    const jobs: Array<Promise<void>> = [];
    for (const layer of layers) {
      const canvas = layerCanvasRefs.current.get(layer.id);
      if (canvas) jobs.push(restoreLayerToCanvas(canvas, layer.dataUrl));
    }
    void Promise.all(jobs);
  }, [layers, canvasSize, themeVersion]);

  function pointerPosition(e: React.PointerEvent): Point {
    const rect = stackRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }

  function activeCtx(): CanvasRenderingContext2D | null {
    const canvas = layerCanvasRefs.current.get(activeLayerId);
    return canvas ? canvas.getContext("2d") : null;
  }

  function commitActiveLayer() {
    const canvas = layerCanvasRefs.current.get(activeLayerId);
    if (!canvas) return;
    dispatch({
      type: "UPDATE_LAYER_DATA",
      id: activeLayerId,
      dataUrl: canvas.toDataURL("image/png"),
    });
  }

  function drawShapePreview(start: Point, current: Point) {
    const overlay = overlayRef.current;
    const ctx = overlay?.getContext("2d");
    if (!overlay || !ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();
    } else if (tool === "rectangle") {
      ctx.strokeRect(
        start.x,
        start.y,
        current.x - start.x,
        current.y - start.y,
      );
    } else if (tool === "circle") {
      const radius = Math.hypot(current.x - start.x, current.y - start.y);
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShapeFinal(start: Point, end: Point) {
    const ctx = activeCtx();
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (tool === "rectangle") {
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (tool === "circle") {
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    if (!activeLayer?.visible) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = pointerPosition(e);

    if (tool === "fill") {
      const ctx = activeCtx();
      if (!ctx) return;
      dispatch({ type: "BEGIN_STROKE" });
      floodFill(ctx, pos.x, pos.y, color, opacity);
      commitActiveLayer();
      return;
    }

    dispatch({ type: "BEGIN_STROKE" });
    strokeRef.current = { drawing: true, start: pos, last: pos };

    if (tool === "brush" || tool === "eraser") {
      const ctx = activeCtx();
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      ctx.globalAlpha = tool === "eraser" ? 1 : opacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const stroke = strokeRef.current;
    if (!stroke?.drawing) return;
    const pos = pointerPosition(e);

    if (tool === "brush" || tool === "eraser") {
      const ctx = activeCtx();
      if (!ctx) return;
      ctx.save();
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      ctx.globalAlpha = tool === "eraser" ? 1 : opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.last.x, stroke.last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.restore();
      stroke.last = pos;
    } else {
      drawShapePreview(stroke.start, pos);
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    const stroke = strokeRef.current;
    if (!stroke?.drawing) return;
    strokeRef.current = null;
    const pos = pointerPosition(e);

    if (tool === "line" || tool === "rectangle" || tool === "circle") {
      const overlay = overlayRef.current;
      overlay?.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height);
      drawShapeFinal(stroke.start, pos);
      commitActiveLayer();
    } else {
      // Brush / eraser: the stroke is already on the canvas; snapshot it.
      commitActiveLayer();
    }
  }

  const isBlank = layers.every((l) => !l.dataUrl);

  return (
    <div className="relative min-w-0 flex-1 overflow-auto bg-ground p-[34px]">
      <div className="flex min-h-full items-center justify-center">
        <div
          ref={stackRef}
          className="relative shrink-0 touch-none rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-line select-none"
          style={{
            width: canvasSize.width * zoom,
            height: canvasSize.height * zoom,
            backgroundColor: canvasTheme.sheetBg,
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--line) 45%, transparent) 1px, transparent 1.4px)",
            backgroundSize: "22px 22px",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: `scale(${zoom})` }}
          >
            {layers.map((layer) => (
              <canvas
                key={layer.id}
                ref={(el) => {
                  if (el) layerCanvasRefs.current.set(layer.id, el);
                  else layerCanvasRefs.current.delete(layer.id);
                }}
                width={canvasSize.width}
                height={canvasSize.height}
                className="absolute top-0 left-0"
                style={{
                  opacity: layer.opacity,
                  display: layer.visible ? "block" : "none",
                }}
              />
            ))}
            <canvas
              ref={overlayRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="pointer-events-none absolute top-0 left-0"
            />
          </div>
          {/* Empty state — a quiet invitation, never in the way of drawing */}
          {isBlank && activeLayer?.visible && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[5px] text-center">
              <p className="font-display text-[21px] leading-tight font-semibold tracking-tight text-ink-faint">
                Start drawing
              </p>
              <p className="text-[13px] text-ink-soft">
                Pick a tool on the left and draw on the canvas
              </p>
            </div>
          )}
          {!activeLayer?.visible && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="rounded-full bg-ink/85 px-3 py-1.5 text-[13px] font-medium text-surface shadow-lg">
                The active layer is hidden — make it visible to draw on it.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Sheet readout — size and zoom, floating over the ground */}
      <div className="pointer-events-none sticky bottom-0 left-0 z-10 -mt-7 flex">
        <span className="rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-ink-soft tabular-nums shadow-sm ring-1 ring-line backdrop-blur">
          {canvasSize.width} × {canvasSize.height} · {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
