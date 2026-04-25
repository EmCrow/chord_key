export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'])

export function normalizePitchClass(value: number): number {
  return ((value % 12) + 12) % 12
}

export function parseNoteName(note: string): number {
  const trimmed = note.trim()
  const sharpIndex = NOTE_NAMES_SHARP.indexOf(trimmed as (typeof NOTE_NAMES_SHARP)[number])
  if (sharpIndex >= 0) {
    return sharpIndex
  }

  const flatIndex = NOTE_NAMES_FLAT.indexOf(trimmed as (typeof NOTE_NAMES_FLAT)[number])
  if (flatIndex >= 0) {
    return flatIndex
  }

  throw new Error(`Unknown note name: ${note}`)
}

export function prefersFlatsForKey(key: string): boolean {
  return FLAT_KEYS.has(key)
}

export function pitchClassToNote(pc: number, preferFlats = false): string {
  const normalized = normalizePitchClass(pc)
  return preferFlats ? NOTE_NAMES_FLAT[normalized] : NOTE_NAMES_SHARP[normalized]
}

export function noteToMidi(note: string): number {
  const match = note.match(/^([A-G](?:#|b)?)(\d)$/)
  if (!match) {
    throw new Error(`Invalid note with octave: ${note}`)
  }

  const [, noteName, octaveText] = match
  const octave = Number(octaveText)
  const pitchClass = parseNoteName(noteName)
  return (octave + 1) * 12 + pitchClass
}

export function midiToNoteName(midi: number, preferFlats = false): string {
  return pitchClassToNote(normalizePitchClass(midi), preferFlats)
}
