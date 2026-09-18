import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import type { Book } from '../types/book';

const FOLDER = 'books';

function booksDirectory() {
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

function fileFor(book: Book) {
  return new File(booksDirectory(), `${book.slug}.pdf`);
}

export function downloadedUri(book: Book) {
  if (Platform.OS === 'web') return null;
  const file = fileFor(book);
  return file.exists ? file.uri : null;
}

export async function downloadBook(book: Book) {
  if (Platform.OS === 'web') throw new Error('no-fs');
  if (!book.pdf_path) throw new Error('no-pdf');
  const file = await File.downloadFileAsync(book.pdf_path, fileFor(book), { idempotent: true });
  return file.uri;
}

export function removeDownload(book: Book) {
  if (Platform.OS === 'web') return;
  const file = fileFor(book);
  if (file.exists) file.delete();
}

export async function readLocalBase64(uri: string) {
  return new File(uri).base64();
}
