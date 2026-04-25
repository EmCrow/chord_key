# AGENTS.md

## Purpose
This project uses focused agent contexts so each contributor can work quickly without loading the entire codebase.

## Global Rules
- Keep all music math in `src/domain/*`; keep React components presentation-focused.
- Add or update tests for any domain behavior change.
- Preserve the fixed nut-to-fret-15 visual range.
- Do not introduce backend dependencies for v1.
- Use readable color contrast and keep fretboard note text legible.

## Integration Contracts
- `src/domain/music/*` owns key/scale/chord/Nashville calculations.
- `src/domain/fretboard/*` owns tuning maps, CAGED windows, and fretboard note generation.
- `src/domain/translator/*` owns progression parsing and shape translation, including capo behavior.
- UI modules in `src/components/*` consume derived data only.
