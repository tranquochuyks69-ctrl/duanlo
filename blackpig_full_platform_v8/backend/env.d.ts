// Ambient TypeScript declarations for zero-dependency IDE / tsc inspection
declare module 'node:cluster' {
  const cluster: { isPrimary: boolean; fork: () => any };
  export default cluster;
}
declare module 'node:os' {
  const os: { cpus: () => Array<any> };
  export default os;
}
declare module 'node:crypto' {
  const crypto: {
    createHmac: (alg: string, key: string) => { update: (d: string) => { digest: (enc: string) => string } };
    createHash: (alg: string) => { update: (d: string) => { digest: () => Buffer } };
  };
  export default crypto;
}
declare module 'crypto' {
  const crypto: {
    createHash: (alg: string) => { update: (d: string) => { digest: () => Buffer } };
  };
  export default crypto;
}
declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void): void;
  export function expect(val: any): {
    toBe: (expected: any) => void;
    toBeGreaterThan: (expected: number) => void;
  };
}
declare interface Buffer {
  toString(encoding?: string): string;
}
declare var Buffer: {
  from(data: string, encoding?: string): Buffer;
};
declare var process: {
  env: Record<string, string | undefined>;
};
declare namespace Intl {
  class Segmenter {
    constructor(locales?: string | string[], options?: { granularity?: 'grapheme' | 'word' | 'sentence' });
    segment(input: string): Iterable<{ segment: string; index: number; isWordLike?: boolean }>;
  }
}
