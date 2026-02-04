/**
 * FAQ View Component
 * Frequently Asked Questions section
 */

import { t } from '../../i18n/index.js';

/**
 * FAQ data organized by category
 */
const faqData = {
  general: {
    title: 'General',
    icon: 'fa-info-circle',
    questions: [
      {
        q: "Qu'est-ce que SpotHitch ?",
        a: "SpotHitch est une application communautaire qui permet aux autostoppeurs de trouver et partager les meilleurs spots d'auto-stop en Europe. Nous avons plus de 90 spots verifies dans 12 pays."
      },
      {
        q: "L'application est-elle gratuite ?",
        a: "Oui, SpotHitch est 100% gratuit ! Pas d'abonnement, pas de publicite intrusive. Nous fonctionnons grace aux dons de la communaute."
      },
      {
        q: "Dans quels pays SpotHitch est-il disponible ?",
        a: "Actuellement, nous couvrons 12 pays europeens : France, Allemagne, Espagne, Italie, Portugal, Belgique, Pays-Bas, Suisse, Autriche, Pologne, Republique Tcheque et Slovaquie. Nous ajoutons regulierement de nouveaux spots !"
      },
      {
        q: "Puis-je utiliser SpotHitch sans compte ?",
        a: "Oui, vous pouvez explorer la carte et consulter les spots sans compte. Cependant, pour ajouter des spots, laisser des avis ou participer aux defis, un compte est necessaire."
      }
    ]
  },
  spots: {
    title: 'Spots',
    icon: 'fa-map-marker-alt',
    questions: [
      {
        q: "Comment trouver un spot pres de moi ?",
        a: "Ouvrez la carte et activez la geolocalisation. Les spots les plus proches seront affiches. Vous pouvez aussi utiliser la recherche pour trouver des spots dans une ville specifique."
      },
      {
        q: "Comment ajouter un nouveau spot ?",
        a: "Cliquez sur le bouton + en bas de l'ecran carte. Renseignez les informations du spot (photo obligatoire, localisation, description) et soumettez-le. Votre spot sera visible apres validation."
      },
      {
        q: "Que signifient les couleurs des spots sur la carte ?",
        a: "Rouge = Top spot (note 4.5+), Vert = Bon spot (note 3.5-4.5), Orange = Spot recent (moins de 3 mois), Gris = Spot ancien (plus d'un an sans check-in)."
      },
      {
        q: "Comment signaler un spot problematique ?",
        a: "Ouvrez la fiche du spot et cliquez sur 'Signaler'. Decrivez le probleme (spot dangereux, inexact, etc.) et notre equipe examinera votre signalement."
      }
    ]
  },
  account: {
    title: 'Compte',
    icon: 'fa-user',
    questions: [
      {
        q: "Comment creer un compte ?",
        a: "Cliquez sur 'Se connecter' puis 'Creer un compte'. Vous pouvez vous inscrire avec votre email ou via Google. L'inscription prend moins de 30 secondes."
      },
      {
        q: "J'ai oublie mon mot de passe, que faire ?",
        a: "Sur l'ecran de connexion, cliquez sur 'Mot de passe oublie ?'. Entrez votre email et vous recevrez un lien de reinitialisation."
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Allez dans Profil > Mes donnees (RGPD) > Supprimer mon compte. Attention, cette action est irreversible et supprime toutes vos donnees."
      },
      {
        q: "Mes donnees sont-elles securisees ?",
        a: "Oui, nous respectons le RGPD. Vos donnees sont chiffrees et stockees de maniere securisee. Vous pouvez telecharger ou supprimer vos donnees a tout moment depuis les parametres."
      }
    ]
  },
  gamification: {
    title: 'Points & Badges',
    icon: 'fa-trophy',
    questions: [
      {
        q: "Comment gagner des points ?",
        a: "Vous gagnez des points en : ajoutant des spots (+50), faisant des check-ins (+10), laissant des avis (+15), completant des defis (variable), et en vous connectant chaque jour (streak bonus)."
      },
      {
        q: "A quoi servent les points ?",
        a: "Les points permettent de monter de niveau, de debloquer des badges et des recompenses dans la boutique (avatars, cadres de profil, titres, boosters)."
      },
      {
        q: "Comment fonctionnent les ligues ?",
        a: "Chaque saison (3 mois), vous gagnez des points de saison. Ces points determinent votre ligue : Bronze, Argent, Or, Platine ou Diamant. A la fin de la saison, les meilleurs joueurs recoivent des recompenses exclusives."
      },
      {
        q: "Qu'est-ce que l'arbre de competences ?",
        a: "L'arbre de competences vous permet de debloquer des bonus permanents en depensant des points de competence. Par exemple : bonus de points, reduction des temps d'attente affiches, etc."
      }
    ]
  },
  safety: {
    title: 'Securite',
    icon: 'fa-shield-alt',
    questions: [
      {
        q: "Comment fonctionne le mode SOS ?",
        a: "En cas d'urgence, activez le mode SOS depuis le bouton rouge en haut de l'ecran. Vous pourrez partager votre position GPS avec vos contacts d'urgence pre-enregistres."
      },
      {
        q: "Comment ajouter des contacts d'urgence ?",
        a: "Allez dans le mode SOS et cliquez sur 'Ajouter un contact'. Entrez le nom et le numero de telephone. Ces contacts recevront votre position en cas d'urgence."
      },
      {
        q: "Les spots sont-ils verifies ?",
        a: "Oui, chaque spot est soumis a une verification avant publication. De plus, le systeme de notes et d'avis de la communaute permet d'identifier les spots problematiques."
      },
      {
        q: "Conseils de securite pour l'autostop ?",
        a: "Toujours informer quelqu'un de votre trajet, faire confiance a votre instinct, eviter l'autostop de nuit, et utiliser le mode SOS en cas de doute. Consultez nos guides pays pour des conseils specifiques."
      }
    ]
  },
  technical: {
    title: 'Technique',
    icon: 'fa-cog',
    questions: [
      {
        q: "Comment installer l'application sur mon telephone ?",
        a: "SpotHitch est une PWA (Progressive Web App). Sur votre telephone, ouvrez le site dans Chrome/Safari et cliquez sur 'Ajouter a l'ecran d'accueil'. L'app fonctionnera comme une application native."
      },
      {
        q: "L'application fonctionne-t-elle hors-ligne ?",
        a: "Oui ! Les spots que vous avez consultes sont mis en cache. Vous pouvez les consulter sans connexion. Les actions (check-ins, avis) seront synchronisees une fois reconnecte."
      },
      {
        q: "L'application consomme-t-elle beaucoup de batterie ?",
        a: "Non, SpotHitch est optimise pour les voyageurs. La geolocalisation n'est active que quand vous l'utilisez. En mode hors-ligne, la consommation est minimale."
      },
      {
        q: "Comment changer la langue de l'application ?",
        a: "Allez dans Profil > Parametres > Langue. Choisissez parmi francais, anglais, espagnol ou allemand. L'application se rechargera dans la nouvelle langue."
      }
    ]
  }
};

