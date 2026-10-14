/**
 * Cryptographically secure, unbiased random integers.
 *
 * Uses the Web Crypto `getRandomValues`, available as a global in Node 20+,
 * browsers and edge runtimes. There is deliberately no `Math.random`
 * fallback: a deck must never be shuffled with a predictable generator.
 */

/** Fills a 32-bit array with random values. Swappable for tests. */
export type RandomSource = (buffer: Uint32Array) => void;

export const secureRandom: RandomSource = (buffer) => {
    const webCrypto = (globalThis as { crypto?: { getRandomValues?: (b: Uint32Array) => Uint32Array } }).crypto;
    if (!webCrypto || typeof webCrypto.getRandomValues !== "function") {
        throw new Error("@block52/deck: globalThis.crypto.getRandomValues is not available (Node 20+, browsers and edge runtimes provide it)");
    }
    webCrypto.getRandomValues(buffer);
};

const RANGE = 0x100000000; // 2^32

/**
 * Returns a uniformly distributed integer in [0, bound). Rejection sampling
 * discards the values that would make `x % bound` favour small results.
 */
export function randomBelow(bound: number, source: RandomSource = secureRandom): number {
    if (!Number.isInteger(bound) || bound <= 0 || bound > RANGE) {
        throw new Error(`randomBelow: bound must be an integer in [1, 2^32], got ${bound}`);
    }
    const limit = RANGE - (RANGE % bound); // largest multiple of bound <= 2^32
    const buffer = new Uint32Array(1);
    for (;;) {
        source(buffer);
        if (buffer[0] < limit) {
            return buffer[0] % bound;
        }
    }
}
