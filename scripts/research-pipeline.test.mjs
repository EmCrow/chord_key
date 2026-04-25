import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateResearchSnapshot } from '../src/domain/research/schema.ts'
import {
  checksumJson,
  ingestFromFetch,
  ingestFromPayloadMap,
  normalizeSourcePayload,
  stableStringify,
  writeResearchArtifacts,
} from './research-pipeline.mjs'

const SOURCE_CONFIGS = [
  {
    sourceId: 'szaza-c-major',
    name: 'szaza C major',
    sourceUrl: 'https://example.org/open.json',
    license: 'MIT',
    format: 'szaza_chord_positions',
    sourceType: 'dataset_ingest',
    tuningId: 'standard',
    validationSources: ['tombatossals-c-major'],
    fallbackSources: ['tombatossals-c-major'],
  },
  {
    sourceId: 'tombatossals-c-major',
    name: 'tombatossals C major',
    sourceUrl: 'https://example.org/tombatossals.json',
    license: 'CC0-1.0',
    format: 'tombatossals_guitar_lib',
    sourceType: 'dataset_validator',
    tuningId: 'standard',
    filter: {
      key: 'C',
      suffix: 'major',
    },
  },
]

const PAYLOAD_MAP = {
  'szaza-c-major': {
    key: 'C',
    suffix: 'major',
    positions: [
      {
        frets: 'x32010',
        fingers: '032010',
      },
      {
        frets: 'x35553',
        fingers: '012341',
      },
    ],
  },
  'tombatossals-c-major': {
    chords: {
      C: [
        {
          key: 'C',
          suffix: 'major',
          positions: [
            { frets: 'x32010', fingers: '032010' },
            { frets: 'x35553', fingers: '012341' },
          ],
        },
      ],
    },
  },
}

const CONFLICTING_PAYLOAD_MAP = {
  'szaza-c-major': PAYLOAD_MAP['szaza-c-major'],
  'tombatossals-c-major': {
    chords: {
      C: [
        {
          key: 'C',
          suffix: 'major',
          positions: [
            { frets: 'x13331', fingers: '012341' },
            { frets: '8aa988', fingers: '134211' },
          ],
        },
      ],
    },
  },
}

const LEGACY_PAYLOAD_MAP = {
  'open-chords-dataset': {
    voicings: [
      {
        voicingId: 'v-c-major-open',
        chordSymbol: 'C',
        rootNote: 'C',
        quality: 'maj',
        tuningId: 'standard',
        relativeFrets: ['x', 3, 2, 0, 1, 0],
      },
    ],
  },
}

