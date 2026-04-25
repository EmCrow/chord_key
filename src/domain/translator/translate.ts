import type { TranslationOptions, TranslationResult, TranslatedShape, TuningDef } from '../types'
import { tuningToMidi } from '../fretboard/tunings'
import { getChordIntervals } from '../music/harmony'
import { midiToNoteName, normalizePitchClass, parseNoteName, pitchClassToNote, prefersFlatsForKey } from '../music/notes'

interface TranslateInput extends TranslationOptions {
  progression: string
  key: string
  fromTuning: TuningDef
  toTuning: TuningDef
}

type ShapeFret = number | 'x'

interface ShapeCandidate {
  frets: ShapeFret[]
  score: number
}

type ChordQuality = 'maj' | 'min' | 'dim'
type ChordSeventh = 'maj7' | 'min7' | 'dom7' | 'dim7'

interface ParsedLetterChord {
  raw: string
  rootPitchClass: number
  quality: ChordQuality
  seventh?: ChordSeventh
  symbol: string
  chordName: string
}

export function translateProgressionShapes({
  progression,
  key,
  fromTuning,
  toTuning,
  capoFret,
  maxFret,
}: TranslateInput): TranslationResult[] {
  const preferFlats = prefersFlatsForKey(key)
  const parsedChords = parseLetterChordProgression(progression, preferFlats)
  if (parsedChords.length === 0) {
    return []
  }

  const fromTuningMidi = tuningToMidi(fromTuning)
  const toTuningMidi = tuningToMidi(toTuning)

  return parsedChords.map((chord) => {
    const intervals = getChordIntervals(chord.quality, chord.seventh)
    const chordToneSet = new Set(intervals.map((interval) => normalizePitchClass(chord.rootPitchClass + interval)))

    const originalShapes = solveChordShapes({
      tuningMidi: fromTuningMidi,
      chordTones: chordToneSet,
      rootPitchClass: chord.rootPitchClass,
      capoFret: 0,
      maxFret,
      preferFlats,
    })

    const translatedShapes = solveChordShapes({
      tuningMidi: toTuningMidi,
      chordTones: chordToneSet,
      rootPitchClass: chord.rootPitchClass,
      capoFret,
      maxFret,
      preferFlats,
    })

    return {
      originalChordName: chord.chordName,
      translatedChordName: chord.chordName,
      originalShape: originalShapes[0] ?? null,
      translatedShape: translatedShapes[0] ?? null,
    }
  })
}

