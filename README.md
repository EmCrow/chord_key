# Guitar Harmony Workbench

A web-based guitar tool that keeps theory and fretboard workflows synchronized in one interface:
- Nashville Number System key/chord table
- Circle of Fifths
- Fixed 15-fret fretboard (nut through fret 15)
- Scale + CAGED shape overlays
- Capo-aware tuning translator for typed chord charts, including slash chords and common suspended/augmented/power shapes
- Static deployment with no backend, database, secrets, or runtime server

## Quickstart (Clone and Run)

### Requirements
- Node.js `22.x` (recommended)
- npm `10+`

### Commands
```bash
git clone <your-repo-url>
cd chords_and_key
npm run setup
npm run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).

## Daily Commands
```bash
npm run dev        # development server
npm run test       # unit + integration tests
npm run typecheck  # TypeScript checks
npm run build      # production build
npm run package:static  # build release/chords-and-key-static for drag-and-drop hosting
npm run start      # preview built app
```

## How to Use
- Choose a **Key** from either the top controls, Nashville key buttons, or Circle of Fifths.
- Pick a **Scale** and **CAGED shape** to update fretboard highlights.
- Enter a letter chord progression in **Tuning Translator** (example: `C G Am F`, `Dm7 G7 Cmaj7`, or `C/E Fsus4 G5`).
- Set **Original Tuning**, **New Tuning**, and **New Tuning Capo**.
- Read translated output in both:
  - Original chord shape
  - Translated shape relative to capo
  - Research-backed offline shape when a verified local voicing exists

## Local-Only Development Changelog
Use `LOCAL_DEV_CHANGELOG.md` for personal development notes. It is ignored by Git and will not be pushed.

A tracked template lives at `LOCAL_DEV_CHANGELOG.example.md`.

## Project Docs
- `docs/USER_GUIDE.md`
- `docs/DEVELOPER_GUIDE.md`
- `AGENTS.md`

## Static Deployment
This app is client-only and deploys cleanly to static hosts:
- Vercel
- Netlify
- GitHub Pages (with a build + publish workflow)

Build output is generated in `dist/` via `npm run build`.

For a nontechnical handoff, run:
```bash
npm run package:static
```

Then upload the files in `release/chords-and-key-static/` to a static host. The package includes a plain-text deployment note for the person receiving it.
