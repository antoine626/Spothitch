/**
 * Error Messages Utility
 * Provides user-friendly, humorous error messages for SpotHitch
 */

/**
 * Error codes and their friendly messages
 */
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_OFFLINE: {
    message: 'Houston, on a perdu le signal ! Verifie ta connexion et reessaie.',
    icon: '📵',
    type: 'warning',
  },
  NETWORK_ERROR: {
    message: 'Houston, on a perdu le signal ! Verifie ta connexion et reessaie.',
    icon: '📵',
    type: 'warning',
  },
  'Failed to fetch': {
    message: 'Houston, on a perdu le signal ! Verifie ta connexion et reessaie.',
    icon: '📵',
    type: 'warning',
  },

  // Server errors (500)
  SERVER_ERROR: {
    message: 'Oups ! Nos serveurs font une pause cafe. Reessaie dans quelques secondes.',
    icon: '🔧',
    type: 'error',
  },
  INTERNAL_SERVER_ERROR: {
    message: 'Oups ! Nos serveurs font une pause cafe. Reessaie dans quelques secondes.',
    icon: '🔧',
    type: 'error',
  },
  '500': {
    message: 'Oups ! Nos serveurs font une pause cafe. Reessaie dans quelques secondes.',
    icon: '🔧',
    type: 'error',
  },

  // Not found errors (404)
  NOT_FOUND: {
    message: "Ce spot n'existe pas... ou alors il est tres bien cache !",
    icon: '🗺️',
    type: 'warning',
  },
  SPOT_NOT_FOUND: {
    message: "Ce spot n'existe pas... ou alors il est tres bien cache !",
    icon: '🗺️',
    type: 'warning',
  },
  '404': {
    message: "Ce spot n'existe pas... ou alors il est tres bien cache !",
    icon: '🗺️',
    type: 'warning',
  },

  // Session errors
  SESSION_EXPIRED: {
    message: 'Ta session a pris la route sans toi. Reconnecte-toi !',
    icon: '⏰',
    type: 'warning',
  },
  'auth/session-expired': {
    message: 'Ta session a pris la route sans toi. Reconnecte-toi !',
    icon: '⏰',
    type: 'warning',
  },
  'auth/user-token-expired': {
    message: 'Ta session a pris la route sans toi. Reconnecte-toi !',
    icon: '⏰',
    type: 'warning',
  },

  // Spots loading errors
  SPOTS_LOADING_ERROR: {
    message: 'Les spots sont coinces dans les bouchons. Patiente un peu...',
    icon: '🚗',
    type: 'warning',
  },
  FETCH_SPOTS_FAILED: {
    message: 'Les spots sont coinces dans les bouchons. Patiente un peu...',
    icon: '🚗',
    type: 'warning',
  },

  // Message errors
  MESSAGE_SEND_FAILED: {
    message: "Ton message s'est perdu en route. On reessaie ?",
    icon: '📨',
    type: 'error',
  },
  CHAT_ERROR: {
    message: "Ton message s'est perdu en route. On reessaie ?",
    icon: '📨',
    type: 'error',
  },

  // Photo/file errors
  FILE_TOO_LARGE: {
    message: "Cette photo est plus lourde qu'un sac a dos de 3 semaines ! Essaie une plus petite.",
    icon: '📸',
    type: 'warning',
  },
  IMAGE_TOO_LARGE: {
    message: "Cette photo est plus lourde qu'un sac a dos de 3 semaines ! Essaie une plus petite.",
    icon: '📸',
    type: 'warning',
  },
  UPLOAD_FAILED: {
    message: "L'upload a fait du stop et s'est arrete en chemin. Reessaie !",
    icon: '📸',
    type: 'error',
  },

  // Form validation errors
  FORM_INVALID: {
    message: 'Il manque des infos ! Verifie les champs en rouge.',
    icon: '✏️',
    type: 'warning',
  },
  VALIDATION_ERROR: {
    message: 'Il manque des infos ! Verifie les champs en rouge.',
    icon: '✏️',
    type: 'warning',
  },
  MISSING_FIELDS: {
    message: 'Il manque des infos ! Verifie les champs en rouge.',
    icon: '✏️',
    type: 'warning',
  },

  // Firebase Auth errors
  'auth/invalid-email': {
    message: "Cette adresse email n'a pas l'air valide. Verifie l'orthographe !",
    icon: '📧',
    type: 'warning',
  },
  'auth/user-disabled': {
    message: 'Ce compte a ete desactive. Contacte-nous si tu penses que c\'est une erreur.',
    icon: '🚫',
    type: 'error',
  },
  'auth/user-not-found': {
    message: "Aucun compte avec cet email. Peut-etre qu'il est temps d'en creer un ?",
    icon: '🔍',
    type: 'warning',
  },
  'auth/wrong-password': {
    message: "Mot de passe incorrect. Tu as oublie ? Ca arrive aux meilleurs d'entre nous !",
    icon: '🔐',
    type: 'warning',
  },
  'auth/email-already-in-use': {
    message: 'Cet email est deja pris. Tu as peut-etre deja un compte ?',
    icon: '📬',
    type: 'warning',
  },
  'auth/weak-password': {
    message: 'Ce mot de passe est trop simple. Ajoute des chiffres et caracteres speciaux !',
    icon: '💪',
    type: 'warning',
  },
  'auth/operation-not-allowed': {
    message: 'Cette operation n\'est pas disponible pour le moment.',
    icon: '🚧',
    type: 'error',
  },
  'auth/popup-closed-by-user': {
    message: 'Tu as ferme la fenetre de connexion. Reessaie quand tu es pret !',
    icon: '🪟',
    type: 'info',
  },
  'auth/network-request-failed': {
    message: 'Probleme de connexion. Verifie ton internet et reessaie.',
    icon: '📵',
    type: 'warning',
  },
  'auth/too-many-requests': {
    message: 'Trop de tentatives ! Fais une pause cafe et reessaie dans quelques minutes.',
    icon: '☕',
    type: 'warning',
  },
  'auth/invalid-credential': {
    message: 'Les identifiants ne sont pas valides. Verifie et reessaie.',
    icon: '🔑',
    type: 'warning',
  },

  // Location errors
  GEOLOCATION_ERROR: {
    message: 'Impossible de te localiser. Active le GPS ou choisis ta position manuellement.',
    icon: '📍',
    type: 'warning',
  },
  GEOLOCATION_DENIED: {
    message: "Tu as bloque l'acces a ta position. Active-le dans les parametres pour continuer.",
    icon: '📍',
    type: 'warning',
  },
  GEOLOCATION_UNAVAILABLE: {
    message: 'GPS indisponible. Ton pouce sait peut-etre mieux ou tu es ?',
    icon: '📍',
    type: 'warning',
  },
  GEOLOCATION_TIMEOUT: {
    message: 'Le GPS met trop de temps a repondre. Essaie en exterieur !',
    icon: '⏳',
    type: 'warning',
  },

  // Route errors
  ROUTE_NOT_FOUND: {
    message: 'Pas de route trouvee. Peut-etre qu\'un raccourci secret existe ?',
    icon: '🛤️',
    type: 'warning',
  },
  ROUTING_ERROR: {
    message: 'Erreur de calcul d\'itineraire. Les routes font parfois des caprices !',
    icon: '🛤️',
    type: 'warning',
  },

  // Generic errors
  UNKNOWN_ERROR: {
    message: 'Quelque chose s\'est mal passe. On ne sait pas quoi, mais on y travaille !',
    icon: '🤷',
    type: 'error',
  },
  DEFAULT: {
    message: 'Oups ! Une erreur s\'est produite. Reessaie dans un instant.',
    icon: '😅',
    type: 'error',
  },
}

