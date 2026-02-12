/**
 * FAQ View Component
 * Frequently Asked Questions section
 * Category: Général, Spots, Sécurité, Compte, Technique
 * Features: Accordéons, barre de recherche, filtrage, accessible (WCAG)
 */

import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

/**
 * FAQ data organized by category (5 categories, 20+ questions)
 */
const faqData = {
  general: {
    title: t('faqGeneral', 'Général'),
    icon: 'fa-info-circle',
    color: 'primary',
    questions: [
      {
        id: 'general-1',
        q: t('faqQ1', "Qu'est-ce que SpotHitch ?"),
        a: t('faqA1', "SpotHitch est une application communautaire qui permet aux autostoppeurs de trouver et partager les meilleurs spots d'auto-stop dans le monde. Nous avons plus de 500 spots vérifiés dans 40+ pays.")
      },
      {
        id: 'general-2',
        q: t('faqQ2', "L'application est-elle gratuite ?"),
        a: t('faqA2', "Oui, SpotHitch est 100% gratuit ! Pas d'abonnement, pas de publicité intrusive. Nous fonctionnons grâce aux dons de la communauté.")
      },
      {
        id: 'general-3',
        q: t('faqQ3', "Dans quels pays SpotHitch est-il disponible ?"),
        a: t('faqA3', "Actuellement, nous couvrons plus de 40 pays sur tous les continents. Nous ajoutons régulièrement de nouveaux spots ! Les principaux pays incluent France, Allemagne, Espagne, USA, Canada, Australie, Nouvelle-Zélande, Maroc, Turquie et bien d'autres.")
      },
      {
        id: 'general-4',
        q: t('faqQ4', "Puis-je utiliser SpotHitch sans compte ?"),
        a: t('faqA4', "Oui, vous pouvez explorer la carte et consulter les spots sans compte. Cependant, pour ajouter des spots, laisser des avis ou participer aux défis, un compte est nécessaire.")
      },
      {
        id: 'general-5',
        q: t('faqQ5', "Y a-t-il une communauté d'utilisateurs ?"),
        a: t('faqA5', "Oui ! SpotHitch compte plus de 1500 autostoppeurs actifs. Vous pouvez rejoindre le chat, créer des groupes de voyage, et échanger des conseils avec d'autres utilisateurs.")
      }
    ]
  },
  spots: {
    title: t('faqSpots', 'Spots'),
    icon: 'fa-map-marker-alt',
    color: 'emerald',
    questions: [
      {
        id: 'spots-1',
        q: t('faqQ6', "Comment trouver un spot près de moi ?"),
        a: t('faqA6', "Ouvrez la carte et activez la géolocalisation. Les spots les plus proches seront affichés. Vous pouvez aussi utiliser la recherche pour trouver des spots dans une ville spécifique.")
      },
      {
        id: 'spots-2',
        q: t('faqQ7', "Comment ajouter un nouveau spot ?"),
        a: t('faqA7', "Cliquez sur le bouton + en bas de l'écran carte. Renseignez les informations du spot (photo obligatoire, localisation, description) et soumettez-le. Votre spot sera visible après validation.")
      },
      {
        id: 'spots-3',
        q: t('faqQ8', "Que signifient les couleurs des spots sur la carte ?"),
        a: t('faqA8', "Rouge = Top spot (note 4.5+), Vert = Bon spot (note 3.5-4.5), Orange = Spot récent (moins de 3 mois), Gris = Spot ancien (plus d'un an sans check-in).")
      },
      {
        id: 'spots-4',
        q: t('faqQ9', "Comment signaler un spot problématique ?"),
        a: t('faqA9', "Ouvrez la fiche du spot et cliquez sur 'Signaler'. Décrivez le problème (spot dangereux, inexact, etc.) et notre équipe examinera votre signalement.")
      },
      {
        id: 'spots-5',
        q: t('faqQ10', "Qu'est-ce qu'un check-in et à quoi ça sert ?"),
        a: t('faqA10', "Un check-in signifie que vous confirmez être passé par ce spot. Cela met à jour la fraîcheur des données et vous fait gagner des points. Plus il y a de check-ins récents, plus le spot est pertinent !")
      }
    ]
  },
  security: {
    title: t('faqSecurity', 'Sécurité'),
    icon: 'fa-shield-alt',
    color: 'rose',
    questions: [
      {
        id: 'security-1',
        q: t('faqQ11', "Comment fonctionne le mode SOS ?"),
        a: t('faqA11', "En cas d'urgence, activez le mode SOS depuis le bouton rouge en haut de l'écran. Vous pourrez partager votre position GPS avec vos contacts d'urgence pré-enregistrés.")
      },
      {
        id: 'security-2',
        q: t('faqQ12', "Comment ajouter des contacts d'urgence ?"),
        a: t('faqA12', "Allez dans le mode SOS et cliquez sur 'Ajouter un contact'. Entrez le nom et le numéro de téléphone. Ces contacts recevront votre position en cas d'urgence.")
      },
      {
        id: 'security-3',
        q: t('faqQ13', "Mes données sont-elles sécurisées ?"),
        a: t('faqA13', "Oui, nous respectons le RGPD. Vos données sont chiffrées et stockées de manière sécurisée. Vous pouvez télécharger ou supprimer vos données à tout moment depuis les paramètres.")
      },
      {
        id: 'security-4',
        q: t('faqQ14', "Les spots sont-ils vérifiés ?"),
        a: t('faqA14', "Oui, chaque spot est soumis à une vérification avant publication. De plus, le système de notes et d'avis de la communauté permet d'identifier les spots problématiques.")
      },
      {
        id: 'security-5',
        q: t('faqQ15', "Conseils de sécurité pour l'autostop ?"),
        a: t('faqA15', "Toujours informer quelqu'un de votre trajet, faire confiance à votre instinct, éviter l'autostop de nuit, et utiliser le mode SOS en cas de doute. Consultez nos guides pays pour des conseils spécifiques.")
      }
    ]
  },
  account: {
    title: t('faqAccount', 'Compte'),
    icon: 'fa-user',
    color: 'sky',
    questions: [
      {
        id: 'account-1',
        q: t('faqQ16', "Comment créer un compte ?"),
        a: t('faqA16', "Cliquez sur 'Se connecter' puis 'Créer un compte'. Vous pouvez vous inscrire avec votre email ou via Google. L'inscription prend moins de 30 secondes.")
      },
      {
        id: 'account-2',
        q: t('faqQ17', "J'ai oublié mon mot de passe, que faire ?"),
        a: t('faqA17', "Sur l'écran de connexion, cliquez sur 'Mot de passe oublié ?'. Entrez votre email et vous recevrez un lien de réinitialisation.")
      },
      {
        id: 'account-3',
        q: t('faqQ18', "Comment supprimer mon compte ?"),
        a: t('faqA18', "Allez dans Profil > Mes données (RGPD) > Supprimer mon compte. Attention, cette action est irréversible et supprime toutes vos données.")
      },
      {
        id: 'account-4',
        q: t('faqQ19', "Comment gagner des points ?"),
        a: t('faqA19', "Vous gagnez des points en : ajoutant des spots (+50), faisant des check-ins (+10), laissant des avis (+15), et en complétant des défis (variable).")
      },
      {
        id: 'account-5',
        q: t('faqQ20', "Comment fonctionne le score de confiance ?"),
        a: t('faqA20', "Le score de confiance reflète votre fiabilité. Il augmente avec l'ancienneté du compte, les spots créés et vérifiés, les avis utiles, la vérification d'identité et les votes positifs de la communauté.")
      }
    ]
  },
  technical: {
    title: t('faqTechnical', 'Technique'),
    icon: 'fa-cog',
    color: 'amber',
    questions: [
      {
        id: 'technical-1',
        q: t('faqQ21', "Comment installer l'application sur mon téléphone ?"),
        a: t('faqA21', "SpotHitch est une PWA (Progressive Web App). Sur votre téléphone, ouvrez le site dans Chrome/Safari et cliquez sur 'Ajouter à l'écran d'accueil'. L'app fonctionnera comme une application native.")
      },
      {
        id: 'technical-2',
        q: t('faqQ22', "L'application fonctionne-t-elle hors-ligne ?"),
        a: t('faqA22', "Oui ! Les spots que vous avez consultés sont mis en cache. Vous pouvez les consulter sans connexion. Les actions (check-ins, avis) seront synchronisées une fois reconnecté.")
      },
      {
        id: 'technical-3',
        q: t('faqQ23', "L'application consomme-t-elle beaucoup de batterie ?"),
        a: t('faqA23', "Non, SpotHitch est optimisé pour les voyageurs. La géolocalisation n'est active que quand vous l'utilisez. En mode hors-ligne, la consommation est minimale.")
      },
      {
        id: 'technical-4',
        q: t('faqQ24', "Comment changer la langue de l'application ?"),
        a: t('faqA24', "Allez dans Profil > Paramètres > Langue. Choisissez parmi français, anglais, espagnol ou allemand. L'application se rechargera dans la nouvelle langue.")
      },
      {
        id: 'technical-5',
        q: t('faqQ25', "Quels navigateurs sont supportés ?"),
        a: t('faqA25', "SpotHitch fonctionne sur Chrome, Firefox, Safari et Edge. Une PWA fonctionne mieux sur les téléphones (iOS 11.3+ et Android 5.0+) que sur les navigateurs desktop.")
      }
    ]
  }
};

