import { describe, expect, it } from 'vitest'
import { getTuningById } from '../fretboard/tunings'
import {
  getCapoAdjustedTuningPitchClasses,
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
})
