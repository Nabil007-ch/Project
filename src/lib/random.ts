/** Mulberry32: same seed means the same sample records on every machine. */
export function seededRandom(seed: number) {
  return () => {
    let n = seed += 0x6D2B79F5
    n = Math.imul(n ^ n >>> 15, n | 1)
    n ^= n + Math.imul(n ^ n >>> 7, n | 61)
    return ((n ^ n >>> 14) >>> 0) / 4294967296
  }
}
