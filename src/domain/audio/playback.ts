import type { FretPosition, NashvilleChord, TuningDef } from '../types'
import { normalizePitchClass } from '../music/notes'
import { tuningToMidi } from '../fretboard/tunings'

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext
}

interface PlaybackOptions {
  duration?: number
  startOffset?: number
  volume?: number
}

export type ChordVoicingMode = 'guitar' | 'compact'
export type ScalePlaybackMode = 'string-sweep' | 'octaves'

export interface ScalePlaybackOptions {
  mode?: ScalePlaybackMode
  octaveCount?: number
}

export interface ScalePlaybackNote {
  midi: number
  stringIndex: number
  fret: number
  pitchClass: number
}

let sharedAudioContext: AudioContext | null = null

const GUITAR_CHORD_TEMPLATES: Record<NashvilleChord['quality'], Array<{ rootPitchClass: number; frets: Array<number | 'x'> }>> = {
  maj: [
    { rootPitchClass: 0, frets: ['x', 3, 2, 0, 1, 0] },
    { rootPitchClass: 2, frets: ['x', 'x', 0, 2, 3, 2] },
    { rootPitchClass: 4, frets: [0, 2, 2, 1, 0, 0] },
    { rootPitchClass: 7, frets: [3, 2, 0, 0, 0, 3] },
    { rootPitchClass: 9, frets: ['x', 0, 2, 2, 2, 0] },
  ],
  min: [
    { rootPitchClass: 0, frets: ['x', 3, 5, 5, 4, 3] },
    { rootPitchClass: 2, frets: ['x', 'x', 0, 2, 3, 1] },
    { rootPitchClass: 4, frets: [0, 2, 2, 0, 0, 0] },
    { rootPitchClass: 9, frets: ['x', 0, 2, 2, 1, 0] },
  ],
  dim: [
    { rootPitchClass: 11, frets: ['x', 2, 3, 4, 3, 'x'] },
  ],
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioContextConstructor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext
  if (!AudioContextConstructor) {
    return null
  }

  sharedAudioContext ??= new AudioContextConstructor()
  return sharedAudioContext
}

function scheduleMidiNote(
  audioContext: AudioContext,
  midi: number,
  startTime: number,
  duration: number,
  volume: number,
): void {
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(midiToFrequency(midi), startTime)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.025)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.04)
}

function scheduleMidiChord(
  audioContext: AudioContext,
  midiNotes: number[],
  startTime: number,
  duration: number,
  volume: number,
): void {
  const uniqueNotes = [...new Set(midiNotes)].sort((a, b) => a - b)
  const noteVolume = volume / Math.max(uniqueNotes.length, 1)

  uniqueNotes.forEach((midi) => scheduleMidiNote(audioContext, midi, startTime, duration, noteVolume))
}

export function playMidiChord(midiNotes: number[], options: PlaybackOptions = {}): void {
  const audioContext = getAudioContext()
  if (!audioContext || midiNotes.length === 0) {
    return
  }

  void audioContext.resume()
  scheduleMidiChord(
    audioContext,
    midiNotes,
    audioContext.currentTime + (options.startOffset ?? 0.02),
    options.duration ?? 1,
    options.volume ?? 0.36,
  )
}

export function playMidiSequence(midiNotes: number[], stepDuration = 0.28): void {
  const audioContext = getAudioContext()
  if (!audioContext || midiNotes.length === 0) {
    return
  }

  void audioContext.resume()
  const startTime = audioContext.currentTime + 0.02
  midiNotes.forEach((midi, index) => {
    scheduleMidiNote(audioContext, midi, startTime + index * stepDuration, stepDuration * 0.9, 0.22)
  })
}

export function playMidiChordSequence(chords: number[][], chordDuration = 0.82): void {
  const audioContext = getAudioContext()
  if (!audioContext || chords.length === 0) {
    return
  }

  void audioContext.resume()
  const startTime = audioContext.currentTime + 0.02
  chords.forEach((midiNotes, index) => {
    scheduleMidiChord(audioContext, midiNotes, startTime + index * chordDuration, chordDuration * 0.92, 0.38)
  })
}

function pitchClassToMidiAtOrAbove(pitchClass: number, minimumMidi: number): number {
  let midi = Math.floor(minimumMidi / 12) * 12 + normalizePitchClass(pitchClass)
  while (midi < minimumMidi) {
    midi += 12
  }
  return midi
}

function getCompactChordMidiVoicing(chord: NashvilleChord, minimumRootMidi = 48): number[] {
  const rootMidi = pitchClassToMidiAtOrAbove(chord.rootPitchClass, minimumRootMidi)
  return chord.chordPitchClasses.map((pitchClass) => pitchClassToMidiAtOrAbove(pitchClass, rootMidi))
}

function transposeShapeFrets(shapeFrets: Array<number | 'x'>, semitones: number): Array<number | 'x'> {
  return shapeFrets.map((fret) => (fret === 'x' ? 'x' : fret + semitones))
}

function getTemplateScore(shapeFrets: Array<number | 'x'>): number {
  const fretted = shapeFrets.filter((fret): fret is number => fret !== 'x')
  const maxFret = Math.max(...fretted)
  const minFret = Math.min(...fretted)
  const mutedCount = shapeFrets.length - fretted.length

  return maxFret * 2 + minFret + mutedCount * 1.5
}

