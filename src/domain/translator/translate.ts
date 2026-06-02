import type { TranslationOptions, TranslationResult, TranslatedShape, TuningDef } from '../types'
import { tuningToMidi } from '../fretboard/tunings'
import { getChordIntervals, type ChordQuality, type ChordSeventh } from '../music/harmony'
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

interface ParsedLetterChord {
  raw: string
  rootPitchClass: number
  bassPitchClass?: number
  quality: ChordQuality
  seventh?: ChordSeventh
  symbol: string
  chordName: string
}

const CHORD_TOKEN_PATTERN =
  /^([A-Ga-g])([#b]?)(maj7|M7|min7|m7b5|m7|dim7|o7|°7|ø7|7sus4|7sus|sus2|sus4|sus|aug|\+|5|dim|o|°|min|minor|maj|major|m|7)?(?:\/([A-Ga-g])([#b]?))?$/

const SHAPE_CACHE_LIMIT = 400
const shapeCache = new Map<string, TranslatedShape[]>()
const STANDARD_TUNING_MIDI = [40, 45, 50, 55, 59, 64]
const STANDARD_OPEN_SHAPES: Record<string, ShapeFret[]> = {
  C: ['x', 3, 2, 0, 1, 0],
  Cm: ['x', 3, 5, 5, 4, 3],
  C7: ['x', 3, 2, 3, 1, 0],
  Cmaj7: ['x', 3, 2, 0, 0, 0],
  D: ['x', 'x', 0, 2, 3, 2],
  Dm: ['x', 'x', 0, 2, 3, 1],
  D7: ['x', 'x', 0, 2, 1, 2],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  Fmaj7: ['x', 'x', 3, 2, 1, 0],
  G: [3, 2, 0, 0, 0, 3],
  G7: [3, 2, 0, 0, 0, 1],
  A: ['x', 0, 2, 2, 2, 0],
  Am: ['x', 0, 2, 2, 1, 0],
  A7: ['x', 0, 2, 0, 2, 0],
  B7: ['x', 2, 1, 2, 0, 2],
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
    if (chord.bassPitchClass !== undefined) {
      chordToneSet.add(chord.bassPitchClass)
    }

    const originalShapes = solveChordShapes({
      tuningMidi: fromTuningMidi,
      chordTones: chordToneSet,
      rootPitchClass: chord.rootPitchClass,
      bassPitchClass: chord.bassPitchClass,
      chordName: chord.chordName,
      capoFret: 0,
      maxFret,
      preferFlats,
    })

    const translatedShapes = solveChordShapes({
      tuningMidi: toTuningMidi,
      chordTones: chordToneSet,
      rootPitchClass: chord.rootPitchClass,
      bassPitchClass: chord.bassPitchClass,
      chordName: chord.chordName,
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
    const match = token.match(CHORD_TOKEN_PATTERN)
    if (!match) {
      continue
    }

    const root = formatParsedNoteName(match[1], match[2])
    const suffix = match[3] ?? ''
    const rootPitchClass = parseNoteName(root)
    const bassNote = match[4] ? formatParsedNoteName(match[4], match[5]) : undefined
    const bassPitchClass = bassNote ? parseNoteName(bassNote) : undefined

    const descriptor = getChordDescriptor(suffix)
    const chordName = `${pitchClassToNote(rootPitchClass, preferFlats)}${descriptor.symbol}${
      bassPitchClass === undefined ? '' : `/${pitchClassToNote(bassPitchClass, preferFlats)}`
    }`

    parsed.push({
      raw: token,
      rootPitchClass,
      bassPitchClass,
      quality: descriptor.quality,
      seventh: descriptor.seventh,
      symbol: descriptor.symbol,
      chordName,
    })
  }

  return parsed
}

function formatParsedNoteName(letter: string, accidental = ''): string {
  return `${letter.toUpperCase()}${accidental}`
}

function getChordDescriptor(suffix: string): {
  quality: ChordQuality
  seventh?: ChordSeventh
  symbol: string
} {
  const normalizedSuffix = suffix.toLowerCase()

  if (normalizedSuffix === 'm' || normalizedSuffix === 'min' || normalizedSuffix === 'minor') {
    return { quality: 'min', symbol: 'm' }
  }

  if (normalizedSuffix === 'maj' || normalizedSuffix === 'major') {
    return { quality: 'maj', symbol: '' }
  }

  if (normalizedSuffix === 'dim' || normalizedSuffix === 'o' || normalizedSuffix === '°') {
    return { quality: 'dim', symbol: 'dim' }
  }

  if (normalizedSuffix === 'aug' || normalizedSuffix === '+') {
    return { quality: 'aug', symbol: 'aug' }
  }

  if (normalizedSuffix === 'sus' || normalizedSuffix === 'sus4') {
    return { quality: 'sus4', symbol: 'sus4' }
  }

  if (normalizedSuffix === 'sus2') {
    return { quality: 'sus2', symbol: 'sus2' }
  }

  if (normalizedSuffix === '5') {
    return { quality: 'power', symbol: '5' }
  }

  if (normalizedSuffix === 'maj7' || suffix === 'M7') {
    return { quality: 'maj', seventh: 'maj7', symbol: 'maj7' }
  }

  if (normalizedSuffix === 'm7' || normalizedSuffix === 'min7') {
    return { quality: 'min', seventh: 'min7', symbol: 'm7' }
  }

  if (normalizedSuffix === 'm7b5' || normalizedSuffix === 'ø7') {
    return { quality: 'dim', seventh: 'min7', symbol: 'm7b5' }
  }

  if (normalizedSuffix === 'dim7' || normalizedSuffix === 'o7' || normalizedSuffix === '°7') {
    return { quality: 'dim', seventh: 'dim7', symbol: 'dim7' }
  }

  if (normalizedSuffix === '7sus' || normalizedSuffix === '7sus4') {
    return { quality: 'sus4', seventh: 'dom7', symbol: '7sus4' }
  }

  if (normalizedSuffix === '7') {
    return { quality: 'maj', seventh: 'dom7', symbol: '7' }
  }

  return { quality: 'maj', symbol: '' }
}

interface SolveShapesInput {
  tuningMidi: number[]
  chordTones: Set<number>
  rootPitchClass: number
  bassPitchClass?: number
  chordName: string
  capoFret: number
  maxFret: number
  preferFlats: boolean
}

function solveChordShapes({
  tuningMidi,
  chordTones,
  rootPitchClass,
  bassPitchClass,
  chordName,
  capoFret,
  maxFret,
  preferFlats,
}: SolveShapesInput): TranslatedShape[] {
  const preferredOpenShape = getStandardOpenShape({ tuningMidi, chordName, capoFret, maxFret, preferFlats })
  if (preferredOpenShape) {
    return [preferredOpenShape]
  }

  const cacheKey = getShapeCacheKey({
    tuningMidi,
    chordTones,
    rootPitchClass,
    bassPitchClass,
    chordName,
    capoFret,
    maxFret,
    preferFlats,
  })
  const cached = shapeCache.get(cacheKey)
  if (cached) {
    return cached.map(cloneTranslatedShape)
  }

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

    const scored = evaluateShape(shape, tuningMidi, chordTones, rootPitchClass, bassPitchClass, capoFret)
    if (scored) {
      candidates.push(scored)
    }
  }

  const deduped = dedupeCandidates(candidates)
  deduped.sort((a, b) => a.score - b.score)

  const solved = deduped
    .slice(0, 3)
    .map((candidate) => buildTranslatedShape(candidate.frets, tuningMidi, capoFret, maxFret, preferFlats))

  setShapeCache(cacheKey, solved)
  return solved.map(cloneTranslatedShape)
}

function getStandardOpenShape({
  tuningMidi,
  chordName,
  capoFret,
  maxFret,
  preferFlats,
}: {
  tuningMidi: number[]
  chordName: string
  capoFret: number
  maxFret: number
  preferFlats: boolean
}): TranslatedShape | null {
  if (chordName.includes('/')) {
    return null
  }

  const standardOffset = getUniformStandardTuningOffset(tuningMidi)
  if (standardOffset === null) {
    return null
  }

  const openShapeName = getOpenChordShapeNameForTuningOffset(chordName, capoFret, standardOffset)
  const relativeFrets = openShapeName ? STANDARD_OPEN_SHAPES[openShapeName] : undefined
  if (!relativeFrets || !isPlayable(relativeFrets, maxFret, capoFret)) {
    return null
  }

  return buildTranslatedShape(relativeFrets, tuningMidi, capoFret, maxFret, preferFlats, openShapeName ?? undefined)
}

export function getOpenChordShapeNameForCapo(chordName: string, capoFret: number): string | null {
  return getOpenChordShapeNameForTuningOffset(chordName, capoFret, 0)
}

function getOpenChordShapeNameForTuningOffset(chordName: string, capoFret: number, tuningOffset: number): string | null {
  if (capoFret === 0) {
    const match = chordName.match(/^([A-G](?:#|b)?)(.*)$/)
    if (!match) {
      return STANDARD_OPEN_SHAPES[chordName] ? chordName : null
    }

    const [, root, suffix] = match
    const shapeRootPc = normalizePitchClass(parseNoteName(root) - tuningOffset)
    const candidates = [
      `${pitchClassToNote(shapeRootPc, false)}${suffix}`,
      `${pitchClassToNote(shapeRootPc, true)}${suffix}`,
    ]

    return candidates.find((candidate) => STANDARD_OPEN_SHAPES[candidate]) ?? null
  }

  const match = chordName.match(/^([A-G](?:#|b)?)(.*)$/)
  if (!match) {
    return null
  }

  const [, root, suffix] = match
  const shapeRootPc = normalizePitchClass(parseNoteName(root) - capoFret - tuningOffset)
  const candidates = [
    `${pitchClassToNote(shapeRootPc, false)}${suffix}`,
    `${pitchClassToNote(shapeRootPc, true)}${suffix}`,
  ]

  return candidates.find((candidate) => STANDARD_OPEN_SHAPES[candidate]) ?? null
}

function getUniformStandardTuningOffset(tuningMidi: number[]): number | null {
  if (tuningMidi.length !== STANDARD_TUNING_MIDI.length) {
    return null
  }

  const offset = tuningMidi[0] - STANDARD_TUNING_MIDI[0]
  return tuningMidi.every((midi, index) => midi - STANDARD_TUNING_MIDI[index] === offset) ? offset : null
}

function buildTranslatedShape(
  relativeFrets: ShapeFret[],
  tuningMidi: number[],
  capoFret: number,
  maxFret: number,
  preferFlats: boolean,
  openChordShape?: string,
): TranslatedShape {
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
    openChordShape,
  }
}

function getShapeCacheKey({
  tuningMidi,
  chordTones,
  rootPitchClass,
  bassPitchClass,
  chordName,
  capoFret,
  maxFret,
  preferFlats,
}: SolveShapesInput): string {
  const tones = [...chordTones].sort((a, b) => a - b).join(',')
  return [
    tuningMidi.join(','),
    tones,
    rootPitchClass,
    bassPitchClass ?? 'root',
    chordName,
    capoFret,
    maxFret,
    preferFlats ? 'flat' : 'sharp',
  ].join('|')
}

function cloneTranslatedShape(shape: TranslatedShape): TranslatedShape {
  return {
    relativeFrets: [...shape.relativeFrets],
    absoluteFrets: [...shape.absoluteFrets],
    playable: shape.playable,
    notes: [...shape.notes],
    openChordShape: shape.openChordShape,
  }
}

function setShapeCache(cacheKey: string, shapes: TranslatedShape[]): void {
  if (shapeCache.size >= SHAPE_CACHE_LIMIT) {
    const oldestKey = shapeCache.keys().next().value
    if (oldestKey) {
      shapeCache.delete(oldestKey)
    }
  }

  shapeCache.set(cacheKey, shapes.map(cloneTranslatedShape))
}

function evaluateShape(
  frets: ShapeFret[],
  tuningMidi: number[],
  chordTones: Set<number>,
  rootPitchClass: number,
  bassPitchClass: number | undefined,
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

  const bass = sounding[0]
  if (bassPitchClass !== undefined && bass.pitchClass !== bassPitchClass) {
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
  const rootInBassBonus = bassPitchClass === undefined && bass.pitchClass === rootPitchClass ? -1 : 0
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
  const transposed = normalizePitchClass(keyPc - capoFret)
  return midiToNoteName(transposed, prefersFlatsForKey(key))
}
