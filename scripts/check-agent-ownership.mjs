#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ownershipPath = resolve(process.cwd(), 'config/agent-ownership.json')

const ownership = JSON.parse(readFileSync(ownershipPath, 'utf8'))

/** @param {string} value */
function normalizePath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/\/+$/, '')
}

/** @param {string} pattern @param {string} candidate */
function patternMatches(pattern, candidate) {
  const p = normalizePath(pattern)
  const c = normalizePath(candidate)

  if (p === c) {
    return true
  }

  if (p.endsWith('/**')) {
    const base = p.slice(0, -3)
    return c === base || c.startsWith(`${base}/`)
  }

  if (p.endsWith('/*')) {
    const base = p.slice(0, -2)
    if (!c.startsWith(`${base}/`)) {
      return false
    }

    const remainder = c.slice(base.length + 1)
    return remainder.length > 0 && !remainder.includes('/')
  }

  const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\\\*\\\*/g, '.*').replace(/\\\*/g, '[^/]*')
  return new RegExp(`^${escaped}$`).test(c)
}

/** @param {string} left @param {string} right */
function patternsConflict(left, right) {
  const l = normalizePath(left)
  const r = normalizePath(right)

  if (l === r) {
    return true
  }

  if (l.endsWith('/**')) {
    const base = l.slice(0, -3)
    if (r === base || r.startsWith(`${base}/`)) {
      return true
    }
  }

  if (r.endsWith('/**')) {
    const base = r.slice(0, -3)
    if (l === base || l.startsWith(`${base}/`)) {
      return true
    }
  }

  return false
}

const errors = []

const agents = ownership.agents ?? {}
const stageOwnership = ownership.stage_ownership ?? {}
const agentNames = Object.keys(agents)

if (agentNames.length === 0) {
  errors.push('No agents were defined in config/agent-ownership.json.')
}

const expectedStages = Array.from({ length: 10 }, (_, idx) => `stage-${String(idx + 1).padStart(2, '0')}`)
for (const stageId of expectedStages) {
  if (!(stageId in stageOwnership)) {
    errors.push(`Missing ${stageId} in stage_ownership.`)
  }
}

for (const [agentName, config] of Object.entries(agents)) {
  const ownedPaths = config.owned_paths ?? []
  if (!Array.isArray(ownedPaths) || ownedPaths.length === 0) {
    errors.push(`Agent "${agentName}" must define at least one owned path.`)
  }
}

for (let i = 0; i < agentNames.length; i += 1) {
  for (let j = i + 1; j < agentNames.length; j += 1) {
    const left = agentNames[i]
    const right = agentNames[j]
    const leftPatterns = agents[left].owned_paths ?? []
    const rightPatterns = agents[right].owned_paths ?? []

    for (const leftPattern of leftPatterns) {
      for (const rightPattern of rightPatterns) {
        if (patternsConflict(leftPattern, rightPattern)) {
          errors.push(`Ownership conflict between "${left}" and "${right}": ${leftPattern} <-> ${rightPattern}`)
        }
      }
    }
  }
}

for (const [stageId, stage] of Object.entries(stageOwnership)) {
  const primary = stage.primary
  const support = stage.support ?? []
  const touchedPaths = stage.paths ?? []

  if (!primary || !(primary in agents)) {
    errors.push(`${stageId} primary owner "${String(primary)}" is not defined in agents.`)
    continue
  }

  const stageOwners = [primary, ...support]
  for (const owner of support) {
    if (!(owner in agents)) {
      errors.push(`${stageId} support owner "${owner}" is not defined in agents.`)
    }
  }

  for (const touchedPath of touchedPaths) {
    const covered = stageOwners.some((owner) => {
      const ownedPatterns = agents[owner].owned_paths ?? []
      return ownedPatterns.some((pattern) => patternMatches(pattern, touchedPath))
    })

    if (!covered) {
      errors.push(`${stageId} path "${touchedPath}" is not owned by its assigned owners.`)
    }
  }
}

if (errors.length > 0) {
  console.error('Agent ownership check failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Agent ownership check passed.')
console.log(`Agents: ${agentNames.length}`)
console.log(`Stages: ${Object.keys(stageOwnership).length}`)
