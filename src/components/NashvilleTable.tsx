import { getNashvilleChords } from '../domain/music/harmony'
import { getChordFunctionInfo, getNashvilleLearningSummary } from '../domain/music/learning'
import type { HarmonyMode } from '../domain/types'

interface NashvilleTableProps {
  keyNote: string
  harmonyMode: HarmonyMode
  activeDegree: number
  onSelectionChange: (nextKey: string, nextDegree: number, nextMode: HarmonyMode) => void
}

const COMMON_DEGREES = [1, 4, 5, 6]
const COMMON_MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const COMMON_MINOR_KEYS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D']

function getQualityLabel(quality: 'maj' | 'min' | 'dim'): string {
  if (quality === 'maj') {
    return 'major'
  }

  if (quality === 'min') {
    return 'minor'
  }

  return 'diminished'
}

export function NashvilleTable({ keyNote, harmonyMode, activeDegree, onSelectionChange }: NashvilleTableProps) {
  const selectedChords = getNashvilleChords(keyNote, harmonyMode)
  const commonKeyNotes = harmonyMode === 'major' ? COMMON_MAJOR_KEYS : COMMON_MINOR_KEYS
  const learningSummary = getNashvilleLearningSummary(keyNote, harmonyMode, activeDegree)
  const activeChordNotes = learningSummary.construction.map((note) => note.noteName)

  return (
    <section className="panel nashville" aria-label="Nashville number system">
      <header>
        <div className="panel-title-row">
          <h2>Nashville Number System</h2>
          <div className="nashville-selects">
            <label className="compact-select">
              Mode
              <select
                value={harmonyMode}
                onChange={(event) => onSelectionChange(keyNote, 1, event.target.value as HarmonyMode)}
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>
            </label>
          </div>
        </div>
        <div className="nashville-key-row" role="group" aria-label="Common keys">
          {commonKeyNotes.map((note) => {
            const active = note === keyNote
            const display = harmonyMode === 'major' ? note : `${note}m`
            return (
              <button
                type="button"
                key={note}
                className={`nashville-key-chip ${active ? 'active' : ''}`}
                aria-label={`Key ${display}`}
                onClick={() => onSelectionChange(note, 1, harmonyMode)}
              >
                {display}
              </button>
            )
          })}
        </div>
        <p>
          {harmonyMode === 'major' ? keyNote : `${keyNote}m`} Nashville rows with direct key and chord selection.
        </p>
      </header>

      <div className="nashville-compact">
        {selectedChords.map((chord) => (
          <button
            type="button"
            className={`nashville-degree-card ${
              chord.degree === activeDegree ? 'active' : ''
            } ${COMMON_DEGREES.includes(chord.degree) ? 'common' : 'secondary'}`}
            key={chord.degree}
            aria-label={`${chord.roman} ${chord.chordName} ${chord.degree}`}
            onClick={() => onSelectionChange(keyNote, chord.degree, harmonyMode)}
          >
            <span>{chord.roman}</span>
            <strong>{chord.chordName}</strong>
            <em>{getChordFunctionInfo(harmonyMode, chord.degree).family}</em>
            <small>{chord.degree}</small>
          </button>
        ))}
      </div>

      <div className="nashville-learning" aria-label="Nashville learning details">
        <article className="nashville-learning-card nashville-explainer">
          <span className="learning-eyebrow">Selected chord</span>
          <h3>
            {learningSummary.activeChord.roman} in {learningSummary.keyLabel}
          </h3>
          <p>
            {learningSummary.activeChord.roman} chord in {learningSummary.keyLabel} ={' '}
            <strong>{learningSummary.activeChord.chordName}</strong> {getQualityLabel(learningSummary.activeChord.quality)}
          </p>
          <dl>
            <div>
              <dt>Function</dt>
              <dd>{learningSummary.functionInfo.family}</dd>
            </div>
            <div>
              <dt>Use</dt>
              <dd>{learningSummary.functionInfo.commonUse}</dd>
            </div>
          </dl>
        </article>

        <article className="nashville-learning-card">
          <span className="learning-eyebrow">Chord construction</span>
          <h3>{learningSummary.activeChord.chordName}: {activeChordNotes.join(' ')}</h3>
          <div className="scale-note-row" aria-label={`${learningSummary.keyLabel} scale notes`}>
            {learningSummary.scaleNotes.map((note, index) => (
              <span key={`${note}-${index}`}>
                <small>{index + 1}</small>
                {note}
              </span>
            ))}
          </div>
          <p>
            Chord tones {learningSummary.construction.map((note) => note.chordTone).join(' ')} use scale degrees{' '}
            {learningSummary.construction.map((note) => note.scaleDegree).join(' ')}.
          </p>
        </article>

        <article className="nashville-learning-card">
          <span className="learning-eyebrow">Voice leading</span>
          <h3>
            {learningSummary.voiceLeading.sourceChord.chordName} {'->'}{' '}
            {learningSummary.voiceLeading.targetChord.chordName}
          </h3>
          <p>
            Common tones:{' '}
            <strong>
              {learningSummary.voiceLeading.commonTones.length > 0
                ? learningSummary.voiceLeading.commonTones.join(' ')
                : 'none'}
            </strong>
          </p>
          <div className="voice-leading-row">
            {learningSummary.voiceLeading.moves.map((move) => (
              <span key={`${move.fromNote}-${move.toNote}`}>
                {move.fromNote} {'->'} {move.toNote} <small>{move.direction} {move.semitones}</small>
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
