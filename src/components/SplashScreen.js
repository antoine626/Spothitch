/**
 * SplashScreen Component
 * A fun animated splash screen with hitchhiking theme
 */

// Funny loading messages related to hitchhiking
const loadingMessages = [
  "On cherche une voiture...",
  "Pouce en l'air !",
  "Direction : l'aventure",
  "Attachez vos ceintures... ou pas",
  "Chargement du karma routier...",
  "Negociation avec un camionneur...",
  "Verification des panneaux...",
  "Calcul de la bonne humeur...",
  "Synchronisation des pouces...",
  "Recherche de l'aire de repos parfaite...",
  "Preparation du sourire gagnant...",
  "Activation du mode aventurier...",
  "Connexion a l'univers routier...",
  "Telechargement de bonnes vibes...",
  "Mise a jour du karma voyageur...",
]

/**
 * Get a random loading message
 */
export function getRandomMessage() {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
}

/**
 * Render the splash screen HTML
 */
export function renderSplashScreen() {
  const message = getRandomMessage()

  return `
    <div id="splash-screen" class="splash-screen" aria-live="polite" aria-label="Chargement de SpotHitch">
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
            <i class="fas fa-route" aria-hidden="true"></i>
          </span>
          <h1 class="splash-logo-text">SpotHitch</h1>
        </div>

        <!-- Animated hitchhiker -->
        <div class="splash-animation">
          <!-- Person with thumb up -->
          <div class="splash-hitchhiker">
            <div class="hitchhiker-body">
              <i class="fas fa-person" aria-hidden="true"></i>
            </div>
            <div class="hitchhiker-thumb">
              <i class="fas fa-thumbs-up" aria-hidden="true"></i>
            </div>
          </div>

          <!-- Car passing by -->
          <div class="splash-car">
            <i class="fas fa-car-side" aria-hidden="true"></i>
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
        <i class="fas fa-sun splash-sun" aria-hidden="true"></i>
        <i class="fas fa-cloud splash-cloud splash-cloud-1" aria-hidden="true"></i>
        <i class="fas fa-cloud splash-cloud splash-cloud-2" aria-hidden="true"></i>
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
