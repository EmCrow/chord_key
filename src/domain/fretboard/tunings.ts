import type { TuningDef } from '../types'
import { noteToMidi } from '../music/notes'

export const TUNINGS: TuningDef[] = [
  { id: 'standard', label: 'Standard (E A D G B E)', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  { id: 'half_step_down', label: 'Half Step Down (Eb Ab Db Gb Bb Eb)', strings: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'] },
  { id: 'whole_step_down', label: 'Whole Step Down (D G C F A D)', strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
  { id: 'drop_d', label: 'Drop D (D A D G B E)', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  { id: 'drop_c', label: 'Drop C (C G C F A D)', strings: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
  { id: 'dadgad', label: 'DADGAD (D A D G A D)', strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
  { id: 'open_g', label: 'Open G (D G D G B D)', strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'] },
  { id: 'open_d', label: 'Open D (D A D F# A D)', strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'] },
  { id: 'open_c', label: 'Open C (C G C G C E)', strings: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'] },
  { id: 'all_fourths', label: 'All Fourths (E A D G C F)', strings: ['E2', 'A2', 'D3', 'G3', 'C4', 'F4'] },
  { id: 'new_standard', label: 'New Standard (C G D A E G)', strings: ['C2', 'G2', 'D3', 'A3', 'E4', 'G4'] },
]

export function getTuningById(id: string): TuningDef {
  const tuning = TUNINGS.find((entry) => entry.id === id)
  if (!tuning) {
    throw new Error(`Unknown tuning: ${id}`)
  }
  return tuning
}

export function tuningToMidi(tuning: TuningDef): number[] {
  return tuning.strings.map((note) => noteToMidi(note))
}
