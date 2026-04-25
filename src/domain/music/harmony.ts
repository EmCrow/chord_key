import type { HarmonyMode, NashvilleChord } from '../types'
import { normalizePitchClass, parseNoteName, pitchClassToNote, prefersFlatsForKey } from './notes'

const MAJOR_DEGREE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]
const MAJOR_DEGREE_QUALITIES: Array<'maj' | 'min' | 'dim'> = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
const MAJOR_ROMAN_NUMERALS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']

const MINOR_DEGREE_INTERVALS = [0, 2, 3, 5, 7, 8, 10]
const MINOR_DEGREE_QUALITIES: Array<'maj' | 'min' | 'dim'> = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']
const MINOR_ROMAN_NUMERALS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']

export interface ParsedNashvilleToken {
  raw: string
  degree: number
  quality: 'maj' | 'min' | 'dim'
  seventh?: 'maj7' | 'min7' | 'dom7' | 'dim7'
}

function getDegreeIntervals(mode: HarmonyMode): number[] {
  return mode === 'major' ? MAJOR_DEGREE_INTERVALS : MINOR_DEGREE_INTERVALS
}

function getDegreeQualities(mode: HarmonyMode): Array<'maj' | 'min' | 'dim'> {
  return mode === 'major' ? MAJOR_DEGREE_QUALITIES : MINOR_DEGREE_QUALITIES
}

function getRomanNumerals(mode: HarmonyMode): string[] {
  return mode === 'major' ? MAJOR_ROMAN_NUMERALS : MINOR_ROMAN_NUMERALS
}

export function getChordIntervals(
  quality: 'maj' | 'min' | 'dim',
  seventh?: 'maj7' | 'min7' | 'dom7' | 'dim7',
): number[] {
  const triad = quality === 'maj' ? [0, 4, 7] : quality === 'min' ? [0, 3, 7] : [0, 3, 6]

  if (!seventh) {
    return triad
  }

  if (seventh === 'maj7') {
    return [...triad, 11]
  }

  if (seventh === 'dim7') {
    return [...triad, 9]
  }

  return [...triad, 10]
}

function getChordSymbol(quality: 'maj' | 'min' | 'dim', seventh?: ParsedNashvilleToken['seventh']): string {
  if (quality === 'maj' && !seventh) {
    return ''
  }

  if (quality === 'min' && !seventh) {
    return 'm'
  }

  if (quality === 'dim' && !seventh) {
    return 'dim'
  }

  if (quality === 'maj' && seventh === 'maj7') {
    return 'maj7'
  }

  if (quality === 'maj' && seventh === 'dom7') {
    return '7'
  }

  if (quality === 'min' && seventh === 'min7') {
    return 'm7'
  }

  if (quality === 'dim' && seventh === 'dim7') {
    return 'dim7'
  }

  return quality === 'min' ? 'm7' : '7'
}

export function getNashvilleChords(keyNote: string, mode: HarmonyMode = 'major'): NashvilleChord[] {
  const rootPc = parseNoteName(keyNote)
  const preferFlats = prefersFlatsForKey(keyNote)
  const degreeIntervals = getDegreeIntervals(mode)
  const degreeQualities = getDegreeQualities(mode)
  const romanNumerals = getRomanNumerals(mode)

  return degreeIntervals.map((interval, index) => {
    const degree = index + 1
    const quality = degreeQualities[index]
    const rootPitchClass = normalizePitchClass(rootPc + interval)
    const symbol = getChordSymbol(quality)
    const chordName = `${pitchClassToNote(rootPitchClass, preferFlats)}${symbol}`
    const chordIntervals = getChordIntervals(quality)

    return {
      degree,
      roman: romanNumerals[index],
      quality,
      symbol,
      chordName,
      rootPitchClass,
      intervals: chordIntervals,
      chordPitchClasses: chordIntervals.map((chordInterval) => normalizePitchClass(rootPitchClass + chordInterval)),
    }
  })
}

export function parseNashvilleProgression(progression: string, mode: HarmonyMode = 'major'): ParsedNashvilleToken[] {
  const tokens = progression
    .split(/\s+|\|/)
    .map((token) => token.trim())
    .filter(Boolean)

  const parsed: ParsedNashvilleToken[] = []

  for (const token of tokens) {
    const match = token.match(/^([1-7])(maj7|m7|dim7|dim|m|7)?$/i)
    if (!match) {
      continue
    }

    const degree = Number(match[1])
    const suffix = (match[2] ?? '').toLowerCase()
    const defaultQuality = getDegreeQualities(mode)[degree - 1]

    if (suffix === 'm') {
      parsed.push({ raw: token, degree, quality: 'min' })
      continue
    }

    if (suffix === 'dim') {
      parsed.push({ raw: token, degree, quality: 'dim' })
      continue
    }

    if (suffix === 'maj7') {
      parsed.push({ raw: token, degree, quality: 'maj', seventh: 'maj7' })
      continue
    }

    if (suffix === 'm7') {
      parsed.push({ raw: token, degree, quality: 'min', seventh: 'min7' })
      continue
    }

    if (suffix === 'dim7') {
      parsed.push({ raw: token, degree, quality: 'dim', seventh: 'dim7' })
      continue
    }

    if (suffix === '7') {
      const seventh = defaultQuality === 'maj' ? 'dom7' : defaultQuality === 'min' ? 'min7' : 'dim7'
      parsed.push({ raw: token, degree, quality: defaultQuality, seventh })
      continue
    }

    parsed.push({ raw: token, degree, quality: defaultQuality })
  }

  return parsed
}

export function buildChordFromNashvilleToken(
  keyNote: string,
  token: ParsedNashvilleToken,
  mode: HarmonyMode = 'major',
): NashvilleChord {
  const keyPc = parseNoteName(keyNote)
  const preferFlats = prefersFlatsForKey(keyNote)
  const degreeInterval = getDegreeIntervals(mode)[token.degree - 1]
  const romanNumerals = getRomanNumerals(mode)
  const rootPitchClass = normalizePitchClass(keyPc + degreeInterval)
  const intervals = getChordIntervals(token.quality, token.seventh)
  const chordPitchClasses = intervals.map((interval) => normalizePitchClass(rootPitchClass + interval))
  const symbol = getChordSymbol(token.quality, token.seventh)

  return {
    degree: token.degree,
    roman: romanNumerals[token.degree - 1],
    quality: token.quality,
    symbol,
    chordName: `${pitchClassToNote(rootPitchClass, preferFlats)}${symbol}`,
    rootPitchClass,
    intervals,
    chordPitchClasses,
  }
}