/**
 * Get a user-friendly error message
 * @param {string} errorCode - The error code (e.g., 'NETWORK_OFFLINE', 'auth/user-not-found')
 * @returns {Object} Object with message, icon, and type
 */
export function getErrorMessage(errorCode) {
  // Handle null/undefined
  if (!errorCode) {
    return ERROR_MESSAGES.DEFAULT
  }

  // Convert to string if needed
  const code = String(errorCode)

  // Direct match
  if (ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code]
  }

  // Check for partial matches (e.g., error contains '404')
  if (code.includes('404') || code.toLowerCase().includes('not found')) {
    return ERROR_MESSAGES.NOT_FOUND
  }

  if (code.includes('500') || code.toLowerCase().includes('server')) {
    return ERROR_MESSAGES.SERVER_ERROR
  }

  if (code.toLowerCase().includes('network') || code.toLowerCase().includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  if (code.toLowerCase().includes('offline')) {
    return ERROR_MESSAGES.NETWORK_OFFLINE
  }

  if (code.toLowerCase().includes('session') || code.toLowerCase().includes('token')) {
    return ERROR_MESSAGES.SESSION_EXPIRED
  }

  if (code.toLowerCase().includes('file') || code.toLowerCase().includes('size') || code.toLowerCase().includes('large')) {
    return ERROR_MESSAGES.FILE_TOO_LARGE
  }

  // Default fallback
  return ERROR_MESSAGES.DEFAULT
}

/**
 * Get formatted error string with icon
 * @param {string} errorCode - The error code
 * @returns {string} Formatted error message with icon
 */
export function getFormattedError(errorCode) {
  const error = getErrorMessage(errorCode)
  return `${error.icon} ${error.message}`
}

/**
 * Get error type for toast styling
 * @param {string} errorCode - The error code
 * @returns {string} Toast type: 'error' | 'warning' | 'info'
 */
export function getErrorType(errorCode) {
  const error = getErrorMessage(errorCode)
  return error.type
}

/**
 * Check if error is recoverable (user can retry)
 * @param {string} errorCode - The error code
 * @returns {boolean}
 */
export function isRecoverableError(errorCode) {
  const nonRecoverable = [
    'auth/user-disabled',
    'auth/operation-not-allowed',
  ]
  return !nonRecoverable.includes(errorCode)
}

/**
 * Get retry message based on error type
 * @param {string} errorCode - The error code
 * @returns {string|null} Retry suggestion or null
 */
export function getRetryMessage(errorCode) {
  if (!isRecoverableError(errorCode)) {
    return null
  }

  const error = getErrorMessage(errorCode)

  if (error.type === 'error') {
    return 'Reessaie dans quelques instants.'
  }

  return null
}

export default {
  getErrorMessage,
  getFormattedError,
  getErrorType,
  isRecoverableError,
  getRetryMessage,
  ERROR_MESSAGES,
}