describe('research pipeline', () => {
  it('ingests configured sources through fetch and produces a valid snapshot', async () => {
    const byUrl = new Map([
      ['https://example.org/open.json', PAYLOAD_MAP['szaza-c-major']],
      ['https://example.org/tombatossals.json', PAYLOAD_MAP['tombatossals-c-major']],
    ])

    const result = await ingestFromFetch({
      sourceConfigs: SOURCE_CONFIGS,
      fetchJson: async (source) => {
        const payload = byUrl.get(source.sourceUrl)
        if (!payload) {
          throw new Error(`Missing payload for ${source.sourceUrl}`)
        }
        return payload
      },
      generatedAt: '2026-04-25T00:00:00.000Z',
      retrievedAt: '2026-04-25T00:00:00.000Z',
    })

    expect(result.snapshot.sources).toHaveLength(2)
    expect(result.snapshot.voicings).toHaveLength(4)
    expect(result.snapshot.transpositions).toHaveLength(0)
    expect(result.indexes.voicingsByTuning.standard.length).toBeGreaterThan(0)
    expect(validateResearchSnapshot(result.snapshot).ok).toBe(true)
  })

  it('normalizes deterministically regardless of source and record order', () => {
    const reversedConfigs = [...SOURCE_CONFIGS].reverse()
    const reversedPayloadMap = {
      'szaza-c-major': {
        key: 'C',
        suffix: 'major',
        positions: [...PAYLOAD_MAP['szaza-c-major'].positions].reverse(),
      },
      'tombatossals-c-major': PAYLOAD_MAP['tombatossals-c-major'],
    }

    const first = ingestFromPayloadMap({
      sourceConfigs: SOURCE_CONFIGS,
      payloadMap: PAYLOAD_MAP,
      generatedAt: '2026-04-25T00:00:00.000Z',
      retrievedAt: '2026-04-25T00:00:00.000Z',
    })
    const second = ingestFromPayloadMap({
      sourceConfigs: reversedConfigs,
      payloadMap: reversedPayloadMap,
      generatedAt: '2026-04-25T00:00:00.000Z',
      retrievedAt: '2026-04-25T00:00:00.000Z',
    })

    expect(stableStringify(second.snapshot)).toBe(stableStringify(first.snapshot))
  })

  it('produces stable checksums and detects payload changes', () => {
    const checksumOne = checksumJson(LEGACY_PAYLOAD_MAP['open-chords-dataset'])
    const checksumTwo = checksumJson(LEGACY_PAYLOAD_MAP['open-chords-dataset'])
    const checksumThree = checksumJson({
      ...LEGACY_PAYLOAD_MAP['open-chords-dataset'],
      voicings: [...LEGACY_PAYLOAD_MAP['open-chords-dataset'].voicings, LEGACY_PAYLOAD_MAP['open-chords-dataset'].voicings[0]],
    })

    expect(checksumOne).toBe(checksumTwo)
    expect(checksumThree).not.toBe(checksumOne)
  })

  it('rejects non-permissive source licenses', () => {
    expect(() =>
      normalizeSourcePayload(
        {
          sourceId: 'non-permissive',
          name: 'Bad License Source',
          sourceUrl: 'https://example.org/bad.json',
          license: 'GPL-3.0',
          tuningId: 'standard',
        },
        LEGACY_PAYLOAD_MAP['open-chords-dataset'],
        '2026-04-25T00:00:00.000Z',
      ),
    ).toThrow(/non-permissive license/i)
  })

  it('parses real-world szaza chord payload format into normalized voicings', () => {
    const sourceConfig = {
      sourceId: 'szaza-c-major',
      name: 'szaza C major',
      sourceUrl: 'https://raw.githubusercontent.com/szaza/guitar-chords-db-json/master/C/major.json',
      license: 'MIT',
      format: 'szaza_chord_positions',
      tuningId: 'standard',
    }

    const payload = {
      key: 'C',
      suffix: 'major',
      positions: [
        { frets: 'x32010', fingers: '032010' },
        { frets: 'x35553', fingers: '012341' },
      ],
    }

    const normalized = normalizeSourcePayload(sourceConfig, payload, '2026-04-25T00:00:00.000Z')

    expect(normalized.voicings).toHaveLength(2)
    expect(normalized.voicings[0].chordSymbol).toBe('C')
    expect(normalized.voicings[0].quality).toBe('maj')
    expect(normalized.voicings[0].relativeFrets).toEqual(['x', 3, 2, 0, 1, 0])
    expect(normalized.voicings[0].tuningId).toBe('standard')
  })

  it('fails ingestion when validator source conflicts and no shared voicing signatures are found', () => {
    expect(() =>
      ingestFromPayloadMap({
        sourceConfigs: SOURCE_CONFIGS,
        payloadMap: CONFLICTING_PAYLOAD_MAP,
        generatedAt: '2026-04-25T00:00:00.000Z',
        retrievedAt: '2026-04-25T00:00:00.000Z',
      }),
    ).toThrow(/Cross-source validation failed/i)
  })

  it('writes normalized snapshot, raw payloads, and indexes to disk', async () => {
    const workspace = await mkdtemp(resolve(tmpdir(), 'research-pipeline-'))
    const result = ingestFromPayloadMap({
      sourceConfigs: SOURCE_CONFIGS,
      payloadMap: PAYLOAD_MAP,
      generatedAt: '2026-04-25T00:00:00.000Z',
      retrievedAt: '2026-04-25T00:00:00.000Z',
    })

    await writeResearchArtifacts(result, workspace)

    const snapshot = JSON.parse(await readFile(resolve(workspace, 'normalized/snapshot.v1.json'), 'utf8'))
    const rawSource = JSON.parse(await readFile(resolve(workspace, 'raw/szaza-c-major.json'), 'utf8'))
    const chordIndex = JSON.parse(await readFile(resolve(workspace, 'indexes/chords-by-symbol.json'), 'utf8'))

    expect(snapshot.schemaVersion).toBe(1)
    expect(rawSource.key).toBe('C')
    expect(rawSource.positions).toHaveLength(2)
    expect(chordIndex.C.length).toBeGreaterThan(0)
  })
})
