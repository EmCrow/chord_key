# DevOps and Quality Agent

## Owns
- `README.md`
- `docs/*`
- `.github/workflows/*`
- package scripts and test harness wiring

## Inputs
- Project setup requirements and deployment goals.

## Outputs
- Clone-and-run docs, CI checks, and local-only changelog workflow.

## Non-goals
- Feature-level music logic.

## Acceptance Checks
- Fresh clone can run via documented commands.
- CI runs typecheck, tests, and build.
- Local changelog file is ignored by Git.
