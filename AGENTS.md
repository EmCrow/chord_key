# AGENTS.md

## Purpose
This project uses focused agent contexts so each contributor can work quickly without loading the entire codebase.

## Global Rules
- Keep all music math in `src/domain/*`; keep React components presentation-focused.
- Add or update tests for any domain behavior change.
- Preserve the fixed nut-to-fret-15 visual range.
- Do not introduce backend dependencies for v1.
- Use readable color contrast and keep fretboard note text legible.
- When a user theory or guitar-layout assumption is verified as wrong, record the correction in `you_are_wrong_sir.md` with the date, claim, correction, and source/context.
- Do not add correct assumptions to `you_are_wrong_sir.md`; explicitly note in the response when the user was right.

## Integration Contracts
- `src/domain/music/*` owns key/scale/chord/Nashville calculations.
- `src/domain/fretboard/*` owns tuning maps, CAGED windows, and fretboard note generation.
- `src/domain/translator/*` owns progression parsing and shape translation, including capo behavior.
- UI modules in `src/components/*` consume derived data only.

## Branch Scope Rules
- Every focused feature or fix branch must stay within its named scope.
- Treat the branch name and the latest explicit user instruction as the branch contract.
- If the user asks for work outside the current branch scope, politely decline and explain that the work needs a matching branch first.
- Do not make unrelated Nashville, Circle of Fifths, fretboard, translator, deployment, research-source, or general styling changes from a scoped branch.
- Use `main` only for integration, branch-scope rule updates, and user-requested release/merge housekeeping.

### Branch Scope Examples
- `circle_of_fifths`: only Circle of Fifths UI and Circle of Fifths music-theory behavior. Relevant files include `src/components/CircleOfFifths.tsx`, circle-specific CSS in `src/index.css`, Circle-related tests, and supporting domain theory code only when needed for Circle correctness.
- `fretboard*`: only fretboard UI/layout and fretboard-domain behavior. Relevant files include `src/components/Fretboard.tsx`, fretboard-specific CSS in `src/index.css`, fretboard tests, and `src/domain/fretboard/*` only when needed for fretboard correctness.

## Research Agent
- Name: `research-agent`
- Mission: vet internet sources (GitHub and non-GitHub), enforce licensing rules, and keep source registries auditable.
- Owns:
  - `config/research-sources.json`
  - `sources/research_sources.json`
  - `scripts/research-pipeline.mjs`
  - `scripts/research-sync.mjs`
- Acceptance checks:
  - Every source in config is documented in `sources/research_sources.json`.
  - Every source has a manual-check instruction and explicit usage.
  - Ingestion rejects non-permissive licenses.
  - Theory-reference sources are never ingested as raw data unless explicitly approved and licensed for that purpose.
