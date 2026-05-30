import { describe, expect, it } from 'vitest'
import { parseNoteName } from './notes'

describe('note spelling', () => {
  it('accepts common enharmonic spellings used in chord charts', () => {
    expect(parseNoteName('B#')).toBe(0)
    expect(parseNoteName('Cb')).toBe(11)
    expect(parseNoteName('E#')).toBe(5)
    expect(parseNoteName('Fb')).toBe(4)
  })

  it('accepts lowercase note input from typed progressions', () => {
    expect(parseNoteName('bb')).toBe(10)
    expect(parseNoteName('f#')).toBe(6)
  })
})
