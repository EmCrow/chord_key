import { getNashvilleChords } from '../domain/music/harmony'
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

export function NashvilleTable({ keyNote, harmonyMode, activeDegree, onSelectionChange }: NashvilleTableProps) {
  const selectedChords = getNashvilleChords(keyNote, harmonyMode)
  const commonKeyNotes = harmonyMode === 'major' ? COMMON_MAJOR_KEYS : COMMON_MINOR_KEYS

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
            <small>{chord.degree}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
