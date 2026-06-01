import { useMemo, type CSSProperties } from 'react'
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
  const activeShapeFrets = useMemo(() => {
    const nextSet = new Set<string>()
    activeResearchSuggestion?.absoluteFrets.forEach((fret, stringIndex) => {
      if (fret !== 'x') {
        nextSet.add(`${stringIndex}-${fret}`)
      }
    })
    return nextSet
  }, [activeResearchSuggestion])
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

      <div className="fretboard-legend" aria-label="Fretboard highlighting legend">
        <span>
          <i className="legend-dot root" aria-hidden="true" />
          Home note
        </span>
        <span>
          <i className="legend-dot scale" aria-hidden="true" />
          In the scale
        </span>
        <span>
          <i className="legend-dot chord" aria-hidden="true" />
          Chord color
        </span>
        <span>
          <i className="legend-dot chord-shape" aria-hidden="true" />
          Chord shape
        </span>
        <span>
          <i className="legend-dot caged" aria-hidden="true" />
          Shape zone
        </span>
      </div>

      <div className="fretboard-table-wrap">
        <div className="fretboard-read-guide" aria-hidden="true">
          <span>Start at the nut</span>
          <strong>{cagedShape} shape practice zone</strong>
          <span>soft glow marks the selected CAGED shape</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>String</th>
              {Array.from({ length: maxFret + 1 }, (_, fret) => {
                const headerClasses = [
                  fret === 0 ? 'nut-col' : '',
                  capoFret > 0 && fret === capoFret ? 'capo-col' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <th key={fret} className={headerClasses} aria-label={fret === 0 ? 'Nut' : undefined}>
                    {fret === 0 ? (
                      <span className="nut-badge" aria-hidden="true">
                        <i />
                        <small>nut</small>
                      </span>
                    ) : (
                      fret
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayStringIndexes.map((stringIndex) => {
              const stringNote = tuning.strings[stringIndex]
              const stringGauge = 1.6 + (tuning.strings.length - 1 - stringIndex) * 0.55

              return (
                <tr
                  key={stringNote + stringIndex}
                  className="fretboard-string-row"
                  style={{ '--string-gauge': `${stringGauge}px` } as CSSProperties & Record<string, string>}
                >
                  <th scope="row">{stringNote}</th>
                  {Array.from({ length: maxFret + 1 }, (_, fret) => {
                    const position = byStringAndFret.get(`${stringIndex}-${fret}`)
                    if (!position) {
                      return <td key={fret} />
                    }

                    const isActiveShapeFret = activeShapeFrets.has(`${stringIndex}-${fret}`)
                    const noteClasses = [
                      'note-dot',
                      position.isScaleTone ? 'scale' : 'off-scale',
                      position.isInCagedShape ? 'caged' : '',
                      isActiveShapeFret ? 'chord-shape' : '',
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
                      'fretboard-string-cell',
                      fret === 0 ? 'open-string-cell' : '',
                      capoFret > 0 && fret === capoFret ? 'capo-col' : '',
                      position.isScaleTone ? 'scale-tone-cell' : 'off-scale-cell',
                      position.isRoot && position.isScaleTone ? 'root-tone-cell' : '',
                      position.isChordTone && position.isScaleTone ? 'chord-tone-cell' : '',
                      position.isInCagedWindow ? 'caged-window-cell' : '',
                      position.isInCagedShape ? 'scale-fret' : '',
                      isActiveShapeFret ? 'chord-shape-cell' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')

                    return (
                      <td
                        key={fret}
                        className={fretClasses}
                        aria-label={`${stringNote} string fret ${fret}: ${position.noteName}${
                          position.isScaleTone ? ', scale tone' : ', off scale'
                        }${position.isInCagedWindow ? `, ${cagedShape} CAGED shape zone` : ''}${
                          position.isRoot ? ', root' : ''
                        }${position.isChordTone ? ', active chord tone' : ''}${
                          isActiveShapeFret ? ', selected chord shape fret' : ''
                        }`}
                      >
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
