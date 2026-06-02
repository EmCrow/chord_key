import { useEffect, useRef, useState, type DragEvent } from 'react'
import {
  type ChordVoicingMode,
  getNashvilleChordMidiVoicing,
  playMidiChord,
  playMidiChordSequence,
} from '../domain/audio/playback'
import { getNashvilleChords } from '../domain/music/harmony'
import { getChordFunctionInfo, getNashvilleLearningSummary } from '../domain/music/learning'
import type { HarmonyMode, NashvilleChord } from '../domain/types'

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
  const [voicingMode, setVoicingMode] = useState<ChordVoicingMode>('guitar')
  const [customProgressionDegrees, setCustomProgressionDegrees] = useState<number[]>([])
  const [isLoopingProgression, setIsLoopingProgression] = useState(false)
  const loopTimer = useRef<number | null>(null)
  const customProgressionChords = customProgressionDegrees
    .map((degree) => selectedChords.find((chord) => chord.degree === degree))
    .filter((chord): chord is NashvilleChord => Boolean(chord))
  const playChord = (chord: NashvilleChord) => playMidiChord(getNashvilleChordMidiVoicing(chord, voicingMode))
  const playProgression = () => {
    if (customProgressionChords.length === 0) {
      return
    }

    playMidiChordSequence(customProgressionChords.map((chord) => getNashvilleChordMidiVoicing(chord, voicingMode)))
  }
  const playVoiceLeading = () => {
    playMidiChordSequence([
      getNashvilleChordMidiVoicing(learningSummary.voiceLeading.sourceChord, voicingMode),
      getNashvilleChordMidiVoicing(learningSummary.voiceLeading.targetChord, voicingMode),
    ])
  }
  const stopLoop = () => {
    if (loopTimer.current !== null) {
      window.clearInterval(loopTimer.current)
      loopTimer.current = null
    }
    setIsLoopingProgression(false)
  }
  const toggleProgressionLoop = () => {
    if (customProgressionChords.length === 0) {
      return
    }

    if (isLoopingProgression) {
      stopLoop()
      return
    }

    playProgression()
    setIsLoopingProgression(true)
    const loopDuration = Math.max(customProgressionChords.length * 820 + 180, 1000)
    loopTimer.current = window.setInterval(playProgression, loopDuration)
  }
  const addProgressionDegree = (degree: number) => {
    stopLoop()
    setCustomProgressionDegrees((current) => [...current, degree])
  }
  const clearProgression = () => {
    stopLoop()
    setCustomProgressionDegrees([])
  }
  const handleChordDragStart = (event: DragEvent<HTMLButtonElement>, degree: number) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', String(degree))
  }
  const handleProgressionDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }
  const handleProgressionDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const degree = Number(event.dataTransfer.getData('text/plain'))
    if (Number.isInteger(degree) && selectedChords.some((chord) => chord.degree === degree)) {
      addProgressionDegree(degree)
    }
  }

  useEffect(
    () => () => {
      if (loopTimer.current !== null) {
        window.clearInterval(loopTimer.current)
      }
    },
    [],
  )

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
              Voicing
              <select
                value={voicingMode}
                onChange={(event) => setVoicingMode(event.target.value as ChordVoicingMode)}
              >
                <option value="guitar">Guitar</option>
                <option value="compact">Compact</option>
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
            draggable
            onDragStart={(event) => handleChordDragStart(event, chord.degree)}
            onClick={() => {
              onSelectionChange(keyNote, chord.degree, harmonyMode)
              playChord(chord)
            }}
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
          <button
            type="button"
            className="audio-button compact-audio-button learning-audio-button"
            onClick={() => playChord(learningSummary.activeChord)}
          >
            Hear chord
          </button>
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
          <button
            type="button"
            className="audio-button compact-audio-button learning-audio-button"
            onClick={playVoiceLeading}
          >
            Hear movement
          </button>
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

        <article className="nashville-learning-card progression-builder-card">
          <span className="learning-eyebrow">Progression builder</span>
          <div
            className={`progression-drop-zone ${customProgressionChords.length === 0 ? 'empty' : ''}`}
            role="list"
            aria-label="Custom Nashville progression"
            onDragOver={handleProgressionDragOver}
            onDrop={handleProgressionDrop}
          >
            {customProgressionChords.length === 0 ? (
              <span>Drag chords here</span>
            ) : (
              customProgressionChords.map((chord, index) => (
                <button
                  type="button"
                  className="progression-builder-chip"
                  key={`${chord.degree}-${index}`}
                  aria-label={`Hear progression chord ${index + 1}: ${chord.chordName}`}
                  onClick={() => playChord(chord)}
                >
                  <small>{chord.roman}</small>
                  {chord.chordName}
                </button>
              ))
            )}
          </div>
          <div className="progression-builder-actions">
            <button
              type="button"
              className="audio-button compact-audio-button"
              disabled={customProgressionChords.length === 0}
              onClick={playProgression}
            >
              Hear progression
            </button>
            <button
              type="button"
              className="audio-button compact-audio-button"
              disabled={customProgressionChords.length === 0}
              onClick={toggleProgressionLoop}
            >
              {isLoopingProgression ? 'Stop loop' : 'Loop'}
            </button>
            <button
              type="button"
              className="audio-button compact-audio-button"
              disabled={customProgressionChords.length === 0}
              onClick={clearProgression}
            >
              Clear
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
