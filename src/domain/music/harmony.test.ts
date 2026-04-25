import { describe, expect, it } from 'vitest'
import { buildChordFromNashvilleToken, getNashvilleChords, parseNashvilleProgression } from './harmony'

describe('harmony mode support', () => {
  it('returns expected diatonic chords for major mode', () => {
    const chords = getNashvilleChords('C', 'major')
    expect(chords.map((chord) => chord.chordName)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'])
    expect(chords.map((chord) => chord.roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
  })

  it('returns expected diatonic chords for natural minor mode', () => {
    const chords = getNashvilleChords('A', 'minor')
    expect(chords.map((chord) => chord.chordName)).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'])
    expect(chords.map((chord) => chord.roman)).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'])
  })

  it('parses nashville progression defaults by harmony mode', () => {
    const parsed = parseNashvilleProgression('1 2 3', 'minor')
    expect(parsed.map((token) => token.quality)).toEqual(['min', 'dim', 'maj'])
  })

  it('builds nashville chord roots from the selected mode intervals', () => {
    const built = buildChordFromNashvilleToken('A', { raw: '5', degree: 5, quality: 'min' }, 'minor')
    expect(built.chordName).toBe('Em')
    expect(built.roman).toBe('v')
  })
})
