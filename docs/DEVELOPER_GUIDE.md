# Developer Guide

## Stack
- React 19 + TypeScript + Vite
- Vitest + Testing Library

## Architecture
- `src/domain/music/*`: notes, scales, harmony, Nashville parsing
- `src/domain/fretboard/*`: tunings, CAGED windowing, fretboard mapping
- `src/domain/translator/*`: progression-to-shape translation and capo logic
- `src/components/*`: UI-only components
- `src/App.tsx`: central app state and derived selectors

## Capo Translation Rules
- Capo applies only to **new tuning** translation context.
- Relative frets are shown as played against capo.
- Absolute frets are computed as `relative + capo`.
- Fretboard display uses new tuning + capo to keep translator and visualization synchronized.

## Development Workflow
```bash
npm run dev
npm run test
npm run typecheck
npm run build
```

## Extending the App
### Add a scale
1. Add scale definition in `src/domain/music/scales.ts`.
2. Ensure interval mapping works in `getScalePitchClasses`.
3. Add/update tests if behavior changes.

### Add a tuning
1. Add tuning entry in `src/domain/fretboard/tunings.ts`.
2. Use standard six-string low-to-high format with octave numbers.
3. Validate translator output with tests.

## Local-Only Changelog
- Create/update `LOCAL_DEV_CHANGELOG.md` in repo root.
- This file is ignored by Git and should never be committed.
- Use `LOCAL_DEV_CHANGELOG.example.md` as template.
