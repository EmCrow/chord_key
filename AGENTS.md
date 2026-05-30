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
