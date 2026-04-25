import { createHash } from 'node:crypto'
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const PERMISSIVE_LICENSES = new Set(['MIT', 'Apache-2.0', 'CC0-1.0', 'Public-Domain'])
const ALLOWED_QUALITIES = new Set(['maj', 'min', 'dim', 'dom7', 'maj7', 'min7', 'dim7'])

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function isObject(value) {
  return typeof value === 'object' && value !== null
}

function normalizePathSort(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizePathSort(entry))
  }

  if (!isObject(value)) {
    return value
  }

  const sortedKeys = Object.keys(value).sort()
  const output = {}
  for (const key of sortedKeys) {
    output[key] = normalizePathSort(value[key])
  }
  return output
}

function decodeFretCharacter(char, label) {
  if (char === 'x' || char === 'X') {
    return 'x'
  }

  if (char >= '0' && char <= '9') {
    return Number(char)
  }

  const lower = char.toLowerCase()
  if (lower >= 'a' && lower <= 'z') {
    return lower.charCodeAt(0) - 87
  }

  throw new Error(`${label} contains invalid fret character "${char}".`)
}

function parseFretsString(frets, label) {
  assert(typeof frets === 'string', `${label} must be a string.`)
  assert(frets.length === 6, `${label} must contain 6 fret symbols.`)
  return frets.split('').map((char) => decodeFretCharacter(char, label))
}

export function stableStringify(value, withTrailingNewline = true) {
  const payload = JSON.stringify(normalizePathSort(value), null, 2)
  return withTrailingNewline ? `${payload}\n` : payload
}

export function checksumJson(value) {
  return createHash('sha256').update(stableStringify(value, false)).digest('hex')
}

function buildStableVoicingId(sourceId, relativeFrets) {
  const signature = relativeFrets.map((value) => (value === 'x' ? 'x' : String(value))).join('-')
  const digest = createHash('sha1').update(signature).digest('hex').slice(0, 12)
  return `${sourceId}-voicing-${digest}`
}

function normalizeFretArray(value, label) {
  assert(Array.isArray(value), `${label} must be an array.`)
  assert(value.length === 6, `${label} must contain 6 entries.`)

  return value.map((entry, index) => {
    const isMuted = entry === 'x'
    const isFret = Number.isInteger(entry) && entry >= 0 && entry <= 15
    assert(isMuted || isFret, `${label}[${index}] must be "x" or integer 0..15.`)
    return entry
  })
}

function deriveFretBounds(relativeFrets) {
  const numericFrets = relativeFrets.filter((value) => typeof value === 'number')
  if (numericFrets.length === 0) {
    return { minFret: 0, maxFret: 0 }
  }

  return {
    minFret: Math.min(...numericFrets),
    maxFret: Math.max(...numericFrets),
  }
}

function normalizeVoicing(sourceId, entry, index) {
  assert(isObject(entry), `voicings[${index}] must be an object.`)
  assert(typeof entry.chordSymbol === 'string' && entry.chordSymbol.length > 0, `voicings[${index}].chordSymbol is required.`)
  assert(typeof entry.rootNote === 'string' && entry.rootNote.length > 0, `voicings[${index}].rootNote is required.`)
  assert(typeof entry.quality === 'string' && ALLOWED_QUALITIES.has(entry.quality), `voicings[${index}].quality is invalid.`)
  assert(typeof entry.tuningId === 'string' && entry.tuningId.length > 0, `voicings[${index}].tuningId is required.`)

  const relativeFrets = normalizeFretArray(entry.relativeFrets, `voicings[${index}].relativeFrets`)
  const { minFret, maxFret } = deriveFretBounds(relativeFrets)
  const voicingId =
    typeof entry.voicingId === 'string' && entry.voicingId.length > 0
      ? entry.voicingId
      : buildStableVoicingId(sourceId, relativeFrets)
  const playableCount = relativeFrets.filter((value) => value !== 'x').length
  const playable = typeof entry.playable === 'boolean' ? entry.playable : playableCount >= 3

  return {
    voicingId,
    chordSymbol: entry.chordSymbol,
    rootNote: entry.rootNote,
    quality: entry.quality,
    tuningId: entry.tuningId,
    relativeFrets,
    minFret: Number.isInteger(entry.minFret) ? entry.minFret : minFret,
    maxFret: Number.isInteger(entry.maxFret) ? entry.maxFret : maxFret,
    playable,
    sourceId,
  }
}

