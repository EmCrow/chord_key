import { describe, expect, it } from 'vitest'
import { buildChordFromNashvilleToken, getNashvilleChords, parseNashvilleProgression } from './harmony'
import { getChordFunctionInfo, getNashvilleLearningSummary } from './learning'

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

  it('labels Nashville chord function for active degrees', () => {
    expect(getChordFunctionInfo('major', 5).family).toBe('Dominant')
    expect(getChordFunctionInfo('major', 2).family).toBe('Predominant')
    expect(getChordFunctionInfo('minor', 1).family).toBe('Tonic')
  })

  it('summarizes chord construction and voice leading for a selected degree', () => {
    const summary = getNashvilleLearningSummary('C', 'major', 5)

    expect(summary.activeChord.chordName).toBe('G')
    expect(summary.functionInfo.family).toBe('Dominant')
    expect(summary.scaleNotes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    expect(summary.construction).toEqual([
      { chordTone: '1', scaleDegree: 5, noteName: 'G' },
      { chordTone: '3', scaleDegree: 7, noteName: 'B' },
      { chordTone: '5', scaleDegree: 2, noteName: 'D' },
    ])
    expect(summary.voiceLeading.targetChord.chordName).toBe('C')
    expect(summary.voiceLeading.commonTones).toEqual(['G'])
    expect(summary.voiceLeading.moves).toEqual([
      { fromNote: 'B', toNote: 'C', semitones: 1, direction: 'up' },
      { fromNote: 'D', toNote: 'E', semitones: 2, direction: 'up' },
    ])
  })
})
