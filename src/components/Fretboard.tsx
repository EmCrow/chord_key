import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
} from 'react'
import {
  type ScalePlaybackOptions,
  getFretboardScalePlaybackSequence,
  playMidiSequence,
} from '../domain/audio/playback'
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
  onCapoChange: (capo: number) => void
}

const INTERVAL_NAMES = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7']
const SCALE_STEP_DURATION = 0.28
const MAX_CAPO_FRET = 12
type ScalePlaybackRange = 'strings' | '1' | '2' | '3'

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
  onCapoChange,
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
  const [scalePlaybackRange, setScalePlaybackRange] = useState<ScalePlaybackRange>('strings')
  const scalePlaybackOptions = useMemo<ScalePlaybackOptions>(() => {
    if (scalePlaybackRange === 'strings') {
      return { mode: 'string-sweep' }
    }

    return { mode: 'octaves', octaveCount: Number(scalePlaybackRange) }
  }, [scalePlaybackRange])
  const scalePlaybackSequence = useMemo(
    () => getFretboardScalePlaybackSequence(positions, tuning, capoFret, keyPitchClass, scalePlaybackOptions),
    [positions, tuning, capoFret, keyPitchClass, scalePlaybackOptions],
  )
  const [activeScalePlaybackKey, setActiveScalePlaybackKey] = useState<string | null>(null)
  const playbackTimers = useRef<number[]>([])

  const clearPlaybackTimers = useCallback(() => {
    playbackTimers.current.forEach((timer) => window.clearTimeout(timer))
    playbackTimers.current = []
  }, [])

  useEffect(
    () => () => {
      clearPlaybackTimers()
    },
    [clearPlaybackTimers],
  )

  const playScale = () => {
    clearPlaybackTimers()
    setActiveScalePlaybackKey(null)
    playMidiSequence(
      scalePlaybackSequence.map((note) => note.midi),
      SCALE_STEP_DURATION,
    )

    scalePlaybackSequence.forEach((note, index) => {
      const timer = window.setTimeout(() => {
        setActiveScalePlaybackKey(`${note.stringIndex}-${note.fret}`)
      }, index * SCALE_STEP_DURATION * 1000)
      playbackTimers.current.push(timer)
    })

    const clearTimer = window.setTimeout(() => {
      setActiveScalePlaybackKey(null)
    }, scalePlaybackSequence.length * SCALE_STEP_DURATION * 1000 + 140)
    playbackTimers.current.push(clearTimer)
  }
  const moveCapo = (nextFret: number) => {
    onCapoChange(Math.min(MAX_CAPO_FRET, maxFret, Math.max(0, nextFret)))
  }
  const handleCapoDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(capoFret))
    }
  }
  const handleCapoDragOver = (event: DragEvent<HTMLTableCellElement>) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }
  const handleCapoDrop = (event: DragEvent<HTMLTableCellElement>, fret: number) => {
    event.preventDefault()
    moveCapo(fret)
  }
  const handleCapoKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveCapo(capoFret - 1)
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveCapo(capoFret + 1)
    }
  }

  return (
    <section className="panel fretboard" aria-label="15 fret fretboard">
      <header>
        <div className="panel-title-row">
          <h2>Fretboard (Nut to Fret 15)</h2>
          <div className="fretboard-audio-controls">
            <label className="compact-select">
              Scale playback
              <select
                value={scalePlaybackRange}
                onChange={(event) => setScalePlaybackRange(event.target.value as ScalePlaybackRange)}
              >
                <option value="strings">String 6 to 1</option>
                <option value="1">1 octave</option>
                <option value="2">2 octaves</option>
                <option value="3">3 octaves</option>
              </select>
            </label>
            <button
              type="button"
              className="audio-button"
              disabled={scalePlaybackSequence.length === 0}
              onClick={playScale}
            >
              Hear scale
            </button>
          </div>
        </div>
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
                const isCapoHandleFret = fret === capoFret
                const headerClasses = [
                  fret === 0 ? 'nut-col' : '',
                  isCapoHandleFret ? 'capo-handle-col' : '',
                  capoFret > 0 && isCapoHandleFret ? 'capo-col' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <th
                    key={fret}
                    className={headerClasses}
                    aria-label={fret === 0 ? 'Nut' : undefined}
                    onDragOver={handleCapoDragOver}
                    onDrop={(event) => handleCapoDrop(event, fret)}
                  >
                    {isCapoHandleFret ? (
                      <button
                        type="button"
                        className={`nut-badge capo-drag-handle${capoFret > 0 ? ' active-capo' : ''}`}
                        draggable
                        aria-label={`Drag nut marker to set capo, currently ${
                          capoFret === 0 ? 'at the nut' : `at fret ${capoFret}`
                        }`}
                        title="Drag to set capo"
                        onDragStart={handleCapoDragStart}
                        onKeyDown={handleCapoKeyDown}
                      >
                        <i />
                        <small>{capoFret === 0 ? 'nut' : `capo ${capoFret}`}</small>
                      </button>
                    ) : fret === 0 ? (
                      <span className="fret-header-label">Nut</span>
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

                    const positionKey = `${stringIndex}-${fret}`
                    const isActiveShapeFret = activeShapeFrets.has(positionKey)
                    const isActiveScalePlaybackFret = activeScalePlaybackKey === positionKey
                    const noteClasses = [
                      'note-dot',
                      position.isScaleTone ? 'scale' : 'off-scale',
                      position.isInCagedShape ? 'caged' : '',
                      isActiveScalePlaybackFret ? 'playing' : '',
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
                      isActiveScalePlaybackFret ? 'scale-playback-cell' : '',
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
                          isActiveScalePlaybackFret ? ', currently playing' : ''
                        }${
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
