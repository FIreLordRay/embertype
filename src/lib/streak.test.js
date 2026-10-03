import { describe, expect, it } from 'vitest'
import { calendarWeeks, currentStreak, dailyTotals, dayKey, longestStreak } from './streak.js'

/** A result typed at local time y-m-d hh:00 (months are 1-based here, for readability). */
const at = (y, m, d, h = 12, ms = 60_000) => ({ date: new Date(y, m - 1, d, h).getTime(), ms })
const now = new Date(2026, 9, 3, 15).getTime() // Sat 3 Oct 2026, 3 pm local

describe('dayKey / dailyTotals', () => {
  it('groups results by local calendar day', () => {
    expect(dayKey(new Date(2026, 9, 3, 23, 59))).toBe('2026-10-03')
    const totals = dailyTotals([at(2026, 10, 3, 9), at(2026, 10, 3, 22, 120_000), at(2026, 10, 2)])
    expect(totals.get('2026-10-03')).toEqual({ ms: 180_000, tests: 2 })
    expect(totals.get('2026-10-02')).toEqual({ ms: 60_000, tests: 1 })
  })
})

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    const totals = dailyTotals([at(2026, 10, 3), at(2026, 10, 2), at(2026, 10, 1), at(2026, 9, 28)])
    expect(currentStreak(totals, now)).toBe(3)
  })

  it("doesn't break before you've practiced today", () => {
    const totals = dailyTotals([at(2026, 10, 2), at(2026, 10, 1)])
    expect(currentStreak(totals, now)).toBe(2)
  })

  it('is 0 once a whole day is missed', () => {
    expect(currentStreak(dailyTotals([at(2026, 10, 1)]), now)).toBe(0)
    expect(currentStreak(new Map(), now)).toBe(0)
  })

  it('survives a daylight-saving change (US clocks go back on 1 Nov 2026)', () => {
    const totals = dailyTotals([at(2026, 10, 31), at(2026, 11, 1), at(2026, 11, 2)])
    expect(currentStreak(totals, new Date(2026, 10, 2, 20).getTime())).toBe(3)
  })
})

describe('longestStreak', () => {
  it('finds the longest run of consecutive days, across month ends', () => {
    const totals = dailyTotals([at(2026, 9, 29), at(2026, 9, 30), at(2026, 10, 1), at(2026, 10, 2), at(2026, 10, 5), at(2026, 10, 6)])
    expect(longestStreak(totals)).toBe(4)
    expect(longestStreak(new Map())).toBe(0)
  })
})

describe('calendarWeeks', () => {
  const weeks = calendarWeeks(dailyTotals([at(2026, 10, 3, 9, 300_000)]), now, 18)

  it('has 18 week columns of 7 days, Sunday first', () => {
    expect(weeks).toHaveLength(18)
    for (const column of weeks) expect(column).toHaveLength(7)
    expect(new Date(weeks[0][0].date).getDay()).toBe(0)
  })

  it('ends with today in the last column, and nothing after it', () => {
    const last = weeks.at(-1)
    expect(last[6]).toMatchObject({ key: '2026-10-03', ms: 300_000, tests: 1 }) // Saturday
    const sunday = new Date(2026, 9, 4).getTime()
    expect(weeks.flat().every((day) => day === null || day.date < sunday)).toBe(true)
  })

  it('marks future days as empty', () => {
    const midweek = calendarWeeks(new Map(), new Date(2026, 9, 1, 12).getTime(), 2) // a Thursday
    expect(midweek.at(-1).slice(4)).toEqual([expect.objectContaining({ key: '2026-10-01' }), null, null])
  })
})