export function parseLetterChordProgression(progression: string, preferFlats: boolean): ParsedLetterChord[] {
  const tokens = progression
    .split(/\s+|\|+|,+/)
    .map((token) => token.trim())
    .filter(Boolean)

  const parsed: ParsedLetterChord[] = []

  for (const token of tokens) {
    const match = token.match(/^([A-Ga-g])([#b]?)(maj7|m7|dim7|dim|m|7)?$/)
    if (!match) {
      continue
    }

    const root = `${match[1].toUpperCase()}${match[2] ?? ''}`
    const suffix = (match[3] ?? '').toLowerCase()
    const rootPitchClass = parseNoteName(root)

    const descriptor = getChordDescriptor(suffix)
    const chordName = `${pitchClassToNote(rootPitchClass, preferFlats)}${descriptor.symbol}`

    parsed.push({
      raw: token,
      rootPitchClass,
      quality: descriptor.quality,
      seventh: descriptor.seventh,
      symbol: descriptor.symbol,
      chordName,
    })
  }

  return parsed
}

function getChordDescriptor(suffix: string): {
  quality: ChordQuality
  seventh?: ChordSeventh
  symbol: string
} {
  if (suffix === 'm') {
    return { quality: 'min', symbol: 'm' }
  }

  if (suffix === 'dim') {
    return { quality: 'dim', symbol: 'dim' }
  }

  if (suffix === 'maj7') {
    return { quality: 'maj', seventh: 'maj7', symbol: 'maj7' }
  }

  if (suffix === 'm7') {
    return { quality: 'min', seventh: 'min7', symbol: 'm7' }
  }

  if (suffix === 'dim7') {
    return { quality: 'dim', seventh: 'dim7', symbol: 'dim7' }
  }

  if (suffix === '7') {
    return { quality: 'maj', seventh: 'dom7', symbol: '7' }
  }

  return { quality: 'maj', symbol: '' }
}

interface SolveShapesInput {
  tuningMidi: number[]
  chordTones: Set<number>
  rootPitchClass: number
  capoFret: number
  maxFret: number
  preferFlats: boolean
}

function solveChordShapes({
  tuningMidi,
  chordTones,
  rootPitchClass,
  capoFret,
  maxFret,
  preferFlats,
}: SolveShapesInput): TranslatedShape[] {
  const maxRelativeFret = Math.max(0, maxFret - capoFret)
  const candidates: ShapeCandidate[] = []

  for (let windowStart = 0; windowStart <= maxRelativeFret; windowStart += 1) {
    const windowEnd = Math.min(maxRelativeFret, windowStart + 4)

    const shape: ShapeFret[] = tuningMidi.map((openMidi) => {
      const frets: number[] = []

      for (let fret = windowStart; fret <= windowEnd; fret += 1) {
        const pitchClass = normalizePitchClass(openMidi + capoFret + fret)
        if (chordTones.has(pitchClass)) {
          frets.push(fret)
        }
      }

      if (windowStart <= 2) {
        const openPitchClass = normalizePitchClass(openMidi + capoFret)
        if (chordTones.has(openPitchClass) && !frets.includes(0)) {
          frets.unshift(0)
        }
      }

      return frets[0] ?? 'x'
    })

    const scored = evaluateShape(shape, tuningMidi, chordTones, rootPitchClass, capoFret)
    if (scored) {
      candidates.push(scored)
    }
  }

  const deduped = dedupeCandidates(candidates)
  deduped.sort((a, b) => a.score - b.score)

  return deduped.slice(0, 3).map((candidate) => {
    const relativeFrets = candidate.frets
    const absoluteFrets = relativeFrets.map((fret) => (fret === 'x' ? 'x' : fret + capoFret))
    const notes = relativeFrets
      .map((fret, stringIndex) => {
        if (fret === 'x') {
          return null
        }

        const midi = tuningMidi[stringIndex] + fret + capoFret
        return midiToNoteName(midi, preferFlats)
      })
      .filter((entry): entry is string => Boolean(entry))

    return {
      relativeFrets,
      absoluteFrets,
      playable: isPlayable(relativeFrets, maxFret, capoFret),
      notes,
    }
  })
}

function evaluateShape(
  frets: ShapeFret[],
  tuningMidi: number[],
  chordTones: Set<number>,
  rootPitchClass: number,
  capoFret: number,
): ShapeCandidate | null {
  const sounding = frets
    .map((fret, stringIndex) => {
      if (fret === 'x') {
        return null
      }

      const midi = tuningMidi[stringIndex] + fret + capoFret
      return {
        stringIndex,
        fret,
        pitchClass: normalizePitchClass(midi),
      }
    })
    .filter((entry): entry is { stringIndex: number; fret: number; pitchClass: number } => Boolean(entry))

  if (sounding.length < 3) {
    return null
  }

  const hasRoot = sounding.some((entry) => entry.pitchClass === rootPitchClass)
  if (!hasRoot) {
    return null
  }

  const distinctToneCount = new Set(sounding.map((entry) => entry.pitchClass)).size
  if (distinctToneCount < 2) {
    return null
  }

  const playedFrets = sounding.map((entry) => entry.fret)
  const maxPlayed = Math.max(...playedFrets)
  const minPlayed = Math.min(...playedFrets)
  const spread = maxPlayed - minPlayed

  if (spread > 5) {
    return null
  }

  const muted = frets.filter((fret) => fret === 'x').length
  const bass = sounding[0]
  const rootInBassBonus = bass.pitchClass === rootPitchClass ? -1 : 0
  const triadCoveragePenalty = chordTones.size > distinctToneCount ? 1.5 : 0
  const openStringBonus = playedFrets.filter((fret) => fret === 0).length * -0.2

  const score = muted * 1.4 + spread * 0.8 + minPlayed * 0.15 + triadCoveragePenalty + rootInBassBonus + openStringBonus

  return {
    frets,
    score,
  }
}

function dedupeCandidates(candidates: ShapeCandidate[]): ShapeCandidate[] {
  const seen = new Map<string, ShapeCandidate>()

  for (const candidate of candidates) {
    const key = candidate.frets.join('-')
    const existing = seen.get(key)

    if (!existing || candidate.score < existing.score) {
      seen.set(key, candidate)
    }
  }

  return [...seen.values()]
}

function isPlayable(relativeFrets: ShapeFret[], maxFret: number, capoFret: number): boolean {
  return relativeFrets.every((fret) => fret === 'x' || fret + capoFret <= maxFret)
}

export function formatShape(shape: Array<number | 'x'>): string {
  return shape.map((value) => (value === 'x' ? 'x' : String(value))).join(' ')
}

export function getCapoAdjustedTuningPitchClasses(tuning: TuningDef, capoFret: number): number[] {
  return tuningToMidi(tuning).map((midi) => normalizePitchClass(midi + capoFret))
}

export function transposeProgressionKeyForCapo(key: string, capoFret: number): string {
  const keyPc = parseNoteName(key)
  const transposed = normalizePitchClass(keyPc + capoFret)
  return midiToNoteName(transposed, prefersFlatsForKey(key))
}
