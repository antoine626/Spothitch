/**
 * LoadingIndicator - Indicateur de chargement global humoristique
 * Affiche des messages amusants liés à l'autostop pendant le chargement
 */

// Messages de chargement amusants (liés à l'autostop)
const loadingMessages = [
  { text: 'Pouce en l\'air...', emoji: '👍' },
  { text: 'On cherche une voiture...', emoji: '🚗' },
  { text: 'Négociation avec le conducteur...', emoji: '🤝' },
  { text: 'Vérification du karma routier...', emoji: '✨' },
  { text: 'Calcul de la distance jusqu\'à l\'aventure...', emoji: '🗺️' },
  { text: 'Consultation de la carte au trésor...', emoji: '📜' },
  { text: 'Démarrage du moteur...', emoji: '🔑' },
  { text: 'Attente sur le bord de la route...', emoji: '🛤️' },
  { text: 'Chargement des bonnes ondes...', emoji: '🌊' },
  { text: 'Préparation du sac à dos...', emoji: '🎒' },
  { text: 'Lecture des panneaux de signalisation...', emoji: '🪧' },
  { text: 'Vérification de la météo...', emoji: '☀️' },
  { text: 'Échauffement du pouce...', emoji: '💪' },
  { text: 'Synchronisation avec l\'univers...', emoji: '🌌' },
  { text: 'Alignement des étoiles...', emoji: '⭐' },
]

// État du loader
let loaderState = {
  isVisible: false,
  mode: 'spinner', // 'bar' ou 'spinner'
  message: null,
  messageIndex: 0,
  intervalId: null,
  progress: 0,
}

/**
 * Obtenir un message aléatoire
 */
function getRandomMessage() {
  const index = Math.floor(Math.random() * loadingMessages.length)
  return loadingMessages[index]
}

/**
 * Obtenir le prochain message (rotation)
 */
function getNextMessage() {
  loaderState.messageIndex = (loaderState.messageIndex + 1) % loadingMessages.length
  return loadingMessages[loaderState.messageIndex]
}

/**
 * Créer le conteneur du loader s'il n'existe pas
 */
function ensureLoaderContainer() {
  let container = document.getElementById('global-loader')
  if (!container) {
    container = document.createElement('div')
    container.id = 'global-loader'
    container.setAttribute('role', 'alert')
    container.setAttribute('aria-live', 'polite')
    container.setAttribute('aria-busy', 'true')
    document.body.appendChild(container)
  }
  return container
}

/**
 * Rendu de la barre de chargement (style YouTube)
 */
function renderProgressBar() {
  return `
    <div class="loading-bar-container">
      <div class="loading-bar" style="width: ${loaderState.progress}%"></div>
    </div>
  `
}

/**
 * Rendu du spinner avec message
 */
function renderSpinner() {
  const msg = loaderState.message || getRandomMessage()
  return `
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-thumb-container">
          <div class="loading-thumb">${msg.emoji}</div>
          <div class="loading-ripple"></div>
          <div class="loading-ripple loading-ripple-delayed"></div>
        </div>
        <p class="loading-message">${msg.text}</p>
        <div class="loading-dots">
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
          <span class="loading-dot"></span>
        </div>
      </div>
    </div>
  `
}

/**
 * Mettre à jour le rendu
 */
function updateRender() {
  const container = ensureLoaderContainer()
  if (loaderState.isVisible) {
    container.innerHTML = loaderState.mode === 'bar' ? renderProgressBar() : renderSpinner()
    container.classList.add('visible')
  } else {
    container.classList.remove('visible')
    container.classList.add('hiding')
    setTimeout(() => {
      container.classList.remove('hiding')
      container.innerHTML = ''
    }, 300)
  }
}

/**
 * Démarrer la rotation des messages
 */
