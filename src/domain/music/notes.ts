export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const

const NOTE_NAME_TO_PITCH_CLASS = new Map<string, number>([
  ...NOTE_NAMES_SHARP.map((note, index) => [note, index] as const),
  ...NOTE_NAMES_FLAT.map((note, index) => [note, index] as const),
  ['B#', 0],
  ['Cb', 11],
  ['E#', 5],
  ['Fb', 4],
])

const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'])

export function normalizePitchClass(value: number): number {
  return ((value % 12) + 12) % 12
}

export function parseNoteName(note: string): number {
  const trimmed = note.trim()
  const normalized = `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`
  const pitchClass = NOTE_NAME_TO_PITCH_CLASS.get(normalized)

  if (pitchClass === undefined) {
    throw new Error(`Unknown note name: ${note}`)
  }

  return pitchClass
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
