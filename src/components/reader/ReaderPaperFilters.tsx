import { PAPER_TONES, toneAt, type PaperTone } from '@/utils/paperTone';

const STEPS = 24;

function table(tone: PaperTone, channel: 0 | 1 | 2) {
  const values: string[] = [];
  for (let index = 0; index <= STEPS; index += 1) {
    values.push((toneAt(tone, index / STEPS)[channel] / 255).toFixed(4));
  }
  return values.join(' ');
}

/**
 * SVG filters with the sepia and night look, for the page thumbnails. The page being read is
 * recoloured in its canvas pixels instead (see tonePageCanvas), so it carries no filter.
 */
export function ReaderPaperFilters() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute h-0 w-0">
      <defs>
        {Object.values(PAPER_TONES).map((tone) => (
          <filter key={tone.id} id={tone.id} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={table(tone, 0)} />
              <feFuncG type="table" tableValues={table(tone, 1)} />
              <feFuncB type="table" tableValues={table(tone, 2)} />
            </feComponentTransfer>
          </filter>
        ))}
      </defs>
    </svg>
  );
}
