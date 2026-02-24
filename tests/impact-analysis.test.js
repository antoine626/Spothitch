/**
 * Impact Analysis Tests
 * Structural tests for critical files: App.js, main.js, state.js
 * These verify that the public API surface of critical modules hasn't
 * changed unexpectedly. Wolf Phase 7 checks for these tests.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const SRC_PATH = join(import.meta.dirname, '..', 'src')

describe('Impact Analysis: state.js', () => {
  let stateModule

  beforeAll(async () => {
    stateModule = await import('../src/stores/state.js')
  })

  it('exports getState function', () => {
    expect(typeof stateModule.getState).toBe('function')
  })

  it('exports setState function', () => {
    expect(typeof stateModule.setState).toBe('function')
  })

  it('exports subscribe function', () => {
    expect(typeof stateModule.subscribe).toBe('function')
  })

  it('exports resetState function', () => {
    expect(typeof stateModule.resetState).toBe('function')
  })

  it('exports actions object', () => {
    expect(typeof stateModule.actions).toBe('object')
    expect(stateModule.actions).not.toBeNull()
  })

  it('initial state has expected core keys', () => {
    stateModule.resetState()
    const state = stateModule.getState()
    // Core keys that must always exist
    const requiredKeys = [
      'user', 'username', 'avatar', 'isLoggedIn',
      'activeTab', 'viewMode', 'theme', 'lang',
      'spots', 'selectedSpot', 'friends',
    ]
    for (const key of requiredKeys) {
      expect(state).toHaveProperty(key)
    }
  })

  it('initial state has correct default values', () => {
    stateModule.resetState()
    const state = stateModule.getState()
    expect(state.activeTab).toBe('map')
    expect(state.theme).toBe('dark')
    expect(state.lang).toBe('fr')
    expect(state.isLoggedIn).toBe(false)
    expect(state.user).toBeNull()
  })

  it('actions has addCheckinToHistory method', () => {
    expect(typeof stateModule.actions.addCheckinToHistory).toBe('function')
  })
})

describe('Impact Analysis: App.js', () => {
  let appModule

  beforeAll(async () => {
    // App.js renders HTML — we just check it exports the expected functions
    appModule = await import('../src/components/App.js')
  })

  it('exports renderApp function', () => {
    expect(typeof appModule.renderApp).toBe('function')
  })

  it('exports afterRender function', () => {
    expect(typeof appModule.afterRender).toBe('function')
  })

  it('renderApp returns a string (HTML)', () => {
    // Pass a minimal state to renderApp
    const html = appModule.renderApp({
      activeTab: 'map',
      theme: 'dark',
      lang: 'fr',
      spots: [],
      isLoggedIn: false,
    })
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })
})

describe('Impact Analysis: main.js window handlers', () => {
  it('main.js defines at least 50 window.* handlers', () => {
    const content = readFileSync(join(SRC_PATH, 'main.js'), 'utf-8')
    const matches = content.match(/window\.\w+\s*=/g) || []
    // Filter out non-handler properties
    const handlers = matches.filter(m => {
      const name = m.replace('window.', '').replace(/\s*=$/, '')
      return !name.startsWith('_') && !['addEventListener', 'removeEventListener',
        'onerror', 'onload', 'onunhandledrejection', '__SPOTHITCH_VERSION__'].includes(name)
    })
    expect(handlers.length).toBeGreaterThanOrEqual(50)
  })

  it('main.js imports from state.js', () => {
    const content = readFileSync(join(SRC_PATH, 'main.js'), 'utf-8')
    expect(content).toContain("from './stores/state.js'")
  })

  it('main.js imports from App.js', () => {
    const content = readFileSync(join(SRC_PATH, 'main.js'), 'utf-8')
    expect(content).toContain("from './components/App.js'")
  })

  it('main.js has render function', () => {
    const content = readFileSync(join(SRC_PATH, 'main.js'), 'utf-8')
    expect(content).toMatch(/function render\b/)
  })

  it('main.js has version check (auto-update)', () => {
    const content = readFileSync(join(SRC_PATH, 'main.js'), 'utf-8')
    expect(content).toContain('version.json')
  })
})
