import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef(0);
  const argsRef = useRef<Args | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const flush = useCallback(() => {
    const args = argsRef.current;
    if (!args) return;
    argsRef.current = null;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
    callbackRef.current(...args);
  }, []);

  useEffect(
    () => () => {
      flush();
    },
    [flush],
  );

  const run = useCallback(
    (...args: Args) => {
      argsRef.current = args;
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = 0;
        flush();
      }, delay);
    },
    [delay, flush],
  );

  return { run, flush };
}