function startMessageRotation() {
  if (loaderState.intervalId) return
  loaderState.intervalId = setInterval(() => {
    if (loaderState.isVisible && loaderState.mode === 'spinner') {
      loaderState.message = getNextMessage()
      updateRender()
    }
  }, 2500) // Change toutes les 2.5 secondes
}

/**
 * Arrêter la rotation des messages
 */
function stopMessageRotation() {
  if (loaderState.intervalId) {
    clearInterval(loaderState.intervalId)
    loaderState.intervalId = null
  }
}

/**
 * Afficher le loader
 * @param {Object} options - Options du loader
 * @param {string} options.mode - 'bar' ou 'spinner' (default: 'spinner')
 * @param {string} options.message - Message personnalisé (optionnel)
 */
export function showLoading(options = {}) {
  const { mode = 'spinner', message = null } = options

  loaderState.isVisible = true
  loaderState.mode = mode
  loaderState.message = message ? { text: message, emoji: '👍' } : getRandomMessage()
  loaderState.progress = mode === 'bar' ? 10 : 0

  updateRender()

  if (mode === 'spinner') {
    startMessageRotation()
  } else if (mode === 'bar') {
    // Animation de progression simulée
    animateProgressBar()
  }
}

/**
 * Animer la barre de progression
 */
function animateProgressBar() {
  const animate = () => {
    if (!loaderState.isVisible || loaderState.mode !== 'bar') return

    // Progression rapide au début, ralentit vers la fin
    if (loaderState.progress < 30) {
      loaderState.progress += Math.random() * 10
    } else if (loaderState.progress < 60) {
      loaderState.progress += Math.random() * 5
    } else if (loaderState.progress < 85) {
      loaderState.progress += Math.random() * 2
    }

    // Ne jamais dépasser 90% tant que hideLoading n'est pas appelé
    loaderState.progress = Math.min(loaderState.progress, 90)

    updateRender()

    if (loaderState.isVisible) {
      setTimeout(animate, 200 + Math.random() * 300)
    }
  }
  animate()
}

/**
 * Masquer le loader
 * @param {Object} options - Options
 * @param {boolean} options.success - Animation de succès (pour la barre)
 */
export function hideLoading(options = {}) {
  const { success = true } = options

  if (loaderState.mode === 'bar' && success) {
    // Compléter la barre avant de masquer
    loaderState.progress = 100
    updateRender()
    setTimeout(() => {
      loaderState.isVisible = false
      loaderState.progress = 0
      stopMessageRotation()
      updateRender()
    }, 200)
  } else {
    loaderState.isVisible = false
    loaderState.progress = 0
    stopMessageRotation()
    updateRender()
  }
}

/**
 * Mettre à jour le message du loader
 * @param {string} message - Nouveau message
 */
export function setLoadingMessage(message) {
  if (loaderState.isVisible) {
    loaderState.message = { text: message, emoji: '👍' }
    updateRender()
  }
}

/**
 * Mettre à jour la progression de la barre
 * @param {number} progress - Valeur entre 0 et 100
 */
export function setLoadingProgress(progress) {
  if (loaderState.isVisible && loaderState.mode === 'bar') {
    loaderState.progress = Math.min(Math.max(progress, 0), 100)
    updateRender()
  }
}

/**
 * Vérifier si le loader est visible
 */
export function isLoading() {
  return loaderState.isVisible
}

/**
 * Wrapper pour exécuter une fonction async avec loading
 * @param {Function} asyncFn - Fonction asynchrone à exécuter
 * @param {Object} options - Options du loader
 * @returns {Promise} - Résultat de la fonction
 */
export async function withLoading(asyncFn, options = {}) {
  showLoading(options)
  try {
    const result = await asyncFn()
    hideLoading({ success: true })
    return result
  } catch (error) {
    hideLoading({ success: false })
    throw error
  }
}

export default {
  showLoading,
  hideLoading,
  setLoadingMessage,
  setLoadingProgress,
  isLoading,
  withLoading,
}
