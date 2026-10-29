type Rgb = [number, number, number];

type PaperTone = {
  id: string;
  ink: Rgb;
  paper: Rgb;
  // Input luminance below `black` counts as full ink, above `white` as clean paper.
  black: number;
  white: number;
  // Above 1 pulls anti-aliased edges toward the ink colour, so thin type reads heavier.
  weight: number;
};

const tones: PaperTone[] = [
  { id: 'reader-paper-sepia', ink: [52, 38, 24], paper: [244, 234, 215], black: 0.2, white: 0.9, weight: 1.4 },
  { id: 'reader-paper-night', ink: [236, 228, 212], paper: [23, 22, 20], black: 0.3, white: 0.85, weight: 2 },
];

const STEPS = 24;

function table(tone: PaperTone, channel: 0 | 1 | 2) {
  const values: string[] = [];
  for (let index = 0; index <= STEPS; index += 1) {
    const luminance = index / STEPS;
    const stretched = Math.min(1, Math.max(0, (luminance - tone.black) / (tone.white - tone.black)));
    const t = stretched ** tone.weight;
    const value = tone.ink[channel] + (tone.paper[channel] - tone.ink[channel]) * t;
    values.push((value / 255).toFixed(4));
  }
  return values.join(' ');
}

/** SVG filters that turn a rendered PDF page into a sepia or night page with readable contrast. */
export function ReaderPaperFilters() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute h-0 w-0">
      <defs>
        {tones.map((tone) => (
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
