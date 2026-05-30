import { getNashvilleChords } from '../domain/music/harmony'
import type { HarmonyMode } from '../domain/types'

interface NashvilleTableProps {
  keyNote: string
  harmonyMode: HarmonyMode
  activeDegree: number
  onSelectionChange: (nextKey: string, nextDegree: number, nextMode: HarmonyMode) => void
}

const COMMON_DEGREES = [1, 4, 5, 6]

export function NashvilleTable({ keyNote, harmonyMode, activeDegree, onSelectionChange }: NashvilleTableProps) {
  const selectedChords = getNashvilleChords(keyNote, harmonyMode)
  const commonChords = selectedChords.filter((chord) => COMMON_DEGREES.includes(chord.degree))
  const lessCommonChords = selectedChords.filter((chord) => !COMMON_DEGREES.includes(chord.degree))
  const activeLessCommonDegree = lessCommonChords.some((chord) => chord.degree === activeDegree) ? String(activeDegree) : ''

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
            <label className="compact-select">
              More
              <select
                value={activeLessCommonDegree}
                onChange={(event) => {
                  if (event.target.value) {
                    onSelectionChange(keyNote, Number(event.target.value), harmonyMode)
                  }
                }}
              >
                <option value="">2, 3, 7</option>
                {lessCommonChords.map((chord) => (
                  <option key={chord.degree} value={chord.degree}>
                    {chord.roman} - {chord.chordName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <p>
          {harmonyMode === 'major' ? keyNote : `${keyNote}m`} common session chords first; less common degrees stay in
          the dropdown.
        </p>
      </header>

      <div className="nashville-compact">
        {commonChords.map((chord) => (
          <button
            type="button"
            className={`nashville-degree-card ${chord.degree === activeDegree ? 'active' : ''}`}
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
