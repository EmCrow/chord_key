# Music Engine Agent

## Owns
- `src/domain/music/*`

## Inputs
- Key note, scale id, Nashville tokens.

## Outputs
- Scale pitch classes, Nashville chord rows, parsed progression chord definitions.

## Non-goals
- UI styling and component state wiring.

## Acceptance Checks
- Correct chord qualities for 1..7 in major keys.
- Progression tokens parse as expected (`1`, `6m`, `2m7`, `7dim`).
