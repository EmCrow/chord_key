import type {
  ResearchTranspositionMatch,
  ResearchTranspositionQuery,
  ResearchVoicingMatch,
  ResearchVoicingQuery,
} from '../types'
import type { ResearchSnapshot, ResearchSourceMeta } from './schema'

function normalizeChordSymbol(value: string): string {
  return value.trim().toLowerCase()
}

function scoreVoicing(relativeFrets: Array<number | 'x'>, minFret: number): number {
  const numericFrets = relativeFrets.filter((value): value is number => typeof value === 'number')
  const mutedCount = relativeFrets.filter((value) => value === 'x').length
  const spread = numericFrets.length > 0 ? Math.max(...numericFrets) - Math.min(...numericFrets) : 0
  const openCount = numericFrets.filter((value) => value === 0).length
  return mutedCount * 1.2 + spread * 0.9 + minFret * 0.15 - openCount * 0.2
}

export interface ResearchRepository {
  findVoicings: (query: ResearchVoicingQuery) => ResearchVoicingMatch[]
  findTranspositions: (query: ResearchTranspositionQuery) => ResearchTranspositionMatch[]
  getSourceTrace: (sourceId: string) => ResearchSourceMeta | null
  getSourceTraceForVoicing: (voicingId: string) => ResearchSourceMeta | null
}

export function createResearchRepository(snapshot: ResearchSnapshot): ResearchRepository {
  const sourceById = new Map(snapshot.sources.map((source) => [source.sourceId, source]))
  const voicingById = new Map(snapshot.voicings.map((voicing) => [voicing.voicingId, voicing]))
  const voicingsByChord = new Map<string, typeof snapshot.voicings>()

  for (const voicing of snapshot.voicings) {
    const key = normalizeChordSymbol(voicing.chordSymbol)
    if (!voicingsByChord.has(key)) {
      voicingsByChord.set(key, [])
    }
    voicingsByChord.get(key)?.push(voicing)
  }

  return {
    findVoicings(query) {
      const normalizedChord = normalizeChordSymbol(query.chordSymbol)
      const limit = query.limit ?? 5
      const maxFret = query.maxFret ?? 15
      const requirePlayable = query.requirePlayable ?? true
      const candidates = voicingsByChord.get(normalizedChord) ?? []

      return candidates
        .filter((voicing) => voicing.tuningId === query.tuningId)
        .filter((voicing) => voicing.maxFret <= maxFret)
        .filter((voicing) => (requirePlayable ? voicing.playable : true))
        .map((voicing) => ({
          voicingId: voicing.voicingId,
          chordSymbol: voicing.chordSymbol,
          tuningId: voicing.tuningId,
          relativeFrets: [...voicing.relativeFrets],
          minFret: voicing.minFret,
          maxFret: voicing.maxFret,
          playable: voicing.playable,
          sourceId: voicing.sourceId,
          score: scoreVoicing(voicing.relativeFrets, voicing.minFret),
        }))
        .sort((left, right) => left.score - right.score || left.voicingId.localeCompare(right.voicingId))
        .slice(0, Math.max(1, limit))
    },

    findTranspositions(query) {
      const normalizedFrom = normalizeChordSymbol(query.fromChordSymbol)
      const normalizedTo = query.toChordSymbol ? normalizeChordSymbol(query.toChordSymbol) : null
      const limit = query.limit ?? 10

      return snapshot.transpositions
        .filter((entry) => normalizeChordSymbol(entry.fromChordSymbol) === normalizedFrom)
        .filter((entry) => (normalizedTo ? normalizeChordSymbol(entry.toChordSymbol) === normalizedTo : true))
        .filter((entry) => (query.fromVoicingId ? entry.fromVoicingId === query.fromVoicingId : true))
        .map((entry) => ({
          transpositionId: entry.transpositionId,
          fromChordSymbol: entry.fromChordSymbol,
          toChordSymbol: entry.toChordSymbol,
          semitoneDelta: entry.semitoneDelta,
          fromVoicingId: entry.fromVoicingId,
          toRelativeFrets: [...entry.toRelativeFrets],
          sourceId: entry.sourceId,
        }))
        .sort((left, right) => left.transpositionId.localeCompare(right.transpositionId))
        .slice(0, Math.max(1, limit))
    },

    getSourceTrace(sourceId) {
      return sourceById.get(sourceId) ?? null
    },

    getSourceTraceForVoicing(voicingId) {
      const voicing = voicingById.get(voicingId)
      if (!voicing) {
        return null
      }

      return sourceById.get(voicing.sourceId) ?? null
    },
  }
}
