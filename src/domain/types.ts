export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D'
export type HarmonyMode = 'major' | 'minor'

export interface NashvilleChord {
  degree: number
  roman: string
  quality: 'maj' | 'min' | 'dim'
  symbol: string
  chordName: string
  rootPitchClass: number
  intervals: number[]
  chordPitchClasses: number[]
}

export interface FretPosition {
  stringIndex: number
  fret: number
  absoluteFret: number
  pitchClass: number
  noteName: string
  isScaleTone: boolean
  isRoot: boolean
  isInCagedShape: boolean
  isChordTone: boolean
}

export interface TuningDef {
  id: string
  label: string
  strings: string[]
}

export interface TranslationOptions {
  capoFret: number
  maxFret: number
}

export interface TranslatedShape {
  relativeFrets: Array<number | 'x'>
  absoluteFrets: Array<number | 'x'>
  playable: boolean
  notes: string[]
}

export interface TranslationResult {
  originalChordName: string
  translatedChordName: string
  originalShape: TranslatedShape | null
  translatedShape: TranslatedShape | null
}

export interface ResearchVoicingQuery {
  chordSymbol: string
  tuningId: string
  maxFret?: number
  requirePlayable?: boolean
  limit?: number
}

export interface ResearchVoicingMatch {
  voicingId: string
  chordSymbol: string
  tuningId: string
  relativeFrets: Array<number | 'x'>
  minFret: number
  maxFret: number
  playable: boolean
  sourceId: string
  score: number
}

export interface ResearchTranspositionQuery {
  fromChordSymbol: string
  toChordSymbol?: string
  fromVoicingId?: string
  limit?: number
}

export interface ResearchTranspositionMatch {
  transpositionId: string
  fromChordSymbol: string
  toChordSymbol: string
  semitoneDelta: number
  fromVoicingId: string
  toRelativeFrets: Array<number | 'x'>
  sourceId: string
}
