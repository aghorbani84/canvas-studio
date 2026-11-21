import type { Layer } from "../state/store";

/** Draw a layer snapshot (data URL) back onto its canvas element. */
export function restoreLayerToCanvas(
  canvas: HTMLCanvasElement,
  dataUrl: string | null,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!dataUrl) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = dataUrl;
  });
}

/**
 * Flood fill starting at (startX, startY) on `ctx`, replacing the touched
 * region with `fillColor` at `globalAlpha`. Classic scanline stack fill on
 * ImageData so it works on real pixel content.
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  alpha: number,
): void {
  const { width, height } = ctx.canvas;
  const x = Math.floor(startX);
  const y = Math.floor(startY);
  if (x < 0 || y < 0 || x >= width || y >= height) return;

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const startIndex = (y * width + x) * 4;
  const target: [number, number, number, number] = [
    data[startIndex],
    data[startIndex + 1],
    data[startIndex + 2],
    data[startIndex + 3],
  ];

  // Parse "#rrggbb" into rgb.
  const r = parseInt(fillColor.slice(1, 3), 16);
  const g = parseInt(fillColor.slice(3, 5), 16);
  const b = parseInt(fillColor.slice(5, 7), 16);
  const a = Math.round(alpha * 255);
  if (target[0] === r && target[1] === g && target[2] === b && target[3] === a) {
    return;
  }

  const matches = (i: number): boolean =>
    data[i] === target[0] &&
    data[i + 1] === target[1] &&
    data[i + 2] === target[2] &&
    data[i + 3] === target[3];

  const stack: Array<[number, number]> = [[x, y]];
  while (stack.length > 0) {
    const [cx, cy] = stack.pop() as [number, number];
    const idx = (cy * width + cx) * 4;
    if (!matches(idx)) continue;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
    if (cx > 0) stack.push([cx - 1, cy]);
    if (cx < width - 1) stack.push([cx + 1, cy]);
    if (cy > 0) stack.push([cx, cy - 1]);
    if (cy < height - 1) stack.push([cx, cy + 1]);
  }
  ctx.putImageData(image, 0, 0);
}

/** Load an image from a data URL. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load layer image"));
    img.src = src;
  });
}

/**
 * Composite all visible layers (bottom layer first, top layer last) onto a
 * single canvas and trigger a PNG download. Layer order in the array is
 * bottom-to-top, so drawing in array order preserves the stack.
 */
export async function exportAsPng(
  layers: Layer[],
  width: number,
  height: number,
  fileName = "canvas-studio.png",
): Promise<void> {
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Could not create export canvas");

  for (const layer of layers) {
    if (!layer.visible || !layer.dataUrl) continue;
    const img = await loadImage(layer.dataUrl);
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  const link = document.createElement("a");
  link.download = fileName;
  link.href = out.toDataURL("image/png");
  link.click();
}
