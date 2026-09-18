import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

const root = dirname(fileURLToPath(import.meta.url));
mkdirSync(root, { recursive: true });

function renderSvg(name, size = 1024) {
  const svg = readFileSync(join(root, name));
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  })
    .render()
    .asPng();
}

function solidPng(hex, size = 1024) {
  const png = new PNG({ width: size, height: size });
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
}

writeFileSync(join(root, 'icon.png'), renderSvg('icon.svg'));
writeFileSync(join(root, 'favicon.png'), renderSvg('icon.svg', 512));
writeFileSync(join(root, 'splash-icon.png'), renderSvg('icon-foreground.svg'));
writeFileSync(join(root, 'android-icon-foreground.png'), renderSvg('icon-foreground.svg'));
writeFileSync(join(root, 'android-icon-monochrome.png'), renderSvg('icon-mono.svg'));
writeFileSync(join(root, 'android-icon-background.png'), solidPng('#F7FAF8'));
