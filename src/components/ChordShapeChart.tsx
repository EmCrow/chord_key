import type { TranslatedShape } from '../domain/types'

interface ChordShapeChartProps {
  shape: TranslatedShape | null
  ariaLabel: string
}

interface ShapeWindow {
  startFret: number
  endFret: number
}

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

export function ChordShapeChart({ shape, ariaLabel }: ChordShapeChartProps) {
  if (!shape) {
    return <div className="shape-chart shape-chart-empty">unplayable</div>
  }

  const { relativeFrets } = shape
  const { startFret, endFret } = getShapeWindow(relativeFrets)
  const chartFrets = Array.from({ length: endFret - startFret + 1 }, (_, index) => startFret + index)
  const displayStringIndexes = [5, 4, 3, 2, 1, 0] // high E to low E

  return (
    <div className="shape-chart" role="img" aria-label={ariaLabel}>
      <div className="shape-chart-grid" aria-hidden="true">
        {displayStringIndexes.map((stringIndex, rowIndex) => {
          const fret = relativeFrets[stringIndex]
          const marker = fret === 'x' ? 'x' : fret === 0 ? 'o' : ''

          return (
            <div
              className="shape-chart-row"
              key={`string-${stringIndex}`}
              style={{ gridTemplateColumns: `14px repeat(${chartFrets.length}, 1fr)` }}
            >
              <span className="shape-chart-marker">{marker}</span>
              {chartFrets.map((fretNumber, fretColumnIndex) => {
                const isFretted = typeof fret === 'number' && fret > 0 && fret === fretNumber
                const rowClasses = [
                  'shape-chart-cell',
                  rowIndex === displayStringIndexes.length - 1 ? 'shape-chart-cell-last' : '',
                  fretColumnIndex === chartFrets.length - 1 ? 'shape-chart-cell-last-col' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <span className={rowClasses} key={`cell-${stringIndex}-${fretNumber}`}>
                    {isFretted && <span className="shape-chart-dot" />}
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>
      {startFret > 1 && <div className="shape-chart-base">{startFret}fr</div>}
    </div>
  )
}
