const COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const COVER_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isCoverFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return COVER_TYPES.has(file.type) || COVER_EXTENSIONS.has(extension);
}

export function fileExtension(file: File, fallback: string) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName) return fromName === 'jpeg' ? 'jpg' : fromName;
  return fallback;
}
