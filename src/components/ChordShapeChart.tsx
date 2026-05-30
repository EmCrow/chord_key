import type { CSSProperties } from 'react'
import type { TranslatedShape } from '../domain/types'

interface ChordShapeChartProps {
  shape: TranslatedShape | null
  ariaLabel: string
}

interface ShapeWindow {
  startFret: number
  endFret: number
}

const DISPLAY_STRING_INDEXES = [5, 4, 3, 2, 1, 0]
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']

function getShapeWindow(relativeFrets: Array<number | 'x'>): ShapeWindow {
  const fretted = relativeFrets.filter((fret): fret is number => typeof fret === 'number' && fret > 0)
  if (fretted.length === 0) {
    return { startFret: 1, endFret: 4 }
  }

  const minFret = Math.min(...fretted)
  const maxFret = Math.max(...fretted)
  const startFret = minFret <= 3 ? 1 : minFret
  const endFret = Math.max(startFret + 3, maxFret)

  return { startFret, endFret }
}

function getCapoFret(shape: TranslatedShape): number {
  const firstFrettedIndex = shape.relativeFrets.findIndex((fret) => fret !== 'x')
  if (firstFrettedIndex < 0) {
    return 0
  }

  const relativeFret = shape.relativeFrets[firstFrettedIndex]
  const absoluteFret = shape.absoluteFrets[firstFrettedIndex]
  if (relativeFret === 'x' || absoluteFret === 'x') {
    return 0
  }

  return absoluteFret - relativeFret
}

export function ChordShapeChart({ shape, ariaLabel }: ChordShapeChartProps) {
  if (!shape) {
    return <div className="shape-chart shape-chart-empty">unplayable</div>
  }

  const { relativeFrets } = shape
  const { startFret, endFret } = getShapeWindow(relativeFrets)
  const chartFrets = Array.from({ length: endFret - startFret + 1 }, (_, index) => startFret + index)
  const capoFret = getCapoFret(shape)
  const edgeLabel = capoFret > 0 ? `capo ${capoFret}` : startFret > 1 ? `${startFret}fr` : 'nut'

  return (
    <div
      className="shape-chart shape-chart-horizontal"
      role="img"
      aria-label={`${ariaLabel}, ${edgeLabel} on the left`}
      style={{ '--shape-fret-count': chartFrets.length } as CSSProperties & Record<string, number>}
    >
      <div className="shape-chart-edge" aria-hidden="true">
        {edgeLabel}
      </div>
      <div className="shape-chart-horizontal-board" aria-hidden="true">
        {DISPLAY_STRING_INDEXES.map((stringIndex) => {
          const fret = relativeFrets[stringIndex]
          const marker = fret === 'x' ? 'x' : fret === 0 ? 'o' : ''
          const stringLabel = STRING_LABELS[stringIndex]

          return (
            <div className="shape-chart-string-row" key={`string-${stringIndex}`}>
              <span className="shape-chart-row-marker">{marker}</span>
              <span className="shape-chart-row-line">
                {chartFrets.map((fretNumber) => {
                  const isFretted = typeof fret === 'number' && fret > 0 && fret === fretNumber
                  return (
                    <span className="shape-chart-fret-space" key={`cell-${stringIndex}-${fretNumber}`}>
                      {isFretted && <span className="shape-chart-dot" />}
                    </span>
                  )
                })}
              </span>
              <span className="shape-chart-string-label">{stringLabel}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
