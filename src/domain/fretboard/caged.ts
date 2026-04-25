import type { CagedShape } from '../types'
import { normalizePitchClass } from '../music/notes'

interface CagedWindowDef {
  rootString: number
  minOffset: number
  maxOffset: number
  centerOffset: number
  targetCenterFret: number
}

const CAGED_WINDOWS: Record<CagedShape, CagedWindowDef> = {
  C: { rootString: 1, minOffset: -3, maxOffset: 0, centerOffset: -1, targetCenterFret: 2 },
  A: { rootString: 1, minOffset: 0, maxOffset: 4, centerOffset: 2, targetCenterFret: 5 },
  G: { rootString: 3, minOffset: 0, maxOffset: 3, centerOffset: 1, targetCenterFret: 6 },
  E: { rootString: 0, minOffset: 0, maxOffset: 4, centerOffset: 2, targetCenterFret: 10 },
  D: { rootString: 2, minOffset: 0, maxOffset: 3, centerOffset: 1, targetCenterFret: 11 },
}

export interface CagedWindow {
  startFret: number
  endFret: number
  anchorFret: number
}

export function getCagedWindow(shape: CagedShape, tuningMidi: number[], keyPitchClass: number, maxFret = 15): CagedWindow {
  const windowDef = CAGED_WINDOWS[shape]
  const openStringPc = normalizePitchClass(tuningMidi[windowDef.rootString])
  const candidates: number[] = []

  for (let fret = 0; fret <= maxFret; fret += 1) {
    if (normalizePitchClass(openStringPc + fret) === keyPitchClass) {
      const start = fret + windowDef.minOffset
      const end = fret + windowDef.maxOffset
      if (start >= 0 && end <= maxFret) {
        candidates.push(fret)
      }
    }
  }

  const anchorFret =
    candidates.length > 0
      ? candidates.reduce((best, current) => {
          const bestDistance = Math.abs(best + windowDef.centerOffset - windowDef.targetCenterFret)
          const currentDistance = Math.abs(current + windowDef.centerOffset - windowDef.targetCenterFret)

          if (currentDistance === bestDistance) {
            return current < best ? current : best
          }

          return currentDistance < bestDistance ? current : best
        })
      : 0

  return {
    anchorFret,
    startFret: Math.max(0, anchorFret + windowDef.minOffset),
    endFret: Math.min(maxFret, anchorFret + windowDef.maxOffset),
  }
}
