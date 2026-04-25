import { describe, expect, it } from 'vitest'
import { parseNoteName } from '../music/notes'
import { getCagedWindow } from './caged'
import { getTuningById, tuningToMidi } from './tunings'

describe('getCagedWindow', () => {
  it('places C key CAGED windows in expected standard-tuning regions', () => {
    const standard = getTuningById('standard')
    const tuningMidi = tuningToMidi(standard)
    const keyPitchClass = parseNoteName('C')
    const expected: Array<{ shape: 'C' | 'A' | 'G' | 'E' | 'D'; start: number; end: number }> = [
      { shape: 'C', start: 0, end: 3 },
      { shape: 'A', start: 3, end: 7 },
      { shape: 'G', start: 5, end: 8 },
      { shape: 'E', start: 8, end: 12 },
      { shape: 'D', start: 10, end: 13 },
    ]

    expected.forEach(({ shape, start, end }) => {
      const window = getCagedWindow(shape, tuningMidi, keyPitchClass, 15)
      expect(window.startFret).toBe(start)
      expect(window.endFret).toBe(end)
    })
  })

  it('keeps windows valid across all chromatic keys in standard tuning', () => {
    const standard = getTuningById('standard')
    const tuningMidi = tuningToMidi(standard)
    const keys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
    const shapes: Array<'C' | 'A' | 'G' | 'E' | 'D'> = ['C', 'A', 'G', 'E', 'D']

    shapes.forEach((shape) => {
      keys.forEach((key) => {
        const keyPitchClass = parseNoteName(key)
        const window = getCagedWindow(shape, tuningMidi, keyPitchClass, 15)

        expect(window.startFret).toBeGreaterThanOrEqual(0)
        expect(window.endFret).toBeLessThanOrEqual(15)
        expect(window.endFret - window.startFret).toBeLessThanOrEqual(4)
      })
    })
  })
})