function getGuitarChordMidiVoicing(chord: NashvilleChord): number[] {
  const templates = GUITAR_CHORD_TEMPLATES[chord.quality]
  const candidates = templates
    .flatMap((template) => {
      const semitones = normalizePitchClass(chord.rootPitchClass - template.rootPitchClass)
      const transpositions = semitones === 0 ? [0] : [semitones, semitones - 12]

      return transpositions.map((transposition) => {
        const frets = transposeShapeFrets(template.frets, transposition)
        const playable = frets.every((fret) => fret === 'x' || (fret >= 0 && fret <= 12))

        return {
          frets,
          playable,
          score: getTemplateScore(frets),
        }
      })
    })
    .filter((candidate) => candidate.playable)
    .sort((a, b) => a.score - b.score)

  const bestCandidate = candidates[0]
  if (!bestCandidate) {
    return getCompactChordMidiVoicing(chord)
  }

  return getShapeMidiNotes(bestCandidate.frets, {
    id: 'standard',
    label: 'Standard',
    strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  })
}

export function getNashvilleChordMidiVoicing(
  chord: NashvilleChord,
  voicingMode: ChordVoicingMode = 'guitar',
  minimumRootMidi = 48,
): number[] {
  if (voicingMode === 'compact') {
    return getCompactChordMidiVoicing(chord, minimumRootMidi)
  }

  return getGuitarChordMidiVoicing(chord)
}

export function getShapeMidiNotes(shapeFrets: Array<number | 'x'>, tuning: TuningDef): number[] {
  const tuningMidi = tuningToMidi(tuning)
  return shapeFrets
    .map((absoluteFret, stringIndex) => {
      if (absoluteFret === 'x') {
        return null
      }

      return tuningMidi[stringIndex] + absoluteFret
    })
    .filter((midi): midi is number => midi !== null)
}

function getCagedScalePlaybackPositions(
  positions: FretPosition[],
  tuning: TuningDef,
  capoFret: number,
): ScalePlaybackNote[] {
  const tuningMidi = tuningToMidi(tuning)
  return positions
    .filter((position) => position.isScaleTone && position.isInCagedWindow)
    .map((position) => ({
      midi: tuningMidi[position.stringIndex] + position.fret + capoFret,
      stringIndex: position.stringIndex,
      fret: position.fret,
      pitchClass: position.pitchClass,
    }))
}

function getStringSweepScaleSequence(scalePositions: ScalePlaybackNote[]): ScalePlaybackNote[] {
  return [...scalePositions].sort((a, b) => a.stringIndex - b.stringIndex || a.fret - b.fret || a.midi - b.midi)
}

function dedupeByMidi(scalePositions: ScalePlaybackNote[]): ScalePlaybackNote[] {
  const byMidi = new Map<number, ScalePlaybackNote>()
  const sortedScalePositions = [...scalePositions].sort((a, b) => a.midi - b.midi)

  sortedScalePositions.forEach((position) => {
    if (!byMidi.has(position.midi)) {
      byMidi.set(position.midi, position)
    }
  })

  return [...byMidi.values()]
}

function getOctaveScaleSequence(
  scalePositions: ScalePlaybackNote[],
  keyPitchClass: number,
  octaveCount: number,
): ScalePlaybackNote[] {
  const normalizedOctaves = Number.isFinite(octaveCount) ? octaveCount : 1
  const requestedOctaves = Math.max(1, Math.min(Math.round(normalizedOctaves), 4))
  const sortedScalePositions = dedupeByMidi(scalePositions)
  const firstRootIndex = sortedScalePositions.findIndex((position) => position.pitchClass === keyPitchClass)
  const orderedPositions = firstRootIndex === -1 ? sortedScalePositions : sortedScalePositions.slice(firstRootIndex)

  if (firstRootIndex === -1) {
    return orderedPositions.slice(0, requestedOctaves * 7 + 1)
  }

  const sequence: ScalePlaybackNote[] = []
  let rootCount = 0

  for (const position of orderedPositions) {
    sequence.push(position)
    if (position.pitchClass === keyPitchClass) {
      rootCount += 1
      if (rootCount === requestedOctaves + 1) {
        break
      }
    }
  }

  return sequence.length > 0 ? sequence : sortedScalePositions.slice(0, requestedOctaves * 7 + 1)
}

export function getFretboardScalePlaybackSequence(
  positions: FretPosition[],
  tuning: TuningDef,
  capoFret: number,
  keyPitchClass: number,
  options: ScalePlaybackOptions = {},
): ScalePlaybackNote[] {
  const scalePositions = getCagedScalePlaybackPositions(positions, tuning, capoFret)

  if (options.mode === 'string-sweep') {
    return getStringSweepScaleSequence(scalePositions)
  }

  return getOctaveScaleSequence(scalePositions, keyPitchClass, options.octaveCount ?? 1)
}

export function getFretboardScaleMidiSequence(
  positions: FretPosition[],
  tuning: TuningDef,
  capoFret: number,
  keyPitchClass: number,
  options: ScalePlaybackOptions = {},
): number[] {
  return getFretboardScalePlaybackSequence(positions, tuning, capoFret, keyPitchClass, options).map(
    (position) => position.midi,
  )
}