function normalizeTransposition(sourceId, entry, index) {
  assert(isObject(entry), `transpositions[${index}] must be an object.`)
  assert(
    typeof entry.fromChordSymbol === 'string' && entry.fromChordSymbol.length > 0,
    `transpositions[${index}].fromChordSymbol is required.`,
  )
  assert(typeof entry.toChordSymbol === 'string' && entry.toChordSymbol.length > 0, `transpositions[${index}].toChordSymbol is required.`)
  assert(Number.isInteger(entry.semitoneDelta), `transpositions[${index}].semitoneDelta must be an integer.`)
  assert(
    typeof entry.fromVoicingId === 'string' && entry.fromVoicingId.length > 0,
    `transpositions[${index}].fromVoicingId is required.`,
  )

  const toRelativeFrets = normalizeFretArray(entry.toRelativeFrets, `transpositions[${index}].toRelativeFrets`)
  const transpositionId =
    typeof entry.transpositionId === 'string' && entry.transpositionId.length > 0
      ? entry.transpositionId
      : `${sourceId}-transposition-${index + 1}`

  return {
    transpositionId,
    fromChordSymbol: entry.fromChordSymbol,
    toChordSymbol: entry.toChordSymbol,
    semitoneDelta: entry.semitoneDelta,
    fromVoicingId: entry.fromVoicingId,
    toRelativeFrets,
    sourceId,
  }
}

function chordSymbolFromSuffix(key, suffix) {
  const normalizedSuffix = String(suffix).trim().toLowerCase()

  if (normalizedSuffix === 'major' || normalizedSuffix === '') {
    return key
  }
  if (normalizedSuffix === 'minor' || normalizedSuffix === 'm') {
    return `${key}m`
  }
  if (normalizedSuffix === 'maj7') {
    return `${key}maj7`
  }
  if (normalizedSuffix === 'm7' || normalizedSuffix === 'min7') {
    return `${key}m7`
  }
  if (normalizedSuffix === 'dim') {
    return `${key}dim`
  }

  return `${key}${suffix}`
}

function qualityFromSuffix(suffix) {
  const normalizedSuffix = String(suffix).trim().toLowerCase()

  if (normalizedSuffix === '' || normalizedSuffix === 'major') {
    return 'maj'
  }
  if (normalizedSuffix === 'minor' || normalizedSuffix === 'm') {
    return 'min'
  }
  if (normalizedSuffix === 'dim') {
    return 'dim'
  }
  if (normalizedSuffix === 'maj7') {
    return 'maj7'
  }
  if (normalizedSuffix === 'm7' || normalizedSuffix === 'min7') {
    return 'min7'
  }
  if (normalizedSuffix === '7') {
    return 'dom7'
  }
  if (normalizedSuffix === 'dim7') {
    return 'dim7'
  }

  return 'maj'
}

