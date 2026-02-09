/**
 * FAQ Service
 * Centralized service for FAQ data management and rendering
 * Categories: general, spots, account, gamification, technical, safety
 *
 * @module faqService
 */

import { t } from '../i18n/index.js'

/**
 * FAQ Categories with metadata
 */
const FAQ_CATEGORIES = {
  general: {
    id: 'general',
    title: 'General',
    titleKey: 'faqCatGeneral',
    icon: 'fa-info-circle',
    color: 'primary',
    description: 'Questions generales sur SpotHitch'
  },
  spots: {
    id: 'spots',
    title: 'Spots',
    titleKey: 'faqCatSpots',
    icon: 'fa-map-marker-alt',
    color: 'emerald',
    description: 'Trouver et ajouter des spots'
  },
  account: {
    id: 'account',
    title: 'Compte',
    titleKey: 'faqCatAccount',
    icon: 'fa-user',
    color: 'sky',
    description: 'Gestion de votre compte'
  },
  gamification: {
    id: 'gamification',
    title: 'Gamification',
    titleKey: 'faqCatGamification',
    icon: 'fa-trophy',
    color: 'amber',
    description: 'Points, badges et defis'
  },
  technical: {
    id: 'technical',
    title: 'Technique',
    titleKey: 'faqCatTechnical',
    icon: 'fa-cog',
    color: 'slate',
    description: 'Questions techniques'
  },
  safety: {
    id: 'safety',
    title: 'Securite',
    titleKey: 'faqCatSafety',
    icon: 'fa-shield-alt',
    color: 'rose',
    description: 'Securite et confidentialite'
  }
}

/**
 * FAQ Data - 36 questions across 6 categories
 */
