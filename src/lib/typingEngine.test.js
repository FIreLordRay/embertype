import { describe, expect, it } from 'vitest'
import { createInitialState, typingReducer, wordStartBefore } from './typingEngine.js'
import { keys, play } from './testing.js'

const newTest = (text, timeLimitMs = null) => createInitialState({ words: text.split(' '), timeLimitMs })

describe('typingReducer', () => {
  it('waits idle, then starts the clock on the first keystroke', () => {
    const idle = newTest('the cat')
    expect(idle).toMatchObject({ status: 'idle', startedAt: null, target: 'the cat' })

    const s = play(idle, [['t', 5000]])
    expect(s).toMatchObject({ status: 'running', startedAt: 5000, typed: 't' })
    expect(s.log).toEqual([{ type: 'char', t: 0, expected: 't', actual: 't' }])
  })

  it('compares every keystroke with the target character', () => {
    const s = play(newTest('the cat'), keys('thx'))
    expect(s.typed).toBe('thx')
    expect(s.log.map((e) => e.actual === e.expected)).toEqual([true, true, false])
  })

  it('lets Backspace remove a mistake so it can be fixed', () => {
    const s = play(newTest('the cat'), keys('thx⌫e'))
    expect(s.typed).toBe('the')
    expect(s.log[3]).toMatchObject({ type: 'delete', count: 1 })
  })

  it('ignores Backspace before the test starts and at the very start of the text', () => {
    const idle = newTest('the cat')
    expect(play(idle, keys('⌫'))).toBe(idle)

    const s = play(idle, keys('t⌫⌫'))
    expect(s.typed).toBe('')
    expect(s.log.filter((e) => e.type === 'delete')).toHaveLength(1)
  })

  it('deletes back to the start of the word on Ctrl+Backspace', () => {
    const midWord = play(newTest('the cat sat'), keys('the ca⇤'))
    expect(midWord.typed).toBe('the ')
    expect(midWord.log.at(-1)).toMatchObject({ type: 'delete', count: 2 })

    const atWordStart = play(midWord, [['⇤', 9000]])
    expect(atWordStart.typed).toBe('')
  })

  it('finishes the moment the last character is typed (words mode)', () => {
    const s = play(newTest('hi yo'), keys('hi yo', 1000, 200))
    expect(s).toMatchObject({ status: 'finished', endedAt: 1800, typed: 'hi yo' })
  })

  it('finishes even if the last character is wrong', () => {
    const s = play(newTest('hi'), keys('hx'))
    expect(s.status).toBe('finished')
  })

  it('does not count keys that arrive after the time limit', () => {
    // The third key lands exactly on the deadline: the test ends, the key is dropped.
    const s = play(newTest('the cat sat', 1000), [['t', 0], ['h', 500], ['e', 1000]])
    expect(s).toMatchObject({ status: 'finished', endedAt: 1000, typed: 'th' })
    expect(s.log).toHaveLength(2)
  })

  it('finishes on timeUp at exactly startedAt + limit, however late the timer fired', () => {
    const running = play(newTest('the cat', 15_000), [['t', 2000]])
    expect(typingReducer(running, { type: 'timeUp' })).toMatchObject({ status: 'finished', endedAt: 17_000 })
  })

  it('ignores timeUp before the first keystroke', () => {
    const idle = newTest('the cat', 15_000)
    expect(typingReducer(idle, { type: 'timeUp' })).toBe(idle)
  })

  it('ignores input once the test is finished', () => {
    const done = play(newTest('hi'), keys('hi'))
    expect(play(done, keys('x⌫'))).toBe(done)
  })
})

describe('wordStartBefore', () => {
  it.each([
    ['the cat', 6, 4], // mid-word → start of that word
    ['the cat', 4, 0], // just past a space → the previous word, space included
    ['the cat', 3, 0],
    ['the cat', 0, 0],
  ])('%j at %i → %i', (target, cursor, expected) => {
    expect(wordStartBefore(target, cursor)).toBe(expected)
  })
})
