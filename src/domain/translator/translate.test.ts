import { describe, expect, it } from 'vitest'
import { getTuningById } from '../fretboard/tunings'
import {
  getCapoAdjustedTuningPitchClasses,
  parseLetterChordProgression,
  transposeProgressionKeyForCapo,
  translateProgressionShapes,
} from './translate'

describe('translator capo behavior', () => {
  it('transposes target tuning pitch classes by capo amount', () => {
    const standard = getTuningById('standard')
    const openPitchClasses = getCapoAdjustedTuningPitchClasses(standard, 0)
    const capoTwoPitchClasses = getCapoAdjustedTuningPitchClasses(standard, 2)

    expect(capoTwoPitchClasses).toEqual(openPitchClasses.map((pc) => (pc + 2) % 12))
  })

  it('keeps same tuning translation valid when capo is added', () => {
    const standard = getTuningById('standard')

    const results = translateProgressionShapes({
      progression: 'C G Am F',
      key: 'C',
      fromTuning: standard,
      toTuning: standard,
      capoFret: 2,
      maxFret: 15,
    })

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].translatedShape).not.toBeNull()

    const shape = results[0].translatedShape
    if (!shape) {
      throw new Error('Expected a translated shape to be generated.')
    }

    shape.relativeFrets.forEach((relativeFret: number | 'x', index: number) => {
      const absoluteFret = shape.absoluteFrets[index]

      if (relativeFret === 'x') {
        expect(absoluteFret).toBe('x')
      } else {
        expect(absoluteFret).toBe(relativeFret + 2)
      }
    })

    expect(results[0].originalChordName).toBe('C')
    expect(results[0].translatedChordName).toBe('C')
  })

  it('prefers the common open C voicing over the eighth-fret barre shape in standard tuning', () => {
    const standard = getTuningById('standard')
    const results = translateProgressionShapes({
      progression: 'C',
      key: 'C',
      fromTuning: standard,
      toTuning: standard,
      capoFret: 0,
      maxFret: 15,
    })

    expect(results[0].translatedShape?.relativeFrets).toEqual(['x', 3, 2, 0, 1, 0])
  })

  it('uses the closest open-shape family near the capo for standard tuning', () => {
    const standard = getTuningById('standard')
    const results = translateProgressionShapes({
      progression: 'F',
      key: 'F',
      fromTuning: standard,
      toTuning: standard,
      capoFret: 5,
      maxFret: 15,
    })

    expect(results[0].translatedShape?.relativeFrets).toEqual(['x', 3, 2, 0, 1, 0])
    expect(results[0].translatedShape?.absoluteFrets).toEqual(['x', 8, 7, 5, 6, 5])
  })

  it('ignores invalid progression tokens without throwing', () => {
    const standard = getTuningById('standard')
    const results = translateProgressionShapes({
      progression: 'C @@@ F ???',
      key: 'C',
      fromTuning: standard,
      toTuning: standard,
      capoFret: 0,
      maxFret: 15,
    })

    expect(results).toHaveLength(2)
    expect(results[0].originalChordName).toBe('C')
    expect(results[1].originalChordName).toBe('F')
  })

  it('parses common letter chord spellings without flattening minor sevenths into major sevenths', () => {
    const parsed = parseLetterChordProgression('Cm7 Cmaj7 C7sus4 Caug G5 Bm7b5 C/E', false)

    expect(parsed.map((chord) => chord.chordName)).toEqual([
      'Cm7',
      'Cmaj7',
      'C7sus4',
      'Caug',
      'G5',
      'Bm7b5',
      'C/E',
    ])
  })

  it('supports slash-chord bass notes in generated shapes', () => {
    const standard = getTuningById('standard')
    const results = translateProgressionShapes({
      progression: 'C/E',
      key: 'C',
      fromTuning: standard,
      toTuning: standard,
      capoFret: 0,
      maxFret: 15,
    })

    expect(results[0].translatedChordName).toBe('C/E')
    expect(results[0].translatedShape).not.toBeNull()
    expect(results[0].translatedShape?.notes[0]).toBe('E')
  })

  it('returns the lower open-shape key needed for a capo', () => {
    expect(transposeProgressionKeyForCapo('D', 2)).toBe('C')
    expect(transposeProgressionKeyForCapo('Bb', 3)).toBe('G')
  })
})
