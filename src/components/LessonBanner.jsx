import { GraduationCap } from 'lucide-react'
import { LESSONS, PASS_ACCURACY, PASS_WPM } from '../config/lessons.js'
import Kbd from './Kbd.jsx'

/**
 * Shown above a lesson: where you are in the course, the new keys, and what it takes to pass.
 *
 * @param {{ lesson: number }} props
 */
export default function LessonBanner({ lesson }) {
  const { keys, row, title } = LESSONS[lesson - 1]
  return (
    <div className="focus-fade flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-sub">
      <GraduationCap size={16} className="text-main" aria-hidden="true" />
      <span className="text-fg">
        lesson {lesson}: {row}, {title}
      </span>
      {keys && (
        <span className="flex items-center gap-1.5">
          new keys
          {[...keys].map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </span>
      )}
      <span>
        pass: {PASS_ACCURACY}% accuracy and {PASS_WPM} wpm
      </span>
    </div>
  )
}
