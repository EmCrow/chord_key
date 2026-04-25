import { describe, expect, it } from 'vitest'
import {
  INVALID_RESEARCH_SNAPSHOT_BAD_FRETS,
  INVALID_RESEARCH_SNAPSHOT_MISSING_SOURCE,
  SHUFFLED_VALID_RESEARCH_SNAPSHOT,
  VALID_RESEARCH_SNAPSHOT,
} from './fixtures'
import {
  parseResearchSnapshot,
  serializeResearchSnapshot,
  validateResearchSnapshot,
} from './schema'

describe('research schema validation', () => {
  it('accepts a valid snapshot fixture', () => {
    const result = validateResearchSnapshot(VALID_RESEARCH_SNAPSHOT)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects fixture entries that reference a missing source', () => {
    const result = validateResearchSnapshot(INVALID_RESEARCH_SNAPSHOT_MISSING_SOURCE)
    expect(result.ok).toBe(false)
    expect(result.errors.some((error) => error.includes('references missing sourceId'))).toBe(true)
  })

  it('rejects fixture entries with invalid fret arrays', () => {
    const result = validateResearchSnapshot(INVALID_RESEARCH_SNAPSHOT_BAD_FRETS)
    expect(result.ok).toBe(false)
    expect(result.errors.some((error) => error.includes('must contain exactly 6 strings'))).toBe(true)
  })
})

describe('research snapshot parsing and serialization', () => {
  it('parses a valid JSON payload into a validated snapshot', () => {
    const parsed = parseResearchSnapshot(JSON.stringify(VALID_RESEARCH_SNAPSHOT))
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.voicings).toHaveLength(2)
  })

  it('serializes deterministically independent of fixture ordering', () => {
    const canonical = serializeResearchSnapshot(VALID_RESEARCH_SNAPSHOT)
    const shuffled = serializeResearchSnapshot(SHUFFLED_VALID_RESEARCH_SNAPSHOT)
    expect(shuffled).toBe(canonical)
  })
})
