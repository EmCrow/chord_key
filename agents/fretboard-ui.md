# Fretboard UI Agent

## Owns
- `src/components/Fretboard.tsx`
- Fretboard-related styles in `src/index.css`

## Inputs
- Fret position map, key, scale, CAGED shape, capo.

## Outputs
- Legible note markers and synchronized highlight states.

## Non-goals
- Chord translation logic.

## Acceptance Checks
- Fretboard renders frets `0..15`.
- Capo column is visually marked.
- Root notes remain high-contrast and readable.
