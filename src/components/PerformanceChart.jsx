import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { niceScale } from '../lib/ticks.js'

/** Same width on both charts, so their plot areas (and seconds) line up exactly. */
const Y_AXIS_WIDTH = 40
const TICK = { fill: 'var(--sub)', fontSize: 12 }

/**
 * How the test went, second by second, as two small charts sharing one time axis:
 *   1. wpm and raw wpm so far (cumulative: the last point equals the final result)
 *   2. mistakes made in each second: the error spikes
 *
 * Why not one chart with errors on a second y-axis? Two scales on one plot line up
 * arbitrarily, so they suggest correlations that aren't in the data. Stacked charts with
 * a shared x-axis (and a synced tooltip, via syncId) show the same story honestly.
 *
 * Colours are CSS variables, so the chart re-themes instantly with the rest of the app.
 *
 * @param {{ data: { second: number, wpm: number, raw: number, errors: number }[] }} props
 */
export default function PerformanceChart({ data }) {
  const seconds = data.length
  const xDomain = [0.5, seconds + 0.5] // half a second of padding so the end bars aren't clipped
  const xTicks = secondTicks(seconds)
  const maxErrors = Math.max(1, ...data.map((point) => point.errors))
  // Raw is never below wpm, so its peak sets the top. Clean ticks: 0 · 20 · 40 · 60, not 0 · 7 · 14.
  const wpmScale = niceScale(0, Math.max(...data.map((point) => point.raw)))

  return (
    <figure className="flex w-full min-w-0 flex-col gap-1">
      <figcaption className="flex items-center gap-4 text-xs text-sub" style={{ paddingLeft: Y_AXIS_WIDTH }}>
        <LegendKey color="var(--main)" label="wpm" />
        <LegendKey color="var(--muted)" label="raw" />
        <LegendKey color="var(--error)" label="errors" bar />
      </figcaption>

      <LineChart
        responsive
        accessibilityLayer={false}
        data={data}
        syncId="results"
        margin={{ top: 8, right: 12, bottom: 8, left: 0 }}
        style={{ width: '100%', height: 180 }}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="second" type="number" domain={xDomain} ticks={xTicks} hide />
        <YAxis
          width={Y_AXIS_WIDTH}
          interval={0}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          domain={wpmScale.domain}
          ticks={wpmScale.ticks}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--sub)', strokeWidth: 1 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="raw" name="raw" {...lineStyle('var(--muted)')} />
        <Line type="monotone" dataKey="wpm" name="wpm" {...lineStyle('var(--main)')} />
      </LineChart>

      <BarChart
        responsive
        accessibilityLayer={false}
        data={data}
        syncId="results"
        // Room above, so its top label sits clear of the wpm chart's 0 just above it.
        margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
        style={{ width: '100%', height: 76 }}
      >
        <XAxis
          dataKey="second"
          type="number"
          domain={xDomain}
          ticks={xTicks}
          tick={TICK}
          tickLine={false}
          axisLine={{ stroke: 'var(--line)' }}
          tickFormatter={(s) => `${s}s`}
        />
        <YAxis
          width={Y_AXIS_WIDTH}
          interval={0}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          domain={[0, maxErrors]}
          ticks={[0, maxErrors]}
        />
        {/* The readout lives on the wpm chart; this one only highlights the hovered second. */}
        <Tooltip content={() => null} cursor={{ fill: 'var(--line)' }} isAnimationActive={false} />
        <Bar dataKey="errors" name="errors" fill="var(--error)" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>

      {/* The same numbers as a table: readable without hovering, and by screen readers. */}
      <details className="mt-1 text-xs text-sub" style={{ paddingLeft: Y_AXIS_WIDTH }}>
        <summary className="w-fit cursor-pointer select-none rounded transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main">
          per-second data
        </summary>
        <div className="mt-2 max-h-48 max-w-xs overflow-y-auto">
          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-left">
                <th className="py-1 font-normal">second</th>
                <th className="py-1 font-normal">wpm</th>
                <th className="py-1 font-normal">raw</th>
                <th className="py-1 font-normal">errors</th>
              </tr>
            </thead>
            <tbody className="text-fg">
              {data.map((point) => (
                <tr key={point.second} className="border-t border-line">
                  <td className="py-0.5">{point.second}</td>
                  <td className="py-0.5">{Math.floor(point.wpm)}</td>
                  <td className="py-0.5">{Math.floor(point.raw)}</td>
                  <td className="py-0.5">{point.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}

/** 2px lines with round joins; the hover dot is 8px with a 2px ring in the background colour. */
function lineStyle(color) {
  return {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    dot: false,
    activeDot: { r: 4, fill: color, stroke: 'var(--bg)', strokeWidth: 2 },
  }
}

/** About six ticks whatever the length: 1, 5, 10, 15 for a 15-second test; 1, 10 … 60 for 60. */
function secondTicks(seconds) {
  const step = [1, 2, 5, 10, 15, 20, 30, 60].find((s) => seconds / s <= 6) ?? 120
  const ticks = [1]
  for (let t = step; t <= seconds; t += step) if (t > 1) ticks.push(t)
  return ticks
}

function LegendKey({ color, label, bar = false }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={bar ? 'size-2.5 rounded-[2px]' : 'h-0.5 w-4 rounded-full'} style={{ background: color }} />
      {label}
    </span>
  )
}

/**
 * One readout for every series at the hovered second. Values lead, labels follow.
 * Numbers are floored like the headline figures, so the last second always matches them.
 */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1.5 text-sub">second {point.second}</div>
      <TooltipRow color="var(--main)" value={Math.floor(point.wpm)} label="wpm" />
      <TooltipRow color="var(--muted)" value={Math.floor(point.raw)} label="raw" />
      <TooltipRow color="var(--error)" value={point.errors} label={point.errors === 1 ? 'error' : 'errors'} />
    </div>
  )
}

function TooltipRow({ color, value, label }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: color }} />
      <span className="font-semibold tabular-nums text-fg">{value}</span>
      <span className="text-sub">{label}</span>
    </div>
  )
}
