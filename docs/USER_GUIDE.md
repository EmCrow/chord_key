# User Guide

## 1. Pick a Key
Use any of these synced controls:
- Top key dropdown
- Nashville key buttons
- Circle of Fifths key nodes

Changing key updates all modules.

## 2. Choose Scale and CAGED Shape
- Select a scale from the Scale dropdown.
- Select a CAGED shape (`C A G E D`).
- The fretboard highlights:
  - Scale tones
  - Root notes
  - Active CAGED window
  - Active Nashville degree chord tones

## 3. Use the Fretboard
- Fretboard is fixed from open strings (nut) to fret 15.
- Turn on note labels or interval labels.
- When capo is set in the new tuning section, the capo fret is marked on the board.

## 4. Translate Chord Progressions
In the Tuning Translator:
- Enter progression using Nashville tokens: `1`, `5`, `6m`, `2m7`, `7dim`.
- Select original and target tunings.
- Set new tuning capo (0-12).

### Output Columns
- `Original Shape`: baseline shape in original tuning.
- `Translated (Relative)`: fret shape relative to capo.
- `Translated (Absolute)`: actual fret numbers from the nut.

## Example Workflows
### Same tuning + capo
- Original: Standard
- New: Standard
- Capo: 2
- Progression: `1 5 6m 4`

### Alternate tuning + capo
- Original: Standard
- New: DADGAD
- Capo: 2
- Progression: `1 4 5 1`
