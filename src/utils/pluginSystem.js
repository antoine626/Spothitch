/**
 * Plugin System
 * Lazy-loads feature modules on demand
 * Reduces initial bundle by deferring non-critical features
 */

const plugins = new Map()
const loaded = new Set()

/**
 * Register a plugin (feature module)
 * @param {string} name - Plugin name
 * @param {Object} config
 * @param {Function} config.loader - () => import('./path/to/module.js')
 * @param {string} [config.description] - Human-readable description
 * @param {boolean} [config.autoInit] - Auto-initialize on load
 * @param {string[]} [config.dependencies] - Other plugins this depends on
 */
export function registerPlugin(name, config) {
  plugins.set(name, {
    name,
    loader: config.loader,
    description: config.description || '',
    autoInit: config.autoInit || false,
    dependencies: config.dependencies || [],
    loaded: false,
    module: null,
  })
}

/**
 * Load a plugin (and its dependencies)
 * @param {string} name - Plugin name
 * @returns {Promise<Object>} The loaded module
 */
export async function loadPlugin(name) {
  if (loaded.has(name)) {
    return plugins.get(name)?.module
  }

  const plugin = plugins.get(name)
  if (!plugin) {
    console.warn(`[Plugin] Unknown plugin: ${name}`)
    return null
  }

  // Load dependencies first
  for (const dep of plugin.dependencies) {
    if (!loaded.has(dep)) {
      await loadPlugin(dep)
    }
  }

  try {
    const module = await plugin.loader()
    plugin.module = module
    plugin.loaded = true
    loaded.add(name)

    // Auto-init if configured
    if (plugin.autoInit && typeof module.init === 'function') {
      await module.init()
    }

    return module
  } catch (e) {
    console.error(`[Plugin] Failed to load ${name}:`, e)
    return null
  }
}

/**
 * Check if a plugin is loaded
 * @param {string} name
 * @returns {boolean}
 */
export function isPluginLoaded(name) {
  return loaded.has(name)
}

/**
 * Get a loaded plugin's module
 * @param {string} name
 * @returns {Object|null}
 */
export function getPlugin(name) {
  const plugin = plugins.get(name)
  return plugin?.module || null
}

/**
 * List all registered plugins and their status
 * @returns {Array<{name, description, loaded}>}
 */
export function listPlugins() {
  return [...plugins.values()].map(p => ({
    name: p.name,
    description: p.description,
    loaded: p.loaded,
    dependencies: p.dependencies,
  }))
}

/**
 * Preload plugins during idle time
 * @param {string[]} names - Plugin names to preload
 */
export function preloadPlugins(names) {
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100))
  names.forEach(name => {
    idle(() => loadPlugin(name))
  })
}

// ==================== DEFAULT PLUGINS ====================

// Register built-in feature plugins
registerPlugin('gamification', {
  loader: () => import('../services/gamification.js'),
  description: 'Points, badges, niveaux',
  autoInit: false,
})

registerPlugin('social', {
  loader: () => import('../services/realtimeChat.js'),
  description: 'Chat temps reel, messages',
  autoInit: false,
})

registerPlugin('guides', {
  loader: () => import('../data/guides.js'),
  description: 'Guides pays (54 pays)',
  autoInit: false,
})

registerPlugin('teamChallenges', {
  loader: () => import('../services/teamChallenges.js'),
  description: 'Defis en equipe',
  dependencies: ['gamification'],
})

registerPlugin('travelGroups', {
  loader: () => import('../services/travelGroups.js'),
  description: 'Groupes de voyage',
  dependencies: ['social'],
})

registerPlugin('adminModeration', {
  loader: () => import('../services/adminModeration.js'),
  description: 'Panel admin moderation',
  autoInit: false,
})

export default {
  registerPlugin,
  loadPlugin,
  isPluginLoaded,
  getPlugin,
  listPlugins,
  preloadPlugins,
}
