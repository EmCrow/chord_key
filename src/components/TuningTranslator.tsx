import type { CSSProperties } from 'react'
import { getShapeMidiNotes, playMidiChord, playMidiChordSequence } from '../domain/audio/playback'
import type { TranslationResult, TranslatedShape, TuningDef } from '../domain/types'
import { formatShape } from '../domain/translator/translate'

interface TuningTranslatorProps {
  progressionInput: string
  onProgressionChange: (nextValue: string) => void
  targetCapo: number
  originalTuning: TuningDef
  targetTuning: TuningDef
  translationResults: TranslationResult[]
}

function getShapeLabel(shape: TranslatedShape | null): string {
  if (!shape) {
    return 'Unplayable'
  }

  return shape.openChordShape ? `${shape.openChordShape} shape` : 'Generated shape'
}

export function TuningTranslator({
  progressionInput,
  onProgressionChange,
  targetCapo,
  originalTuning,
  targetTuning,
  translationResults,
}: TuningTranslatorProps) {
  const progressionGridStyle = {
    '--progression-count': Math.max(translationResults.length, 1),
  } as CSSProperties & Record<string, number>
  const originalProgressionChords = translationResults
    .map((result) => (result.originalShape ? getShapeMidiNotes(result.originalShape.absoluteFrets, originalTuning) : []))
    .filter((midiNotes) => midiNotes.length > 0)
  const translatedProgressionChords = translationResults
    .map((result) => (result.translatedShape ? getShapeMidiNotes(result.translatedShape.absoluteFrets, targetTuning) : []))
    .filter((midiNotes) => midiNotes.length > 0)
  const playShape = (shape: TranslatedShape | null, tuning: TuningDef) => {
    if (!shape) {
      return
    }

    playMidiChord(getShapeMidiNotes(shape.absoluteFrets, tuning))
  }
  const playProgression = (chords: number[][]) => {
    playMidiChordSequence(chords)
  }

  return (
    <section className="panel translator" aria-label="Tuning translator">
      <header>
        <h2>Tuning Translator</h2>
        <p>
          Enter chord letters like C G Am F. Original chords and capo chord shapes stay aligned left to right
          {targetCapo > 0 ? ` with capo at fret ${targetCapo}.` : '.'}
        </p>
      </header>

      <div className="translator-layout">
        <div className="translator-entry">
          <label className="progression-input">
            Chord Progression (Letters)
            <input
              value={progressionInput}
              onChange={(event) => onProgressionChange(event.target.value)}
              placeholder="Example: C G Am F | Dm G C"
            />
          </label>

          <div className="translator-table-wrap">
            <table>
              <caption>Chord Shape Lookup</caption>
              <colgroup>
                <col className="translator-col-chord" />
                <col className="translator-col-shape" />
                <col className="translator-col-frets" />
                <col className="translator-col-audio" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Original Chord</th>
                  <th scope="col">Open Shape</th>
                  <th scope="col">Frets</th>
                  <th scope="col">Hear</th>
                </tr>
              </thead>
              <tbody>
                {translationResults.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-row">
                      No valid letter chords found. Use tokens like C, G, Am, F, Dm7, or Bdim.
                    </td>
                  </tr>
                ) : (
                  translationResults.map((result, index) => (
                    <tr key={`${result.originalChordName}-${index}`}>
                      <td>
                        <strong className="translator-chord-name">{result.originalChordName}</strong>
                      </td>
                      <td>{getShapeLabel(result.translatedShape)}</td>
                      <td className="translator-frets">
                        {result.translatedShape ? formatShape(result.translatedShape.relativeFrets) : 'n/a'}
                      </td>
                      <td>
                        <div className="audio-button-group">
                          <button
                            type="button"
                            className="audio-button compact-audio-button"
                            disabled={!result.originalShape}
                            onClick={() => playShape(result.originalShape, originalTuning)}
                          >
                            Original
                          </button>
                          <button
                            type="button"
                            className="audio-button compact-audio-button"
                            disabled={!result.translatedShape}
                            onClick={() => playShape(result.translatedShape, targetTuning)}
                          >
                            Shape
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="progression-panel" aria-label="Chord progression before and after">
          <div className="progression-panel-header">
            <h3>Progression Alignment</h3>
            <div className="audio-button-group">
              <button
                type="button"
                className="audio-button compact-audio-button"
                disabled={originalProgressionChords.length === 0}
                aria-label="Hear original progression"
                onClick={() => playProgression(originalProgressionChords)}
              >
                Original
              </button>
              <button
                type="button"
                className="audio-button compact-audio-button"
                disabled={translatedProgressionChords.length === 0}
                aria-label="Hear translated progression"
                onClick={() => playProgression(translatedProgressionChords)}
              >
                Shape
              </button>
            </div>
          </div>
          <div className="progression-map progression-alignment-grid" style={progressionGridStyle}>
            <span className="progression-row-label progression-row-label-original">Original Chord</span>
            <span className="progression-row-label progression-row-label-shape">Open Shape</span>

            {translationResults.length === 0 ? (
              <small className="progression-empty progression-empty-both">Waiting for valid chords...</small>
            ) : (
              translationResults.map((result, index) => {
                const gridColumn = index + 2
                return (
                  <span className="progression-pair" key={`pair-${result.originalChordName}-${index}`}>
                    <button
                      type="button"
                      className="progression-chip original playable-chip"
                      style={{ gridColumn, gridRow: 1 }}
                      disabled={!result.originalShape}
                      onClick={() => playShape(result.originalShape, originalTuning)}
                    >
                      {result.originalChordName}
                    </button>
                    <button
                      type="button"
                      className="progression-chip translated playable-chip"
                      style={{ gridColumn, gridRow: 2 }}
                      disabled={!result.translatedShape}
                      onClick={() => playShape(result.translatedShape, targetTuning)}
                    >
                      {getShapeLabel(result.translatedShape)}
                    </button>
                  </span>
                )
              })
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
