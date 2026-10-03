/**
 * Axis bounds and evenly spaced ticks on "nice" numbers: steps of 1, 2, 2.5 or 5 × 10ⁿ.
 *
 *   niceScale(86.3, 100)  → { domain: [85, 100], ticks: [85, 90, 95, 100] }
 *   niceScale(0, 37)      → { domain: [0, 40],   ticks: [0, 10, 20, 30, 40] }
 *
 * Charts pass both to Recharts explicitly. Its automatic ticks round fractional steps,
 * which produced uneven axes like 85% · 89% · 93% · 100%.
 *
 * @param {number} min smallest value that must fit
 * @param {number} max largest value that must fit
 * @param {number} [maxTicks=5] roughly how many ticks to aim for
 * @returns {{ domain: [number, number], ticks: number[] }}
 */
export function niceScale(min, max, maxTicks = 5) {
  if (!(max > min)) max = min + 1 // flat (or single-point) data still needs a visible range
  const rawStep = (max - min) / (maxTicks - 1)
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep - 1e-9)
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks = []
  // lo + i × step (rather than adding step repeatedly) avoids drift like 0.30000000000000004.
  for (let i = 0; lo + i * step <= hi + step / 2; i++) ticks.push(Number((lo + i * step).toFixed(10)))
  return { domain: [lo, hi], ticks }
}
