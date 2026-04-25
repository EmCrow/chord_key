import { describe, expect, it } from 'vitest'
import { VALID_RESEARCH_SNAPSHOT } from './fixtures'
import { createResearchRepository } from './repository'

describe('research repository', () => {
  it('finds voicings for a chord and tuning using offline snapshot data', () => {
    const repository = createResearchRepository(VALID_RESEARCH_SNAPSHOT)
    const results = repository.findVoicings({
      chordSymbol: 'C',
      tuningId: 'standard',
      maxFret: 15,
    })

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].chordSymbol).toBe('C')
    expect(results[0].tuningId).toBe('standard')
    expect(results.every((entry) => entry.maxFret <= 15)).toBe(true)
  })

  it('applies max-fret filtering and returns no match when constraints are too strict', () => {
    const repository = createResearchRepository(VALID_RESEARCH_SNAPSHOT)
    const results = repository.findVoicings({
      chordSymbol: 'C',
      tuningId: 'standard',
      maxFret: 1,
    })

    expect(results).toEqual([])
  })

  it('returns transposition matches for a requested chord movement', () => {
    const repository = createResearchRepository(VALID_RESEARCH_SNAPSHOT)
    const results = repository.findTranspositions({
      fromChordSymbol: 'C',
      toChordSymbol: 'D',
    })

    expect(results).toHaveLength(1)
    expect(results[0].fromChordSymbol).toBe('C')
    expect(results[0].toChordSymbol).toBe('D')
    expect(results[0].semitoneDelta).toBe(2)
  })

  it('returns source trace metadata for voicing provenance', () => {
    const repository = createResearchRepository(VALID_RESEARCH_SNAPSHOT)
    const voicings = repository.findVoicings({
      chordSymbol: 'C',
      tuningId: 'standard',
    })
    const trace = repository.getSourceTraceForVoicing(voicings[0].voicingId)

    expect(trace).not.toBeNull()
    expect(trace?.sourceId).toBe('open-chords-dataset')
    expect(trace?.license).toBe('MIT')
  })
})