const FAQ_DATA = [
  // GENERAL (6 questions)
  {
    id: 'general-1',
    category: 'general',
    question: "Qu'est-ce que SpotHitch ?",
    answer: "SpotHitch est une application communautaire qui permet aux autostoppeurs de trouver et partager les meilleurs spots d'auto-stop dans le monde. Nous avons plus de 500 spots verifies dans 40+ pays, avec une communaute active de plus de 1500 autostoppeurs.",
    tags: ['debutant', 'presentation']
  },
  {
    id: 'general-2',
    category: 'general',
    question: "L'application est-elle gratuite ?",
    answer: "Oui, SpotHitch est 100% gratuit ! Pas d'abonnement, pas de publicite intrusive. Nous fonctionnons grace aux dons de la communaute et aux partenariats avec des entreprises locales.",
    tags: ['prix', 'gratuit']
  },
  {
    id: 'general-3',
    category: 'general',
    question: "Dans quels pays SpotHitch est-il disponible ?",
    answer: "Actuellement, nous couvrons plus de 40 pays sur tous les continents : Europe, Amerique du Nord, Oceanie, Afrique et Asie. Nous ajoutons regulierement de nouveaux spots ! Les principaux pays incluent France, Allemagne, Espagne, Italie, USA, Canada, Australie, Nouvelle-Zelande, Maroc, Turquie et bien d'autres.",
    tags: ['pays', 'mondial', 'couverture']
  },
  {
    id: 'general-4',
    category: 'general',
    question: "Puis-je utiliser SpotHitch sans compte ?",
    answer: "Oui, vous pouvez explorer la carte et consulter les spots sans compte. Cependant, pour ajouter des spots, laisser des avis, participer aux defis ou utiliser le chat, un compte est necessaire.",
    tags: ['compte', 'anonyme']
  },
  {
    id: 'general-5',
    category: 'general',
    question: "Y a-t-il une communaute d'utilisateurs ?",
    answer: "Oui ! SpotHitch compte plus de 1500 autostoppeurs actifs. Vous pouvez rejoindre le chat communautaire, creer des groupes de voyage, participer aux defis, et echanger des conseils avec d'autres utilisateurs.",
    tags: ['communaute', 'social']
  },
  {
    id: 'general-6',
    category: 'general',
    question: "Comment contacter l'equipe SpotHitch ?",
    answer: "Vous pouvez nous contacter via le formulaire de contact dans l'application (Profil > Nous contacter), par email a contact@spothitch.com, ou sur nos reseaux sociaux (@SpotHitch). Nous repondons generalement sous 24-48h.",
    tags: ['contact', 'support']
  },

  // SPOTS (6 questions)
  {
    id: 'spots-1',
    category: 'spots',
    question: "Comment trouver un spot pres de moi ?",
    answer: "Ouvrez la carte et activez la geolocalisation en cliquant sur l'icone de position. Les spots les plus proches seront affiches avec leur distance. Vous pouvez aussi utiliser la barre de recherche pour trouver des spots dans une ville specifique.",
    tags: ['carte', 'geolocalisation', 'recherche']
  },
  {
    id: 'spots-2',
    category: 'spots',
    question: "Comment ajouter un nouveau spot ?",
    answer: "Cliquez sur le bouton + en bas de l'ecran carte. Renseignez les informations du spot : photo (obligatoire), localisation precise, description, direction recommandee, et temps d'attente estime. Votre spot sera visible apres validation par la communaute.",
    tags: ['ajouter', 'creer', 'photo']
  },
  {
    id: 'spots-3',
    category: 'spots',
    question: "Que signifient les couleurs des spots sur la carte ?",
    answer: "Rouge = Top spot (note 4.5+), Vert = Bon spot (note 3.5-4.5), Orange = Spot recent (moins de 3 mois), Bleu = Spot standard, Gris = Spot ancien (plus d'un an sans check-in). Les clusters indiquent plusieurs spots proches.",
    tags: ['couleurs', 'carte', 'legende']
  },
  {
    id: 'spots-4',
    category: 'spots',
    question: "Comment signaler un spot problematique ?",
    answer: "Ouvrez la fiche du spot et cliquez sur l'icone de signalement (drapeau). Decrivez le probleme : spot dangereux, localisation inexacte, ferme, etc. Notre equipe examinera votre signalement sous 48h et prendra les mesures necessaires.",
    tags: ['signaler', 'probleme', 'securite']
  },
  {
    id: 'spots-5',
    category: 'spots',
    question: "Qu'est-ce qu'un check-in et a quoi ca sert ?",
    answer: "Un check-in confirme que vous etes passe par ce spot. Cela met a jour la fraicheur des donnees, aide les autres autostoppeurs, et vous fait gagner 10 points. Plus il y a de check-ins recents, plus le spot est considere comme fiable !",
    tags: ['check-in', 'points', 'validation']
  },
  {
    id: 'spots-6',
    category: 'spots',
    question: "Comment laisser un avis sur un spot ?",
    answer: "Apres avoir fait un check-in sur un spot, vous pouvez laisser un avis detaille. Notez le spot de 1 a 5 etoiles, ajoutez un commentaire avec vos conseils (meilleure heure, direction, etc.), et partagez une photo si vous le souhaitez. Chaque avis vous rapporte 15 points.",
    tags: ['avis', 'note', 'commentaire']
  },

  // ACCOUNT (6 questions)
  {
    id: 'account-1',
    category: 'account',
    question: "Comment creer un compte ?",
    answer: "Cliquez sur 'Se connecter' puis 'Creer un compte'. Vous pouvez vous inscrire avec votre email (verification requise) ou via Google pour une inscription instantanee. L'inscription prend moins de 30 secondes.",
    tags: ['inscription', 'creer', 'google']
  },
  {
    id: 'account-2',
    category: 'account',
    question: "J'ai oublie mon mot de passe, que faire ?",
    answer: "Sur l'ecran de connexion, cliquez sur 'Mot de passe oublie ?'. Entrez votre email et vous recevrez un lien de reinitialisation dans les minutes qui suivent. Verifiez vos spams si vous ne le recevez pas.",
    tags: ['mot de passe', 'reinitialisation', 'oublie']
  },
  {
    id: 'account-3',
    category: 'account',
    question: "Comment supprimer mon compte ?",
    answer: "Allez dans Profil > Parametres > Mes donnees (RGPD) > Supprimer mon compte. Attention, cette action est irreversible et supprime toutes vos donnees : spots, avis, points, badges. Un email de confirmation vous sera envoye.",
    tags: ['supprimer', 'rgpd', 'donnees']
  },
  {
    id: 'account-4',
    category: 'account',
    question: "Comment modifier mon profil ?",
    answer: "Allez dans l'onglet Profil et cliquez sur l'icone de modification (crayon). Vous pouvez changer votre photo de profil, pseudo, bio, langues parlees, pays d'origine, et preferences de voyage.",
    tags: ['profil', 'modifier', 'photo']
  },
  {
    id: 'account-5',
    category: 'account',
    question: "Comment verifier mon compte ?",
    answer: "La verification se fait en plusieurs etapes : email (niveau 1), telephone (niveau 2), photo de profil (niveau 3), piece d'identite (niveau 4). Chaque niveau augmente votre score de confiance et debloque des fonctionnalites.",
    tags: ['verification', 'confiance', 'identite']
  },
  {
    id: 'account-6',
    category: 'account',
    question: "Puis-je avoir plusieurs comptes ?",
    answer: "Non, un seul compte par personne est autorise. Les multi-comptes sont detectes automatiquement et peuvent entrainer une suspension. Si vous avez perdu l'acces a votre compte, contactez-nous pour le recuperer.",
    tags: ['multi-compte', 'regles']
  },

  // GAMIFICATION (6 questions)
  {
    id: 'gamification-1',
    category: 'gamification',
    question: "Comment gagner des points ?",
    answer: "Vous gagnez des points en : ajoutant des spots (+50), faisant des check-ins (+10), laissant des avis (+15), completant des defis (variable), vous connectant chaque jour (streak bonus jusqu'a +25), et en parrainant des amis (+100).",
    tags: ['points', 'gagner', 'actions']
  },
  {
    id: 'gamification-2',
    category: 'gamification',
    question: "Qu'est-ce que l'arbre de competences ?",
    answer: "L'arbre de competences vous permet de debloquer des bonus permanents en depensant des points de competence. Par exemple : bonus de points sur les check-ins, reduction des temps d'attente affiches, acces a des badges exclusifs, etc.",
    tags: ['competences', 'arbre', 'bonus']
  },
  {
    id: 'gamification-3',
    category: 'gamification',
    question: "Comment obtenir des badges ?",
    answer: "Les badges sont debloques en atteignant certains objectifs : nombre de check-ins, pays visites, spots ajoutes, jours consecutifs de connexion, etc. Consultez la section Badges dans votre profil pour voir les objectifs.",
    tags: ['badges', 'succes', 'objectifs']
  },
  {
    id: 'gamification-4',
    category: 'gamification',
    question: "Comment fonctionnent les ligues ?",
    answer: "Les ligues sont des classements hebdomadaires bases sur les points gagnes. Il y a 5 ligues : Bronze, Argent, Or, Diamant, et Legende. Les 10% meilleurs de chaque ligue montent, les 10% derniers descendent. Des recompenses sont distribuees chaque semaine.",
    tags: ['ligues', 'classement', 'competition']
  },
  {
    id: 'gamification-5',
    category: 'gamification',
    question: "Qu'est-ce que le streak bonus ?",
    answer: "Le streak (serie) compte vos jours consecutifs de connexion. Plus votre streak est long, plus le bonus quotidien est eleve : 1-7 jours = +5pts, 8-14 jours = +10pts, 15-30 jours = +15pts, 30+ jours = +25pts. Ne cassez pas votre streak !",
    tags: ['streak', 'bonus', 'quotidien']
  },
  {
    id: 'gamification-6',
    category: 'gamification',
    question: "Comment defier un ami ?",
    answer: "Allez dans Social > Amis et selectionnez un ami. Cliquez sur 'Defier' et choisissez un type de defi : course aux check-ins, decouverte de spots, tour du monde, etc. Le gagnant remporte des points bonus !",
    tags: ['defi', 'ami', 'competition']
  },

  // TECHNICAL (6 questions)
  {
    id: 'technical-1',
    category: 'technical',
    question: "Comment installer l'application sur mon telephone ?",
    answer: "SpotHitch est une PWA (Progressive Web App). Sur Chrome Android, appuyez sur les 3 points > 'Ajouter a l'ecran d'accueil'. Sur Safari iOS, appuyez sur le bouton partage > 'Sur l'ecran d'accueil'. L'app fonctionnera comme une application native.",
    tags: ['installation', 'pwa', 'mobile']
  },
  {
    id: 'technical-2',
    category: 'technical',
    question: "L'application fonctionne-t-elle hors-ligne ?",
    answer: "Oui ! Les spots que vous avez consultes sont mis en cache automatiquement. Vous pouvez les consulter sans connexion. Les actions (check-ins, avis) seront enregistrees localement et synchronisees automatiquement une fois reconnecte.",
    tags: ['hors-ligne', 'offline', 'cache']
  },
  {
    id: 'technical-3',
    category: 'technical',
    question: "L'application consomme-t-elle beaucoup de batterie ?",
    answer: "Non, SpotHitch est optimise pour les voyageurs. La geolocalisation n'est active que quand vous l'utilisez explicitement (bouton position). En mode hors-ligne ou arriere-plan, la consommation est minimale (<1% par heure).",
    tags: ['batterie', 'optimisation', 'gps']
  },
  {
    id: 'technical-4',
    category: 'technical',
    question: "Comment changer la langue de l'application ?",
    answer: "Allez dans Profil > Parametres > Langue. Choisissez parmi francais, anglais, espagnol ou allemand. L'application se rechargera automatiquement dans la nouvelle langue. Vos donnees et preferences sont conservees.",
    tags: ['langue', 'parametres', 'i18n']
  },
  {
    id: 'technical-5',
    category: 'technical',
    question: "Quels navigateurs sont supportes ?",
    answer: "SpotHitch fonctionne sur Chrome, Firefox, Safari et Edge (versions recentes). Pour une experience optimale en PWA, utilisez Chrome sur Android ou Safari sur iOS. Minimum requis : iOS 11.3+ ou Android 5.0+.",
    tags: ['navigateur', 'compatibilite', 'support']
  },
  {
    id: 'technical-6',
    category: 'technical',
    question: "Pourquoi les notifications ne fonctionnent pas ?",
    answer: "Verifiez que : 1) Les notifications sont autorisees dans les parametres de votre navigateur/telephone, 2) Vous etes connecte a votre compte, 3) Les notifications sont activees dans Profil > Parametres > Notifications. Sur iOS, seules les notifications in-app sont disponibles.",
    tags: ['notifications', 'push', 'probleme']
  },

  // SAFETY (6 questions)
  {
    id: 'safety-1',
    category: 'safety',
    question: "Comment fonctionne le mode SOS ?",
    answer: "En cas d'urgence, activez le mode SOS depuis le bouton rouge en haut de l'ecran. Votre position GPS sera partagee en temps reel avec vos contacts d'urgence pre-enregistres. Ils recevront un SMS/email avec un lien de suivi.",
    tags: ['sos', 'urgence', 'position']
  },
  {
    id: 'safety-2',
    category: 'safety',
    question: "Comment ajouter des contacts d'urgence ?",
    answer: "Allez dans le mode SOS (bouton rouge) et cliquez sur 'Ajouter un contact'. Entrez le nom, numero de telephone et/ou email. Vous pouvez ajouter jusqu'a 5 contacts d'urgence. Testez l'envoi pour verifier que ca fonctionne.",
    tags: ['contacts', 'urgence', 'sos']
  },
  {
    id: 'safety-3',
    category: 'safety',
    question: "Mes donnees sont-elles securisees ?",
    answer: "Oui, nous prenons la securite tres au serieux. Vos donnees sont chiffrees en transit (HTTPS) et au repos. Nous respectons le RGPD. Vous pouvez telecharger ou supprimer vos donnees a tout moment depuis Profil > Mes donnees.",
    tags: ['securite', 'rgpd', 'chiffrement']
  },
  {
    id: 'safety-4',
    category: 'safety',
    question: "Les spots sont-ils verifies ?",
    answer: "Oui, chaque nouveau spot est soumis a une verification par la communaute avant publication. De plus, le systeme de notes, d'avis et de signalements permet d'identifier rapidement les spots problematiques ou dangereux.",
    tags: ['verification', 'spots', 'moderation']
  },
  {
    id: 'safety-5',
    category: 'safety',
    question: "Quels sont les conseils de securite pour l'autostop ?",
    answer: "1) Informez toujours quelqu'un de votre trajet, 2) Faites confiance a votre instinct, 3) Evitez l'autostop de nuit seul(e), 4) Gardez vos affaires importantes sur vous, 5) Utilisez le mode SOS en cas de doute, 6) Consultez nos guides pays pour des conseils specifiques.",
    tags: ['conseils', 'securite', 'autostop']
  },
  {
    id: 'safety-6',
    category: 'safety',
    question: "Comment signaler un utilisateur problematique ?",
    answer: "Ouvrez le profil de l'utilisateur et cliquez sur l'icone de signalement. Decrivez le probleme : comportement inapproprie, harcelement, faux profil, etc. Notre equipe de moderation examinera le signalement sous 24h et prendra les mesures necessaires.",
    tags: ['signaler', 'utilisateur', 'moderation']
  }
]

