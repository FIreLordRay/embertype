import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { movingAverage, testLabel, timeAgo } from '../../lib/history.js'
import { niceScale } from '../../lib/ticks.js'

/** Same width on both charts, so their test numbers line up exactly. */
const Y_AXIS_WIDTH = 44
const TICK = { fill: 'var(--sub)', fontSize: 12 }
/** The chart shows your latest 100 tests; the table on the page lists every one. */
const MAX_POINTS = 100
/** How many tests the trend line averages. */
const WINDOW = 10

/** 8px dots with a 2px ring in the background colour, so overlapping tests stay readable. */
const TEST_DOT = { r: 4, fill: 'var(--muted)', stroke: 'var(--bg)', strokeWidth: 2 }
const TREND_LINE = {
  type: 'monotone',
  stroke: 'var(--main)',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  dot: false,
  activeDot: { r: 4, fill: 'var(--main)', stroke: 'var(--bg)', strokeWidth: 2 },
}

/**
 * Progress over time, as two small charts sharing one axis (test number):
 *   1. wpm per test (grey dots) and its 10-test average (the trend line)
 *   2. accuracy, the same way
 * The dots show how much single tests vary; the line shows whether you're actually improving.
 *
 * @param {{ results: import('../../lib/history.js').TestResult[], now: number }} props
 */
export default function ProgressChart({ results, now }) {
  const data = useMemo(() => {
    // Average over the whole history first, so the first plotted points have full windows.
    const avgWpm = movingAverage(results.map((r) => r.wpm), WINDOW)
    const avgAccuracy = movingAverage(results.map((r) => r.accuracy), WINDOW)
    const start = Math.max(0, results.length - MAX_POINTS)
    return results.slice(start).map((r, i) => ({
      n: start + i + 1,
      wpm: r.wpm,
      avgWpm: avgWpm[start + i],
      accuracy: r.accuracy,
      avgAccuracy: avgAccuracy[start + i],
      date: r.date,
      test: testLabel(r),
    }))
  }, [results])

  const first = data[0].n
  const last = data.at(-1).n
  const xDomain = [first - 0.5, last + 0.5]
  const xTicks = testTicks(first, last)

  // Lines don't need a zero baseline (bars do), so fit the axes to the data: that's what
  // makes improvement visible. A little padding keeps the dots off the edges.
  const wpms = data.map((d) => d.wpm)
  const wpmScale = niceScale(Math.max(0, Math.min(...wpms) - 3), Math.max(...wpms) + 3)
  const accuracyScale = niceScale(Math.max(0, Math.min(...data.map((d) => d.accuracy)) - 1), 100)

  return (
    <figure className="flex w-full min-w-0 flex-col gap-1">
      <figcaption
        className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sub"
        style={{ paddingLeft: Y_AXIS_WIDTH }}
      >
        <span className="text-fg">{results.length > MAX_POINTS ? `your last ${MAX_POINTS} tests` : 'every test'}</span>
        <LegendKey dot label="one test" />
        <LegendKey label={`${WINDOW}-test average`} />
      </figcaption>

      <ChartLabel>wpm</ChartLabel>
      <LineChart
        responsive
        accessibilityLayer={false}
        data={data}
        syncId="progress"
        margin={{ top: 6, right: 12, bottom: 8, left: 0 }}
        style={{ width: '100%', height: 220 }}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="n" type="number" domain={xDomain} ticks={xTicks} hide />
        <YAxis
          width={Y_AXIS_WIDTH}
          interval={0}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          domain={wpmScale.domain}
          ticks={wpmScale.ticks}
        />
        <Tooltip content={<ProgressTooltip now={now} />} cursor={{ stroke: 'var(--sub)', strokeWidth: 1 }} isAnimationActive={false} />
        <Line dataKey="wpm" name="wpm" stroke="none" dot={TEST_DOT} activeDot={{ ...TEST_DOT, r: 5 }} />
        <Line dataKey="avgWpm" name="average wpm" {...TREND_LINE} />
      </LineChart>

      <ChartLabel>accuracy</ChartLabel>
      <LineChart
        responsive
        accessibilityLayer={false}
        data={data}
        syncId="progress"
        margin={{ top: 6, right: 12, bottom: 0, left: 0 }}
        style={{ width: '100%', height: 140 }}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="n"
          type="number"
          domain={xDomain}
          ticks={xTicks}
          tick={TICK}
          tickLine={false}
          axisLine={{ stroke: 'var(--line)' }}
          tickFormatter={(n) => `#${n}`}
        />
        <YAxis
          width={Y_AXIS_WIDTH}
          interval={0}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          domain={accuracyScale.domain}
          ticks={accuracyScale.ticks}
          tickFormatter={(v) => `${v}%`}
        />
        {/* The readout lives on the wpm chart; this one only shows the crosshair. */}
        <Tooltip content={() => null} cursor={{ stroke: 'var(--sub)', strokeWidth: 1 }} isAnimationActive={false} />
        <Line dataKey="accuracy" name="accuracy" stroke="none" dot={TEST_DOT} activeDot={{ ...TEST_DOT, r: 5 }} />
        <Line dataKey="avgAccuracy" name="average accuracy" {...TREND_LINE} />
      </LineChart>
    </figure>
  )
}

/** About six ticks whatever the range, starting from the first test shown. */
function testTicks(first, last) {
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find((s) => (last - first) / s <= 6) ?? 1000
  const ticks = []
  for (let t = Math.ceil(first / step) * step; t <= last; t += step) ticks.push(t)
  // Label the first test too, unless a tick already sits right next to it.
  if (ticks.length === 0 || ticks[0] - first >= step / 2) ticks.unshift(first)
  return ticks
}

function ChartLabel({ children }) {
  return (
    <div className="text-xs text-sub" style={{ paddingLeft: Y_AXIS_WIDTH }}>
      {children}
    </div>
  )
}

/** Legend keys mirror the marks: a dot for single tests, a line for the average. */
function LegendKey({ label, dot = false }) {
  return (
    <span className="flex items-center gap-1.5">
      <KeyMark dot={dot} />
      {label}
    </span>
  )
}

function KeyMark({ dot }) {
  return dot ? (
    <span aria-hidden="true" className="size-2 rounded-full bg-muted" />
  ) : (
    <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-main" />
  )
}

/** One readout for both charts at the hovered test. Values lead, labels follow. */
function ProgressTooltip({ active, payload, now }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      {/* Two short header lines rather than one long one: the tooltip has to fit on a phone. */}
      <div className="text-sub">
        test #{point.n} · {point.test}
      </div>
      <div className="mb-1.5 text-sub">{timeAgo(point.date, now)}</div>
      <TooltipRow dot value={Math.floor(point.wpm)} label="wpm" />
      <TooltipRow value={Math.floor(point.avgWpm)} label={`${WINDOW}-test average`} />
      <TooltipRow dot value={`${Math.floor(point.accuracy)}%`} label="accuracy" />
      <TooltipRow value={`${Math.floor(point.avgAccuracy)}%`} label="average accuracy" />
    </div>
  )
}

function TooltipRow({ value, label, dot = false }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-3 justify-center">
        <KeyMark dot={dot} />
      </span>
      <span className="font-semibold tabular-nums text-fg">{value}</span>
      <span className="text-sub">{label}</span>
    </div>
  )
}
