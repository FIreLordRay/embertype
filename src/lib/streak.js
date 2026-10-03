/**
 * Daily practice: time typed per day, your streak, and the calendar grid on the stats page.
 *
 * Days are local calendar days, keyed "YYYY-MM-DD". Dates are always stepped through by their
 * calendar fields (year, month, day − 1), never by subtracting 24 hours, so a daylight-saving
 * change (a 23- or 25-hour day) can't skip or repeat a day.
 */

/** "2026-10-03": the local calendar day of a timestamp. */
export function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Local midnight, `offset` calendar days before `date`. */
function daysBefore(date, offset) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset)
}

/**
 * Practice time and number of tests for every day that has any.
 *
 * @param {{ date: number, ms: number }[]} results
 * @returns {Map<string, { ms: number, tests: number }>}
 */
export function dailyTotals(results) {
  const totals = new Map()
  for (const result of results) {
    const key = dayKey(result.date)
    const day = totals.get(key) ?? { ms: 0, tests: 0 }
    day.ms += result.ms
    day.tests++
    totals.set(key, day)
  }
  return totals
}

/**
 * Consecutive days with practice, counting back from today. Today is still "in progress": if
 * you haven't practiced yet today, the streak counts up to yesterday instead of dropping to 0.
 *
 * @param {Map<string, unknown>} totals from dailyTotals
 * @param {number} now
 */
export function currentStreak(totals, now) {
  let offset = totals.has(dayKey(now)) ? 0 : 1
  let streak = 0
  while (totals.has(dayKey(daysBefore(now, offset)))) {
    streak++
    offset++
  }
  return streak
}

/** The longest run of consecutive practice days ever. */
export function longestStreak(totals) {
  let best = 0
  let run = 0
  let previous = null
  for (const key of [...totals.keys()].sort()) {
    const [y, m, d] = key.split('-').map(Number)
    const dayBefore = dayKey(new Date(y, m - 1, d - 1))
    run = previous === dayBefore ? run + 1 : 1
    best = Math.max(best, run)
    previous = key
  }
  return best
}

/**
 * The calendar grid: `weeks` columns of 7 days (Sunday at the top), ending with this week.
 * Days after today are null.
 *
 * @param {Map<string, { ms: number, tests: number }>} totals
 * @param {number} now
 * @returns {({ key: string, date: number, ms: number, tests: number } | null)[][]}
 */
export function calendarWeeks(totals, now, weeks = 18) {
  const today = daysBefore(now, 0)
  const firstSunday = daysBefore(today, today.getDay() + 7 * (weeks - 1))
  const columns = []
  for (let week = 0; week < weeks; week++) {
    const column = []
    for (let day = 0; day < 7; day++) {
      const date = new Date(firstSunday.getFullYear(), firstSunday.getMonth(), firstSunday.getDate() + week * 7 + day)
      if (date > today) {
        column.push(null)
        continue
      }
      const key = dayKey(date)
      column.push({ key, date: date.getTime(), ...(totals.get(key) ?? { ms: 0, tests: 0 }) })
    }
    columns.push(column)
  }
  return columns
}
