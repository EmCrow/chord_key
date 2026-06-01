import type { HarmonyMode, NashvilleChord } from '../types'
import { getNashvilleChords } from './harmony'
import { pitchClassToNote, prefersFlatsForKey } from './notes'

export interface ChordFunctionInfo {
  family: 'Tonic' | 'Predominant' | 'Dominant' | 'Color'
  description: string
  commonUse: string
}

export interface ChordConstructionNote {
  chordTone: string
  scaleDegree: number
  noteName: string
}

export interface VoiceLeadingMove {
  fromNote: string
  toNote: string
  semitones: number
  direction: 'up' | 'down'
}

export interface VoiceLeadingHint {
  sourceChord: NashvilleChord
  targetChord: NashvilleChord
  commonTones: string[]
  moves: VoiceLeadingMove[]
}

export interface NashvilleLearningSummary {
  keyLabel: string
  activeChord: NashvilleChord
  functionInfo: ChordFunctionInfo
  scaleNotes: string[]
  construction: ChordConstructionNote[]
  voiceLeading: VoiceLeadingHint
}

const MAJOR_FUNCTIONS: Record<number, ChordFunctionInfo> = {
  1: {
    family: 'Tonic',
    description: 'The home chord and most stable resting point.',
    commonUse: 'Starts phrases, anchors the key, and receives resolutions.',
  },
  2: {
    family: 'Predominant',
    description: 'A setup chord that points strongly toward the dominant.',
    commonUse: 'Moves naturally into V before returning home.',
  },
  3: {
    family: 'Color',
    description: 'A softer tonic-family color with shared notes from I.',
    commonUse: 'Connects I, vi, and IV in smoother progressions.',
  },
  4: {
    family: 'Predominant',
    description: 'A broad away-from-home chord with strong setup energy.',
    commonUse: 'Moves to V or back to I for a plagal sound.',
  },
  5: {
    family: 'Dominant',
    description: 'The strongest tension chord in the key.',
    commonUse: 'Resolves back to I and makes cadences feel complete.',
  },
  6: {
    family: 'Tonic',
    description: 'The relative minor and a common substitute for I.',
    commonUse: 'Adds emotional color while staying close to home.',
  },
  7: {
    family: 'Dominant',
    description: 'A leading-tone chord with direct pull into I.',
    commonUse: 'Creates tension before resolving to the tonic.',
  },
}

const MINOR_FUNCTIONS: Record<number, ChordFunctionInfo> = {
  1: {
    family: 'Tonic',
    description: 'The minor home chord and resting point.',
    commonUse: 'Centers the key and receives resolutions.',
  },
  2: {
    family: 'Predominant',
    description: 'A tense setup chord in natural minor.',
    commonUse: 'Often prepares v, V, or i.',
  },
  3: {
    family: 'Color',
    description: 'The relative major color inside the minor key.',
    commonUse: 'Brightens minor progressions without leaving the key.',
  },
  4: {
    family: 'Predominant',
    description: 'The minor subdominant and a common setup chord.',
    commonUse: 'Moves toward v or returns to i.',
  },
  5: {
    family: 'Dominant',
    description: 'The natural-minor dominant with a softer pull than V.',
    commonUse: 'Leads back to i with less tension than harmonic minor.',
  },
  6: {
    family: 'Color',
    description: 'The flat-six color chord in minor.',
    commonUse: 'Connects i, iv, and VII with strong modal color.',
  },
  7: {
    family: 'Dominant',
    description: 'The subtonic chord that pushes around the minor key.',
    commonUse: 'Often moves to III or back toward i.',
  },
}

const MAJOR_RESOLUTION_TARGETS: Record<number, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 5,
  5: 1,
  6: 4,
  7: 1,
}

const MINOR_RESOLUTION_TARGETS: Record<number, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 5,
  5: 1,
  6: 7,
  7: 1,
}

const CHORD_TONES_BY_QUALITY: Record<NashvilleChord['quality'], string[]> = {
  maj: ['1', '3', '5'],
  min: ['1', 'b3', '5'],
  dim: ['1', 'b3', 'b5'],
}

export function getChordFunctionInfo(mode: HarmonyMode, degree: number): ChordFunctionInfo {
  const functions = mode === 'major' ? MAJOR_FUNCTIONS : MINOR_FUNCTIONS
  return functions[degree] ?? functions[1]
}

