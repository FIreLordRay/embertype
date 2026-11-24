# embertype

A Monkeytype-style typing trainer that also teaches you to touch type.

**Try it: https://firelordray.github.io/embertype/** (your history stays in your own browser;
nothing is uploaded anywhere).

- **Tests:** time (15 / 30 / 60 s), words (10 / 25 / 50) and quotes (short / medium / long),
  with optional **punctuation**, **numbers** and **tech** words (500 terms from code, the web,
  data, git and IT). Live WPM and accuracy, then a results screen
  with a per-second chart.
- **Learn:** a 15-lesson touch-typing course, one or two keys at a time, with a **finger
  guide**: a 3D keyboard under the words that lights the next key and the finger to use, and
  presses each key you type (red when it's the wrong one).
- **Train:** **practice drills** built from the keys you miss most, and **race your best**: a
  ghost caret that moves at your personal-best speed.
- **Progress:** a dashboard with your streak, a daily goal, a practice calendar, a per-key
  **heatmap**, personal bests and your speed over time. **Export / import** moves it between
  browsers.
- Four themes (ember, dark, cyberpunk, vintage), optional key **sounds**, works offline.

**Stack:** React 19 · Tailwind CSS v4 · Recharts 3 · Vite 8 · Vitest

### Using it

Double-click **embertype** on the Desktop. It rebuilds the app, starts it in the background
and opens it at **http://localhost:4173**. Bookmark **#/stats** (your progress) and **#/learn**
(the course). The shortcut runs `start_hidden.vbs`; `run.cmd` does the same with the server's
output visible.

Shortcuts: <kbd>tab</kbd> restart · <kbd>ctrl</kbd>+<kbd>backspace</kbd> (<kbd>⌥</kbd>+<kbd>backspace</kbd>
on a Mac) delete word · <kbd>enter</kbd> next test (on the results screen) ·
<kbd>shift</kbd>+<kbd>tab</kbd> reach the controls by keyboard.

### Developing it

```bash
npm install
npm run dev      # http://localhost:5173 (hot reload)
npm test         # 172 unit tests: engine, metrics, keyboard, history and its storage, lessons, streaks …
npm run lint     # includes the React Hooks / React Compiler rules
npm run build    # production build in dist/
```

The two ports are deliberate. Browsers keep saved data per address, so **4173 holds your real
history** and **5173 is a sandbox**: experiments in development never touch your stats.

### Publishing it

`.github/workflows/deploy.yml` publishes the site to **GitHub Pages**
(https://firelordray.github.io/embertype/) on every push to `main`: it runs the tests and lint
first, and only deploys a build that passes both. The build uses relative paths
(`base: './'` in `vite.config.js`), so the same files work at `http://localhost:4173/` and
under `/embertype/` on Pages. The live site and your local app keep separate histories
(saved data belongs to the address); export from one and import into the other to move it.

---

## Architecture

### Why this stack

| Choice | Why |
|---|---|
| **React + Vite** (not Next.js) | A typing test runs entirely in the browser. There's nothing to server-render, so a plain single-page app is simpler and faster to build. |
| **Tailwind v4, CSS-first** | Themes are CSS variables, and v4's `@theme inline` turns them straight into utilities like `bg-bg` and `text-error`. No JS config file. |
| **Recharts** | Declarative React components, and it accepts `var(--main)` as a colour, so charts re-theme for free. |
| **JavaScript + JSDoc** | Types are documented in comments, so editors still autocomplete and warn, with no build step. |

### File structure

```
embertype/
├── index.html              entry page + a tiny script that applies the saved theme before first paint
├── vite.config.js          relative base path; preview port 4173; Vitest settings (incl. the test time zone)
├── eslint.config.js
├── .github/workflows/deploy.yml   test, lint, build, publish to GitHub Pages
├── start_hidden.vbs        what the desktop shortcut runs: build, serve (hidden), open the browser
├── run.cmd                 the same, with the server's output in a window
├── embertype.ico           shortcut icon, made from the ring-of-fire logo
├── public/favicon.svg      ring-of-fire logo
└── src/
    ├── main.jsx            mounts <App/>; loads fonts and CSS
    ├── App.jsx             page layout and routes; remounts <TypingTest> for every new test
    ├── index.css           themes (CSS variables) → Tailwind tokens; keycaps; focus mode
    ├── config/
    │   ├── modes.js        every mode and its options, default settings, daily goals
    │   ├── lessons.js      the 15 lessons: keys, titles, pass marks
    │   └── themes.js       theme ids and labels (the colours live in index.css)
    ├── data/
    │   ├── english.js      200 common English words (regular tests)
    │   ├── practiceWords.js  ~1,200 words covering every letter (drills and lessons)
    │   └── quotes.js       56 public-domain quotes
    ├── lib/                plain JavaScript: no React, no DOM, unit-tested
    │   ├── typingEngine.js the state machine: keystrokes in, test state out
    │   ├── metrics.js      wpm, raw, accuracy, per-second timeline, missed keys
    │   ├── keyboard.js     which key means what (type / delete / restart / leave alone)
    │   ├── qwerty.js       the US layout: which finger types each character
    │   ├── words.js · decorate.js · quotes.js · lessons.js · practice.js
    │   │                   where a test's words come from
    │   ├── testSetup.js    what a new test contains: words, time limit, targets, quote, pace
    │   ├── history.js      saved results → summaries, bests, key miss rates, trends; trimming
    │   ├── streak.js       daily totals, streaks, the calendar grid
    │   ├── sound.js        key clicks, synthesised with Web Audio
    │   ├── ticks.js        round, evenly spaced chart axes
    │   └── *.test.js
    ├── state/
    │   ├── settings.js / SettingsProvider.jsx   preferences: a small store + Context
    │   ├── history.js / HistoryProvider.jsx     every finished test: a small store + Context
    │   └── announcer.js    screen-reader announcements
    ├── hooks/              useTypingEngine, useTestTimer, useHashRoute, useNow, usePopover
    └── components/
        ├── TypingTest.jsx         one test; saves it and switches to results when it finishes
        ├── Words.jsx              one <span> per character, caret, ghost caret, 3-line scrolling
        ├── Keyboard.jsx · FingerGuide.jsx   the 3D keyboard and the coach built on it
        ├── ResultsDashboard.jsx · PerformanceChart.jsx   the results screen (lazy-loaded)
        ├── stats/                 the progress dashboard (lazy-loaded)
        ├── learn/LessonsPage.jsx  the course page (lazy-loaded)
        └── NavBar, ModeBar, SettingsMenu, ThemeSwitcher, LiveStats, banners, notices, Kbd …
```

The split that matters most is `lib/` vs everything else. All the rules of typing (what
counts as correct, when a test ends, how WPM is computed) are plain functions with no React
in them. They're easy to read, easy to test, and you could reuse them in a Vue app or a CLI.

### How data flows

```
keydown ─▶ keyToAction() ─▶ dispatch({ type, at: e.timeStamp }) ─▶ typingReducer ─▶ state
                                                                                     │
           useTestTimer: elapsed = now − startedAt ◀────────── startedAt ─────────────┤
                                                                                     ▼
                  computeStats() · buildTimeline() · missedKeys()    (pure; nothing stored)
                                                                                     ▼
                         <Words>   <LiveStats>   <FingerGuide>   <ResultsDashboard>
```

Keystrokes are timed by the event's own timestamp (the same clock as `performance.now()`, with
a fallback), not by when the handler gets to run: a slow frame can't stretch a keystroke.

### Where state lives (the "global state" question)

The tempting design is one big global store holding the timer, the words and the metrics.
The better question is *what kind* of state each thing is. Each kind gets the home that fits:

| State | Lives in | Why |
|---|---|---|
| **Settings**: mode, lengths, extras, theme, typing aids, daily goal | A small external store (`createSettingsStore`) read with `useSyncExternalStore`, handed out by Context | Truly global and rarely changing. Saved the moment it changes, and kept in sync between open tabs. |
| **History**: every finished test | Another small store (`createHistoryStore`), same pattern | Saving has to start from what's in localStorage (another tab may have written since), not from React state; see below. |
| **The test**: words, typed text, status, keystroke log | `useReducer` inside `<TypingTest>` | It changes on *every keystroke*. In Context, every consumer (nav bar included) would re-render on every key. Kept local, only the test re-renders. |
| **Time** | Not stored. The reducer records one timestamp, `startedAt`; `useTestTimer` computes `now − startedAt`. | A `seconds--` counter in `setInterval` drifts, because intervals fire late and background tabs are throttled. A timestamp can't drift. |
| **Metrics**: wpm, raw, accuracy, chart data | Not stored. Pure functions compute them from the reducer state. | Stored derived values go stale and need syncing. Recomputing takes microseconds, and the live display, results and chart can never disagree. |
| **Caret position** | Direct style writes in a layout effect | Purely visual. Moving a caret shouldn't cost a React render. |
| **"Is a test running?"** (to fade the nav) | CSS: `body:has([data-test-status="running"])` | Purely visual, so zero JavaScript. |

Two techniques make this work:

- **The keystroke log is the source of truth.** Every keystroke that changes the text is
  appended to `log` with its timestamp. Accuracy, errors, the per-second chart, the
  missed-keys list and the finger guide's key presses are all *replays* of that log. Adding a
  statistic means writing one more pure function, with no new state to keep in sync.
- **A new test is a new mount.** `<TypingTest key={…}>` gets a new key on restart or when a
  setting changes, so React discards the old instance entirely. There's no reset logic to get
  wrong: no stale timers, listeners or scroll offsets.

### Keeping your history safe

Your history is the one thing in the app you can't get back, so `createHistoryStore`
(`src/state/history.js`) follows three rules, each with unit tests against a fake localStorage:

1. **Opening the app only reads.** Nothing is written until something actually changes.
2. **Every change starts from what's saved right now**, not from this tab's copy, so a test
   saved in another open tab is never overwritten. Other tabs follow along through the
   `storage` event, and never write back what they read.
3. **Saved data is never thrown away silently.** Data saved by a newer version of embertype is
   left alone (the app says so and keeps new tests in memory until you reload). Data that
   can't be fully read is copied to `embertype:history-backup` before it's written over.

Space is managed, not just capped. A saved test is about 450 characters (700 with punctuation
and numbers), and per-key counts are most of that. embertype keeps **3,000 tests**, the newest
1,000 with per-key counts: about 0.9 million characters. Browsers allow each site 5 MiB, which
is 2.6 million characters even at 2 bytes each. When it's full the oldest tests go first, but **never a personal
best, a lesson pass, or the last test of a day you practiced**, so bests, the course and your
streak survive. Tests are matched by id, so a result is saved exactly once and importing the
same file twice adds nothing.

### The progress dashboard

When a test finishes, `TypingTest` turns it into a compact record (`createResult` in
`lib/history.js`: the scores, the mode and extras, and per-key attempts and misses) and saves
it. The stats page at `#/stats` computes everything from those records:

- **Consistency:** today's typing against your daily goal, your streak and best streak, and a
  calendar of the last 18 weeks shaded by how much of the goal you met. Every kind of practice
  counts here, drills and lessons included.
- **Tiles:** tests taken, time spent typing, your best, and your recent average (last 10 tests)
  with the trend against the tests before.
- **Progress chart:** WPM and accuracy per test (dots) with a 10-test average (line).
- **Personal bests** for every test. Punctuation and numbers make a different test, so
  "time 30 + punctuation" has its own row: a run with punctuation never has to beat a plain one.
- **Keys to practice and the heatmap**, by miss *rate* (misses ÷ attempts), not raw counts.
  Otherwise "e" would always top the list just for being the most common letter. The heatmap's
  numbers are also in a table under it.
- **Recent tests**, expandable to all of them, and **export / import / clear**.
- One **filter row** scopes the page to a single mode, practice drills or lessons.

### Learning, training and the rest

- **Lessons** (`lib/lessons.js`) introduce one or two keys at a time, home row first. Early
  lessons know too few letters for real words (measured: lessons 1–3 have none), so they use
  classic drills like "fjf"; later ones use real words, 70% containing the new keys. A lesson
  passes at 95% accuracy and 15 wpm. Progress is worked out from your results, never stored
  separately.
- **Practice drills** (`lib/practice.js`) take your 5 highest miss rates from *regular* tests
  and fill each word slot in proportion to them. Drills and lessons stay out of "all", personal
  bests and the trend: their words are picked to be hard or limited, so they aren't comparable.
- **Race your best** shows a ghost caret moving at your best speed for exactly this test
  (same mode, length and extras).
- **Punctuation and numbers** (`lib/decorate.js`) capitalise sentences, add commas, quotes,
  brackets and dashes, and swap in numbers, while a words test keeps its exact length.
- **Sounds** are synthesised with Web Audio (a click, and a thud for a mistake): no audio files.

### The keycaps

The on-screen keyboards, the key hints and the main buttons are 3D keycaps (`.keycap` in
`index.css`), adapted from [a keycap by 20essentials on Uiverse.io](https://uiverse.io)
(MIT License). The original is one fixed 80 px dark key; here every size is a fraction of the
key's height (`--k`) and the shading is translucent black and white over the key's own colour,
so one rule serves a 20 px hint and a 50 px key, in every theme, light or dark. On a button it
presses down when clicked; the finger guide plays the same press for every key you type.
With reduced motion turned on, keys don't move.

### The desktop shortcut

`start_hidden.vbs` (the shortcut's target) rebuilds the app (about a second), starts `vite
preview` with no window unless it's already running, waits until it's listening, and opens
your browser. The server stays up in the background and serves each new build straight from
disk. To stop it, end "Node.js JavaScript Runtime" in Task Manager, or restart the PC.

- **Is the server up?** It asks Windows' TCP table through WMI: about 0.1 s and the same in
  every Windows language (`netstat` prints "LISTENING" only in English). Not an HTTP request:
  on Windows, one to a port nobody is listening on takes about 4 s to fail.
- **Is it embertype?** Once something is listening, a quick request checks the page title, so
  another program on port 4173 gets a clear message instead of opening in your browser.
- **Where's Node?** The standard install folder first, then whatever `where node` finds (nvm,
  Volta, Scoop, fnm …). A server that never starts gets a message, not silence.

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
- **Backspace** removes one character. **Ctrl+Backspace** (Option+Backspace on a Mac) removes
  back to the start of the word, using the *target's* word boundaries.

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

The results chart shows WPM and raw *cumulatively* (so its last point equals your final result)
and errors *per second*, as two stacked charts sharing one time axis rather than one chart
with a second y-axis: two scales on one plot line up arbitrarily and suggest correlations
that aren't there.

### Theming

1. Each theme is a block of CSS variables: `[data-theme="cyberpunk"] { --bg: …; --main: …; }`.
2. `@theme inline { --color-bg: var(--bg); … }` turns them into Tailwind utilities.
3. Switching theme sets one attribute, `<html data-theme="…">`. No re-render, no rebuild.

Themes carry more than colours: each has its own font (JetBrains Mono, Roboto Mono, Share
Tech Mono, Special Elite), and cyberpunk adds a neon glow through a `--glow` variable. Because
of `inline`, any element can re-theme its own subtree; the theme picker uses that to preview
each option in its own colours. A small inline script in `index.html` applies the saved theme
before React loads, so there's no flash of the wrong theme.

**The colours are measured, not eyeballed.** They were checked with a WCAG-contrast and
colour-blindness (CVD) validator:

| Theme | Untyped text contrast | Correct vs error, colour-blind ΔE (≥ 8 target) |
|---|---|---|
| ember | 4.9 : 1 | 11.9 |
| dark | 4.8 : 1 | 9.0 |
| cyberpunk | 4.7 : 1 | 21.1 |
| vintage | 4.6 : 1 | 9.7 |

Wrong characters are also underlined, so errors never rely on colour alone.

### Keyboard handling and accessibility

All key rules live in `lib/keyboard.js` (unit-tested):

- **Printable keys** type; held-down auto-repeat is ignored. **Ctrl / Cmd / Alt shortcuts**
  pass through to the browser, and **AltGr** characters still type.
- **Only keys aimed at the page drive the test.** When any control has focus (a button, a link,
  a `<summary>`), Tab, Enter and Space are that control's. On the results screen only Tab and
  Enter are the app's, so Space scrolls and Firefox's quick-find works as usual.
- **Focus is never stranded.** Menus put focus back on their button when they close, so the
  next Tab doesn't land on the page and restart a test. Nav buttons don't take focus on click,
  so your next Space types instead of pressing them.
- **Screen readers** hear the result when a test ends ("test complete: 72 wpm, 96% accuracy,
  new personal best …") through one always-present live region. The charts and the heatmap
  have tables with the same numbers.

### Rendering performance

- Every character is a `<span>`, grouped into one `memo`-ised `<Word>` per word. A keystroke
  re-renders only the word it touches, not the ~300 on screen.
- The caret and line-scroll are written straight to the DOM in a layout effect: no extra renders.
- Code-split: the typing screen ships **95 kB** of gzipped JavaScript. The chart code
  (**101 kB**, shared by the results screen and the stats page) downloads in the background on
  your first keystroke, or when you open the stats page. With a full 3,000-test history the
  stats page loads in about a quarter of a second.
- If the app is redeployed while a tab is open, a page loaded on demand can't find its old
  file. Instead of a blank screen you get "embertype was updated" and a reload button.

---

## Known limitations and next steps

- Physical keyboards only: on-screen keyboards and IME composition (e.g. Japanese input) need
  a hidden `<input>` instead of a window keydown listener. The same change would let screen
  readers in browse mode (NVDA, JAWS) pass letters through to the test.
- Drills can't target q, x or z: regular tests almost never contain them, so they never reach
  the 20 attempts a key needs to be judged. Lessons 10, 13 and 14 drill them instead.
- History lives in one browser's storage. Export it now and then: clearing site data erases it.
- English only, one word list.
