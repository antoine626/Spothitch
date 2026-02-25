#!/usr/bin/env node
/**
 * Update Visual Regression Baselines
 *
 * Convenience wrapper that runs visual-regression.mjs with --update-baselines.
 * Takes screenshots of all key screens and saves them as the new baselines
 * for future comparisons.
 *
 * Usage: node scripts/update-baselines.mjs
 *
 * Prerequisites:
 *   - Run "npm run build" first (needs dist/ to exist)
 *   - Playwright must be installed
 */

import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SCRIPT = join(__dirname, 'visual-regression.mjs')

console.log('Updating visual regression baselines...\n')

try {
  execSync(`node "${SCRIPT}" --update-baselines`, {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: 120000, // 2 minutes max
  })
  console.log('\nBaselines updated successfully.')
} catch (err) {
  console.error('\nFailed to update baselines.')
  process.exit(err.status || 1)
}
