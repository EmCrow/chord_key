import { getNashvilleChords } from '../domain/music/harmony'
import type { HarmonyMode } from '../domain/types'

interface NashvilleTableProps {
  keyNote: string
  harmonyMode: HarmonyMode
  activeDegree: number
  onSelectionChange: (nextKey: string, nextDegree: number, nextMode: HarmonyMode) => void
}

const KEY_SET = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
const NASHVILLE_ROWS = [
  ...KEY_SET.map((note) => ({ note, mode: 'major' as const, label: note })),
  ...KEY_SET.map((note) => ({ note, mode: 'minor' as const, label: `${note}m` })),
]

export function NashvilleTable({ keyNote, harmonyMode, activeDegree, onSelectionChange }: NashvilleTableProps) {
  const selectedChords = getNashvilleChords(keyNote, harmonyMode)

  return (
    <section className="panel nashville" aria-label="Nashville number system">
      <header>
        <h2>Nashville Number System</h2>
        <p>
          Top row is Roman numerals. First column is key/mode. Pick any cell to drive the active key, mode, and chord
          degree.
        </p>
      </header>

      <div className="nashville-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Key</th>
              {selectedChords.map((chord) => (
                <th scope="col" key={chord.degree}>
                  {chord.roman}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NASHVILLE_ROWS.map((row) => {
              const chords = getNashvilleChords(row.note, row.mode)
              const rowSelected = row.note === keyNote && row.mode === harmonyMode

              return (
                <tr key={`${row.note}-${row.mode}`} className={rowSelected ? 'active-row' : ''}>
                  <th scope="row">
                    <button
                      type="button"
                      className={`key-chip ${rowSelected ? 'active' : ''}`}
                      onClick={() => onSelectionChange(row.note, 1, row.mode)}
                    >
                      {row.label}
                    </button>
                  </th>
                  {chords.map((chord) => {
                    const isSelected = rowSelected && chord.degree === activeDegree
                    return (
                      <td key={`${row.note}-${row.mode}-${chord.degree}`}>
                        <button
                          type="button"
                          className={`chord-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => onSelectionChange(row.note, chord.degree, row.mode)}
                        >
                          {chord.chordName}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
