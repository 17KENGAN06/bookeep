export function stripCopyTags(text: string) {
  return text.replace(/<\/?[a-zA-Z]+>/g, '');
}
