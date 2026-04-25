import type { ResearchSnapshot } from './schema'

export const VALID_RESEARCH_SNAPSHOT: ResearchSnapshot = {
  schemaVersion: 1,
  generatedAt: '2026-04-24T23:30:00.000Z',
  sources: [
    {
      sourceId: 'open-chords-dataset',
      name: 'Open Chords Dataset',
      sourceUrl: 'https://example.org/open-chords',
      license: 'MIT',
      retrievedAt: '2026-04-24T23:00:00.000Z',
      checksum: 'sha256-open-chords-001',
    },
    {
      sourceId: 'transposition-reference',
      name: 'Transposition Reference',
      sourceUrl: 'https://example.org/transposition-ref',
      license: 'CC0-1.0',
      retrievedAt: '2026-04-24T23:05:00.000Z',
      checksum: 'sha256-transposition-001',
    },
  ],
  voicings: [
    {
      voicingId: 'v-c-major-open',
      chordSymbol: 'C',
      rootNote: 'C',
      quality: 'maj',
      tuningId: 'standard',
      relativeFrets: ['x', 3, 2, 0, 1, 0],
      minFret: 0,
      maxFret: 3,
      playable: true,
      sourceId: 'open-chords-dataset',
    },
    {
      voicingId: 'v-d-major-open',
      chordSymbol: 'D',
      rootNote: 'D',
      quality: 'maj',
      tuningId: 'standard',
      relativeFrets: ['x', 'x', 0, 2, 3, 2],
      minFret: 0,
      maxFret: 3,
      playable: true,
      sourceId: 'open-chords-dataset',
    },
  ],
  transpositions: [
    {
      transpositionId: 't-c-to-d-open',
      fromChordSymbol: 'C',
      toChordSymbol: 'D',
      semitoneDelta: 2,
      fromVoicingId: 'v-c-major-open',
      toRelativeFrets: ['x', 'x', 0, 2, 3, 2],
      sourceId: 'transposition-reference',
    },
  ],
}

export const SHUFFLED_VALID_RESEARCH_SNAPSHOT: ResearchSnapshot = {
  schemaVersion: 1,
  generatedAt: VALID_RESEARCH_SNAPSHOT.generatedAt,
  sources: [...VALID_RESEARCH_SNAPSHOT.sources].reverse(),
  voicings: [...VALID_RESEARCH_SNAPSHOT.voicings].reverse(),
  transpositions: [...VALID_RESEARCH_SNAPSHOT.transpositions].reverse(),
}

export const INVALID_RESEARCH_SNAPSHOT_MISSING_SOURCE: unknown = {
  ...VALID_RESEARCH_SNAPSHOT,
  voicings: [
    {
      ...VALID_RESEARCH_SNAPSHOT.voicings[0],
      sourceId: 'missing-source',
    },
  ],
}

export const INVALID_RESEARCH_SNAPSHOT_BAD_FRETS: unknown = {
  ...VALID_RESEARCH_SNAPSHOT,
  voicings: [
    {
      ...VALID_RESEARCH_SNAPSHOT.voicings[0],
      relativeFrets: [0, 1, 2],
    },
  ],
}
