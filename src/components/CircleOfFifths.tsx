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
const KEY_SIGNATURES: Record<string, string> = {
  C: '0',
  G: '1#',
  D: '2#',
  A: '3#',
  E: '4#',
  B: '5#',
  'F#': '6#',
  Db: '5b',
  Ab: '4b',
  Eb: '3b',
  Bb: '2b',
  F: '1b',
}

function getRelativeMinorForKey(keyNote: string): string {
  const keyPc = parseNoteName(keyNote)
  const minorPc = normalizePitchClass(keyPc + 9)
  return `${pitchClassToNote(minorPc, prefersFlatsForKey(keyNote))}m`
}

export function CircleOfFifths({ keyNote, harmonyMode, onKeyChange }: CircleOfFifthsProps) {
  const preferFlats = prefersFlatsForKey(keyNote)
  const scaleMode = harmonyMode === 'major' ? 'major' : 'natural_minor'
  const scaleNotes = getScalePitchClasses(keyNote, scaleMode).map((pc) => pitchClassToNote(pc, preferFlats))
  const diatonicChords = getNashvilleChords(keyNote, harmonyMode)
  const relativeMinor = getRelativeMinorForKey(keyNote)

  return (
    <section className="panel circle" aria-label="Circle of fifths">
      <header>
        <h2>Circle of Fifths</h2>
        <p>Classroom theory wheel: majors outside, relative minors inside, active-key degrees in the center.</p>
      </header>

      <div className="circle-wrap">
        <div className="circle-board-label circle-board-label-top">clockwise = up a fifth</div>
        <div className="circle-board-label circle-board-label-bottom">counterclockwise = down a fifth</div>
        <div className="circle-ring-label circle-ring-label-major">Major keys</div>
        <div className="circle-ring-label circle-ring-label-minor">Relative minors</div>
        <div className="circle-spokes" aria-hidden="true">
          {CIRCLE_KEYS.map((note, index) => (
            <span
              key={note}
              style={{ transform: `translate(-50%, -100%) rotate(${index * 30}deg)` }}
            />
          ))}
        </div>
        {CIRCLE_KEYS.map((note, index) => {
          const angle = (index / CIRCLE_KEYS.length) * Math.PI * 2 - Math.PI / 2
          const keyRadius = 40
          const minorRadius = 28.5
          const signatureRadius = 45
          const keyX = 50 + Math.cos(angle) * keyRadius
          const keyY = 50 + Math.sin(angle) * keyRadius
          const minorX = 50 + Math.cos(angle) * minorRadius
          const minorY = 50 + Math.sin(angle) * minorRadius
          const signatureX = 50 + Math.cos(angle) * signatureRadius
          const signatureY = 50 + Math.sin(angle) * signatureRadius

          return (
            <div className="circle-key-group" key={note}>
              <span className="circle-signature" style={{ left: `${signatureX}%`, top: `${signatureY}%` }}>
                {KEY_SIGNATURES[note]}
              </span>
              <button
                type="button"
                className={`circle-key ${keyNote === note ? 'active' : ''}`}
                style={{ left: `${keyX}%`, top: `${keyY}%` }}
                onClick={() => onKeyChange(note)}
              >
                <span>{note}</span>
              </button>
              <span
                className={`circle-relative-minor ${keyNote === note ? 'active' : ''}`}
                style={{ left: `${minorX}%`, top: `${minorY}%` }}
              >
                {getRelativeMinorForKey(note)}
              </span>
            </div>
          )
        })}
        <div className="circle-degree-wheel" aria-label="Active key degrees">
          {diatonicChords.map((chord, index) => {
            const angle = (index / diatonicChords.length) * Math.PI * 2 - Math.PI / 2
            const radius = 37.3
            const x = 50 + Math.cos(angle) * radius
            const y = 50 + Math.sin(angle) * radius

            return (
              <span
                className="circle-degree-node"
                key={chord.degree}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span>{chord.roman}</span>
                <small>{chord.chordName}</small>
              </span>
            )
          })}
        </div>
        <div className="circle-center">
          <span>Active Key</span>
          <strong>{harmonyMode === 'major' ? keyNote : `${keyNote}m`}</strong>
          <small>{relativeMinor}</small>
        </div>
      </div>

      <div className="circle-notes" aria-label="Active key notes and chords">
        <div>
          <span>Lesson note</span>
          <strong>{harmonyMode === 'major' ? `${keyNote} major` : `${keyNote} minor`}</strong>
        </div>
        <p>
          <strong>Notes:</strong> {scaleNotes.join(' - ')}
        </p>
        <p>
          <strong>Diatonic Chords:</strong> {diatonicChords.map((chord) => chord.chordName).join(' - ')}
        </p>
      </div>
    </section>
  )
}
