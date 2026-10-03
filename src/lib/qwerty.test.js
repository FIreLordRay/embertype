import { describe, expect, it } from 'vitest'
import { keyFor, keysForFinger, ROWS } from './qwerty.js'

describe('keyFor', () => {
  it('knows which finger presses each letter', () => {
    expect(keyFor('f')).toEqual({ key: 'f', finger: 'left index', shift: null })
    expect(keyFor('k')).toEqual({ key: 'k', finger: 'right middle', shift: null })
    expect(keyFor('q')).toEqual({ key: 'q', finger: 'left pinky', shift: null })
    expect(keyFor('p')).toEqual({ key: 'p', finger: 'right pinky', shift: null })
  })

  it('types capitals and symbols with the Shift on the opposite hand', () => {
    expect(keyFor('K')).toEqual({ key: 'k', finger: 'right middle', shift: 'left' })
    expect(keyFor('A')).toEqual({ key: 'a', finger: 'left pinky', shift: 'right' })
    expect(keyFor('?')).toEqual({ key: '/', finger: 'right pinky', shift: 'left' })
    expect(keyFor('"')).toEqual({ key: "'", finger: 'right pinky', shift: 'left' })
    expect(keyFor('!')).toEqual({ key: '1', finger: 'left pinky', shift: 'right' })
  })

  it('uses a thumb for space and gives up on characters a US keyboard lacks', () => {
    expect(keyFor(' ')).toEqual({ key: ' ', finger: 'thumb', shift: null })
    expect(keyFor('é')).toBeNull()
    expect(keyFor('toString')).toBeNull()
  })

  it('assigns every key on the keyboard to exactly one finger', () => {
    const fingers = ['left pinky', 'left ring', 'left middle', 'left index', 'right index', 'right middle', 'right ring', 'right pinky']
    const assigned = fingers.flatMap((f) => [...keysForFinger(f)])
    expect(assigned.sort()).toEqual(ROWS.flat().sort())
  })
})
