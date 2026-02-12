/**
 * SplashScreen Component
 * A fun animated splash screen with hitchhiking theme
 */

import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'

// Loading message i18n keys
const loadingMessageKeys = [
  'loadingMsg1', 'loadingMsg2', 'loadingMsg3', 'loadingMsg4', 'loadingMsg5',
  'loadingMsg6', 'loadingMsg7', 'loadingMsg8', 'loadingMsg9', 'loadingMsg10',
  'loadingMsg11', 'loadingMsg12', 'loadingMsg13', 'loadingMsg14', 'loadingMsg15',
]

function getLoadingMessages() {
  return loadingMessageKeys.map(key => t(key)).filter(Boolean)
}

/**
 * Get a random loading message
 */
export function getRandomMessage() {
  const messages = getLoadingMessages()
  if (messages.length === 0) return 'Loading...'
  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Render the splash screen HTML
 */
export function renderSplashScreen() {
  const message = getRandomMessage()

  return `
    <div id="splash-screen" class="splash-screen" aria-live="polite" aria-label="${t('appLoading') || 'Loading SpotHitch'}">
      <!-- Background with gradient -->
      <div class="splash-bg"></div>

      <!-- Animated road lines -->
      <div class="splash-road">
        <div class="road-line"></div>
        <div class="road-line"></div>
        <div class="road-line"></div>
      </div>

      <!-- Main content -->
      <div class="splash-content">
        <!-- Logo -->
        <div class="splash-logo">
          <span class="splash-logo-icon">
            ${icon('route', 'w-5 h-5')}
          </span>
          <h1 class="splash-logo-text">SpotHitch</h1>
        </div>

        <!-- Animated hitchhiker -->
        <div class="splash-animation">
          <!-- Person with thumb up -->
          <div class="splash-hitchhiker">
            <div class="hitchhiker-body">
              ${icon('person', 'w-5 h-5')}
            </div>
            <div class="hitchhiker-thumb">
              ${icon('thumbs-up', 'w-5 h-5')}
            </div>
          </div>

          <!-- Car passing by -->
          <div class="splash-car">
            ${icon('car-side', 'w-5 h-5')}
          </div>
        </div>

        <!-- Loading message -->
        <p class="splash-message" id="splash-message">${message}</p>

        <!-- Progress dots -->
        <div class="splash-dots">
          <span class="splash-dot"></span>
          <span class="splash-dot"></span>
          <span class="splash-dot"></span>
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="splash-decorations">
        ${icon('sun', 'w-5 h-5 splash-sun')}
        ${icon('cloud', 'w-5 h-5 splash-cloud splash-cloud-1')}
        ${icon('cloud', 'w-5 h-5 splash-cloud splash-cloud-2')}
      </div>
    </div>
  `
}

/**
 * Initialize the splash screen
 * Replaces the basic loader with animated splash
 */
export function initSplashScreen() {
  const loader = document.getElementById('app-loader')
  if (!loader) return

  // Replace loader content with splash screen
  loader.innerHTML = renderSplashScreen()
  loader.classList.remove('hidden')

  // Rotate messages every 1.5 seconds
  const messageInterval = setInterval(() => {
    const messageEl = document.getElementById('splash-message')
    if (messageEl) {
      messageEl.classList.add('splash-message-fade')
      setTimeout(() => {
        messageEl.textContent = getRandomMessage()
        messageEl.classList.remove('splash-message-fade')
      }, 200)
    }
  }, 1500)

  // Store interval for cleanup
  window._splashMessageInterval = messageInterval
}

/**
 * Hide the splash screen with animation
 */
export function hideSplashScreen() {
  // Clear message interval
  if (window._splashMessageInterval) {
    clearInterval(window._splashMessageInterval)
    delete window._splashMessageInterval
  }

  const loader = document.getElementById('app-loader')
  const splash = document.getElementById('splash-screen')
  const app = document.getElementById('app')

  if (splash) {
    splash.classList.add('splash-exit')
  }

  if (loader) {
    loader.classList.add('hidden')
    setTimeout(() => loader.remove(), 500)
  }

  if (app) {
    app.classList.add('loaded')
  }
}

export default {
  renderSplashScreen,
  initSplashScreen,
  hideSplashScreen,
  getRandomMessage,
}
