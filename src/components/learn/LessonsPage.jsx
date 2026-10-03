import { CircleCheck, GraduationCap } from 'lucide-react'
import { useMemo } from 'react'
import { LESSONS, PASS_ACCURACY, PASS_WPM } from '../../config/lessons.js'
import { lessonProgress, nextLessonNumber } from '../../lib/lessons.js'
import { DECORATIVE_KEYS, HOME_KEYS } from '../../lib/qwerty.js'
import { useHistory } from '../../state/history.js'
import { useSettings } from '../../state/settings.js'
import Kbd from '../Kbd.jsx'
import Keyboard from '../Keyboard.jsx'

/**
 * The course page: how touch typing works, your progress, and every lesson. Progress is
 * worked out from your saved lesson results, so there's nothing separate to keep in sync.
 */
export default function LessonsPage() {
  const { results } = useHistory()
  const { update } = useSettings()
  const progress = useMemo(() => lessonProgress(results), [results])
  const next = nextLessonNumber(progress)
  const passed = progress.filter((entry) => entry.passed).length
  const start = (lesson) => update({ mode: 'lesson', lesson })

  return (
    <section aria-labelledby="learn-heading" className="flex animate-fade-in flex-col gap-10 motion-reduce:animate-none">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div className="flex flex-col gap-4">
          <h2 id="learn-heading" className="text-2xl text-fg">
            learn to touch type
          </h2>
          <p className="text-sub">
            Touch typing means typing without looking at the keys. Each finger looks after its own keys, so once your
            hands learn where everything is, speed follows on its own.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-sub">
            <li>
              <span className="text-fg">Home row.</span> Rest your fingers on <Kbd>a</Kbd> <Kbd>s</Kbd> <Kbd>d</Kbd>{' '}
              <Kbd>f</Kbd> and <Kbd>j</Kbd> <Kbd>k</Kbd> <Kbd>l</Kbd> <Kbd>;</Kbd>. The bumps on F and J let you find
              them without looking.
            </li>
            <li>
              <span className="text-fg">Don&apos;t look down.</span> The finger guide under the words shows which
              finger presses the next key.
            </li>
            <li>
              <span className="text-fg">Accuracy first.</span> Each lesson needs {PASS_ACCURACY}% accuracy and{' '}
              {PASS_WPM} wpm to pass. Slow and right beats fast and wrong.
            </li>
          </ul>
        </div>
        <div aria-hidden="true">
          <Keyboard keyProps={homeRowKey} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        <div>
          <h3 className="text-lg text-fg">the course</h3>
          <p className="text-sm text-sub">
            {passed} of {LESSONS.length} lessons passed
          </p>
        </div>
        <a
          href="#/"
          onClick={() => start(next)}
          className="flex items-center gap-2 rounded-lg bg-main px-5 py-2.5 text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-main"
        >
          <GraduationCap size={18} aria-hidden="true" />
          {passed === 0 ? 'start lesson 1' : `continue: lesson ${next}`}
        </a>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LESSONS.map((lesson, i) => (
          <LessonCard key={i} number={i + 1} lesson={lesson} entry={progress[i]} isNext={i + 1 === next} onStart={start} />
        ))}
      </ol>
    </section>
  )
}

/** The home-row keys lit up, F and J brightest (they have the bumps). */
function homeRowKey(id) {
  if (id === 'f' || id === 'j') return { className: 'bg-main text-bg' }
  if (HOME_KEYS.includes(id)) return { className: 'bg-main/20 text-fg' }
  if (DECORATIVE_KEYS.includes(id) || id.startsWith('shift')) return { className: 'bg-surface/50 text-sub/60' }
  return { className: 'bg-surface text-sub' }
}

function LessonCard({ number, lesson, entry, isNext, onStart }) {
  return (
    <li>
      <a
        href="#/"
        onClick={() => onStart(number)}
        className={`flex h-full flex-col gap-2 rounded-xl border bg-surface p-4 transition-colors hover:border-main focus-visible:outline-2 focus-visible:outline-main ${
          isNext ? 'border-main' : 'border-line'
        }`}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-sub">lesson {number}</span>
          {entry.passed ? (
            <span className="flex items-center gap-1 text-correct">
              <CircleCheck size={15} aria-hidden="true" /> passed
            </span>
          ) : isNext ? (
            <span className="text-main">up next</span>
          ) : null}
        </div>
        <div className="text-fg">
          {lesson.row}: {lesson.title}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {lesson.keys ? [...lesson.keys].map((key) => <Kbd key={key}>{key}</Kbd>) : <Kbd>a–z</Kbd>}
        </div>
        {entry.best && (
          <div className="mt-auto pt-1 text-xs text-sub">
            best {Math.floor(entry.best.wpm)} wpm · {Math.floor(entry.best.accuracy)}% · {entry.attempts}{' '}
            {entry.attempts === 1 ? 'try' : 'tries'}
          </div>
        )}
      </a>
    </li>
  )
}
