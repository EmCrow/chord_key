const ALLOWED_LICENSES = new Set<ResearchLicense>(['MIT', 'Apache-2.0', 'CC0-1.0', 'Public-Domain'])
const ALLOWED_QUALITIES = new Set<ResearchChordQuality>(['maj', 'min', 'dim', 'dom7', 'maj7', 'min7', 'dim7'])

export type ResearchLicense = 'MIT' | 'Apache-2.0' | 'CC0-1.0' | 'Public-Domain'
export type ResearchChordQuality = 'maj' | 'min' | 'dim' | 'dom7' | 'maj7' | 'min7' | 'dim7'
export type ResearchFret = number | 'x'

export interface ResearchSourceMeta {
  sourceId: string
  name: string
  sourceUrl: string
  license: ResearchLicense
  retrievedAt: string
  checksum: string
}

export interface ResearchChordVoicingRecord {
  voicingId: string
  chordSymbol: string
  rootNote: string
  quality: ResearchChordQuality
  tuningId: string
  relativeFrets: ResearchFret[]
  minFret: number
  maxFret: number
  playable: boolean
  sourceId: string
}

export interface ResearchTranspositionRecord {
  transpositionId: string
  fromChordSymbol: string
  toChordSymbol: string
  semitoneDelta: number
  fromVoicingId: string
  toRelativeFrets: ResearchFret[]
  sourceId: string
}

export interface ResearchSnapshot {
  schemaVersion: 1
  generatedAt: string
  sources: ResearchSourceMeta[]
  voicings: ResearchChordVoicingRecord[]
  transpositions: ResearchTranspositionRecord[]
}