function getResolutionTargetDegree(mode: HarmonyMode, degree: number): number {
  const targets = mode === 'major' ? MAJOR_RESOLUTION_TARGETS : MINOR_RESOLUTION_TARGETS
  return targets[degree] ?? 1
}

function getSignedSemitoneDistance(fromPitchClass: number, toPitchClass: number): number {
  const upward = (toPitchClass - fromPitchClass + 12) % 12
  return upward > 6 ? upward - 12 : upward
}

function formatPitchClass(pitchClass: number, preferFlats: boolean): string {
  return pitchClassToNote(pitchClass, preferFlats)
}

function getScaleDegreeForPitchClass(scaleChords: NashvilleChord[], pitchClass: number): number {
  const index = scaleChords.findIndex((chord) => chord.rootPitchClass === pitchClass)
  return index === -1 ? 1 : index + 1
}

function buildConstruction(
  scaleChords: NashvilleChord[],
  activeChord: NashvilleChord,
  preferFlats: boolean,
): ChordConstructionNote[] {
  const chordTones = CHORD_TONES_BY_QUALITY[activeChord.quality]

  return activeChord.chordPitchClasses.map((pitchClass, index) => ({
    chordTone: chordTones[index] ?? String(index + 1),
    scaleDegree: getScaleDegreeForPitchClass(scaleChords, pitchClass),
    noteName: formatPitchClass(pitchClass, preferFlats),
  }))
}

function buildVoiceLeading(
  sourceChord: NashvilleChord,
  targetChord: NashvilleChord,
  preferFlats: boolean,
): VoiceLeadingHint {
  const commonPitchClasses = sourceChord.chordPitchClasses.filter((pitchClass) =>
    targetChord.chordPitchClasses.includes(pitchClass),
  )
  const targetPool = targetChord.chordPitchClasses.filter((pitchClass) => !commonPitchClasses.includes(pitchClass))
  const remainingTargets = [...targetPool]

  const moves = sourceChord.chordPitchClasses
    .filter((pitchClass) => !commonPitchClasses.includes(pitchClass))
    .map((fromPitchClass) => {
      const nearestTarget = remainingTargets.reduce((nearest, candidate) => {
        const nearestDistance = Math.abs(getSignedSemitoneDistance(fromPitchClass, nearest))
        const candidateDistance = Math.abs(getSignedSemitoneDistance(fromPitchClass, candidate))
        return candidateDistance < nearestDistance ? candidate : nearest
      }, remainingTargets[0] ?? targetChord.rootPitchClass)
      const usedIndex = remainingTargets.indexOf(nearestTarget)
      if (usedIndex !== -1) {
        remainingTargets.splice(usedIndex, 1)
      }
      const semitones = getSignedSemitoneDistance(fromPitchClass, nearestTarget)

      return {
        fromNote: formatPitchClass(fromPitchClass, preferFlats),
        toNote: formatPitchClass(nearestTarget, preferFlats),
        semitones: Math.abs(semitones),
        direction: semitones >= 0 ? ('up' as const) : ('down' as const),
      }
    })

  return {
    sourceChord,
    targetChord,
    commonTones: commonPitchClasses.map((pitchClass) => formatPitchClass(pitchClass, preferFlats)),
    moves,
  }
}

export function getNashvilleLearningSummary(
  keyNote: string,
  mode: HarmonyMode,
  activeDegree: number,
): NashvilleLearningSummary {
  const scaleChords = getNashvilleChords(keyNote, mode)
  const preferFlats = prefersFlatsForKey(keyNote)
  const activeChord = scaleChords.find((chord) => chord.degree === activeDegree) ?? scaleChords[0]
  const targetDegree = getResolutionTargetDegree(mode, activeChord.degree)
  const targetChord = scaleChords.find((chord) => chord.degree === targetDegree) ?? scaleChords[0]

  return {
    keyLabel: mode === 'major' ? keyNote : `${keyNote}m`,
    activeChord,
    functionInfo: getChordFunctionInfo(mode, activeChord.degree),
    scaleNotes: scaleChords.map((chord) => formatPitchClass(chord.rootPitchClass, preferFlats)),
    construction: buildConstruction(scaleChords, activeChord, preferFlats),
    voiceLeading: buildVoiceLeading(activeChord, targetChord, preferFlats),
  }
}
