#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ingestFromFetch, ingestFromPayloadMap, writeResearchArtifacts } from './research-pipeline.mjs'

async function readJson(path) {
  const contents = await readFile(path, 'utf8')
  return JSON.parse(contents)
}

async function loadSourceConfig(configPath) {
  const config = await readJson(configPath)
  if (!Array.isArray(config.sources) || config.sources.length === 0) {
    throw new Error('config/research-sources.json must define a non-empty sources array.')
  }

  return config.sources
}

async function loadFixturePayloads(sourceConfigs, fixtureDir) {
  const payloadMap = {}
  for (const source of sourceConfigs) {
    const fixturePath = resolve(fixtureDir, `${source.sourceId}.json`)
    payloadMap[source.sourceId] = await readJson(fixturePath)
  }
  return payloadMap
}

async function fetchJson(sourceConfig) {
  const response = await fetch(sourceConfig.sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceConfig.sourceId} from ${sourceConfig.sourceUrl}: ${response.status}`)
  }

  return response.json()
}

async function run() {
  const cwd = process.cwd()
  const args = new Set(process.argv.slice(2))
  const useFixtures = process.env.RESEARCH_USE_FIXTURES === '1' || args.has('--fixtures')
  const dryRun = args.has('--dry-run')
  const now = new Date().toISOString()

  const configPath = resolve(cwd, 'config/research-sources.json')
  const fixtureDir = resolve(cwd, 'data/research/fixtures')
  const outputDir = resolve(cwd, 'data/research')

  const sourceConfigs = await loadSourceConfig(configPath)
  const artifacts = useFixtures
    ? ingestFromPayloadMap({
        sourceConfigs,
        payloadMap: await loadFixturePayloads(sourceConfigs, fixtureDir),
        generatedAt: now,
        retrievedAt: now,
      })
    : await ingestFromFetch({
        sourceConfigs,
        fetchJson,
        generatedAt: now,
        retrievedAt: now,
      })

  if (!dryRun) {
    await writeResearchArtifacts(artifacts, outputDir)
  }

  const mode = useFixtures ? 'fixtures' : 'network'
  console.log(`Research sync complete (${mode}${dryRun ? ', dry-run' : ''}).`)
  console.log(`Sources: ${artifacts.snapshot.sources.length}`)
  console.log(`Voicings: ${artifacts.snapshot.voicings.length}`)
  console.log(`Transpositions: ${artifacts.snapshot.transpositions.length}`)
}

run().catch((error) => {
  console.error(`Research sync failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
