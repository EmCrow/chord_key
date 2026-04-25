import { normalizePitchClass, parseNoteName } from './notes'

export type ScaleId =
  | 'major'
  | 'natural_minor'
  | 'harmonic_minor'
  | 'melodic_minor'
  | 'major_pentatonic'
  | 'minor_pentatonic'
  | 'blues'
  | 'dorian'
  | 'mixolydian'

export interface ScaleDef {
  id: ScaleId
  name: string
  intervals: number[]
}

export interface KeyOption {
  label: string
  note: string
}

export const KEY_OPTIONS: KeyOption[] = [
  { label: 'C', note: 'C' },
  { label: 'G', note: 'G' },
  { label: 'D', note: 'D' },
  { label: 'A', note: 'A' },
  { label: 'E', note: 'E' },
  { label: 'B', note: 'B' },
  { label: 'F#/Gb', note: 'F#' },
  { label: 'Db', note: 'Db' },
  { label: 'Ab', note: 'Ab' },
  { label: 'Eb', note: 'Eb' },
  { label: 'Bb', note: 'Bb' },
  { label: 'F', note: 'F' },
]

export const SCALE_DEFS: ScaleDef[] = [
  { id: 'major', name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'natural_minor', name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic_minor', name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic_minor', name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'major_pentatonic', name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  { id: 'minor_pentatonic', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { id: 'blues', name: 'Blues Scale', intervals: [0, 3, 5, 6, 7, 10] },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
]

export function getScaleById(id: ScaleId): ScaleDef {
  const scale = SCALE_DEFS.find((scaleEntry) => scaleEntry.id === id)
  if (!scale) {
    throw new Error(`Unknown scale id: ${id}`)
  }
  return scale
}

export function getScalePitchClasses(keyNote: string, scaleId: ScaleId): number[] {
  const root = parseNoteName(keyNote)
  return getScaleById(scaleId).intervals.map((interval) => normalizePitchClass(root + interval))
}