function normalizeSzazaChordPayload(sourceConfig, payload) {
  assert(isObject(payload), `source "${sourceConfig.sourceId}" payload must be an object.`)
  assert(typeof payload.key === 'string' && payload.key.length > 0, `source "${sourceConfig.sourceId}" payload.key is required.`)
  assert(typeof payload.suffix === 'string', `source "${sourceConfig.sourceId}" payload.suffix is required.`)
  assert(Array.isArray(payload.positions), `source "${sourceConfig.sourceId}" payload.positions must be an array.`)

  const chordSymbol = chordSymbolFromSuffix(payload.key, payload.suffix)
  const quality = qualityFromSuffix(payload.suffix)

  const voicings = payload.positions
    .map((position, index) => {
    assert(isObject(position), `source "${sourceConfig.sourceId}" positions[${index}] must be an object.`)
    const parsedFrets = parseFretsString(position.frets, `source "${sourceConfig.sourceId}" positions[${index}].frets`)
    const hasOutOfRangeFret = parsedFrets.some((value) => typeof value === 'number' && value > 15)
    if (hasOutOfRangeFret) {
      return null
    }

    const relativeFrets = normalizeFretArray(parsedFrets, `source "${sourceConfig.sourceId}" positions[${index}].frets`)
    const bounds = deriveFretBounds(relativeFrets)
    const voicingId = buildStableVoicingId(sourceConfig.sourceId, relativeFrets)
    const playableCount = relativeFrets.filter((value) => value !== 'x').length

    return {
      voicingId,
      chordSymbol,
      rootNote: payload.key,
      quality,
      tuningId: sourceConfig.tuningId,
      relativeFrets,
      minFret: bounds.minFret,
      maxFret: bounds.maxFret,
      playable: playableCount >= 3,
      sourceId: sourceConfig.sourceId,
    }
  })
    .filter((entry) => entry !== null)

  return {
    voicings: sortById(voicings, 'voicingId'),
    transpositions: [],
    rawPayload: normalizePathSort(payload),
  }
}

function normalizeTombatossalsChordPayload(sourceConfig, payload) {
  assert(isObject(payload), `source "${sourceConfig.sourceId}" payload must be an object.`)
  assert(isObject(payload.chords), `source "${sourceConfig.sourceId}" payload.chords must be an object.`)
  assert(isObject(sourceConfig.filter), `source "${sourceConfig.sourceId}" filter is required for tombatossals format.`)
  assert(typeof sourceConfig.filter.key === 'string' && sourceConfig.filter.key.length > 0, `source "${sourceConfig.sourceId}" filter.key is required.`)
  assert(
    typeof sourceConfig.filter.suffix === 'string' && sourceConfig.filter.suffix.length > 0,
    `source "${sourceConfig.sourceId}" filter.suffix is required.`,
  )

  const keyChords = payload.chords[sourceConfig.filter.key]
  assert(Array.isArray(keyChords), `source "${sourceConfig.sourceId}" missing chords for key "${sourceConfig.filter.key}".`)

  const matchingChords = keyChords.filter((entry) => isObject(entry) && String(entry.suffix).toLowerCase() === sourceConfig.filter.suffix.toLowerCase())
  assert(matchingChords.length > 0, `source "${sourceConfig.sourceId}" has no matching suffix "${sourceConfig.filter.suffix}" for key "${sourceConfig.filter.key}".`)

  const voicings = matchingChords
    .flatMap((entry, chordIndex) => {
      assert(Array.isArray(entry.positions), `source "${sourceConfig.sourceId}" matching chord at index ${chordIndex} has no positions array.`)
      const chordSymbol = chordSymbolFromSuffix(sourceConfig.filter.key, sourceConfig.filter.suffix)
      const quality = qualityFromSuffix(sourceConfig.filter.suffix)

      return entry.positions.map((position, index) => {
        assert(isObject(position), `source "${sourceConfig.sourceId}" positions[${index}] must be an object.`)
        const parsedFrets = parseFretsString(position.frets, `source "${sourceConfig.sourceId}" positions[${index}].frets`)
        const hasOutOfRangeFret = parsedFrets.some((value) => typeof value === 'number' && value > 15)
        if (hasOutOfRangeFret) {
          return null
        }

        const relativeFrets = normalizeFretArray(parsedFrets, `source "${sourceConfig.sourceId}" positions[${index}].frets`)
        const bounds = deriveFretBounds(relativeFrets)
        const voicingId = buildStableVoicingId(sourceConfig.sourceId, relativeFrets)
        const playableCount = relativeFrets.filter((value) => value !== 'x').length

        return {
          voicingId,
          chordSymbol,
          rootNote: sourceConfig.filter.key,
          quality,
          tuningId: sourceConfig.tuningId,
          relativeFrets,
          minFret: bounds.minFret,
          maxFret: bounds.maxFret,
          playable: playableCount >= 3,
          sourceId: sourceConfig.sourceId,
        }
      })
    })
    .filter((entry) => entry !== null)

  return {
    voicings: sortById(voicings, 'voicingId'),
    transpositions: [],
    rawPayload: normalizePathSort(payload),
  }
}