export interface ResearchValidationResult {
  ok: boolean
  errors: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isFret(value: unknown): value is ResearchFret {
  return value === 'x' || (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 15)
}

function validateFretArray(value: unknown, label: string, errors: string[]): value is ResearchFret[] {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array.`)
    return false
  }

  if (value.length !== 6) {
    errors.push(`${label} must contain exactly 6 strings.`)
    return false
  }

  if (!value.every(isFret)) {
    errors.push(`${label} can only contain non-negative fret numbers (0..15) or "x".`)
    return false
  }

  return true
}

function validateSource(entry: unknown, index: number, errors: string[]): entry is ResearchSourceMeta {
  const label = `sources[${index}]`

  if (!isRecord(entry)) {
    errors.push(`${label} must be an object.`)
    return false
  }

  if (!isString(entry.sourceId)) {
    errors.push(`${label}.sourceId must be a non-empty string.`)
  }
  if (!isString(entry.name)) {
    errors.push(`${label}.name must be a non-empty string.`)
  }
  if (!isString(entry.sourceUrl)) {
    errors.push(`${label}.sourceUrl must be a non-empty string.`)
  }
  if (!isString(entry.checksum)) {
    errors.push(`${label}.checksum must be a non-empty string.`)
  }
  if (!isTimestamp(entry.retrievedAt)) {
    errors.push(`${label}.retrievedAt must be an ISO-compatible timestamp.`)
  }
  if (!ALLOWED_LICENSES.has(entry.license as ResearchLicense)) {
    errors.push(`${label}.license must be one of: ${[...ALLOWED_LICENSES].join(', ')}.`)
  }

  return true
}

function validateVoicing(entry: unknown, index: number, errors: string[]): entry is ResearchChordVoicingRecord {
  const label = `voicings[${index}]`

  if (!isRecord(entry)) {
    errors.push(`${label} must be an object.`)
    return false
  }

  if (!isString(entry.voicingId)) {
    errors.push(`${label}.voicingId must be a non-empty string.`)
  }
  if (!isString(entry.chordSymbol)) {
    errors.push(`${label}.chordSymbol must be a non-empty string.`)
  }
  if (!isString(entry.rootNote)) {
    errors.push(`${label}.rootNote must be a non-empty string.`)
  }
  if (!isString(entry.tuningId)) {
    errors.push(`${label}.tuningId must be a non-empty string.`)
  }
  if (!isString(entry.sourceId)) {
    errors.push(`${label}.sourceId must be a non-empty string.`)
  }
  if (!ALLOWED_QUALITIES.has(entry.quality as ResearchChordQuality)) {
    errors.push(`${label}.quality must be one of: ${[...ALLOWED_QUALITIES].join(', ')}.`)
  }
  if (!isNonNegativeInt(entry.minFret)) {
    errors.push(`${label}.minFret must be a non-negative integer.`)
  }
  if (!isNonNegativeInt(entry.maxFret)) {
    errors.push(`${label}.maxFret must be a non-negative integer.`)
  }
  if (typeof entry.playable !== 'boolean') {
    errors.push(`${label}.playable must be boolean.`)
  }
  validateFretArray(entry.relativeFrets, `${label}.relativeFrets`, errors)

  if (isNonNegativeInt(entry.minFret) && isNonNegativeInt(entry.maxFret) && entry.minFret > entry.maxFret) {
    errors.push(`${label}.minFret cannot be greater than maxFret.`)
  }

  return true
}

function validateTransposition(entry: unknown, index: number, errors: string[]): entry is ResearchTranspositionRecord {
  const label = `transpositions[${index}]`

  if (!isRecord(entry)) {
    errors.push(`${label} must be an object.`)
    return false
  }

  if (!isString(entry.transpositionId)) {
    errors.push(`${label}.transpositionId must be a non-empty string.`)
  }
  if (!isString(entry.fromChordSymbol)) {
    errors.push(`${label}.fromChordSymbol must be a non-empty string.`)
  }
  if (!isString(entry.toChordSymbol)) {
    errors.push(`${label}.toChordSymbol must be a non-empty string.`)
  }
  if (!Number.isInteger(entry.semitoneDelta)) {
    errors.push(`${label}.semitoneDelta must be an integer.`)
  }
  if (!isString(entry.fromVoicingId)) {
    errors.push(`${label}.fromVoicingId must be a non-empty string.`)
  }
  if (!isString(entry.sourceId)) {
    errors.push(`${label}.sourceId must be a non-empty string.`)
  }
  validateFretArray(entry.toRelativeFrets, `${label}.toRelativeFrets`, errors)

  return true
}

export function validateResearchSnapshot(snapshot: unknown): ResearchValidationResult {
  const errors: string[] = []

  if (!isRecord(snapshot)) {
    return { ok: false, errors: ['Research snapshot must be an object.'] }
  }

  if (snapshot.schemaVersion !== 1) {
    errors.push('schemaVersion must be 1.')
  }
  if (!isTimestamp(snapshot.generatedAt)) {
    errors.push('generatedAt must be an ISO-compatible timestamp.')
  }
  if (!Array.isArray(snapshot.sources)) {
    errors.push('sources must be an array.')
  }
  if (!Array.isArray(snapshot.voicings)) {
    errors.push('voicings must be an array.')
  }
  if (!Array.isArray(snapshot.transpositions)) {
    errors.push('transpositions must be an array.')
  }

  if (!Array.isArray(snapshot.sources) || !Array.isArray(snapshot.voicings) || !Array.isArray(snapshot.transpositions)) {
    return { ok: false, errors }
  }

  snapshot.sources.forEach((entry, index) => validateSource(entry, index, errors))
  snapshot.voicings.forEach((entry, index) => validateVoicing(entry, index, errors))
  snapshot.transpositions.forEach((entry, index) => validateTransposition(entry, index, errors))

  const sourceIds = new Set<string>()
  for (const source of snapshot.sources) {
    if (!isRecord(source) || !isString(source.sourceId)) {
      continue
    }
    if (sourceIds.has(source.sourceId)) {
      errors.push(`Duplicate sourceId detected: ${source.sourceId}.`)
    }
    sourceIds.add(source.sourceId)
  }

  const voicingIds = new Set<string>()
  for (const voicing of snapshot.voicings) {
    if (!isRecord(voicing) || !isString(voicing.voicingId)) {
      continue
    }
    if (voicingIds.has(voicing.voicingId)) {
      errors.push(`Duplicate voicingId detected: ${voicing.voicingId}.`)
    }
    voicingIds.add(voicing.voicingId)
  }

  for (let index = 0; index < snapshot.voicings.length; index += 1) {
    const voicing = snapshot.voicings[index]
    if (!isRecord(voicing)) {
      continue
    }
    if (isString(voicing.sourceId) && !sourceIds.has(voicing.sourceId)) {
      errors.push(`voicings[${index}] references missing sourceId "${voicing.sourceId}".`)
    }
  }

  for (let index = 0; index < snapshot.transpositions.length; index += 1) {
    const transposition = snapshot.transpositions[index]
    if (!isRecord(transposition)) {
      continue
    }
    if (isString(transposition.sourceId) && !sourceIds.has(transposition.sourceId)) {
      errors.push(`transpositions[${index}] references missing sourceId "${transposition.sourceId}".`)
    }
    if (isString(transposition.fromVoicingId) && !voicingIds.has(transposition.fromVoicingId)) {
      errors.push(`transpositions[${index}] references missing fromVoicingId "${transposition.fromVoicingId}".`)
    }
  }

  return { ok: errors.length === 0, errors }
}

export function assertValidResearchSnapshot(snapshot: unknown): ResearchSnapshot {
  const result = validateResearchSnapshot(snapshot)
  if (!result.ok) {
    throw new Error(`Invalid research snapshot:\n${result.errors.join('\n')}`)
  }

  return snapshot as ResearchSnapshot
}

export function parseResearchSnapshot(jsonPayload: string): ResearchSnapshot {
  const parsed = JSON.parse(jsonPayload) as unknown
  return assertValidResearchSnapshot(parsed)
}

function canonicalizeSnapshot(snapshot: ResearchSnapshot): ResearchSnapshot {
  return {
    schemaVersion: 1,
    generatedAt: snapshot.generatedAt,
    sources: [...snapshot.sources]
      .sort((a, b) => a.sourceId.localeCompare(b.sourceId))
      .map((source) => ({
        sourceId: source.sourceId,
        name: source.name,
        sourceUrl: source.sourceUrl,
        license: source.license,
        retrievedAt: source.retrievedAt,
        checksum: source.checksum,
      })),
    voicings: [...snapshot.voicings]
      .sort((a, b) => a.voicingId.localeCompare(b.voicingId))
      .map((voicing) => ({
        voicingId: voicing.voicingId,
        chordSymbol: voicing.chordSymbol,
        rootNote: voicing.rootNote,
        quality: voicing.quality,
        tuningId: voicing.tuningId,
        relativeFrets: [...voicing.relativeFrets],
        minFret: voicing.minFret,
        maxFret: voicing.maxFret,
        playable: voicing.playable,
        sourceId: voicing.sourceId,
      })),
    transpositions: [...snapshot.transpositions]
      .sort((a, b) => a.transpositionId.localeCompare(b.transpositionId))
      .map((transposition) => ({
        transpositionId: transposition.transpositionId,
        fromChordSymbol: transposition.fromChordSymbol,
        toChordSymbol: transposition.toChordSymbol,
        semitoneDelta: transposition.semitoneDelta,
        fromVoicingId: transposition.fromVoicingId,
        toRelativeFrets: [...transposition.toRelativeFrets],
        sourceId: transposition.sourceId,
      })),
  }
}

export function serializeResearchSnapshot(snapshot: ResearchSnapshot): string {
  const canonical = canonicalizeSnapshot(snapshot)
  return `${JSON.stringify(canonical, null, 2)}\n`
}
