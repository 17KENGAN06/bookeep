export const DEFAULT_DEMO_PAGES = 10;

/**
 * How many pages a demo really gets: what the admin set, but never more than a
 * third of the book, so a short book is not given away whole.
 */
export function demoPageCount(requested: number, totalPages: number) {
  const wanted = Math.max(1, Math.round(requested || DEFAULT_DEMO_PAGES));
  const cap = Math.max(1, Math.floor(totalPages / 3));
  return Math.min(wanted, cap, totalPages);
}
