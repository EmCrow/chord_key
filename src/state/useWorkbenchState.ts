import { useEffect, useState } from 'react'
import type { ScaleId } from '../domain/music/scales'
import type { CagedShape, HarmonyMode } from '../domain/types'
import { DEFAULT_STATE } from './defaults'

type ThemeMode = 'light' | 'dark'

export interface WorkbenchState {
  keyNote: string
  harmonyMode: HarmonyMode
  scaleId: ScaleId
  cagedShape: CagedShape
  activeDegree: number
  tuningOriginalId: string
  tuningTargetId: string
  tuningTargetCapo: number
  progressionInput: string
  showNoteNames: boolean
  showIntervals: boolean
  theme: ThemeMode
}

export interface WorkbenchActions {
  setScaleId: (nextScale: ScaleId) => void
  setCagedShape: (nextShape: CagedShape) => void
  setTuningOriginalId: (nextTuningId: string) => void
  setTuningTargetId: (nextTuningId: string) => void
  setTuningTargetCapo: (capo: number) => void
  setProgressionInput: (nextProgression: string) => void
  setShowNoteNames: (enabled: boolean) => void
  setShowIntervals: (enabled: boolean) => void
  toggleTheme: () => void
  handleKeyChange: (nextKey: string) => void
  handleHarmonySelection: (nextKey: string, nextDegree: number, nextMode: HarmonyMode) => void
}

export function useWorkbenchState(): { state: WorkbenchState; actions: WorkbenchActions } {
  const [keyNote, setKeyNote] = useState(DEFAULT_STATE.keyNote)
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>(DEFAULT_STATE.harmonyMode)
  const [scaleId, setScaleId] = useState<ScaleId>(DEFAULT_STATE.scaleId)
  const [cagedShape, setCagedShape] = useState<CagedShape>(DEFAULT_STATE.cagedShape)
  const [activeDegree, setActiveDegree] = useState(DEFAULT_STATE.activeDegree)
  const [tuningOriginalId, setTuningOriginalId] = useState(DEFAULT_STATE.tuningOriginalId)
  const [tuningTargetId, setTuningTargetId] = useState(DEFAULT_STATE.tuningTargetId)
  const [tuningTargetCapo, setTuningTargetCapo] = useState(DEFAULT_STATE.tuningTargetCapo)
  const [progressionInput, setProgressionInput] = useState(DEFAULT_STATE.progressionInput)
  const [showNoteNames, setShowNoteNamesState] = useState(DEFAULT_STATE.showNoteNames)
  const [showIntervals, setShowIntervalsState] = useState(DEFAULT_STATE.showIntervals)
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleKeyChange = (nextKey: string) => {
    setKeyNote(nextKey)
    setActiveDegree(1)
  }

  const handleHarmonySelection = (nextKey: string, nextDegree: number, nextMode: HarmonyMode) => {
    setKeyNote(nextKey)
    setHarmonyMode(nextMode)
    setActiveDegree(nextDegree)
  }

  const setShowIntervals = (enabled: boolean) => {
    setShowIntervalsState(enabled)
    if (enabled) {
      setShowNoteNamesState(false)
    }
  }

  const setShowNoteNames = (enabled: boolean) => {
    setShowNoteNamesState(enabled)
  }

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  return {
    state: {
      keyNote,
      harmonyMode,
      scaleId,
      cagedShape,
      activeDegree,
      tuningOriginalId,
      tuningTargetId,
      tuningTargetCapo,
      progressionInput,
      showNoteNames,
      showIntervals,
      theme,
    },
    actions: {
      setScaleId,
      setCagedShape,
      setTuningOriginalId,
      setTuningTargetId,
      setTuningTargetCapo,
      setProgressionInput,
      setShowNoteNames,
      setShowIntervals,
      toggleTheme,
      handleKeyChange,
      handleHarmonySelection,
    },
  }
}
