import { useMemo } from 'react'
import type { FretPosition, ResearchSuggestion, TuningDef } from '../domain/types'
import { normalizePitchClass, parseNoteName } from '../domain/music/notes'
import { formatShape } from '../domain/translator/translate'

interface FretboardProps {
  positions: FretPosition[]
  tuning: TuningDef
  keyNote: string
  scaleName: string
  cagedShape: string
  capoFret: number
  activeResearchSuggestion: ResearchSuggestion | null
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
  activeResearchSuggestion,
  maxFret = 15,
  showNoteNames,
  showIntervals,
}: FretboardProps) {
  const keyPitchClass = parseNoteName(keyNote)
  const byStringAndFret = useMemo(() => {
    const nextMap = new Map<string, FretPosition>()
    positions.forEach((position) => {
      nextMap.set(`${position.stringIndex}-${position.fret}`, position)
    })
    return nextMap
  }, [positions])
  const displayStringIndexes = useMemo(() => tuning.strings.map((_, index) => index).reverse(), [tuning.strings])

  return (
    <section className="panel fretboard" aria-label="15 fret fretboard">
      <header>
        <h2>Fretboard (Nut to Fret 15)</h2>
        <p>
          {scaleName} in {keyNote} with {cagedShape}-shape overlay on {tuning.label}
          {capoFret > 0 ? ` (capo at ${capoFret})` : ''}
        </p>
        <p className="research-inline">
          {activeResearchSuggestion ? (
            <>
              Research voicing: {activeResearchSuggestion.chordSymbol} {formatShape(activeResearchSuggestion.relativeFrets)}.
              Source: {activeResearchSuggestion.sourceName}
              {activeResearchSuggestion.fallbackTuningId
                ? ` (fallback tuning ${activeResearchSuggestion.fallbackTuningId})`
                : ''}
              .
            </>
          ) : (
            `Research voicing: no verified local shape for current active chord on ${tuning.id}.`
          )}
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
            {displayStringIndexes.map((stringIndex) => {
              const stringNote = tuning.strings[stringIndex]

              return (
                <tr key={stringNote + stringIndex}>
                  <th scope="row">{stringNote}</th>
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
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
