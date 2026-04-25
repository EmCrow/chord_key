import { CircleOfFifths } from './components/CircleOfFifths'
import { ControlBar } from './components/ControlBar'
import { Fretboard } from './components/Fretboard'
import { NashvilleTable } from './components/NashvilleTable'
import { TuningTranslator } from './components/TuningTranslator'
import { useWorkbenchDerivedData } from './state/useWorkbenchDerivedData'
import { useWorkbenchState } from './state/useWorkbenchState'

function App() {
  const { state, actions } = useWorkbenchState()
  const { scaleDef, targetTuning, fretboardMap, translationResults } = useWorkbenchDerivedData(state)

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
          onClick={actions.toggleTheme}
        >
          {state.theme === 'light' ? 'Dark Theme' : 'Light Theme'}
        </button>
      </header>

      <ControlBar
        keyNote={state.keyNote}
        onKeyChange={actions.handleKeyChange}
        scaleId={state.scaleId}
        onScaleChange={actions.setScaleId}
        cagedShape={state.cagedShape}
        onCagedShapeChange={actions.setCagedShape}
        tuningOriginalId={state.tuningOriginalId}
        onTuningOriginalChange={actions.setTuningOriginalId}
        tuningTargetId={state.tuningTargetId}
        onTuningTargetChange={actions.setTuningTargetId}
        tuningTargetCapo={state.tuningTargetCapo}
        onTargetCapoChange={actions.setTuningTargetCapo}
      />

      <section className="panel toggles" aria-label="Fretboard labels">
        <label>
          <input
            type="checkbox"
            checked={state.showNoteNames}
            onChange={(event) => actions.setShowNoteNames(event.target.checked)}
            disabled={state.showIntervals}
          />
          Note names
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.showIntervals}
            onChange={(event) => actions.setShowIntervals(event.target.checked)}
          />
          Intervals
        </label>
      </section>

      <section className="dashboard-grid">
        <NashvilleTable
          keyNote={state.keyNote}
          harmonyMode={state.harmonyMode}
          activeDegree={state.activeDegree}
          onSelectionChange={actions.handleHarmonySelection}
        />
        <CircleOfFifths keyNote={state.keyNote} harmonyMode={state.harmonyMode} onKeyChange={actions.handleKeyChange} />
        <Fretboard
          positions={fretboardMap}
          tuning={targetTuning}
          keyNote={state.keyNote}
          scaleName={scaleDef.name}
          cagedShape={state.cagedShape}
          capoFret={state.tuningTargetCapo}
          showNoteNames={state.showNoteNames}
          showIntervals={state.showIntervals}
        />
        <TuningTranslator
          progressionInput={state.progressionInput}
          onProgressionChange={actions.setProgressionInput}
          targetCapo={state.tuningTargetCapo}
          translationResults={translationResults}
        />
      </section>
    </main>
  )
}

export default App
