# embertype

A Monkeytype-style typing trainer: time tests (15 / 30 / 60 s) and word tests (10 / 25 / 50),
live WPM and accuracy, a per-second performance chart, four themes (ember, dark, cyberpunk,
vintage), a **progress dashboard** that remembers every test, and a **practice mode** that
drills the keys you miss most.

**Stack:** React 19 · Tailwind CSS v4 · Recharts 3 · Vite 8 · Vitest

### Using it

Double-click **embertype** on the Desktop. It rebuilds the app, starts it in the background
and opens it at **http://localhost:4173**. Your stats page is **http://localhost:4173/#/stats**,
which you can bookmark. (The shortcut runs `start_hidden.vbs`; `run.cmd` does the same with the
server's output visible.)

### Developing it

```bash
npm install
npm run dev      # http://localhost:5173 (hot reload)
npm test         # unit tests: engine, metrics, keyboard rules, history, settings
npm run lint     # includes the React Hooks / React Compiler rules
npm run build    # production build in dist/
```

The two ports are deliberate. Browsers keep saved data per address, so **4173 holds your real
history** and **5173 is a sandbox**: experiments in development never touch your stats.

Shortcuts: <kbd>tab</kbd> restart · <kbd>ctrl</kbd>+<kbd>backspace</kbd> delete word ·
<kbd>enter</kbd> next test (on the results screen) · <kbd>shift</kbd>+<kbd>tab</kbd> reach the
controls by keyboard.

---

## Architecture

### Why this stack

| Choice | Why |
|---|---|
| **React + Vite** (not Next.js) | A typing test runs entirely in the browser. There's nothing to server-render and no routes, so a plain single-page app is simpler and faster to build. |
| **Tailwind v4, CSS-first** | Themes are CSS variables, and v4's `@theme inline` turns them straight into utilities like `bg-bg` and `text-error`. No JS config file. |
| **Recharts** | Declarative React components, and it accepts `var(--main)` as a colour, so charts re-theme for free. |
| **JavaScript + JSDoc** | Types are documented in comments, so editors still autocomplete and warn, with no build step. |

### File structure

```
embertype/
├── index.html              entry page + a tiny script that applies the saved theme before first paint
├── vite.config.js          Vite + React + Tailwind plugins; preview port 4173; Vitest settings
├── eslint.config.js
├── start_hidden.vbs        what the desktop shortcut runs: build, serve (hidden), open the browser
├── run.cmd                 the same, with the server's output in a window
├── embertype.ico           shortcut icon, made from the ring-of-fire logo
├── public/favicon.svg      ring-of-fire logo
└── src/
    ├── main.jsx            mounts <App/>; loads fonts and CSS
    ├── App.jsx             page layout; remounts <TypingTest> for every new test
    ├── index.css           themes (CSS variables) → Tailwind tokens; base styles; focus mode
    ├── config/
    │   ├── modes.js        time 15/30/60, words 10/25/50, practice 10/25/50, default settings
    │   └── themes.js       theme ids and labels (the colours live in index.css)
    ├── data/
    │   ├── english.js      200 common English words (regular tests)
    │   └── practiceWords.js  ~1,200 words covering every letter (practice drills)
    ├── lib/                plain JavaScript: no React, no DOM, unit-tested
    │   ├── typingEngine.js the state machine: keystrokes in, test state out
    │   ├── metrics.js      wpm, raw, accuracy, per-second timeline, missed keys
    │   ├── keyboard.js     which key means what (type / delete / restart / ignore)
    │   ├── words.js        random word picker
    │   ├── testSetup.js    what a new test contains: words, time limit, practice targets
    │   ├── practice.js     your weakest keys → drill words
    │   ├── history.js      saved results → summaries, personal bests, key miss rates, trends
    │   ├── ticks.js        round, evenly spaced chart axes
    │   ├── testing.js      helpers that turn keystroke scripts into reducer calls
    │   └── *.test.js
    ├── state/
    │   ├── settings.js     SettingsContext, useSettings(), load / save / sanitize
    │   ├── SettingsProvider.jsx   global state #1: preferences
    │   ├── history.js      HistoryContext, useHistory(), load / save / sanitize
    │   └── HistoryProvider.jsx    global state #2: every finished test
    ├── hooks/
    │   ├── useTypingEngine.js     reducer + window keydown listener
    │   ├── useTestTimer.js        timestamp-based countdown / stopwatch
    │   └── useHashRoute.js        #/ ↔ #/stats
    └── components/
        ├── NavBar.jsx  ModeBar.jsx  ThemeSwitcher.jsx
        ├── TypingTest.jsx         one test; saves it and switches to results when it finishes
        ├── PracticeBanner.jsx     "drilling your weakest keys: b r y" above a drill
        ├── LiveStats.jsx          countdown or word count, Caps Lock warning, live wpm/acc
        ├── Words.jsx              one <span> per character, caret, 3-line scrolling
        ├── ResultsDashboard.jsx   final numbers, new-best badge, missed keys (lazy-loaded)
        ├── PerformanceChart.jsx   wpm/raw chart + errors strip, synced tooltip
        ├── stats/StatsPage.jsx    the progress dashboard (lazy-loaded)
        ├── stats/ProgressChart.jsx  wpm and accuracy over time, with a 10-test trend line
        └── Footer.jsx  Kbd.jsx
```

The split that matters most is `lib/` vs everything else. All the rules of typing (what
counts as correct, when a test ends, how WPM is computed) are plain functions with no React
in them. They're easy to read, easy to test, and you could reuse them in a Vue app or a CLI.

### How data flows

```
keydown ─▶ keyToAction() ─▶ dispatch({ type, at: performance.now() }) ─▶ typingReducer ─▶ state
                                                                                          │
           useTestTimer: elapsed = now − startedAt ◀────────── startedAt ──────────────────┤
                                                                                          ▼
                  computeStats() · buildTimeline() · missedKeys()    (pure; nothing stored)
                                                                                          ▼
                                 <Words>   <LiveStats>   <ResultsDashboard>
```

### Where state lives (the "global state" question)

The tempting design is one big global store holding the timer, the words and the metrics.
The better question is *what kind* of state each thing is. Each kind gets the home that fits:

| State | Lives in | Why |
|---|---|---|
| **Settings**: mode, duration, word count, theme | `SettingsProvider` (React Context), saved to localStorage | Truly global: the nav, the test and the theme picker all read it. It changes rarely, so re-rendering consumers on change is fine. |
| **History**: every finished test | `HistoryProvider` (React Context), saved to localStorage | Read by the stats page and the results screen (for the new-best badge). It changes once per *test*, not per keystroke, so Context is still enough. |
| **The test**: words, typed text, status, keystroke log | `useReducer` inside `<TypingTest>` | It changes on *every keystroke*. In Context, every consumer (nav bar included) would re-render on every key. Kept local, only the test re-renders. |
| **Time** | Not stored. The reducer records one timestamp, `startedAt`; `useTestTimer` computes `now − startedAt`. | A `seconds--` counter in `setInterval` drifts, because intervals fire late and background tabs are throttled. A timestamp can't drift. |
| **Metrics**: wpm, raw, accuracy, chart data | Not stored. Pure functions compute them from the reducer state. | Stored derived values go stale and need syncing. Recomputing takes microseconds, and the live display, results and chart can never disagree. |
| **Word list** | A static module (`data/english.js`) | It never changes. Each test's random words are generated once into the reducer's initial state. |
| **Caret position** | Direct style writes in a layout effect | Purely visual. Moving a caret shouldn't cost a React render. |
| **"Is a test running?"** (to fade the nav) | CSS: `body:has([data-test-status="running"])` | Purely visual, so zero JavaScript. |

Two techniques make this work:

- **The keystroke log is the source of truth.** Every keystroke that changes the text is
  appended to `log` with its timestamp. Accuracy, errors, the per-second chart and the
  missed-keys list are all *replays* of that log. Adding a new statistic means writing one more
  pure function, with no new state to keep in sync.
- **A new test is a new mount.** `<TypingTest key={…}>` gets a new key on restart or when a
  setting changes, so React discards the old instance entirely. There's no reset logic to get
  wrong: no stale timers, listeners or scroll offsets.

You'd reach for a store library such as **Zustand** or **Redux Toolkit** when global state grows
much further: accounts, sync between devices, leaderboards. Even then, keystroke-speed state
should stay local.

### The progress dashboard

When a test finishes, `TypingTest` turns it into a compact record (`createResult` in
`lib/history.js`: the scores, the mode, and per-key attempts and misses) and saves it. The
stats page at `#/stats` computes everything from those records:

- **Tiles:** tests taken, time spent typing, your best, and your recent average (last 10 tests)
  with the trend against the tests before.
- **Progress chart:** WPM and accuracy per test (dots) with a 10-test average (line). Single
  tests are noisy; the average shows whether you're really improving.
- **Personal bests** for every mode.
- **Keys to practice, by miss *rate*** (misses ÷ attempts), not raw counts. Otherwise "e" would
  always top the list just for being the most common letter.
- **Recent tests**, expandable to all of them.
- One **filter row** scopes the whole page to a single mode.

Details that keep the data trustworthy:

- **Saved exactly once.** Each test has an id, and `addResult` ignores an id it already has.
  React runs effects twice in development, and the result still isn't duplicated.
- **Accidental starts aren't saved:** a test needs at least one word of correct typing.
- **Two tabs can't overwrite each other.** Each tab listens for the `storage` event and reloads
  the list when another tab saves.
- **Validated on load.** The data is versioned, broken records are dropped one by one, and
  the list is capped at the newest 1,000 results.

### Practice mode

Pick **practice** in the mode bar, or press **practice these keys** on the stats page.

1. **Targets.** `practiceTargets` takes your 5 highest miss rates from your *regular* tests.
2. **Words.** `generatePracticeWords` fills each slot by picking a target key in proportion to
   its miss rate (a key you miss twice as often shows up twice as often), then a random real
   word containing it, from a ~1,200-word list that covers every letter. A weak space bar gets
   short words, which have the most spaces per letter.
3. **Report.** After the drill, each drilled key shows this drill's misses next to your usual
   rate. The counts are shown too, because a few attempts is a small sample.

Drills are training, not tests:

- **They don't count toward your speed.** Drill words are picked to be hard for you, so they
  stay out of "all", personal bests and the trend. They have their own "practice" filter.
- **They don't decide what's weak.** Targets come from regular tests only, so a key leaves the
  list when your real typing improves, not because you drilled it in easy words.
- **Brand new?** With no history yet, practice gives a mixed drill and says how to unlock
  targeted ones.

`lib/testSetup.js` decides each test's words before the engine starts. The engine never knows
whether it's running a test or a drill.

### The desktop shortcut

`start_hidden.vbs` (the shortcut's target) rebuilds the app, so code changes always show up,
then starts `vite preview` with no window unless it's already running, waits until it's
listening, and opens your browser. Measured: **2.4 s** from double-click to browser on a cold
start, and about 2 s once the server is already running (it stays up in the background); the
rebuild is 1.2 s of that. To stop the server, end "Node.js JavaScript Runtime" in Task Manager,
or restart the PC.

The launcher asks `netstat` whether the port is in use instead of sending an HTTP request.
On Windows, a request to a port nobody is listening on takes about 4 s to fail, because
Windows retries refused connections to localhost. Switching to netstat cut the cold start
from 6.2 s to 2.4 s.

`vite.config.js` pins the preview server to port 4173 with `strictPort`. If 4173 were busy and
Vite quietly used 4174, your history would seem to vanish, since saved data belongs to the
exact address.

### The typing engine

`lib/typingEngine.js` is a reducer, which is a natural fit for a state machine:

```
idle ──first keystroke──▶ running ──last character typed / time up──▶ finished
```

- It's **pure**: no clock reads. Each action carries its own timestamp (`at`), so tests can
  replay exact keystroke timelines.
- The **first keystroke starts the clock** (`startedAt = at`).
- **Typing past the end of the text** finishes the test, which is how words mode ends.
- **The time limit is enforced in the reducer too.** A key that arrives after the deadline is
  dropped, and the test ends at exactly `startedAt + limit`, even if the timer's callback was late.
- **Backspace** removes one character. **Ctrl+Backspace** removes back to the start of the
  word, using the *target's* word boundaries, so a mistyped space can't confuse it.

### The timer

`useTestTimer` never counts anything. It re-renders every 100 ms while a test runs, computes
`elapsed = now − startedAt`, and calls `onTimeUp` when the countdown reaches zero. It starts
by itself (the first keystroke flips `status` to `running`) and stops by itself (`finished`
clears the interval). A late or throttled tick only delays a screen update; it can't make
the time wrong.

### The formulas

| Metric | Formula | What it means |
|---|---|---|
| **WPM** | (correct characters ÷ 5) ÷ minutes | Characters that are correct *right now*. A mistake you fixed counts; an uncorrected one doesn't. |
| **Raw WPM** | (every character keystroke ÷ 5) ÷ minutes | Pure finger speed, mistakes and deleted characters included. |
| **Accuracy** | correct keystrokes ÷ total keystrokes × 100 | Measured on keystrokes, so fixing a mistake doesn't erase it. |
| **Errors** | wrong keystrokes | Fixed or not. |

A "word" is 5 characters including spaces, the universal typing-test convention. Worked
example (from `metrics.test.js`): the target is "the cat". Over 6 seconds you type
`t e✗ h✗ ⌫ ⌫ h e`. That gives **WPM 6** (3 correct characters), **raw 10** (5 keystrokes) and
**accuracy 60%** (3 of 5 keystrokes right).

The chart shows WPM and raw *cumulatively* (so its last point equals your final result) and
errors *per second*. It's drawn as two stacked charts sharing one time axis, not one chart
with a second y-axis: two scales on one plot line up arbitrarily and suggest correlations
that aren't there.

### Theming

1. Each theme is a block of CSS variables: `[data-theme="cyberpunk"] { --bg: …; --main: …; }`.
2. `@theme inline { --color-bg: var(--bg); … }` turns them into Tailwind utilities.
3. Switching theme sets one attribute, `<html data-theme="…">`. No re-render, no rebuild.

Themes carry more than colours: each has its own font (JetBrains Mono, Roboto Mono, Share
Tech Mono, Special Elite), and cyberpunk adds a neon glow through a `--glow` variable. Because
of `inline`, any element can re-theme its own subtree; the theme picker uses that to draw each
option in its own colours. A small inline script in `index.html` applies the saved theme
before React loads, so there's no flash of the wrong theme.

To add a theme: copy a block in `src/index.css`, change the values, and add the id to
`src/config/themes.js`.

**The colours are measured, not eyeballed.** They were checked with a WCAG-contrast and
colour-blindness (CVD) validator:

| Theme | Untyped text contrast | Correct vs error, colour-blind ΔE (≥ 8 target) |
|---|---|---|
| ember | 4.9 : 1 | 11.9 |
| dark | 4.8 : 1 | 9.0 |
| cyberpunk | 4.7 : 1 | 21.1 |
| vintage | 4.6 : 1 | 9.7 |

Wrong characters are also underlined, so errors never rely on colour alone. The selected mode
option gets a tinted pill for the same reason.

### Keyboard handling

All rules live in `lib/keyboard.js` (unit-tested):

- **Printable keys** type (`e.key.length === 1`); held-down auto-repeat is ignored.
- **Space** and **'** / **/** call `preventDefault()`, so the page doesn't scroll and Firefox's
  quick-find doesn't open.
- **Ctrl / Cmd / Alt shortcuts** pass through to the browser. **AltGr** characters still type
  (Windows reports AltGr as Ctrl+Alt).
- **Tab** restarts, unless a button has focus or Shift is held. That keeps the controls
  reachable without a mouse.
- **Nav buttons don't take focus on click** (`onMouseDown → preventDefault`). Otherwise your
  next Space would "press" the button you just clicked instead of typing a space.

### Rendering performance

- Every character is a `<span>`, grouped into one `memo`-ised `<Word>` per word. A keystroke
  re-renders only the word it touches, not the ~300 on screen.
- The caret and line-scroll are written straight to the DOM in a layout effect: no extra renders.
- Recharts is code-split. The typing screen ships **83 kB** of gzipped JavaScript. The chart
  code (**101 kB**, shared by the results screen and the stats page) downloads in the background
  on your first keystroke, or when you open the stats page.

---

## Known limitations and next steps

- Physical keyboards only: on-screen keyboards and IME composition (e.g. Japanese input) need
  a hidden `<input>` instead of a window keydown listener.
- One word list (English 200), with no punctuation or numbers yet.
- History lives in one browser's storage. Use the desktop shortcut (your normal browser) as its
  home; clearing site data erases it. **Export / import** would make it portable.
- Drills could go further: highlighting the target letters as you type, or tracking each key's
  miss rate over time to show a drill actually paying off in later tests.