function sortById(collection, idKey) {
  return [...collection].sort((left, right) => String(left[idKey]).localeCompare(String(right[idKey])))
}

function createIndexes(snapshot) {
  const chordsBySymbol = {}
  const voicingsBySource = {}
  const voicingsByTuning = {}

  for (const voicing of snapshot.voicings) {
    if (!chordsBySymbol[voicing.chordSymbol]) {
      chordsBySymbol[voicing.chordSymbol] = []
    }
    if (!voicingsBySource[voicing.sourceId]) {
      voicingsBySource[voicing.sourceId] = []
    }
    if (!voicingsByTuning[voicing.tuningId]) {
      voicingsByTuning[voicing.tuningId] = []
    }

    chordsBySymbol[voicing.chordSymbol].push(voicing.voicingId)
    voicingsBySource[voicing.sourceId].push(voicing.voicingId)
    voicingsByTuning[voicing.tuningId].push(voicing.voicingId)
  }

  for (const key of Object.keys(chordsBySymbol)) {
    chordsBySymbol[key].sort()
  }
  for (const key of Object.keys(voicingsBySource)) {
    voicingsBySource[key].sort()
  }
  for (const key of Object.keys(voicingsByTuning)) {
    voicingsByTuning[key].sort()
  }

  return {
    chordsBySymbol: normalizePathSort(chordsBySymbol),
    voicingsBySource: normalizePathSort(voicingsBySource),
    voicingsByTuning: normalizePathSort(voicingsByTuning),
  }
}

function buildVoicingSignature(relativeFrets) {
  return relativeFrets.map((value) => (value === 'x' ? 'x' : String(value))).join('-')
}

function createCrossSourceValidation(snapshot, sourceConfigs) {
  const configBySourceId = new Map(sourceConfigs.map((source) => [source.sourceId, source]))
  const voicingsBySource = new Map()

  for (const voicing of snapshot.voicings) {
    if (!voicingsBySource.has(voicing.sourceId)) {
      voicingsBySource.set(voicing.sourceId, [])
    }
    voicingsBySource.get(voicing.sourceId).push(voicing)
  }

  const conflicts = []
  const checks = []

  for (const sourceConfig of sourceConfigs) {
    if (sourceConfig.sourceType !== 'dataset_ingest') {
      continue
    }

    const sourceVoicings = voicingsBySource.get(sourceConfig.sourceId) ?? []
    const sourceSymbols = new Set(sourceVoicings.map((voicing) => voicing.chordSymbol))
    const sourceSignatures = new Set(sourceVoicings.map((voicing) => buildVoicingSignature(voicing.relativeFrets)))
    const validators = Array.isArray(sourceConfig.validationSources) ? sourceConfig.validationSources : []
    const fallbacks = Array.isArray(sourceConfig.fallbackSources) ? sourceConfig.fallbackSources : []

    if (validators.length === 0) {
      conflicts.push({
        sourceId: sourceConfig.sourceId,
        type: 'missing_validation_sources',
        message: `${sourceConfig.sourceId} has no validationSources configured.`,
        action: 'add_validation_source',
      })
      continue
    }

    let validated = false
    let validatedBy = null

    for (const validatorId of validators) {
      const validatorVoicings = voicingsBySource.get(validatorId) ?? []
      const validatorSymbols = new Set(validatorVoicings.map((voicing) => voicing.chordSymbol))
      const validatorSignatures = new Set(validatorVoicings.map((voicing) => buildVoicingSignature(voicing.relativeFrets)))
      const symbolOverlap = [...sourceSymbols].filter((symbol) => validatorSymbols.has(symbol))
      const signatureOverlapCount = [...sourceSignatures].filter((signature) => validatorSignatures.has(signature)).length

      checks.push({
        sourceId: sourceConfig.sourceId,
        validatorId,
        symbolOverlap,
        signatureOverlapCount,
      })

      if (symbolOverlap.length > 0 && signatureOverlapCount > 0) {
        validated = true
        validatedBy = validatorId
        break
      }
    }

    if (!validated) {
      const fallbackAvailable = fallbacks.some((fallbackId) => {
        const fallback = configBySourceId.get(fallbackId)
        return fallback && (fallback.sourceType === 'dataset_validator' || fallback.sourceType === 'dataset_ingest')
      })

      conflicts.push({
        sourceId: sourceConfig.sourceId,
        type: 'cross_source_mismatch',
        message: `${sourceConfig.sourceId} did not achieve cross-source voicing overlap with validators.`,
        fallbackAvailable,
        fallbackSources: fallbacks,
        action: fallbackAvailable ? 'evaluate_fallback_sources' : 'add_additional_source',
      })
    } else {
      checks.push({
        sourceId: sourceConfig.sourceId,
        validatorId: validatedBy,
        status: 'validated',
      })
    }
  }

  return {
    checks: normalizePathSort(checks),
    conflicts: normalizePathSort(conflicts),
    ok: conflicts.length === 0,
  }
}