/**
 * State for expanded FAQs
 */
const expandedFAQs = new Set()

/**
 * Get all FAQ categories
 * @returns {Object} Categories object with metadata
 */
export function getCategories() {
  return { ...FAQ_CATEGORIES }
}

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Object|null} Category object or null
 */
export function getCategoryById(categoryId) {
  if (!categoryId || typeof categoryId !== 'string') {
    return null
  }
  return FAQ_CATEGORIES[categoryId] || null
}

/**
 * Get FAQs by category
 * @param {string} category - Category ID (general, spots, account, gamification, technical, safety)
 * @returns {Array} Array of FAQ objects for the category
 */
export function getFAQs(category) {
  if (!category || typeof category !== 'string') {
    return [...FAQ_DATA]
  }

  const normalizedCategory = category.toLowerCase().trim()

  if (!FAQ_CATEGORIES[normalizedCategory]) {
    return []
  }

  return FAQ_DATA.filter(faq => faq.category === normalizedCategory)
}

/**
 * Get all FAQs
 * @returns {Array} All FAQ objects
 */
export function getAllFAQs() {
  return [...FAQ_DATA]
}

/**
 * Search FAQs by query
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string} options.category - Filter by category
 * @param {boolean} options.searchTags - Include tags in search (default: true)
 * @param {number} options.limit - Maximum results (default: unlimited)
 * @returns {Array} Matching FAQ objects with relevance score
 */
