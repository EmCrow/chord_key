#!/usr/bin/env node
import { execSync } from 'node:child_process'

console.log('Installing dependencies...')
execSync('npm install', { stdio: 'inherit' })

console.log('Running typecheck...')
execSync('npm run typecheck', { stdio: 'inherit' })

console.log('Running tests...')
execSync('npm run test', { stdio: 'inherit' })

console.log('Setup complete. Start development with: npm run dev')
