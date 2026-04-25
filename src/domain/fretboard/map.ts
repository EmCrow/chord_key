import type { CagedShape, FretPosition, NashvilleChord, TuningDef } from '../types'
import { midiToNoteName, normalizePitchClass, parseNoteName, prefersFlatsForKey } from '../music/notes'
import { getCagedWindow } from './caged'
import { tuningToMidi } from './tunings'

interface FretboardOptions {
  tuning: TuningDef
  keyNote: string
  scalePitchClasses: number[]
  cagedShape: CagedShape
  activeChord?: NashvilleChord
  capoFret?: number
  maxFret?: number
}

export function getFretboardMap({
  tuning,
  keyNote,
  scalePitchClasses,
  cagedShape,
  activeChord,
  capoFret = 0,
  maxFret = 15,
}: FretboardOptions): FretPosition[] {
  const tuningMidi = tuningToMidi(tuning)
  const keyPitchClass = parseNoteName(keyNote)
  const scaleSet = new Set(scalePitchClasses)
  const activeChordSet = new Set(activeChord?.chordPitchClasses ?? [])
  const preferFlats = prefersFlatsForKey(keyNote)
  const cagedWindow = getCagedWindow(cagedShape, tuningMidi, keyPitchClass, maxFret)

  const positions: FretPosition[] = []

  tuningMidi.forEach((openStringMidi, stringIndex) => {
    for (let fret = 0; fret <= maxFret; fret += 1) {
      const soundingMidi = openStringMidi + fret + capoFret
      const pitchClass = normalizePitchClass(soundingMidi)
      const isScaleTone = scaleSet.has(pitchClass)

      positions.push({
        stringIndex,
        fret,
        absoluteFret: fret,
        pitchClass,
        noteName: midiToNoteName(soundingMidi, preferFlats),
        isScaleTone,
        isRoot: pitchClass === keyPitchClass,
        isInCagedShape: fret >= cagedWindow.startFret && fret <= cagedWindow.endFret && isScaleTone,
        isChordTone: activeChordSet.size > 0 && activeChordSet.has(pitchClass),
      })
    }
  })

  return positions
}