export function searchFAQ(query, options = {}) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return []
  }

  const {
    category = null,
    searchTags = true,
    limit = 0
  } = options

  const searchTerms = query.toLowerCase().trim().split(/\s+/)

  let results = FAQ_DATA.map(faq => {
    let score = 0
    const questionLower = faq.question.toLowerCase()
    const answerLower = faq.answer.toLowerCase()
    const tagsLower = faq.tags.join(' ').toLowerCase()
    const idLower = faq.id.toLowerCase()

    searchTerms.forEach(term => {
      // ID match (highest priority)
      if (idLower.includes(term)) {
        score += 10
      }

      // Question match (high priority)
      if (questionLower.includes(term)) {
        score += 5
      }

      // Answer match (medium priority)
      if (answerLower.includes(term)) {
        score += 3
      }

      // Tags match (medium-low priority)
      if (searchTags && tagsLower.includes(term)) {
        score += 2
      }

      // Category match
      if (faq.category.includes(term)) {
        score += 1
      }
    })

    return { ...faq, score }
  }).filter(faq => faq.score > 0)

  // Filter by category if specified
  if (category) {
    const normalizedCategory = category.toLowerCase().trim()
    results = results.filter(faq => faq.category === normalizedCategory)
  }

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score)

  // Apply limit
  if (limit > 0) {
    results = results.slice(0, limit)
  }

  return results
}

