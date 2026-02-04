/**
 * Controllers Index
 * Registers all global window handlers for onclick events
 */

import { registerAuthHandlers } from './auth.js'
import { registerNavigationHandlers } from './navigation.js'
import { registerSpotsHandlers } from './spots.js'
import { registerModalsHandlers } from './modals.js'

/**
 * Initialize all controllers and register handlers
 */
export function initControllers() {
  console.log('🎮 Initializing controllers...')

  registerAuthHandlers()
  registerNavigationHandlers()
  registerSpotsHandlers()
  registerModalsHandlers()

  console.log('✅ Controllers initialized')
}

export {
  registerAuthHandlers,
  registerNavigationHandlers,
  registerSpotsHandlers,
  registerModalsHandlers,
}

export default { initControllers }
