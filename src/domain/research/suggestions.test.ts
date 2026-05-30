import { describe, expect, it } from 'vitest'
import { getResearchSuggestionForChord, getResearchSuggestionsForChordSequence } from './suggestions'

describe('research suggestions', () => {
  it('keeps capo math invariant between relative and absolute frets', () => {
    const suggestion = getResearchSuggestionForChord({
      chordSymbol: 'C',
      tuningId: 'standard',
      capoFret: 2,
      maxFret: 15,
    })

    expect(suggestion).not.toBeNull()

    if (!suggestion) {
      throw new Error('Expected a suggestion for C in standard tuning.')
    }

    suggestion.relativeFrets.forEach((relativeFret, index) => {
      const absoluteFret = suggestion.absoluteFrets[index]
      if (relativeFret === 'x') {
        expect(absoluteFret).toBe('x')
      } else {
        expect(absoluteFret).toBe(relativeFret + 2)
      }
    })
  })

  it('handles unsupported chord tokens safely', () => {
    const sequence = getResearchSuggestionsForChordSequence({
      chordSymbols: ['C', '@@@', 'G'],
      tuningId: 'standard',
      capoFret: 0,
    })

    expect(sequence).toHaveLength(3)
    expect(sequence[0]).not.toBeNull()
    expect(sequence[1]).toBeNull()
    expect(sequence[2]).not.toBeNull()
  })

  it('uses standard tuning fallback when requested tuning has no local voicings', () => {
    const suggestion = getResearchSuggestionForChord({
      chordSymbol: 'C',
      tuningId: 'drop_d',
      capoFret: 0,
    })

    expect(suggestion).not.toBeNull()

    if (!suggestion) {
      throw new Error('Expected fallback suggestion for drop_d.')
    }

    expect(suggestion.tuningId).toBe('drop_d')
    expect(suggestion.fallbackTuningId).toBe('standard')
  })
})
