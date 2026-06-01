import { describe, expect, it } from 'vitest'
import { getFretboardMap } from '../fretboard/map'
import { getTuningById } from '../fretboard/tunings'
import { getNashvilleChords } from '../music/harmony'
import { parseNoteName } from '../music/notes'
import { getScalePitchClasses } from '../music/scales'
import {
  getFretboardScaleMidiSequence,
  getFretboardScalePlaybackSequence,
  getNashvilleChordMidiVoicing,
  getShapeMidiNotes,
  midiToFrequency,
} from './playback'

describe('audio playback helpers', () => {
  it('converts midi notes to equal-tempered frequency', () => {
    expect(midiToFrequency(69)).toBe(440)
    expect(Math.round(midiToFrequency(60) * 100) / 100).toBe(261.63)
  })

  it('voices Nashville chords in a playable register', () => {
    const cChord = getNashvilleChords('C', 'major')[0]
    const gChord = getNashvilleChords('C', 'major')[4]

    expect(getNashvilleChordMidiVoicing(gChord)).toEqual([43, 47, 50, 55, 59, 67])
    expect(Math.min(...getNashvilleChordMidiVoicing(gChord))).toBeLessThan(
      Math.min(...getNashvilleChordMidiVoicing(cChord)),
    )
    expect(getNashvilleChordMidiVoicing(gChord, 'compact')).toEqual([55, 59, 62])
  })

  it('turns translated shape frets into sounding midi notes', () => {
    const standard = getTuningById('standard')

    expect(getShapeMidiNotes(['x', 3, 2, 0, 1, 0], standard)).toEqual([48, 52, 55, 60, 64])
  })

  it('builds a scale run from the selected fretboard shape window', () => {
    const standard = getTuningById('standard')
    const positions = getFretboardMap({
      tuning: standard,
      keyNote: 'C',
      scalePitchClasses: getScalePitchClasses('C', 'major'),
      cagedShape: 'C',
      maxFret: 15,
    })

    const sequence = getFretboardScaleMidiSequence(positions, standard, 0, parseNoteName('C'))

    expect(sequence[0] % 12).toBe(0)
    expect(new Set(sequence.map((midi) => midi % 12)).size).toBeGreaterThanOrEqual(7)
  })

  it('builds a physical scale sweep from string 6 to string 1', () => {
    const standard = getTuningById('standard')
    const positions = getFretboardMap({
      tuning: standard,
      keyNote: 'C',
      scalePitchClasses: getScalePitchClasses('C', 'major'),
      cagedShape: 'C',
      maxFret: 15,
    })

    const sequence = getFretboardScalePlaybackSequence(positions, standard, 0, parseNoteName('C'), {
      mode: 'string-sweep',
    })

    expect(sequence[0].stringIndex).toBe(0)
    expect(sequence.at(-1)?.stringIndex).toBe(5)
    expect(sequence.every((note, index) => index === 0 || note.stringIndex >= sequence[index - 1].stringIndex)).toBe(
      true,
    )
  })

  it('limits octave playback to the selected root-to-root span', () => {
    const standard = getTuningById('standard')
    const positions = getFretboardMap({
      tuning: standard,
      keyNote: 'C',
      scalePitchClasses: getScalePitchClasses('C', 'major'),
      cagedShape: 'E',
      maxFret: 15,
    })
    const keyPitchClass = parseNoteName('C')

    const oneOctave = getFretboardScalePlaybackSequence(positions, standard, 0, keyPitchClass, {
      mode: 'octaves',
      octaveCount: 1,
    })
    const twoOctaves = getFretboardScalePlaybackSequence(positions, standard, 0, keyPitchClass, {
      mode: 'octaves',
      octaveCount: 2,
    })

    expect(oneOctave[0].pitchClass).toBe(keyPitchClass)
    expect(oneOctave.at(-1)?.pitchClass).toBe(keyPitchClass)
    expect(twoOctaves.length).toBeGreaterThan(oneOctave.length)
  })
})
