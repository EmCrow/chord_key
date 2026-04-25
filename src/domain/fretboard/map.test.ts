import { describe, expect, it } from 'vitest'
import { getScalePitchClasses } from '../music/scales'
import { getFretboardMap } from './map'
import { getTuningById } from './tunings'

describe('getFretboardMap', () => {
  it('highlights only C major pentatonic notes within the CAGED G window for key C', () => {
    const standard = getTuningById('standard')
    const scalePitchClasses = getScalePitchClasses('C', 'major_pentatonic')

    const positions = getFretboardMap({
      tuning: standard,
      keyNote: 'C',
      scalePitchClasses,
      cagedShape: 'G',
      maxFret: 15,
    })

    const highlighted = positions.filter((position) => position.isInCagedShape)
    const scaleOutsideWindow = positions.filter(
      (position) => position.isScaleTone && (position.fret < 5 || position.fret > 8),
    )

    expect(highlighted.length).toBeGreaterThan(0)
    expect(highlighted.every((position) => position.isScaleTone)).toBe(true)
    expect(highlighted.every((position) => position.fret >= 5 && position.fret <= 8)).toBe(true)
    expect(scaleOutsideWindow.every((position) => !position.isInCagedShape)).toBe(true)
  })
})
