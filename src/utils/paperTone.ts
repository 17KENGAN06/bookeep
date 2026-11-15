import type { PdfPaper } from '@/hooks/usePdfPaper';

type Rgb = [number, number, number];

export type PaperTone = {
  id: string;
  ink: Rgb;
  paper: Rgb;
  // Input luminance below `black` counts as full ink, above `white` as clean paper.
  black: number;
  white: number;
  // Above 1 pulls anti-aliased edges toward the ink colour, so thin type reads heavier.
  weight: number;
};

export const PAPER_TONES: Record<Exclude<PdfPaper, 'light'>, PaperTone> = {
  sepia: { id: 'reader-paper-sepia', ink: [52, 38, 24], paper: [244, 234, 215], black: 0.2, white: 0.9, weight: 1.4 },
  night: { id: 'reader-paper-night', ink: [236, 228, 212], paper: [23, 22, 20], black: 0.3, white: 0.85, weight: 2 },
};

/** The tone's colour for an input luminance from 0 (black) to 1 (white). */
export function toneAt(tone: PaperTone, luminance: number): Rgb {
  const stretched = Math.min(1, Math.max(0, (luminance - tone.black) / (tone.white - tone.black)));
  const t = stretched ** tone.weight;
  return [0, 1, 2].map((channel) =>
    Math.round(tone.ink[channel] + (tone.paper[channel] - tone.ink[channel]) * t),
  ) as Rgb;
}

const lookups = new Map<PaperTone, Uint32Array>();
const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;

/** One packed RGBA pixel per input luminance 0–255. */
function lookup(tone: PaperTone) {
  let table = lookups.get(tone);
  if (!table) {
    table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      const [r, g, b] = toneAt(tone, index / 255);
      table[index] = littleEndian
        ? ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
        : ((r << 24) | (g << 16) | (b << 8) | 255) >>> 0;
    }
    lookups.set(tone, table);
  }
  return table;
}

/**
 * Recolours a drawn PDF page in place: the sepia or night look goes into the canvas pixels
 * themselves. The page then has exactly the same elements and styles as the stock page, so
 * text selection (a finger's above all) behaves the same in every paper mode. A CSS filter
 * on the canvas did the same job, but phones re-ran it on every repaint of the selection.
 */
export function tonePageCanvas(canvas: HTMLCanvasElement, paper: PdfPaper) {
  if (paper === 'light' || !canvas.width || !canvas.height) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const table = lookup(PAPER_TONES[paper]);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = new Uint32Array(image.data.buffer);
  const bytes = image.data;
  for (let index = 0, offset = 0; index < pixels.length; index += 1, offset += 4) {
    // Rec. 709 luminance in integer steps: (0.2126, 0.7152, 0.0722) × 256.
    pixels[index] = table[(54 * bytes[offset] + 183 * bytes[offset + 1] + 19 * bytes[offset + 2]) >> 8];
  }
  context.putImageData(image, 0, 0);
}
