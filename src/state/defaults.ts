import type { CagedShape, HarmonyMode } from '../domain/types'
import type { ScaleId } from '../domain/music/scales'

export const DEFAULT_STATE = {
  keyNote: 'C',
  harmonyMode: 'major' as HarmonyMode,
  scaleId: 'major' as ScaleId,
  cagedShape: 'E' as CagedShape,
  activeDegree: 1,
  tuningOriginalId: 'standard',
  tuningTargetId: 'standard',
  tuningTargetCapo: 0,
  progressionInput: 'C G Am F',
  showNoteNames: true,
  showIntervals: false,
}
