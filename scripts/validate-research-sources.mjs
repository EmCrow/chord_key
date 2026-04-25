#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message)
  }
}

export function validateResearchSourcesConfig(config, registry) {
  const errors = []

  const configSources = Array.isArray(config?.sources) ? config.sources : []
  const registrySources = Array.isArray(registry?.sources) ? registry.sources : []

  assert(configSources.length > 0, 'config/research-sources.json must contain at least one source.', errors)
  assert(registrySources.length > 0, 'sources/research_sources.json must contain at least one source.', errors)

  const configById = new Map(configSources.map((source) => [source.sourceId, source]))
  const registryById = new Map(registrySources.map((source) => [source.sourceId, source]))

  for (const source of configSources) {
    assert(typeof source.sourceId === 'string' && source.sourceId.length > 0, 'Each config source must have a sourceId.', errors)
    assert(typeof source.sourceUrl === 'string' && source.sourceUrl.length > 0, `${source.sourceId} is missing sourceUrl.`, errors)
    assert(typeof source.license === 'string' && source.license.length > 0, `${source.sourceId} is missing license.`, errors)
    assert(typeof source.tuningId === 'string' && source.tuningId.length > 0, `${source.sourceId} is missing tuningId.`, errors)
    assert(registryById.has(source.sourceId), `${source.sourceId} is missing from sources/research_sources.json.`, errors)

    if (source.sourceType === 'dataset_ingest') {
      const validators = Array.isArray(source.validationSources) ? source.validationSources : []
      const fallbacks = Array.isArray(source.fallbackSources) ? source.fallbackSources : []
      assert(validators.length > 0, `${source.sourceId} must declare validationSources.`, errors)
      assert(fallbacks.length > 0, `${source.sourceId} must declare fallbackSources.`, errors)

      for (const validatorId of validators) {
        assert(configById.has(validatorId), `${source.sourceId} references unknown validator source "${validatorId}".`, errors)
      }
      for (const fallbackId of fallbacks) {
        assert(configById.has(fallbackId), `${source.sourceId} references unknown fallback source "${fallbackId}".`, errors)
      }
    }
  }

  for (const registrySource of registrySources) {
    assert(
      configById.has(registrySource.sourceId) || registrySource.sourceType === 'theory_reference',
      `${registrySource.sourceId} appears in registry but not in config and is not marked as theory_reference.`,
      errors,
    )
    assert(typeof registrySource.usage === 'string' && registrySource.usage.length > 0, `${registrySource.sourceId} is missing usage text.`, errors)
    assert(
      typeof registrySource.manualCheck === 'string' && registrySource.manualCheck.length > 0,
      `${registrySource.sourceId} is missing manualCheck instructions.`,
      errors,
    )
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

async function run() {
  const root = process.cwd()
  const configPath = resolve(root, 'config/research-sources.json')
  const registryPath = resolve(root, 'sources/research_sources.json')

  const [config, registry] = await Promise.all([readJson(configPath), readJson(registryPath)])
  const result = validateResearchSourcesConfig(config, registry)

  if (!result.ok) {
    console.error('Research source validation failed:')
    for (const error of result.errors) {
      console.error(`- ${error}`)
    }
    process.exit(1)
  }

  console.log(`Research source validation passed (${config.sources.length} config sources, ${registry.sources.length} registry entries).`)
}

if (process.argv[1] && process.argv[1].endsWith('validate-research-sources.mjs')) {
  run().catch((error) => {
    console.error(`Research source validation failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
}
