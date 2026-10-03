import { lazy, Suspense, useCallback, useState } from 'react'
import { modeAmount } from './config/modes.js'
import Footer from './components/Footer.jsx'
import NavBar from './components/NavBar.jsx'
import TypingTest from './components/TypingTest.jsx'
import { useHashRoute } from './hooks/useHashRoute.js'
import { HistoryProvider } from './state/HistoryProvider.jsx'
import { SettingsProvider } from './state/SettingsProvider.jsx'
import { useSettings } from './state/settings.js'

// The stats page pulls in Recharts: load it only when someone opens it.
const StatsPage = lazy(() => import('./components/stats/StatsPage.jsx'))

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
  const amount = modeAmount(settings) // seconds in time mode, a word count otherwise

  // Bumping this remounts <TypingTest>: a brand-new test with completely fresh state.
  const [testNumber, setTestNumber] = useState(0)
  const restart = useCallback(() => setTestNumber((n) => n + 1), [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-10 px-4 py-6 sm:px-8 sm:py-8">
      <NavBar route={route} />
      <main className="flex flex-1 flex-col justify-center pb-10">
        {route === 'stats' ? (
          <Suspense fallback={null}>
            <StatsPage />
          </Suspense>
        ) : (
          // The key ties a test to its settings: change the mode or its length → new test.
          <TypingTest key={`${mode}-${amount}-${testNumber}`} mode={mode} amount={amount} onRestart={restart} />
        )}
      </main>
      <Footer />
    </div>
  )
}