/**
 * Get FAQ by ID
 * @param {string} id - FAQ ID (e.g., 'general-1', 'spots-3')
 * @returns {Object|null} FAQ object or null if not found
 */
export function getFAQById(id) {
  if (!id || typeof id !== 'string') {
    return null
  }

  const normalizedId = id.toLowerCase().trim()
  return FAQ_DATA.find(faq => faq.id === normalizedId) || null
}

/**
 * Expand/collapse a FAQ item
 * @param {string} id - FAQ ID to toggle
 * @returns {boolean} New expanded state
 */
export function expandFAQ(id) {
  if (!id || typeof id !== 'string') {
    return false
  }

  const normalizedId = id.toLowerCase().trim()
  const faq = getFAQById(normalizedId)

  if (!faq) {
    return false
  }

  if (expandedFAQs.has(normalizedId)) {
    expandedFAQs.delete(normalizedId)
    return false
  } else {
    expandedFAQs.add(normalizedId)
    return true
  }
}

/**
 * Check if FAQ is expanded
 * @param {string} id - FAQ ID
 * @returns {boolean} Whether the FAQ is expanded
 */
export function isFAQExpanded(id) {
  if (!id || typeof id !== 'string') {
    return false
  }
  return expandedFAQs.has(id.toLowerCase().trim())
}

