export const SITE_ORIGIN = 'https://bookeep.cloud';

export function webBookUrl(slug: string) {
  return `${SITE_ORIGIN}/books/${slug}`;
}

export function appBookUrl(slug: string) {
  return `bookeep://books/${slug}`;
}
