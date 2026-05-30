import snapshotPayload from '../../../data/research/normalized/snapshot.v1.json?raw'
import type { ResearchSuggestion } from '../types'
import { createResearchRepository, type ResearchRepository } from './repository'
import { parseResearchSnapshot } from './schema'

const DEFAULT_MAX_FRET = 15
const DEFAULT_FALLBACK_TUNING_ID = 'standard'

interface ResearchSuggestionInput {
  chordSymbol: string
  tuningId: string
  capoFret: number
  maxFret?: number
}

interface ResearchSuggestionSequenceInput {
  chordSymbols: string[]
  tuningId: string
  capoFret: number
  maxFret?: number
}

let cachedRepository: ResearchRepository | null | undefined

function getRepository(): ResearchRepository | null {
  if (cachedRepository !== undefined) {
    return cachedRepository
  }

  try {
    const snapshot = parseResearchSnapshot(snapshotPayload)
    cachedRepository = createResearchRepository(snapshot)
  } catch {
    cachedRepository = null
  }

  return cachedRepository
}

function toAbsoluteFrets(relativeFrets: Array<number | 'x'>, capoFret: number): Array<number | 'x'> {
  return relativeFrets.map((fret) => (fret === 'x' ? 'x' : fret + capoFret))
}

function fitsWithinVisibleRange(absoluteFrets: Array<number | 'x'>, maxFret: number): boolean {
  return absoluteFrets.every((fret) => fret === 'x' || fret <= maxFret)
}

function findTopSuggestion({
  chordSymbol,
  tuningId,
  capoFret,
  maxFret,
}: {
  chordSymbol: string
  tuningId: string
  capoFret: number
  maxFret: number
}): {
  suggestion: ResearchSuggestion | null
  usedFallback: boolean
} {
  const repository = getRepository()
  if (!repository) {
    return { suggestion: null, usedFallback: false }
  }

  const normalizedChord = chordSymbol.trim()
  if (!normalizedChord) {
    return { suggestion: null, usedFallback: false }
  }

  const maxRelativeFret = Math.max(0, maxFret - capoFret)
  const directMatch = repository.findVoicings({
    chordSymbol: normalizedChord,
    tuningId,
    maxFret: maxRelativeFret,
    requirePlayable: true,
    limit: 1,
  })[0]

  let match = directMatch
  let usedFallback = false

  if (!match && tuningId !== DEFAULT_FALLBACK_TUNING_ID) {
    match = repository.findVoicings({
      chordSymbol: normalizedChord,
      tuningId: DEFAULT_FALLBACK_TUNING_ID,
      maxFret: maxRelativeFret,
      requirePlayable: true,
      limit: 1,
    })[0]
    usedFallback = Boolean(match)
  }

  if (!match) {
    return { suggestion: null, usedFallback: false }
  }

  const absoluteFrets = toAbsoluteFrets(match.relativeFrets, capoFret)
  if (!fitsWithinVisibleRange(absoluteFrets, maxFret)) {
    return { suggestion: null, usedFallback: false }
  }

  const sourceTrace = repository.getSourceTraceForVoicing(match.voicingId) ?? repository.getSourceTrace(match.sourceId)
  const suggestion: ResearchSuggestion = {
    chordSymbol: match.chordSymbol,
    tuningId,
    relativeFrets: [...match.relativeFrets],
    absoluteFrets,
    sourceId: match.sourceId,
    sourceName: sourceTrace?.name ?? match.sourceId,
    fallbackTuningId: usedFallback ? DEFAULT_FALLBACK_TUNING_ID : undefined,
  }

  return {
    suggestion,
    usedFallback,
  }
}

export function getResearchSuggestionForChord({
  chordSymbol,
  tuningId,
  capoFret,
  maxFret = DEFAULT_MAX_FRET,
}: ResearchSuggestionInput): ResearchSuggestion | null {
  return findTopSuggestion({
    chordSymbol,
    tuningId,
    capoFret,
    maxFret,
  }).suggestion
}

export function getResearchSuggestionsForChordSequence({
  chordSymbols,
  tuningId,
  capoFret,
  maxFret = DEFAULT_MAX_FRET,
}: ResearchSuggestionSequenceInput): Array<ResearchSuggestion | null> {
  return chordSymbols.map((chordSymbol) =>
    getResearchSuggestionForChord({
      chordSymbol,
      tuningId,
      capoFret,
      maxFret,
    }),
  )
}
