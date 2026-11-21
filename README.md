# Canvas Studio

A browser drawing app built with React, TypeScript, Vite and the HTML Canvas API.
Draw with a brush, eraser, shapes and fill on stacked layers, undo any step,
and export the finished artwork as a PNG — everything stays in your browser.

## Features

- **Drawing tools** — brush, eraser, line, rectangle, circle and flood fill
- **Color** — color picker plus a custom palette (add the current color with
  `+`, right-click a swatch to remove it)
- **Brush controls** — size slider (1–64 px) and opacity slider (5–100%)
- **Layers** — add, delete, reorder (up/down), toggle visibility and set
  per-layer opacity; each layer is drawn on its own stacked canvas so the
  composite order is always bottom-to-top
- **History** — snapshot-based undo/redo (up to 50 steps) via `Ctrl+Z` /
  `Ctrl+Shift+Z`, covering strokes, shapes, fills, layer edits and clears
- **Canvas** — size presets (800×600 up to 1920×1080), zoom 25–300%, clear-all
- **Export** — composites all visible layers into a single PNG download
- **Autosave** — layer snapshots and canvas size are saved to `localStorage`
  (debounced) and restored automatically on the next visit

## Tech used

- **React 19 + TypeScript + Vite** — app scaffold and build
- **React Context + `useReducer`** — all studio state (tool, color, layers,
  history, zoom, canvas size) lives in one reducer in
  `src/state/store.tsx`; components read it through the `useStudio()` hook
- **HTML Canvas API** — one `<canvas>` per layer plus a preview overlay for
  shapes; flood fill is implemented directly on `ImageData`
- **Tailwind CSS 4** (via the `@tailwindcss/vite` plugin) — all styling
- **localStorage only** — no backend, no API, no keys

## How to run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Other commands:

```bash
npm run build    # typecheck (tsc) + production build
npx tsc --noEmit # typecheck only
```

## Project structure

```
src/
  App.tsx                  # provider, autosave effect, keyboard shortcuts
  state/store.tsx          # Context + useReducer: tools, layers, history
  components/
    Toolbar.tsx            # tools, color/palette, sliders, undo/redo, export
    CanvasBoard.tsx        # stacked layer canvases + pointer drawing
    LayersPanel.tsx        # layer list: visibility, reorder, opacity, delete
  utils/canvas.ts          # flood fill, layer restore, PNG export compositing
```

## Notes

- Undo snapshots store full layer images, so very large canvases with many
  steps use more memory; the history is capped at 50 steps.
- Exported PNGs keep transparency — hidden layers are excluded and each
  layer's opacity is applied during compositing.
