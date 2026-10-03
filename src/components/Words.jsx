import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react'

/** How each character looks, by its state. Correct = green, incorrect = red (per theme). */
const CHAR_CLASS = {
  pending: 'text-sub',
  active: 'rounded-[0.12em] bg-caret/15 text-fg', // the character you're about to type
  correct: 'text-correct glow',
  // The underline is a second cue besides colour, for red-green colour-blind readers.
  incorrect: 'text-error glow underline decoration-2 underline-offset-[0.22em]',
}

/**
 * The text to type. Every character is its own <span>, coloured by comparing it with
 * what was typed at that position.
 *
 *  - Characters sit in one inline-block box per word, so lines only break between words.
 *  - Only three lines show. When the caret reaches the third, the text slides up a line.
 *  - The caret is one absolutely-positioned bar that glides to the active character.
 *  - The ghost caret (race your best) glides to where your personal best would be by now.
 *
 * @param {{ target: string, typed: string, status: import('../lib/typingEngine.js').Status,
 *           ghostIndex?: number | null }} props
 */
function Words({ target, typed, status, ghostIndex = null }) {
  const words = useMemo(() => splitWords(target), [target])
  const textRef = useRef(null)
  const caretRef = useRef(null)
  const ghostRef = useRef(null)

  // After every render (each keystroke, and each move of the ghost), place both carets and
  // scroll the lines. These are direct style writes rather than React state: moving a caret
  // shouldn't cost a re-render.
  useLayoutEffect(() => {
    placeCaret(textRef.current, caretRef.current)
    placeGhost(textRef.current, ghostRef.current, words, ghostIndex)
  })

  // Characters can also move without a keystroke: a window resize, a web font finishing
  // loading, or a theme switch (themes change the font).
  useEffect(() => {
    const update = () => placeCaret(textRef.current, caretRef.current)
    const resize = new ResizeObserver(update)
    resize.observe(textRef.current)
    const themeChange = new MutationObserver(update)
    themeChange.observe(document.documentElement, { attributeFilter: ['data-theme'] })
    document.fonts.addEventListener('loadingdone', update)
    return () => {
      resize.disconnect()
      themeChange.disconnect()
      document.fonts.removeEventListener('loadingdone', update)
    }
  }, [])

  const cursor = typed.length
  return (
    // 3 visible lines: height = 3 × line-height (1.6em). Font size sets the scale.
    <div className="relative h-[4.8em] select-none overflow-hidden text-[1.375rem] leading-[1.6] sm:text-[1.75rem]">
      <div ref={textRef} className="relative transition-transform duration-200 ease-out motion-reduce:transition-none">
        <div
          ref={ghostRef}
          aria-hidden="true"
          title="your personal best's pace"
          className="pointer-events-none absolute left-0 top-0 -ml-[0.05em] w-[0.1em] rounded-full bg-sub opacity-0 transition-[transform,opacity] duration-200 ease-linear motion-reduce:transition-none"
        />
        <div
          ref={caretRef}
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 -ml-[0.05em] w-[0.1em] rounded-full bg-caret transition-transform duration-100 ease-out motion-reduce:transition-none ${
            status === 'idle' ? 'animate-blink motion-reduce:animate-none' : ''
          }`}
        />
        {words.map(({ text, start }) => (
          <Word
            key={start}
            text={text}
            start={start}
            typed={typed.slice(start, Math.min(start + text.length, cursor))}
            active={cursor >= start && cursor < start + text.length}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(Words)

/**
 * One word plus its trailing space. Memoised with primitive props, so a keystroke
 * re-renders only the word it touches, not all ~300 on screen.
 */
const Word = memo(function Word({ text, start, typed, active }) {
  return (
    <span className="inline-block" data-start={start}>
      {[...text].map((char, i) => {
        let state = 'pending'
        if (i < typed.length) state = typed[i] === char ? 'correct' : 'incorrect'
        else if (active && i === typed.length) state = 'active'

        const isSpace = char === ' '
        return (
          <span
            key={start + i}
            data-active={state === 'active' || undefined}
            // A mistyped space has no glyph to colour, so tint its background instead.
            className={state === 'incorrect' && isSpace ? 'rounded-[0.12em] bg-error/40' : CHAR_CLASS[state]}
          >
            {/* A non-breaking space keeps its width, so a mistyped space can still show. */}
            {isSpace ? <>&nbsp;</> : char}
          </span>
        )
      })}
    </span>
  )
})

/** "the cat sat" → [{ text: 'the ', start: 0 }, { text: 'cat ', start: 4 }, { text: 'sat', start: 8 }] */
function splitWords(target) {
  const words = []
  let start = 0
  for (const word of target.split(' ')) {
    const text = start + word.length < target.length ? `${word} ` : word
    words.push({ text, start })
    start += text.length
  }
  return words
}

/**
 * Put the caret on the active character and scroll so its line stays in view.
 * Reads layout (offsetTop/offsetLeft) and writes transforms: no React state involved.
 */
function placeCaret(text, caret) {
  const char = text?.querySelector('[data-active]')
  if (!char || !caret) return
  const word = char.parentElement
  const lineHeight = word.offsetHeight // each word box is exactly one line tall

  // Keep the caret's line second from the top once you're past the second line.
  const scroll = Math.max(0, word.offsetTop - lineHeight)
  text.style.transform = `translateY(${-scroll}px)`

  caret.style.height = `${char.offsetHeight}px`
  caret.style.transform = `translate(${char.offsetLeft}px, ${char.offsetTop}px)`
}

/**
 * Put the ghost caret on character `index`, or hide it (null: no personal best to race,
 * or the test isn't running). Finds the word by binary search on the start offsets,
 * then the character inside it.
 */
function placeGhost(text, ghost, words, index) {
  if (!ghost) return
  let char = null
  if (text && index !== null) {
    let lo = 0
    let hi = words.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (words[mid].start <= index) lo = mid
      else hi = mid - 1
    }
    char = text.querySelector(`[data-start="${words[lo].start}"]`)?.children[index - words[lo].start] ?? null
  }
  if (!char) {
    ghost.style.opacity = '0'
    return
  }
  ghost.style.opacity = '0.7'
  ghost.style.height = `${char.offsetHeight}px`
  ghost.style.transform = `translate(${char.offsetLeft}px, ${char.offsetTop}px)`
}