/**
 * Collapse all expanded FAQs
 */
export function collapseAllFAQs() {
  expandedFAQs.clear()
}

/**
 * Get expanded FAQ IDs
 * @returns {Array} Array of expanded FAQ IDs
 */
export function getExpandedFAQs() {
  return Array.from(expandedFAQs)
}

/**
 * Render a single FAQ item
 * @param {Object} faq - FAQ object
 * @param {Object} options - Render options
 * @param {boolean} options.showCategory - Show category badge
 * @param {boolean} options.showTags - Show tags
 * @returns {string} HTML string
 */
export function renderFAQItem(faq, options = {}) {
  if (!faq || !faq.id) {
    return ''
  }

  const { showCategory = false, showTags = false } = options
  const isExpanded = isFAQExpanded(faq.id)
  const category = FAQ_CATEGORIES[faq.category]

  return `
    <div class="faq-item border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors" data-faq-id="${faq.id}">
      <button
        onclick="window.faqService?.expandFAQ('${faq.id}'); window.renderApp?.()"
        class="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-all"
        aria-expanded="${isExpanded}"
        aria-controls="faq-answer-${faq.id}"
      >
        <div class="flex-1">
          ${showCategory && category ? `
            <span class="inline-flex items-center gap-1 text-xs bg-${category.color}-500/20 text-${category.color}-400 px-2 py-0.5 rounded-full mb-2">
              <i class="fas ${category.icon}" aria-hidden="true"></i>
              ${category.title}
            </span>
          ` : ''}
          <span class="font-medium block">${faq.question}</span>
        </div>
        <i class="fas fa-chevron-down text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}" aria-hidden="true"></i>
      </button>
      <div id="faq-answer-${faq.id}" class="faq-answer ${isExpanded ? '' : 'hidden'}" role="region" aria-hidden="${!isExpanded}">
        <div class="px-4 pb-4 text-slate-300 border-t border-slate-700/50">
          <p class="pt-3">${faq.answer}</p>
          ${showTags && faq.tags && faq.tags.length > 0 ? `
            <div class="mt-3 flex flex-wrap gap-1">
              ${faq.tags.map(tag => `
                <span class="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">
                  #${tag}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `
}

/**
 * Render FAQs for a specific category
 * @param {string} category - Category ID
 * @param {Object} options - Render options
 * @returns {string} HTML string for the category section
 */
export function renderFAQCategory(category, options = {}) {
  if (!category || typeof category !== 'string') {
    return ''
  }

  const normalizedCategory = category.toLowerCase().trim()
  const categoryData = FAQ_CATEGORIES[normalizedCategory]

  if (!categoryData) {
    return ''
  }

  const faqs = getFAQs(normalizedCategory)

  if (faqs.length === 0) {
    return ''
  }

  const { showTags = false } = options

  return `
    <div id="faq-category-${normalizedCategory}" class="faq-category mb-8">
      <h2 class="text-lg font-bold mb-4 flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-${categoryData.color}-500/20 flex items-center justify-center">
          <i class="fas ${categoryData.icon} text-${categoryData.color}-400" aria-hidden="true"></i>
        </div>
        <span>${t(categoryData.titleKey, categoryData.title)}</span>
        <span class="text-sm text-slate-400 ml-auto">${faqs.length}</span>
      </h2>
      <p class="text-slate-400 text-sm mb-4">${categoryData.description}</p>
      <div class="space-y-2">
        ${faqs.map(faq => renderFAQItem(faq, { showTags })).join('')}
      </div>
    </div>
  `
}

/**
 * Render complete FAQ page
 * @param {Object} options - Render options
 * @param {string} options.searchQuery - Current search query
 * @param {string} options.activeCategory - Filter by category
 * @param {boolean} options.showCategoryNav - Show category navigation
 * @param {boolean} options.showTags - Show tags on items
 * @returns {string} Complete HTML for FAQ page
 */
export function renderFAQ(options = {}) {
  const {
    searchQuery = '',
    activeCategory = null,
    showCategoryNav = true,
    showTags = false
  } = options

  const categories = Object.values(FAQ_CATEGORIES)

  // Handle search
  let content = ''
  if (searchQuery && searchQuery.trim()) {
    const results = searchFAQ(searchQuery, { category: activeCategory })

    if (results.length > 0) {
      content = `
        <div class="search-results">
          <p class="text-slate-400 mb-4">${results.length} resultat${results.length > 1 ? 's' : ''} pour "${searchQuery}"</p>
          <div class="space-y-2">
            ${results.map(faq => renderFAQItem(faq, { showCategory: true, showTags })).join('')}
          </div>
        </div>
      `
    } else {
      content = `
        <div class="text-center py-12">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-bold mb-2">${t('noResults', 'Aucun resultat')}</h3>
          <p class="text-slate-400 mb-6">${t('faqNoResultsMsg', "Desole, nous n'avons pas trouve de reponse pour votre recherche.")}</p>
          <button
            onclick="window.faqService?.clearSearch?.()"
            class="btn-primary"
          >
            <i class="fas fa-times mr-2" aria-hidden="true"></i>
            ${t('clearSearch', 'Effacer la recherche')}
          </button>
        </div>
      `
    }
  } else if (activeCategory) {
    content = renderFAQCategory(activeCategory, { showTags })
  } else {
    content = categories.map(cat => renderFAQCategory(cat.id, { showTags })).join('')
  }

  return `
    <div class="faq-service-view pb-24 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="sticky top-16 z-30 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent p-4 border-b border-slate-700/50">
        <div class="flex items-center gap-4 mb-4">
          <button
            onclick="window.history?.back?.()"
            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            aria-label="${t('back', 'Retour')}"
          >
            <i class="fas fa-arrow-left" aria-hidden="true"></i>
          </button>
          <div>
            <h1 class="text-2xl font-bold">${t('faqTitle', 'Questions frequentes')}</h1>
            <p class="text-slate-400 text-sm">${t('faqSubtitle', 'Trouvez rapidement des reponses')}</p>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <input
            type="text"
            id="faq-service-search"
            placeholder="${t('searchFAQ', 'Rechercher dans la FAQ...')}"
            class="w-full bg-slate-800 border border-slate-700 rounded-lg px-12 py-3 text-white placeholder-slate-500 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
            value="${searchQuery}"
            oninput="window.faqService?.handleSearch?.(this.value)"
            aria-label="${t('searchFAQ', 'Rechercher dans la FAQ...')}"
          />
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
          ${searchQuery ? `
            <button
              onclick="window.faqService?.clearSearch?.()"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label="${t('clearSearch', 'Effacer')}"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          ` : ''}
        </div>
      </div>

      ${showCategoryNav && !searchQuery ? `
        <!-- Category Navigation -->
        <div class="px-4 py-6 border-b border-slate-700/50">
          <p class="text-sm text-slate-400 uppercase tracking-wide mb-3 font-semibold">${t('categories', 'Categories')}</p>
          <div class="flex flex-wrap gap-2">
            ${categories.map(cat => `
              <button
                onclick="document.getElementById('faq-category-${cat.id}')?.scrollIntoView({ behavior: 'smooth' })"
                class="px-3 py-2 rounded-full bg-${cat.color}-500/20 hover:bg-${cat.color}-500/30 transition-all text-sm flex items-center gap-2 border border-${cat.color}-500/30"
              >
                <i class="fas ${cat.icon}" aria-hidden="true"></i>
                <span>${t(cat.titleKey, cat.title)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- FAQ Content -->
      <div class="p-4" role="region" aria-live="polite">
        ${content}
      </div>

      <!-- Contact CTA -->
      <div class="mx-4 mb-4 p-6 rounded-lg bg-gradient-to-br from-primary-500/20 to-emerald-500/20 border border-primary-500/30 text-center">
        <div class="text-2xl mb-3">💬</div>
        <h3 class="text-lg font-bold mb-2">${t('faqNeedHelp', "Vous n'avez pas trouve votre reponse ?")}</h3>
        <p class="text-slate-300 mb-4">${t('faqHelpMsg', 'Notre equipe est la pour vous aider !')}</p>
        <button
          onclick="window.openContactForm?.()"
          class="btn-primary"
        >
          <i class="fas fa-envelope mr-2" aria-hidden="true"></i>
          ${t('contactUs', 'Nous contacter')}
        </button>
      </div>
    </div>
  `
}

/**
 * Get FAQ statistics
 * @returns {Object} Statistics about FAQs
 */
export function getFAQStats() {
  const stats = {
    totalQuestions: FAQ_DATA.length,
    categoryCounts: {},
    tagCounts: {},
    expandedCount: expandedFAQs.size
  }

  Object.keys(FAQ_CATEGORIES).forEach(cat => {
    stats.categoryCounts[cat] = FAQ_DATA.filter(faq => faq.category === cat).length
  })

  FAQ_DATA.forEach(faq => {
    faq.tags.forEach(tag => {
      stats.tagCounts[tag] = (stats.tagCounts[tag] || 0) + 1
    })
  })

  return stats
}

/**
 * Get related FAQs based on tags
 * @param {string} faqId - FAQ ID to find related items for
 * @param {number} limit - Maximum number of related FAQs
 * @returns {Array} Related FAQ objects
 */
export function getRelatedFAQs(faqId, limit = 3) {
  const faq = getFAQById(faqId)

  if (!faq || !faq.tags || faq.tags.length === 0) {
    return []
  }

  const related = FAQ_DATA
    .filter(f => f.id !== faq.id)
    .map(f => {
      const sharedTags = f.tags.filter(tag => faq.tags.includes(tag))
      return { ...f, relevance: sharedTags.length }
    })
    .filter(f => f.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)

  return related
}

/**
 * Get popular tags
 * @param {number} limit - Maximum number of tags
 * @returns {Array} Array of { tag, count } objects
 */
export function getPopularTags(limit = 10) {
  const stats = getFAQStats()

  return Object.entries(stats.tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Export service object for window binding
const faqService = {
  getCategories,
  getCategoryById,
  getFAQs,
  getAllFAQs,
  searchFAQ,
  getFAQById,
  expandFAQ,
  isFAQExpanded,
  collapseAllFAQs,
  getExpandedFAQs,
  renderFAQItem,
  renderFAQCategory,
  renderFAQ,
  getFAQStats,
  getRelatedFAQs,
  getPopularTags
}

// Bind to window for onclick handlers
if (typeof window !== 'undefined') {
  window.faqService = faqService
}

export default faqService
