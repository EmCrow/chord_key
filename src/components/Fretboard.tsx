import type { FretPosition, TuningDef } from '../domain/types'
import { normalizePitchClass, parseNoteName } from '../domain/music/notes'

interface FretboardProps {
  positions: FretPosition[]
  tuning: TuningDef
  keyNote: string
  scaleName: string
  cagedShape: string
  capoFret: number
  maxFret?: number
  showNoteNames: boolean
  showIntervals: boolean
}

const INTERVAL_NAMES = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']

function getIntervalLabel(keyPitchClass: number, pitchClass: number): string {
  const semitones = normalizePitchClass(pitchClass - keyPitchClass)
  return INTERVAL_NAMES[semitones]
}

export function Fretboard({
  positions,
  tuning,
  keyNote,
  scaleName,
  cagedShape,
  capoFret,
  maxFret = 15,
  showNoteNames,
  showIntervals,
}: FretboardProps) {
  const byStringAndFret = new Map<string, FretPosition>()
  const keyPitchClass = parseNoteName(keyNote)

  positions.forEach((position) => {
    byStringAndFret.set(`${position.stringIndex}-${position.fret}`, position)
  })

  return (
    <section className="panel fretboard" aria-label="15 fret fretboard">
      <header>
        <h2>Fretboard (Nut to Fret 15)</h2>
        <p>
          {scaleName} in {keyNote} with {cagedShape}-shape overlay on {tuning.label}
          {capoFret > 0 ? ` (capo at ${capoFret})` : ''}
        </p>
      </header>

      <div className="fretboard-table-wrap">
        <table>
          <thead>
            <tr>
              <th>String</th>
              {Array.from({ length: maxFret + 1 }, (_, fret) => (
                <th key={fret} className={capoFret > 0 && fret === capoFret ? 'capo-col' : ''}>
                  {fret}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tuning.strings.map((stringNote, stringIndex) => (
              <tr key={stringNote + stringIndex}>
                <th>{stringNote}</th>
                {Array.from({ length: maxFret + 1 }, (_, fret) => {
                  const position = byStringAndFret.get(`${stringIndex}-${fret}`)
                  if (!position) {
                    return <td key={fret} />
                  }

                  const noteClasses = [
                    'note-dot',
                    position.isScaleTone ? 'scale' : 'off-scale',
                    position.isInCagedShape ? 'caged' : '',
                    position.isRoot && position.isScaleTone ? 'root' : '',
                    position.isChordTone && position.isScaleTone ? 'chord' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  const label = showIntervals
                    ? getIntervalLabel(keyPitchClass, position.pitchClass)
                    : showNoteNames
                      ? position.noteName
                      : ''

                  const dimmed = !position.isScaleTone || (capoFret > 0 && fret < capoFret)
                  const fretClasses = [
                    capoFret > 0 && fret === capoFret ? 'capo-col' : '',
                    position.isInCagedShape ? 'scale-fret' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <td key={fret} className={fretClasses}>
                      <span className={`${noteClasses}${dimmed ? ' muted' : ''}`}>{label}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
