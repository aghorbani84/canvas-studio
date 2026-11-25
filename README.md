# Canvas Studio

**A layered drawing app in the browser, with shapes, flood fill, undo/redo, and PNG export.**

[![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-2ea44f)](https://aghorbani84.github.io/canvas-studio/)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
[![GitHub stars](https://img.shields.io/github/stars/aghorbani84/canvas-studio?style=flat)](https://github.com/aghorbani84/canvas-studio/stargazers)

**Live demo:** https://aghorbani84.github.io/canvas-studio/

## Overview

Canvas Studio is a drawing app built on the HTML Canvas API. Each layer is its own canvas, all studio
state lives in a single reducer, and your work autosaves to `localStorage`, so nothing leaves your browser.

## Features

- **Tools**: brush, eraser, line, rectangle, circle, and flood fill.
- **Color**: color picker plus a custom palette (add with `+`, right-click a swatch to remove).
- **Brush controls**: size 1–64 px and opacity.
- **Layers**: add, delete, reorder, toggle visibility, and set per-layer opacity.
- **Undo / redo** up to 50 steps with `Ctrl+Z` / `Ctrl+Shift+Z` (`⌘` on macOS).
- **Canvas**: size presets (512×512 up to 1920×1080), zoom 25–300%, clear.
- **PNG export** that composites visible layers and keeps transparency.
- **Autosave** of layers and canvas size, restored on your next visit.
- **Themes**: Achaemenid and Modern styles, each in light and dark.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript |
| Build | Vite 8 |
| State | React Context + `useReducer` (`useStudio()` hook) |
| Rendering | HTML Canvas API (flood fill on `ImageData`) |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Deploy | GitHub Actions → GitHub Pages |

## Getting started

Requires Node.js 20 or newer and npm.

```bash
git clone https://github.com/aghorbani84/canvas-studio.git
cd canvas-studio
npm install
npm run dev        # http://localhost:5173/canvas-studio/
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Project structure

```
src/
  App.tsx            provider, autosave, keyboard shortcuts
  state/store.tsx    tools, layers, history, zoom (Context + reducer)
  theme.tsx          theme state
  components/        TopBar, ToolRail, CanvasBoard, PropertiesPanel, LayersPanel, InfoBar, ThemeSwitcher
  utils/canvas.ts    flood fill, layer restore, PNG compositing
.github/workflows/   GitHub Pages deploy
```

Undo history stores full layer snapshots, so very large canvases use more memory; history is capped at 50 steps.

## Author

Built by [Abolfazl Ghorbani](https://github.com/aghorbani84).
