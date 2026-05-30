#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const rootDir = new URL('..', import.meta.url).pathname
const distDir = join(rootDir, 'dist')
const releaseDir = join(rootDir, 'release')
const packagedDir = join(releaseDir, 'chords-and-key-static')
const manifestPath = join(packagedDir, 'DEPLOY_README.txt')

console.log('Building production static app...')
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' })

if (!existsSync(distDir)) {
  throw new Error('Expected dist/ to exist after npm run build.')
}

rmSync(packagedDir, { recursive: true, force: true })
mkdirSync(packagedDir, { recursive: true })

for (const entry of readdirSync(distDir)) {
  const from = join(distDir, entry)
  const to = join(packagedDir, entry)
  cpSync(from, to, { recursive: true })
}

if (existsSync(join(rootDir, 'README.md'))) {
  copyFileSync(join(rootDir, 'README.md'), join(packagedDir, 'PROJECT_README.md'))
}

const indexHtml = readFileSync(join(packagedDir, 'index.html'), 'utf8')
const assetCount = existsSync(join(packagedDir, 'assets')) ? readdirSync(join(packagedDir, 'assets')).length : 0

writeFileSync(
  manifestPath,
  [
    'Guitar Harmony Workbench static package',
    '',
    'What this is:',
    '- A client-only web app. It does not need a database, backend server, or secrets.',
    '- Upload every file in this folder to any static host.',
    '',
    'Easy hosting options:',
    '- Netlify Drop: drag this whole folder onto https://app.netlify.com/drop',
    '- Vercel: import the repo and use npm run build with dist as the output folder',
    '- GitHub Pages: enable the included Pages workflow in GitHub Actions',
    '',
    `Package check: index.html ${indexHtml.includes('<div id="root"></div>') ? 'found' : 'missing'}, ${assetCount} asset file(s).`,
    '',
  ].join('\n'),
)

console.log(`Static package ready: ${packagedDir}`)
