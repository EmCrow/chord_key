import type { CSSProperties } from 'react'
import type { TranslationResult, TranslatedShape } from '../domain/types'
import { formatShape } from '../domain/translator/translate'

interface TuningTranslatorProps {
  progressionInput: string
  onProgressionChange: (nextValue: string) => void
  targetCapo: number
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
  translationResults,
}: TuningTranslatorProps) {
  const progressionGridStyle = {
    '--progression-count': Math.max(translationResults.length, 1),
  } as CSSProperties & Record<string, number>

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
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Original Chord</th>
                  <th scope="col">Open Shape</th>
                  <th scope="col">Frets</th>
                </tr>
              </thead>
              <tbody>
                {translationResults.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-row">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="progression-panel" aria-label="Chord progression before and after">
          <h3>Progression Alignment</h3>
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
                  <strong className="progression-chip original" style={{ gridColumn, gridRow: 1 }}>
                    {result.originalChordName}
                  </strong>
                  <span className="progression-chip translated" style={{ gridColumn, gridRow: 2 }}>
                    {getShapeLabel(result.translatedShape)}
                  </span>
                </span>
              )})
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