/**
 * Render the FAQ page
 */
export function renderFAQ(state) {
  const categories = Object.entries(faqData);

  return `
    <div class="p-4 pb-24 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button
          onclick="closeFAQ()"
          class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          aria-label="Retour"
        >
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
        </button>
        <div>
          <h1 class="text-2xl font-bold">Questions frequentes</h1>
          <p class="text-slate-400 text-sm">Trouvez rapidement des reponses a vos questions</p>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative">
          <input
            type="text"
            id="faq-search"
            placeholder="Rechercher dans la FAQ..."
            class="input-modern pl-12"
            oninput="filterFAQ(this.value)"
          />
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="flex flex-wrap gap-2 mb-8">
        ${categories.map(([key, category]) => `
          <button
            onclick="scrollToFAQCategory('${key}')"
            class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-sm flex items-center gap-2"
          >
            <i class="fas ${category.icon}" aria-hidden="true"></i>
            ${category.title}
          </button>
        `).join('')}
      </div>

      <!-- FAQ Categories -->
      <div id="faq-content" class="space-y-6">
        ${categories.map(([key, category]) => `
          <div id="faq-${key}" class="card p-4 faq-category">
            <h2 class="text-xl font-bold mb-4 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <i class="fas ${category.icon} text-primary-400" aria-hidden="true"></i>
              </div>
              ${category.title}
            </h2>

            <div class="space-y-2">
              ${category.questions.map((item, index) => `
                <div class="faq-item border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onclick="toggleFAQItem(this)"
                    class="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-all"
                    aria-expanded="false"
                  >
                    <span class="font-medium">${item.q}</span>
                    <i class="fas fa-chevron-down text-slate-400 transition-transform" aria-hidden="true"></i>
                  </button>
                  <div class="faq-answer hidden">
                    <div class="px-4 pb-4 text-slate-300">
                      ${item.a}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Still need help? -->
      <div class="mt-8 card p-6 bg-gradient-to-br from-primary-500/20 to-emerald-500/20 text-center">
        <h3 class="text-xl font-bold mb-2">Vous n'avez pas trouve votre reponse ?</h3>
        <p class="text-slate-300 mb-4">Notre equipe est la pour vous aider !</p>
        <button
          onclick="openContactForm()"
          class="btn-primary"
        >
          <i class="fas fa-envelope mr-2" aria-hidden="true"></i>
          Nous contacter
        </button>
      </div>
    </div>
  `;
}

// Global handlers
window.toggleFAQItem = (button) => {
  const item = button.parentElement;
  const answer = item.querySelector('.faq-answer');
  const icon = button.querySelector('i');
  const isExpanded = button.getAttribute('aria-expanded') === 'true';

  // Toggle
  button.setAttribute('aria-expanded', !isExpanded);
  answer.classList.toggle('hidden');
  icon.style.transform = isExpanded ? '' : 'rotate(180deg)';
};

window.scrollToFAQCategory = (categoryId) => {
  const element = document.getElementById(`faq-${categoryId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.filterFAQ = (query) => {
  const items = document.querySelectorAll('.faq-item');
  const categories = document.querySelectorAll('.faq-category');
  const searchLower = query.toLowerCase().trim();

  if (!searchLower) {
    // Show all
    items.forEach(item => item.style.display = '');
    categories.forEach(cat => cat.style.display = '');
    return;
  }

  // Filter items
  const visibleCategories = new Set();

  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    const matches = text.includes(searchLower);
    item.style.display = matches ? '' : 'none';

    if (matches) {
      const category = item.closest('.faq-category');
      if (category) visibleCategories.add(category.id);
    }
  });

  // Show/hide categories
  categories.forEach(cat => {
    cat.style.display = visibleCategories.has(cat.id) ? '' : 'none';
  });
};

window.openFAQ = () => {
  window.setState?.({ activeView: 'faq' });
};

window.closeFAQ = () => {
  window.setState?.({ activeView: null });
  window.history?.back?.();
};

export default { renderFAQ };
