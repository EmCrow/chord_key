import { useMemo } from 'react'
import { getFretboardMap } from '../domain/fretboard/map'
import { getTuningById } from '../domain/fretboard/tunings'
import { getNashvilleChords } from '../domain/music/harmony'
import { getScaleById, getScalePitchClasses, type ScaleId } from '../domain/music/scales'
import { translateProgressionShapes } from '../domain/translator/translate'
import type { CagedShape, HarmonyMode } from '../domain/types'

const FIXED_MAX_FRET = 15

interface UseWorkbenchDerivedDataInput {
  keyNote: string
  harmonyMode: HarmonyMode
  scaleId: ScaleId
  cagedShape: CagedShape
  activeDegree: number
  tuningOriginalId: string
  tuningTargetId: string
  tuningTargetCapo: number
  progressionInput: string
}

export function useWorkbenchDerivedData({
  keyNote,
  harmonyMode,
  scaleId,
  cagedShape,
  activeDegree,
  tuningOriginalId,
  tuningTargetId,
  tuningTargetCapo,
  progressionInput,
}: UseWorkbenchDerivedDataInput) {
  const nashvilleChords = useMemo(() => getNashvilleChords(keyNote, harmonyMode), [keyNote, harmonyMode])
  const scaleDef = useMemo(() => getScaleById(scaleId), [scaleId])
  const scalePitchClasses = useMemo(() => getScalePitchClasses(keyNote, scaleId), [keyNote, scaleId])
  const activeChord = useMemo(
    () => nashvilleChords.find((chord) => chord.degree === activeDegree) ?? nashvilleChords[0],
    [activeDegree, nashvilleChords],
  )

  const originalTuning = useMemo(() => getTuningById(tuningOriginalId), [tuningOriginalId])
  const targetTuning = useMemo(() => getTuningById(tuningTargetId), [tuningTargetId])

  const fretboardMap = useMemo(
    () =>
      getFretboardMap({
        tuning: targetTuning,
        keyNote,
        scalePitchClasses,
        cagedShape,
        activeChord,
        capoFret: tuningTargetCapo,
        maxFret: FIXED_MAX_FRET,
      }),
    [targetTuning, keyNote, scalePitchClasses, cagedShape, activeChord, tuningTargetCapo],
  )

  const translationResults = useMemo(
    () =>
      translateProgressionShapes({
        progression: progressionInput,
        key: keyNote,
        fromTuning: originalTuning,
        toTuning: targetTuning,
        capoFret: tuningTargetCapo,
        maxFret: FIXED_MAX_FRET,
      }),
    [progressionInput, keyNote, originalTuning, targetTuning, tuningTargetCapo],
  )

  return {
    nashvilleChords,
    scaleDef,
    targetTuning,
    fretboardMap,
    translationResults,
  }
}
