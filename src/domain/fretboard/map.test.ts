import { describe, expect, it } from 'vitest'
import { getScalePitchClasses, SCALE_DEFS } from '../music/scales'
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
    const cagedWindow = positions.filter((position) => position.isInCagedWindow)
    const scaleOutsideWindow = positions.filter(
      (position) => position.isScaleTone && (position.fret < 5 || position.fret > 8),
    )
    const offScaleInsideWindow = positions.filter(
      (position) => position.isInCagedWindow && !position.isScaleTone,
    )

    expect(highlighted.length).toBeGreaterThan(0)
    expect(cagedWindow.length).toBeGreaterThan(highlighted.length)
    expect(cagedWindow.every((position) => position.fret >= 5 && position.fret <= 8)).toBe(true)
    expect(highlighted.every((position) => position.isScaleTone)).toBe(true)
    expect(highlighted.every((position) => position.fret >= 5 && position.fret <= 8)).toBe(true)
    expect(offScaleInsideWindow.every((position) => !position.isInCagedShape)).toBe(true)
    expect(scaleOutsideWindow.every((position) => !position.isInCagedShape)).toBe(true)
  })

  it.each(SCALE_DEFS)('marks exactly the selected %s pitch classes as scale tones', (scaleDef) => {
    const standard = getTuningById('standard')
    const scalePitchClasses = getScalePitchClasses('G', scaleDef.id)
    const scaleSet = new Set(scalePitchClasses)

    const positions = getFretboardMap({
      tuning: standard,
      keyNote: 'G',
      scalePitchClasses,
      cagedShape: 'E',
      maxFret: 15,
    })

    expect(positions).toHaveLength(standard.strings.length * 16)
    expect(positions.every((position) => position.isScaleTone === scaleSet.has(position.pitchClass))).toBe(true)
  })

  it('uses capo-adjusted sounding notes when deciding scale highlighting', () => {
    const standard = getTuningById('standard')
    const scalePitchClasses = getScalePitchClasses('C', 'major')

    const positions = getFretboardMap({
      tuning: standard,
      keyNote: 'C',
      scalePitchClasses,
      cagedShape: 'C',
      capoFret: 2,
      maxFret: 3,
    })

    const lowE = (fret: number) => positions.find((position) => position.stringIndex === 0 && position.fret === fret)

    expect(lowE(0)).toMatchObject({ noteName: 'F#', isScaleTone: false })
    expect(lowE(1)).toMatchObject({ noteName: 'G', isScaleTone: true })
    expect(lowE(2)).toMatchObject({ noteName: 'G#', isScaleTone: false })
    expect(lowE(3)).toMatchObject({ noteName: 'A', isScaleTone: true })
  })
})
