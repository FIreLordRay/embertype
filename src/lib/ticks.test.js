import { describe, expect, it } from 'vitest'
import { niceScale } from './ticks.js'

describe('niceScale', () => {
  it('turns an accuracy range into even, round ticks', () => {
    expect(niceScale(86.3, 100)).toEqual({ domain: [85, 100], ticks: [85, 90, 95, 100] })
  })

  it('handles a zero-based wpm axis', () => {
    expect(niceScale(0, 37)).toEqual({ domain: [0, 40], ticks: [0, 10, 20, 30, 40] })
  })

  it('uses 2.5-style steps when they fit best', () => {
    expect(niceScale(0, 9)).toEqual({ domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] })
  })

  it('gives flat data a visible range instead of dividing by zero', () => {
    const { domain, ticks } = niceScale(60, 60)
    expect(domain[0]).toBeLessThanOrEqual(60)
    expect(domain[1]).toBeGreaterThan(60)
    expect(ticks.length).toBeGreaterThan(1)
  })

  it('never produces floating-point noise', () => {
    for (const tick of niceScale(0.1, 0.9).ticks) expect(String(tick)).not.toMatch(/0000|9999/)
  })
})
