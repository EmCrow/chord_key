# Fix Log

Researched and implemented on May 30, 2026.

## Sources Used

- Fender, "How to Read a Chord Chart": https://www.fender.com/articles/chords/how-to-read-a-chord-chart
  - Used for chord diagram conventions: vertical string lines, horizontal fret lines, low E through high E left-to-right, X/O markers, and dots showing fretting positions.
- Fender, "How to Read Guitar Chord Charts": https://www.fender.com/articles/chords/read-guitar-chord-charts
  - Used to confirm that chord diagrams should show frets/strings as a grid and dots on the corresponding string/fret position.
- Guitar Composers ToolBox, "Interactive Circle of Fifths": https://guitarcomposerstoolbox.com/circle-of-fifths/
  - Used to confirm that a selected key view should expose all seven diatonic chords with Roman numerals I through vii.
- Nashville Number System reference: https://www.nashville-numbers.com/learn/nashville-numbers
  - Used to confirm the practical default degree qualities: 1, 4, and 5 major; 2, 3, and 6 minor; 7 diminished.
- Nashville Number System chart: https://www.nashville-numbers.com/
  - Used to confirm that common numbered progressions should stay front-and-center while allowing fuller degree exploration.

## What Changed

- Fixed fretboard orientation.
  - The fretboard table now renders the high string at the top and the low string at the bottom, so standard tuning appears top-to-bottom as `E4, B3, G3, D3, A2, E2`.
  - This matches the player's visual expectation that standard tuning is `E A D G B e` from bottom to top.

- Rebuilt chord diagrams.
  - Chord shapes now render as horizontal chord boxes with the nut or capo on the left.
  - Strings run as horizontal lines, with low E on the bottom and high e on top.
  - Frets run left-to-right away from the nut/capo.
  - X/O markers sit at the left of each string before the nut/capo.
  - Dots are centered on the actual string line at the fretted position, instead of floating in a generic grid space.

- Fixed common open C selection.
  - Standard tuning with no capo now prefers trusted open-position voicings for common beginner/common-use chords.
  - `C` now resolves to `x 3 2 0 1 0` instead of favoring the eighth-fret barre shape.
  - With a capo, standard tuning now prefers the closest matching open-shape family near the capo when one exists.
  - Example: a sounding `F` with capo 5 resolves to a C-shaped chord, `x 3 2 0 1 0` relative to the capo.
  - The general solver is still used for alternate tunings, capo contexts, slash chords, and unsupported voicings.

- Expanded the Circle of Fifths.
  - Outer circle nodes remain the major keys.
  - A new inner degree ring groups all seven active-key chords in one section.
  - The selected key still lists all seven notes and diatonic chords underneath.

- Simplified Nashville Number System by default.
  - The Nashville table has been replaced by a compact active-key panel.
  - Common degrees `1, 4, 5, 6` are shown as large buttons.
  - Less common degrees `2, 3, 7` live in a dropdown.
  - A mode dropdown preserves quick major/minor switching without restoring the full all-key grid.

- Added an assumption log.
  - `AGENTS.md` now instructs contributors to record verified-wrong user theory/layout assumptions in `you_are_wrong_sir.md`.
  - The capo 5 / F / C-shape assumption was correct, so it is documented as correct rather than listed as a wrong assumption.

## Tests Added

- Open C shape preference in standard tuning.
- Fretboard row order: high E top through low E bottom.
- Nashville compact common-degree buttons plus less-common dropdown.
- Circle of Fifths inner degree-ring visibility for all seven active-key Roman numerals.
- Capo 5 sounding F chooses a C-shaped relative voicing.

## Verification

Run:

```bash
npm run gate
```

For manual visual QA:

```bash
npm run dev
```

Then open the local Vite URL and check:

- Fretboard top row is `E4`; bottom row is `E2`.
- `C` in the default progression shows an open C chord shape.
- Chord diagrams have the nut/capo on the left, horizontal strings, vertical fret positions, and dots on strings.
- Circle of Fifths has an outer major-key ring and an inner all-seven-degree section.
- Nashville shows four common buttons plus `Mode` and `More` dropdowns.
