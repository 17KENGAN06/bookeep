import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pages = [
  ['An evening with a book', 'Sit down. Nowhere to rush.', 'The page is waiting.'],
  ['A small planet', 'Short chapters.', 'A story that still hits.'],
  ['Valley evening', 'Warm talk.', 'Language that does not hurry.'],
  ['Coffee and rain', 'A bus window.', 'Ordinary days, quiet sentences.'],
  ['Sea and patience', 'Short lines.', 'They still carry weight.'],
  ['A goose, a gem', 'Sherlock, compact.', 'One evening is enough.'],
  ['Forest and family', 'Seven stubborn lives.', 'A classic you can sit with.'],
  ['Conversation and irony', 'Readable pace.', 'Stay as long as you like.'],
  ['Myth and rhythm', 'Selected runes.', 'A softer way into the epic.'],
  ['Close the tab', 'Come back later.', 'The page will still be here.'],
];

function escapePdf(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function pageStream(lines) {
  const [title, a, b] = lines;
  return `BT
/F1 22 Tf
40 168 Td
(${escapePdf(title)}) Tj
0 -28 Td
/F1 13 Tf
(${escapePdf(a)}) Tj
0 -18 Td
(${escapePdf(b)}) Tj
ET`;
}

const contentBodies = pages.map((lines) => {
  const stream = pageStream(lines);
  return `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`;
});

let file = '%PDF-1.4\n';
const offsets = [0];

function add(content) {
  offsets.push(Buffer.byteLength(file, 'ascii'));
  const id = offsets.length;
  file += `${id} 0 obj\n${content}\nendobj\n`;
  return id;
}

const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
const contentIds = contentBodies.map((content) => add(content));
const pagesId = fontId + contentIds.length + contentIds.length + 1;

const pageIds = contentIds.map((contentId) =>
  add(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 480 220] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
  ),
);

const actualPagesId = add(
  `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`,
);

if (actualPagesId !== pagesId) {
  throw new Error(`pages id mismatch: expected ${pagesId}, got ${actualPagesId}`);
}

const catalogId = add(`<< /Type /Catalog /Pages ${actualPagesId} 0 R >>`);
const xrefAt = Buffer.byteLength(file, 'ascii');

let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
for (let i = 1; i < offsets.length; i += 1) {
  xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}

file += xref;
file += `trailer\n<< /Size ${offsets.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'samples');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'evening.pdf'), file, 'ascii');
console.log(`wrote public/samples/evening.pdf (${pages.length} pages)`);