export function normalizeSourcePayload(sourceConfig, payload, retrievedAt) {
  assert(isObject(sourceConfig), 'sourceConfig must be an object.')
  assert(typeof sourceConfig.sourceId === 'string' && sourceConfig.sourceId.length > 0, 'sourceId is required.')
  assert(typeof sourceConfig.name === 'string' && sourceConfig.name.length > 0, `source "${sourceConfig.sourceId}" name is required.`)
  assert(
    typeof sourceConfig.sourceUrl === 'string' && sourceConfig.sourceUrl.length > 0,
    `source "${sourceConfig.sourceId}" sourceUrl is required.`,
  )
  assert(
    typeof sourceConfig.tuningId === 'string' && sourceConfig.tuningId.length > 0,
    `source "${sourceConfig.sourceId}" tuningId is required.`,
  )
  assert(PERMISSIVE_LICENSES.has(sourceConfig.license), `source "${sourceConfig.sourceId}" has non-permissive license "${sourceConfig.license}".`)

  const normalizedSourceData =
    sourceConfig.format === 'szaza_chord_positions'
      ? normalizeSzazaChordPayload(sourceConfig, payload)
      : sourceConfig.format === 'tombatossals_guitar_lib'
      ? normalizeTombatossalsChordPayload(sourceConfig, payload)
      : (() => {
          assert(isObject(payload), `source "${sourceConfig.sourceId}" payload must be an object.`)
          const voicingsRaw = Array.isArray(payload.voicings) ? payload.voicings : []
          const transpositionsRaw = Array.isArray(payload.transpositions) ? payload.transpositions : []

          const normalizedVoicings = voicingsRaw.map((entry, index) => normalizeVoicing(sourceConfig.sourceId, entry, index))
          const normalizedTranspositions = transpositionsRaw.map((entry, index) =>
            normalizeTransposition(sourceConfig.sourceId, entry, index),
          )

          return {
            voicings: normalizedVoicings,
            transpositions: normalizedTranspositions,
            rawPayload: normalizePathSort(payload),
          }
        })()

  const normalizedVoicings = normalizedSourceData.voicings
  const normalizedTranspositions = normalizedSourceData.transpositions
  const sortedVoicings = sortById(normalizedVoicings, 'voicingId')
  const sortedTranspositions = sortById(normalizedTranspositions, 'transpositionId')
  const checksumPayload = {
    voicings: sortedVoicings,
    transpositions: sortedTranspositions,
  }

  return {
    source: {
      sourceId: sourceConfig.sourceId,
      name: sourceConfig.name,
      sourceUrl: sourceConfig.sourceUrl,
      license: sourceConfig.license,
      retrievedAt,
      checksum: checksumJson(checksumPayload),
    },
    voicings: sortedVoicings,
    transpositions: sortedTranspositions,
    rawPayload: normalizedSourceData.rawPayload,
  }
}

