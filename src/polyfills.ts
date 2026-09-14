function definePrototype<T extends object>(target: T, name: string, value: unknown) {
  if (typeof (target as Record<string, unknown>)[name] === 'function') return;
  Object.defineProperty(target, name, {
    configurable: true,
    writable: true,
    value,
  });
}

if (typeof Uint8Array !== 'undefined') {
  definePrototype(Uint8Array.prototype, 'toHex', function toHex(this: Uint8Array) {
    let hex = '';
    for (let i = 0; i < this.length; i += 1) {
      hex += this[i]!.toString(16).padStart(2, '0');
    }
    return hex;
  });
}

if (typeof Map !== 'undefined') {
  definePrototype(Map.prototype, 'getOrInsertComputed', function getOrInsertComputed<K, V>(
    this: Map<K, V>,
    key: K,
    callback: (key: K) => V,
  ) {
    if (this.has(key)) return this.get(key) as V;
    const value = callback(key);
    this.set(key, value);
    return value;
  });
}

if (typeof Promise !== 'undefined' && typeof (Promise as PromiseConstructor & { withResolvers?: unknown }).withResolvers !== 'function') {
  (Promise as PromiseConstructor & {
    withResolvers: <T>() => {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: unknown) => void;
    };
  }).withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
