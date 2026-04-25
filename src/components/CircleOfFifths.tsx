import { getScalePitchClasses } from '../domain/music/scales'
import { normalizePitchClass, parseNoteName, pitchClassToNote, prefersFlatsForKey } from '../domain/music/notes'
import { getNashvilleChords } from '../domain/music/harmony'
import type { HarmonyMode } from '../domain/types'

interface CircleOfFifthsProps {
  keyNote: string
  harmonyMode: HarmonyMode
  onKeyChange: (nextKey: string) => void
}

const CIRCLE_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

function getRelativeMinorForKey(keyNote: string): string {
  const keyPc = parseNoteName(keyNote)
  const minorPc = normalizePitchClass(keyPc + 9)
  return `${pitchClassToNote(minorPc, prefersFlatsForKey(keyNote))}m`
}

export function CircleOfFifths({ keyNote, harmonyMode, onKeyChange }: CircleOfFifthsProps) {
  const preferFlats = prefersFlatsForKey(keyNote)
  const scaleMode = harmonyMode === 'major' ? 'major' : 'natural_minor'
  const scaleNotes = getScalePitchClasses(keyNote, scaleMode).map((pc) => pitchClassToNote(pc, preferFlats))
  const diatonicChords = getNashvilleChords(keyNote, harmonyMode).map((chord) => chord.chordName)
  const relativeMinor = getRelativeMinorForKey(keyNote)

  return (
    <section className="panel circle" aria-label="Circle of fifths">
      <header>
        <h2>Circle of Fifths</h2>
        <p>Major and relative minor are shown on each node, plus the active key note set below.</p>
      </header>

      <div className="circle-wrap">
        {CIRCLE_KEYS.map((note, index) => {
          const angle = (index / CIRCLE_KEYS.length) * Math.PI * 2 - Math.PI / 2
          const radius = 132
          const x = 150 + Math.cos(angle) * radius
          const y = 150 + Math.sin(angle) * radius

          return (
            <button
              key={note}
              type="button"
              className={`circle-key ${keyNote === note ? 'active' : ''}`}
              style={{ left: `${x}px`, top: `${y}px` }}
              onClick={() => onKeyChange(note)}
            >
              <span>{note}</span>
              <small>{getRelativeMinorForKey(note)}</small>
            </button>
          )
        })}
        <div className="circle-center">
          <span>Active Key</span>
          <strong>{harmonyMode === 'major' ? keyNote : `${keyNote}m`}</strong>
          <small>{relativeMinor}</small>
        </div>
      </div>

      <div className="circle-notes" aria-label="Active key notes and chords">
        <p>
          <strong>Notes:</strong> {scaleNotes.join(' - ')}
        </p>
        <p>
          <strong>Diatonic Chords:</strong> {diatonicChords.join(' - ')}
        </p>
      </div>
    </section>
  )
}
