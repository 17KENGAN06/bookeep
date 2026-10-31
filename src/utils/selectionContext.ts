import type { TextContent } from 'react-pdf';

/** Page text as one string, with line-end hyphenation joined back into whole words. */
export function pageTextFromContent(content: TextContent) {
  let out = '';
  for (const item of content.items) {
    if (!('str' in item)) continue;
    let piece = item.str;
    if (item.hasEOL) {
      if (/\p{L}-$/u.test(piece)) piece = piece.slice(0, -1);
      else piece += ' ';
    }
    out += piece;
  }
  return out.replace(/\s+/g, ' ').trim();
}

const SENTENCE_END = /[.!?…]["'”»)]?\s/gu;
const MAX_SIDE = 900;

/**
 * The sentence holding the selection plus one sentence on each side, so the explanation
 * fits this place in the story. Falls back to the start of the page when the selection
 * can't be found in the page text (e.g. it crosses into a footer).
 */
export function contextAround(pageText: string, selection: string) {
  if (!pageText) return '';

  const index = findLoose(pageText, selection);
  if (index == null) return pageText.slice(0, MAX_SIDE * 2);

  const [selStart, selEnd] = index;
  const floor = Math.max(0, selStart - MAX_SIDE);
  const ceil = Math.min(pageText.length, selEnd + MAX_SIDE);

  const ends: number[] = [];
  for (const match of pageText.slice(floor, ceil).matchAll(SENTENCE_END)) {
    ends.push(floor + (match.index ?? 0) + match[0].length);
  }

  const before = ends.filter((end) => end <= selStart);
  const after = ends.filter((end) => end >= selEnd);
  // Two sentence breaks back = start of the previous sentence.
  const start = before.length >= 2 ? before[before.length - 2] : floor;
  const end = after.length >= 2 ? after[1] : ceil;

  return pageText.slice(start, end).trim();
}

/**
 * Finds the selection ignoring whitespace, hyphens and case: the text layer spaces words
 * differently from the joined page text, and line-end hyphens were dropped above.
 */
function findLoose(haystack: string, needle: string): [number, number] | null {
  const skip = /[\s\-\u00ad]/;
  const map: number[] = [];
  let stripped = '';
  for (let i = 0; i < haystack.length; i += 1) {
    const char = haystack[i];
    if (skip.test(char)) continue;
    stripped += char.toLowerCase();
    map.push(i);
  }
  const target = needle.replace(/[\s\-\u00ad]+/g, '').toLowerCase();
  if (!target) return null;

  const at = stripped.indexOf(target);
  if (at < 0) return null;
  return [map[at], map[at + target.length - 1] + 1];
}
