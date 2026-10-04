import { lazy, Suspense, useCallback, useState } from 'react'
import { EXTRAS_MODES, modeAmount } from './config/modes.js'
import Announcer from './components/Announcer.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Footer from './components/Footer.jsx'
import ModeBar from './components/ModeBar.jsx'
import NavBar from './components/NavBar.jsx'
import StorageNotice from './components/StorageNotice.jsx'
import TypingTest from './components/TypingTest.jsx'
import { useHashRoute } from './hooks/useHashRoute.js'
import { HistoryProvider } from './state/HistoryProvider.jsx'
import { SettingsProvider } from './state/SettingsProvider.jsx'
import { useSettings } from './state/settings.js'

// These pages pull in charts or the course: load them only when someone opens them.
const StatsPage = lazy(() => import('./components/stats/StatsPage.jsx'))
const LessonsPage = lazy(() => import('./components/learn/LessonsPage.jsx'))

export default function App() {
  return (
    <SettingsProvider>
      <HistoryProvider>
        <Layout />
      </HistoryProvider>
    </SettingsProvider>
  )
}

function Layout() {
  const route = useHashRoute()
  const settings = useSettings()
  const { mode } = settings
  const amount = modeAmount(settings) // seconds, a word count, a quote length or a lesson number
  // Punctuation and numbers only exist for time and words tests.
  const extras = EXTRAS_MODES.includes(mode) ? { punctuation: settings.punctuation, numbers: settings.numbers } : {}

  // Bumping this remounts <TypingTest>: a brand-new test with completely fresh state.
  const [testNumber, setTestNumber] = useState(0)
  const restart = useCallback(() => setTestNumber((n) => n + 1), [])
  // Ties a test to everything that decides its words: change any of them → new test.
  const testKey = `${mode}-${amount}-${Boolean(extras.punctuation)}-${Boolean(extras.numbers)}-${testNumber}`

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8">
      <NavBar route={route} />
      <StorageNotice />
      {route === 'type' && <ModeBar className="focus-fade" />}
      <main className="flex flex-1 flex-col justify-center pb-10">
        {/* Keyed by page, and by test on the typing page: going elsewhere, or starting a new
            test (the mode bar stays usable), clears an error shown here. */}
        <ErrorBoundary key={route === 'type' ? testKey : route}>
          {route === 'stats' && (
            <Suspense fallback={null}>
              <StatsPage />
            </Suspense>
          )}
          {route === 'learn' && (
            <Suspense fallback={null}>
              <LessonsPage />
            </Suspense>
          )}
          {route === 'type' && <TypingTest key={testKey} mode={mode} amount={amount} extras={extras} onRestart={restart} />}
        </ErrorBoundary>
      </main>
      <Footer />
      <Announcer />
    </div>
  )
}