export function ingestFromPayloadMap({ sourceConfigs, payloadMap, generatedAt, retrievedAt }) {
  assert(Array.isArray(sourceConfigs) && sourceConfigs.length > 0, 'sourceConfigs must contain at least one source.')
  assert(isObject(payloadMap), 'payloadMap must be an object keyed by sourceId.')

  const sourceOutputs = sortById(sourceConfigs, 'sourceId').map((sourceConfig) => {
    const payload = payloadMap[sourceConfig.sourceId]
    assert(payload !== undefined, `Missing payload for sourceId "${sourceConfig.sourceId}".`)
    return normalizeSourcePayload(sourceConfig, payload, retrievedAt)
  })

  const snapshot = {
    schemaVersion: 1,
    generatedAt,
    sources: sourceOutputs.map((entry) => entry.source),
    voicings: sortById(
      sourceOutputs.flatMap((entry) => entry.voicings),
      'voicingId',
    ),
    transpositions: sortById(
      sourceOutputs.flatMap((entry) => entry.transpositions),
      'transpositionId',
    ),
  }

  const rawBySource = {}
  for (const output of sourceOutputs) {
    rawBySource[output.source.sourceId] = output.rawPayload
  }

  const validation = createCrossSourceValidation(snapshot, sourceConfigs)
  const missingTuningVoicings = snapshot.voicings.filter((voicing) => typeof voicing.tuningId !== 'string' || voicing.tuningId.length === 0)
  if (missingTuningVoicings.length > 0) {
    throw new Error(`Tuning linkage failed: ${missingTuningVoicings.length} voicings missing tuningId.`)
  }

  if (!validation.ok) {
    const details = validation.conflicts.map((conflict) => conflict.message).join('\n')
    throw new Error(`Cross-source validation failed:\n${details}`)
  }

  return {
    snapshot,
    rawBySource,
    indexes: createIndexes(snapshot),
    validation,
  }
}

export async function ingestFromFetch({
  sourceConfigs,
  fetchJson,
  generatedAt = new Date().toISOString(),
  retrievedAt = new Date().toISOString(),
}) {
  assert(typeof fetchJson === 'function', 'fetchJson callback is required.')
  const payloadMap = {}

  for (const sourceConfig of sourceConfigs) {
    payloadMap[sourceConfig.sourceId] = await fetchJson(sourceConfig)
  }

  return ingestFromPayloadMap({
    sourceConfigs,
    payloadMap,
    generatedAt,
    retrievedAt,
  })
}

export async function writeResearchArtifacts({ snapshot, rawBySource, indexes, validation }, outputRoot = resolve(process.cwd(), 'data/research')) {
  const rawDir = resolve(outputRoot, 'raw')
  const normalizedDir = resolve(outputRoot, 'normalized')
  const indexDir = resolve(outputRoot, 'indexes')

  await mkdir(rawDir, { recursive: true })
  await mkdir(normalizedDir, { recursive: true })
  await mkdir(indexDir, { recursive: true })

  const clearJsonFiles = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true })
    await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => unlink(resolve(directory, entry.name))),
    )
  }

  await clearJsonFiles(rawDir)
  await clearJsonFiles(normalizedDir)
  await clearJsonFiles(indexDir)

  await writeFile(resolve(normalizedDir, 'snapshot.v1.json'), stableStringify(snapshot))
  await writeFile(resolve(indexDir, 'chords-by-symbol.json'), stableStringify(indexes.chordsBySymbol))
  await writeFile(resolve(indexDir, 'voicings-by-source.json'), stableStringify(indexes.voicingsBySource))
  await writeFile(resolve(indexDir, 'voicings-by-tuning.json'), stableStringify(indexes.voicingsByTuning))
  await writeFile(resolve(indexDir, 'source-validation.json'), stableStringify(validation ?? { checks: [], conflicts: [], ok: true }))

  const sourceIds = Object.keys(rawBySource).sort()
  for (const sourceId of sourceIds) {
    await writeFile(resolve(rawDir, `${sourceId}.json`), stableStringify(rawBySource[sourceId]))
  }
}
