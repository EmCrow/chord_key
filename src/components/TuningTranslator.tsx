import type { TranslationResult } from '../domain/types'
import { formatShape } from '../domain/translator/translate'
import { ChordShapeChart } from './ChordShapeChart'

interface TuningTranslatorProps {
  progressionInput: string
  onProgressionChange: (nextValue: string) => void
  targetCapo: number
  translationResults: TranslationResult[]
}

export function TuningTranslator({
  progressionInput,
  onProgressionChange,
  targetCapo,
  translationResults,
}: TuningTranslatorProps) {
  return (
    <section className="panel translator" aria-label="Tuning translator">
      <header>
        <h2>Tuning Translator</h2>
        <p>
          Enter chord letters like C G Am F. Original and translated chord shapes are shown side by side
          {targetCapo > 0 ? ` with capo at fret ${targetCapo}.` : '.'}
        </p>
      </header>

      <div className="translator-layout">
        <div>
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
              <thead>
                <tr>
                  <th scope="col">Chord</th>
                  <th scope="col">Original Chord Shape</th>
                  <th scope="col">Translated Chord Shape</th>
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
                      <td>{result.originalChordName}</td>
                      <td>{result.originalShape ? formatShape(result.originalShape.relativeFrets) : 'n/a'}</td>
                      <td>{result.translatedShape ? formatShape(result.translatedShape.relativeFrets) : 'unplayable'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="progression-panel" aria-label="Chord progression before and after">
          <h3>Progression Before / After Shapes</h3>
          <div className="progression-row">
            <span>Before</span>
            <div className="progression-chords">
              {translationResults.length === 0 ? (
                <small>Waiting for valid chords...</small>
              ) : (
                translationResults.map((result, index) => (
                  <div className="progression-card progression-shape-card" key={`before-${result.originalChordName}-${index}`}>
                    <span className="progression-order">#{index + 1}</span>
                    <ChordShapeChart shape={result.originalShape} ariaLabel={`Before shape ${index + 1}`} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="progression-row">
            <span>After</span>
            <div className="progression-chords">
              {translationResults.length === 0 ? (
                <small>Waiting for valid chords...</small>
              ) : (
                translationResults.map((result, index) => (
                  <div className="progression-card progression-shape-card" key={`after-${result.originalChordName}-${index}`}>
                    <span className="progression-order">#{index + 1}</span>
                    <ChordShapeChart shape={result.translatedShape} ariaLabel={`After shape ${index + 1}`} />
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
