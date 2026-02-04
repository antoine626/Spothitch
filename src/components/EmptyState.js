/**
 * EmptyState Component
 * Displays funny empty state messages with call-to-action buttons
 */

const emptyStates = {
  friends: {
    emoji: '🚗',
    message: 'Même les meilleurs routards ont besoin de compagnons !',
    buttonText: 'Trouver des compagnons',
    buttonAction: "changeTab('social'); setSocialTab('friends');",
    buttonIcon: 'fa-user-friends'
  },
  checkins: {
    emoji: '👍',
    message: "Ton pouce n'a pas encore travaillé... C'est le moment !",
    buttonText: 'Voir la carte',
    buttonAction: "changeTab('map')",
    buttonIcon: 'fa-map-marked-alt'
  },
  favorites: {
    emoji: '⭐',
    message: "Ta liste de favoris est plus vide qu'une aire d'autoroute à 3h du mat'",
    buttonText: 'Découvrir des spots',
    buttonAction: "changeTab('spots')",
    buttonIcon: 'fa-search-location'
  },
  trips: {
    emoji: '🗺️',
    message: "Aucun voyage prévu ? La route t'appelle !",
    buttonText: 'Planifier un voyage',
    buttonAction: "changeTab('planner')",
    buttonIcon: 'fa-route'
  },
  messages: {
    emoji: '💬',
    message: "C'est calme ici... Trop calme. Dis bonjour à quelqu'un !",
    buttonText: 'Aller au chat',
    buttonAction: "changeTab('social')",
    buttonIcon: 'fa-comments'
  },
  badges: {
    emoji: '🏆',
    message: "Zéro badge ? Même mon grand-père en a plus que toi !",
    buttonText: 'Voir les défis',
    buttonAction: "changeTab('challenges')",
    buttonIcon: 'fa-medal'
  }
}

/**
 * Renders an empty state with a funny message and call-to-action
 * @param {string} type - The type of empty state (friends, checkins, favorites, trips, messages, badges)
 * @returns {string} HTML string for the empty state
 */
export function renderEmptyState(type) {
  const state = emptyStates[type]

  if (!state) {
    console.warn(`EmptyState: Unknown type "${type}"`)
    return `
      <div class="text-center py-12">
        <span class="text-5xl mb-4 block">🤷</span>
        <p class="text-slate-400">Rien à afficher ici...</p>
      </div>
    `
  }

  return `
    <div class="text-center py-12 px-4">
      <span class="text-6xl mb-4 block animate-bounce-slow">${state.emoji}</span>
      <p class="text-slate-300 text-lg mb-6 max-w-xs mx-auto font-medium">
        ${state.message}
      </p>
      <button
        onclick="${state.buttonAction}"
        class="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
      >
        <i class="fas ${state.buttonIcon}" aria-hidden="true"></i>
        ${state.buttonText}
      </button>
    </div>
  `
}

/**
 * Get all available empty state types
 * @returns {string[]} Array of empty state type keys
 */
export function getEmptyStateTypes() {
  return Object.keys(emptyStates)
}

export default { renderEmptyState, getEmptyStateTypes }