/**
 * Get all FAQ questions for search
 */
export function getAllFAQQuestions() {
  const allQuestions = [];
  Object.entries(faqData).forEach(([categoryKey, category]) => {
    category.questions.forEach(q => {
      allQuestions.push({
        id: q.id,
        category: categoryKey,
        categoryTitle: category.title,
        q: q.q,
        a: q.a
      });
    });
  });
  return allQuestions;
}

/**
 * Get FAQ types/categories
 */
export function getFAQTypes() {
  return Object.keys(faqData);
}

/**
 * Render the FAQ page
 */
export function renderFAQ(state) {
  const categories = Object.entries(faqData);
  const searchQuery = state.faqSearchQuery || '';

  // Filter questions based on search
  let filteredCategories = categories.map(([key, category]) => {
    if (!searchQuery.trim()) {
      return [key, category];
    }

    const query = searchQuery.toLowerCase();
    const filteredQuestions = category.questions.filter(q =>
      q.id.toLowerCase().includes(query) ||
      q.q.toLowerCase().includes(query) ||
      q.a.toLowerCase().includes(query)
    );

    return [key, { ...category, questions: filteredQuestions }];
  }).filter(([_, category]) => category.questions.length > 0);

  const hasResults = filteredCategories.length > 0;

  return `
    <div class="faq-view pb-24 max-w-4xl mx-auto overflow-x-hidden">
      <!-- Header -->
      <div class="sticky top-16 z-30 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent p-4 border-b border-slate-700/50">
        <div class="flex items-center gap-4 mb-4">
          <button
            onclick="closeFAQ()"
            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            aria-label="${t('back', 'Retour')}"
            title="${t('back', 'Retour')}"
          >
            ${icon('arrow-left', 'w-5 h-5')}
          </button>
          <div>
            <h1 class="text-2xl font-bold">${t('faqTitle', 'Questions fréquentes')}</h1>
            <p class="text-slate-400 text-sm">${t('faqSubtitle', 'Trouvez rapidement des réponses à vos questions')}</p>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <input
            type="text"
            id="faq-search"
            placeholder="${t('searchFAQ', 'Rechercher dans la FAQ...')}"
            class="w-full bg-slate-800 border border-slate-700 rounded-lg px-12 py-3 text-white placeholder-slate-500 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
            oninput="filterFAQ(this.value)"
            value="${searchQuery}"
            aria-label="${t('searchFAQ', 'Rechercher dans la FAQ...')}"
          />
          ${icon('search', 'w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400')}
          ${searchQuery ? `
            <button
              onclick="clearFAQSearch()"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label="${t('clearSearch', 'Effacer la recherche')}"
              title="${t('clearSearch', 'Effacer la recherche')}"
            >
              ${icon('times', 'w-5 h-5')}
            </button>
          ` : ''}
        </div>
      </div>

      ${!searchQuery ? `
        <!-- Quick Links (only show when not searching) -->
        <div class="px-4 py-6 border-b border-slate-700/50">
          <p class="text-sm text-slate-400 uppercase tracking-wide mb-3 font-semibold">${t('categories', 'Catégories')}</p>
          <div class="flex flex-wrap gap-2">
            ${categories.map(([key, category]) => `
              <button
                onclick="scrollToFAQCategory('${key}')"
                class="px-3 py-2 rounded-full bg-${category.color}-500/20 hover:bg-${category.color}-500/30 transition-all text-sm flex items-center gap-2 border border-${category.color}-500/30"
              >
                ${icon(category.icon, 'w-5 h-5')}
                <span>${category.title}</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- FAQ Categories or No Results -->
      <div class="p-4">
        ${hasResults ? `
          <div id="faq-content" class="space-y-6" role="region" aria-live="polite">
            ${filteredCategories.map(([key, category]) => `
              <div id="faq-${key}" class="faq-category">
                <h2 class="text-lg font-bold mb-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-${category.color}-500/20 flex items-center justify-center">
                    ${icon(category.icon, `w-5 h-5 text-${category.color}-400`)}
                  </div>
                  <span>${category.title}</span>
                  <span class="text-sm text-slate-400 ml-auto">${category.questions.length}</span>
                </h2>

                <div class="space-y-2">
                  ${category.questions.map((item) => `
                    <div class="faq-item border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors">
                      <button
                        onclick="toggleFAQItem(this)"
                        class="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-all"
                        aria-expanded="false"
                        aria-controls="faq-answer-${item.id}"
                      >
                        <span class="font-medium flex-1">${item.q}</span>
                        ${icon('chevron-down', 'w-5 h-5 text-slate-400 transition-transform shrink-0')}
                      </button>
                      <div id="faq-answer-${item.id}" class="faq-answer hidden" role="region" aria-hidden="true">
                        <div class="px-4 pb-4 text-slate-300 border-t border-slate-700/50">
                          ${item.a}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <!-- No Results -->
          <div class="text-center py-12">
            <div class="text-6xl mb-4">🔍</div>
            <h3 class="text-xl font-bold mb-2">${t('noResults', 'Aucun résultat')}</h3>
            <p class="text-slate-400 mb-6">${t('faqNoResultsMsg', 'Désolé, nous n\'avons pas trouvé de réponse pour votre recherche.')}</p>
            <button
              onclick="clearFAQSearch()"
              class="btn-primary"
            >
              ${icon('times', 'w-5 h-5 mr-2')}
              ${t('clearSearch', 'Effacer la recherche')}
            </button>
          </div>
        `}
      </div>

      <!-- Still need help? -->
      <div class="mx-4 mb-4 p-6 rounded-lg bg-gradient-to-br from-primary-500/20 to-emerald-500/20 border border-primary-500/30 text-center">
        <div class="text-2xl mb-3">💬</div>
        <h3 class="text-lg font-bold mb-2">${t('faqNeedHelp', 'Vous n\'avez pas trouvé votre réponse ?')}</h3>
        <p class="text-slate-300 mb-4">${t('faqHelpMsg', 'Notre équipe est là pour vous aider !')}</p>
        <button
          onclick="openContactForm()"
          class="btn-primary"
        >
          ${icon('envelope', 'w-5 h-5 mr-2')}
          ${t('contactUs', 'Nous contacter')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Toggle a FAQ item open/closed
 */
export function toggleFAQItem(button) {
  if (!button) return;

  const item = button.parentElement;
  if (!item) return;

  const answer = item.querySelector('.faq-answer');
  const icon = button.querySelector('i');
  const isExpanded = button.getAttribute('aria-expanded') === 'true';

  // Update ARIA attributes
  button.setAttribute('aria-expanded', !isExpanded);
  if (answer) {
    answer.setAttribute('aria-hidden', isExpanded);
    answer.classList.toggle('hidden');
  }

  // Rotate icon
  if (icon) {
    icon.style.transform = isExpanded ? '' : 'rotate(180deg)';
  }
}

/**
 * Scroll to a specific FAQ category
 */
export function scrollToFAQCategory(categoryId) {
  const element = document.getElementById(`faq-${categoryId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Filter FAQ based on search query
 */
export function filterFAQ(query) {
  if (!query) {
    query = '';
  }

  const searchQuery = query.trim().toLowerCase();

  // Update state with search query
  window.setState?.({ faqSearchQuery: query });
}

/**
 * Clear FAQ search
 */
export function clearFAQSearch() {
  const searchInput = document.getElementById('faq-search');
  if (searchInput) {
    searchInput.value = '';
  }
  window.setState?.({ faqSearchQuery: '' });
}

/**
 * Open FAQ view
 */
export function openFAQ() {
  window.setState?.({ activeView: 'faq', faqSearchQuery: '' });
}

/**
 * Close FAQ view
 */
export function closeFAQ() {
  window.setState?.({ activeView: null, faqSearchQuery: '' });
  window.history?.back?.();
}

/**
 * Search in FAQ
 */
export function searchFAQ(query) {
  if (!query || !query.trim()) {
    return [];
  }

  const allQuestions = getAllFAQQuestions();
  const searchLower = query.toLowerCase().trim();

  return allQuestions.filter(q =>
    q.id.toLowerCase().includes(searchLower) ||
    q.q.toLowerCase().includes(searchLower) ||
    q.a.toLowerCase().includes(searchLower) ||
    q.categoryTitle.toLowerCase().includes(searchLower) ||
    q.category.toLowerCase().includes(searchLower)
  );
}

/**
 * Get FAQ question by ID
 */
export function getFAQQuestionById(id) {
  const allQuestions = getAllFAQQuestions();
  return allQuestions.find(q => q.id === id);
}

// Global window handlers
window.toggleFAQItem = toggleFAQItem;
window.scrollToFAQCategory = scrollToFAQCategory;
window.filterFAQ = filterFAQ;
window.clearFAQSearch = clearFAQSearch;
window.openFAQ = openFAQ;
window.closeFAQ = closeFAQ;
window.searchFAQ = searchFAQ;
window.getFAQQuestionById = getFAQQuestionById;

export default { renderFAQ, toggleFAQItem, filterFAQ, clearFAQSearch, openFAQ, closeFAQ, searchFAQ, getFAQQuestionById, getAllFAQQuestions, getFAQTypes };
