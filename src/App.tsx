import { useEffect, useMemo, useState } from 'react'
import { CircleOfFifths } from './components/CircleOfFifths'
import { ControlBar } from './components/ControlBar'
import { Fretboard } from './components/Fretboard'
import { NashvilleTable } from './components/NashvilleTable'
import { TuningTranslator } from './components/TuningTranslator'
import { getFretboardMap } from './domain/fretboard/map'
import { getTuningById } from './domain/fretboard/tunings'
import { getNashvilleChords } from './domain/music/harmony'
import { getScaleById, getScalePitchClasses, type ScaleId } from './domain/music/scales'
import { translateProgressionShapes } from './domain/translator/translate'
import type { CagedShape, HarmonyMode } from './domain/types'
import { DEFAULT_STATE } from './state/defaults'

function App() {
  const [keyNote, setKeyNote] = useState(DEFAULT_STATE.keyNote)
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>(DEFAULT_STATE.harmonyMode)
  const [scaleId, setScaleId] = useState<ScaleId>(DEFAULT_STATE.scaleId)
  const [cagedShape, setCagedShape] = useState<CagedShape>(DEFAULT_STATE.cagedShape)
  const [activeDegree, setActiveDegree] = useState(DEFAULT_STATE.activeDegree)
  const [tuningOriginalId, setTuningOriginalId] = useState(DEFAULT_STATE.tuningOriginalId)
  const [tuningTargetId, setTuningTargetId] = useState(DEFAULT_STATE.tuningTargetId)
  const [tuningTargetCapo, setTuningTargetCapo] = useState(DEFAULT_STATE.tuningTargetCapo)
  const [progressionInput, setProgressionInput] = useState(DEFAULT_STATE.progressionInput)
  const [showNoteNames, setShowNoteNames] = useState(DEFAULT_STATE.showNoteNames)
  const [showIntervals, setShowIntervals] = useState(DEFAULT_STATE.showIntervals)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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
        maxFret: 15,
      }),
    [progressionInput, keyNote, originalTuning, targetTuning, tuningTargetCapo],
  )

  const handleKeyChange = (nextKey: string) => {
    setKeyNote(nextKey)
    setActiveDegree(1)
  }

  return (
    <main className="app-shell">
      <header className="hero-header">
        <div>
          <h1>Guitar Harmony Workbench</h1>
          <p>
            Nashville harmony, circle mapping, capo-aware scale visualization, and tuning translation in one synced
            workspace.
          </p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        >
          {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
        </button>
      </header>

      <ControlBar
        keyNote={keyNote}
        onKeyChange={handleKeyChange}
        scaleId={scaleId}
        onScaleChange={setScaleId}
        cagedShape={cagedShape}
        onCagedShapeChange={setCagedShape}
        tuningOriginalId={tuningOriginalId}
        onTuningOriginalChange={setTuningOriginalId}
        tuningTargetId={tuningTargetId}
        onTuningTargetChange={setTuningTargetId}
        tuningTargetCapo={tuningTargetCapo}
        onTargetCapoChange={setTuningTargetCapo}
      />

      <section className="panel toggles" aria-label="Fretboard labels">
        <label>
          <input
            type="checkbox"
            checked={showNoteNames}
            onChange={(event) => setShowNoteNames(event.target.checked)}
            disabled={showIntervals}
          />
          Note names
        </label>
        <label>
          <input
            type="checkbox"
            checked={showIntervals}
            onChange={(event) => {
              const checked = event.target.checked
              setShowIntervals(checked)
              if (checked) {
                setShowNoteNames(false)
              }
            }}
          />
          Intervals
        </label>
      </section>

      <section className="dashboard-grid">
        <NashvilleTable
          keyNote={keyNote}
          harmonyMode={harmonyMode}
          activeDegree={activeDegree}
          onSelectionChange={(nextKey, nextDegree, nextMode) => {
            setKeyNote(nextKey)
            setHarmonyMode(nextMode)
            setActiveDegree(nextDegree)
          }}
        />
        <CircleOfFifths keyNote={keyNote} harmonyMode={harmonyMode} onKeyChange={handleKeyChange} />
        <Fretboard
          positions={fretboardMap}
          tuning={targetTuning}
          keyNote={keyNote}
          scaleName={scaleDef.name}
          cagedShape={cagedShape}
          capoFret={tuningTargetCapo}
          showNoteNames={showNoteNames}
          showIntervals={showIntervals}
        />
        <TuningTranslator
          progressionInput={progressionInput}
          onProgressionChange={setProgressionInput}
          targetCapo={tuningTargetCapo}
          translationResults={translationResults}
        />
      </section>
    </main>
  )
}

export default App
