import type { ScaleId } from '../domain/music/scales'
import { SCALE_DEFS } from '../domain/music/scales'
import type { CagedShape } from '../domain/types'
import { TUNINGS } from '../domain/fretboard/tunings'

const CAGED_OPTIONS: CagedShape[] = ['C', 'A', 'G', 'E', 'D']

interface ControlBarProps {
  keyNote: string
  onKeyChange: (nextKey: string) => void
  scaleId: ScaleId
  onScaleChange: (nextScale: ScaleId) => void
  cagedShape: CagedShape
  onCagedShapeChange: (nextShape: CagedShape) => void
  tuningOriginalId: string
  onTuningOriginalChange: (nextTuningId: string) => void
  tuningTargetId: string
  onTuningTargetChange: (nextTuningId: string) => void
  tuningTargetCapo: number
  onTargetCapoChange: (capo: number) => void
}

export function ControlBar({
  keyNote,
  onKeyChange,
  scaleId,
  onScaleChange,
  cagedShape,
  onCagedShapeChange,
  tuningOriginalId,
  onTuningOriginalChange,
  tuningTargetId,
  onTuningTargetChange,
  tuningTargetCapo,
  onTargetCapoChange,
}: ControlBarProps) {
  return (
    <section className="panel controls" aria-label="Global controls">
      <label>
        Key
        <select value={keyNote} onChange={(event) => onKeyChange(event.target.value)}>
          {['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'].map((note) => (
            <option key={note} value={note}>
              {note}
            </option>
          ))}
        </select>
      </label>

      <label>
        Scale
        <select value={scaleId} onChange={(event) => onScaleChange(event.target.value as ScaleId)}>
          {SCALE_DEFS.map((scale) => (
            <option key={scale.id} value={scale.id}>
              {scale.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        CAGED Shape
        <select value={cagedShape} onChange={(event) => onCagedShapeChange(event.target.value as CagedShape)}>
          {CAGED_OPTIONS.map((shape) => (
            <option key={shape} value={shape}>
              {shape}
            </option>
          ))}
        </select>
      </label>

      <label>
        Original Tuning
        <select value={tuningOriginalId} onChange={(event) => onTuningOriginalChange(event.target.value)}>
          {TUNINGS.map((tuning) => (
            <option key={tuning.id} value={tuning.id}>
              {tuning.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        New Tuning
        <select value={tuningTargetId} onChange={(event) => onTuningTargetChange(event.target.value)}>
          {TUNINGS.map((tuning) => (
            <option key={tuning.id} value={tuning.id}>
              {tuning.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        New Tuning Capo
        <select
          value={tuningTargetCapo}
          onChange={(event) => onTargetCapoChange(Number(event.target.value))}
        >
          {Array.from({ length: 13 }, (_, step) => (
            <option key={step} value={step}>
              Fret {step}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
