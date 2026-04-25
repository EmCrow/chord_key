# Tuning Translator Agent

## Owns
- `src/domain/translator/*`
- `src/components/TuningTranslator.tsx`

## Inputs
- Nashville progression, key, original tuning, new tuning, capo.

## Outputs
- Original and translated chord shapes with relative and absolute fret maps.

## Non-goals
- Circle-of-fifths and Nashville table rendering.

## Acceptance Checks
- Same tuning + capo returns valid translated shapes.
- Relative + capo == absolute for each fretted string.
- Unparseable tokens are safely ignored.
