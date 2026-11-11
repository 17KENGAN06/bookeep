/**
 * Safari (every browser on iPhone and iPad) cannot loop over a ReadableStream with
 * `for await`. pdf.js 5 reads a page's text that way in getTextContent(), and the legacy
 * build does not polyfill it: on an iPhone the text layer was never built, so there were
 * no words to select or tap, and "Explain" got no page text around the selection.
 * This adds the missing piece, built on getReader(), which Safari has.
 */
type IterableStream = ReadableStream & {
  [Symbol.asyncIterator]?: () => AsyncIterator<unknown>;
  values?: () => AsyncIterator<unknown>;
};

if (typeof ReadableStream !== 'undefined') {
  const proto = ReadableStream.prototype as IterableStream;
  if (typeof proto[Symbol.asyncIterator] !== 'function') {
    const values = async function* (this: ReadableStream) {
      const reader = this.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) return;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    };
    Object.defineProperty(proto, Symbol.asyncIterator, { value: values, configurable: true, writable: true });
    if (typeof proto.values !== 'function') {
      Object.defineProperty(proto, 'values', { value: values, configurable: true, writable: true });
    }
  }
}

export {};
