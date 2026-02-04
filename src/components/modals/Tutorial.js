/**
 * Tutorial Modal Component
 * Interactive onboarding tutorial with rewards
 */

import { t } from '../../i18n/index.js';

// Tutorial rewards
const TUTORIAL_REWARDS = {
  completeAll: { points: 100, badge: 'tutorial_master' },
  perStep: 5, // Points per step completed
};

const tutorialSteps = [
  // Introduction
  {
    id: 'welcome',
    icon: '🤙',
    title: 'Bienvenue sur SpotHitch !',
    desc: 'L\'app communautaire des autostoppeurs. Découvre comment trouver les meilleurs spots, planifier tes voyages et rejoindre la communauté.',
    position: 'center',
    highlight: null,
  },
  // Navigation - Accueil
  {
    id: 'nav-home',
    icon: '🏠',
    title: 'L\'Accueil',
    desc: 'Ta page principale avec tes stats, les top spots, et un accès rapide à toutes les fonctionnalités. C\'est ton tableau de bord personnel.',
    position: 'top',
    highlight: '[aria-label="Accueil"], button:has(.fa-home)',
    action: () => window.changeTab?.('home'),
  },
  // Gamification - Stats
  {
    id: 'stats',
    icon: '📊',
    title: 'Tes Statistiques',
    desc: 'Clique sur tes stats (Spots, Points, Niveau) pour voir ton profil complet : VIP, ligue, badges débloqués, distance parcourue...',
    position: 'top',
    highlight: '.grid-cols-3 button',
  },
  // Gamification - Badges
  {
    id: 'badges',
    icon: '🏅',
    title: 'Les Badges',
    desc: 'Gagne des badges en utilisant l\'app : premier check-in, série de jours, spots créés... Collectionne-les tous !',
    position: 'center',
    highlight: '[onclick*="openBadges"]',
  },
  // Gamification - Défis
  {
    id: 'challenges',
    icon: '🎯',
    title: 'Les Défis',
    desc: 'Des défis quotidiens et hebdomadaires pour gagner des points bonus. Complète-les pour monter dans les ligues !',
    position: 'center',
    highlight: '[onclick*="openChallenges"]',
  },
  // Gamification - Boutique
  {
    id: 'shop',
    icon: '🛒',
    title: 'La Boutique',
    desc: 'Dépense tes points pour débloquer des avatars, cadres, titres et fonctionnalités exclusives. Plus tu es VIP, plus tu as de réductions !',
    position: 'center',
    highlight: '[onclick*="openShop"]',
  },
  // Gamification - Quiz
  {
    id: 'quiz',
    icon: '🧠',
    title: 'Le Quiz',
    desc: 'Teste tes connaissances sur l\'auto-stop ! 10 questions, 60 secondes. Gagne des points et le badge "Expert" si tu fais un sans-faute.',
    position: 'center',
    highlight: '[onclick*="openQuiz"]',
  },
  // Navigation - Spots
  {
    id: 'nav-spots',
    icon: '📍',
    title: 'Les Spots',
    desc: 'Explore la carte interactive avec 94+ spots vérifiés en Europe. Filtre par pays, note, temps d\'attente...',
    position: 'top',
    highlight: '[aria-label="Spots"], button:has(.fa-map-marker-alt)',
    action: () => window.changeTab?.('spots'),
  },
  // Spots - Carte
  {
    id: 'map-view',
    icon: '🗺️',
    title: 'Vue Carte',
    desc: 'Bascule entre la liste et la carte. Sur la carte, les spots sont colorés selon leur note : vert (excellent) → rouge (éviter).',
    position: 'top',
    highlight: '[aria-label="Vue carte"], button:has(.fa-map)',
  },
  // Spots - Filtres
  {
    id: 'filters',
    icon: '🔍',
    title: 'Les Filtres',
    desc: 'Filtre les spots par pays, note minimum, temps d\'attente max, spots vérifiés uniquement. Trouve LE spot parfait !',
    position: 'top',
    highlight: '[onclick*="openFilters"], .badge:has(.fa-sliders)',
  },
  // Spots - Ajouter
  {
    id: 'add-spot',
    icon: '➕',
    title: 'Ajouter un Spot',
    desc: 'Tu connais un bon spot ? Partage-le ! Ajoute une photo, décris l\'endroit, et aide la communauté. Tu gagnes 50 points par spot validé.',
    position: 'top',
    highlight: '.fab, [onclick*="openAddSpot"]',
  },
  // Spot Detail
  {
    id: 'spot-detail',
    icon: '📸',
    title: 'Détail d\'un Spot',
    desc: 'Clique sur un spot pour voir : photos, description, notes, commentaires, temps d\'attente moyen. Tu peux aussi signaler ou valider un spot.',
    position: 'center',
    highlight: '.card',
  },
  // Navigation - Planner
  {
    id: 'nav-planner',
    icon: '🧭',
    title: 'Le Planificateur',
    desc: 'Planifie ton voyage étape par étape. L\'app calcule l\'itinéraire et te suggère les meilleurs spots sur ta route.',
    position: 'top',
    highlight: '[aria-label="Voyage"], button:has(.fa-route)',
    action: () => window.changeTab?.('planner'),
  },
  // Navigation - Chat
  {
    id: 'nav-chat',
    icon: '💬',
    title: 'Le Chat',
    desc: 'Discute avec la communauté ! Pose des questions, partage tes expériences, trouve des compagnons de voyage.',
    position: 'top',
    highlight: '[aria-label="Chat"], button:has(.fa-comments)',
    action: () => window.changeTab?.('chat'),
  },
  // Navigation - Profil
  {
    id: 'nav-profile',
    icon: '👤',
    title: 'Ton Profil',
    desc: 'Gère ton compte, change ton avatar, consulte tes voyages sauvegardés, et paramètre l\'app (langue, thème, notifications).',
    position: 'top',
    highlight: '[aria-label="Profil"], button:has(.fa-user)',
    action: () => window.changeTab?.('profile'),
  },
  // Header - SOS
  {
    id: 'sos',
    icon: '🆘',
    title: 'Mode SOS',
    desc: 'En cas d\'urgence, le bouton SOS partage ta position GPS avec tes contacts d\'urgence et affiche les numéros utiles du pays.',
    position: 'bottom',
    highlight: '.sos-header-btn, [onclick*="openSOS"]',
  },
  // Header - Reset (Dev)
  {
    id: 'reset',
    icon: '🔄',
    title: 'Bouton Reset',
    desc: 'Ce bouton réinitialise l\'app (données locales). Utile pour tester ou si tu rencontres un bug.',
    position: 'bottom',
    highlight: '[onclick*="resetApp"]',
  },
  // Conclusion
  {
    id: 'ready',
    icon: '🚀',
    title: 'Tu es prêt !',
    desc: 'Tu connais maintenant toutes les fonctionnalités de SpotHitch. Bonne route et bon stop ! N\'oublie pas : la communauté compte sur toi pour partager tes spots.',
    position: 'center',
    highlight: null,
  },
];

export function renderTutorial(state) {
  const stepIndex = state.tutorialStep || 0;
  const step = tutorialSteps[stepIndex] || tutorialSteps[0];
  const isLast = stepIndex === tutorialSteps.length - 1;
  const isFirst = stepIndex === 0;
  const progress = ((stepIndex + 1) / tutorialSteps.length) * 100;

  // Position classes
  const positionClasses = {
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    top: 'top-20 left-4 right-4',
    bottom: 'bottom-32 left-4 right-4',
  };

  return `
    <!-- Dark Overlay with spotlight effect -->
    <div class="fixed inset-0 z-[100] bg-black/80 transition-opacity duration-300" onclick="skipTutorial()" aria-hidden="true">
      ${step.highlight ? `
        <div class="tuto-spotlight" data-highlight="${step.highlight}"></div>
      ` : ''}
    </div>

    <!-- Tutorial Card -->
    <div class="fixed z-[101] ${positionClasses[step.position] || positionClasses.center}
                max-w-md w-full mx-auto animate-fade-in"
         onclick="event.stopPropagation()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="tutorial-title"
         aria-describedby="tutorial-desc">
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 mx-4
                  border border-white/10 shadow-2xl">

        <!-- Progress Bar -->
        <div class="h-1 bg-slate-700 rounded-full mb-6 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500"
               style="width: ${progress}%"></div>
        </div>

        <!-- Icon with glow effect -->
        <div class="flex justify-center mb-4" aria-hidden="true">
          <div class="text-6xl animate-bounce-slow filter drop-shadow-lg">
            ${step.icon}
          </div>
        </div>

        <!-- Title -->
        <h3 id="tutorial-title" class="text-2xl font-bold text-center mb-3 text-white">
          ${step.title}
        </h3>

        <!-- Description -->
        <p id="tutorial-desc" class="text-slate-300 text-center leading-relaxed mb-6">
          ${step.desc}
        </p>

        <!-- Progress Dots -->
        <div class="flex justify-center gap-1.5 mb-6">
          ${tutorialSteps.map((_, i) => `
            <div class="w-2 h-2 rounded-full transition-all duration-300
                        ${i === stepIndex ? 'w-6 bg-primary-500' :
                          i < stepIndex ? 'bg-emerald-500' : 'bg-slate-600'}">
            </div>
          `).join('')}
        </div>

        <!-- Navigation Buttons -->
        <div class="flex gap-3">
          ${!isFirst ? `
            <button
              onclick="prevTutorial()"
              class="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-white font-medium
                     hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              type="button"
            >
              <i class="fas fa-arrow-left" aria-hidden="true"></i>
              Precedent
            </button>
          ` : `
            <button
              onclick="skipTutorial()"
              class="flex-1 py-3 px-4 rounded-xl bg-slate-700/50 text-slate-400 font-medium
                     hover:bg-slate-700 hover:text-white transition-colors"
              type="button"
            >
              Passer le tutoriel
            </button>
          `}

          <button
            onclick="${isLast ? 'finishTutorial()' : 'nextTutorial()'}"
            class="flex-1 py-3 px-4 rounded-xl font-medium transition-all
                   ${isLast
                     ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                     : 'bg-gradient-to-r from-primary-500 to-cyan-500 text-white hover:from-primary-600 hover:to-cyan-600'}
                   flex items-center justify-center gap-2"
            type="button"
          >
            ${isLast ? 'Commencer !' : 'Suivant'}
            ${!isLast ? '<i class="fas fa-arrow-right" aria-hidden="true"></i>' : '<i class="fas fa-rocket" aria-hidden="true"></i>'}
          </button>
        </div>

        <!-- Step Counter & Rewards -->
        <div class="text-center mt-4">
          <div class="text-slate-500 text-sm">
            Étape ${stepIndex + 1} sur ${tutorialSteps.length}
          </div>
          <div class="text-xs text-amber-400 mt-1">
            <i class="fas fa-star mr-1"></i>
            +${TUTORIAL_REWARDS.perStep} pts par étape • +${TUTORIAL_REWARDS.completeAll.points} pts bonus à la fin !
          </div>
        </div>
      </div>
    </div>

    <style>
      .animate-bounce-slow {
        animation: bounce-slow 2s ease-in-out infinite;
      }
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }
      @keyframes fade-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .tuto-spotlight {
        position: absolute;
        background: transparent;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        pointer-events: none;
      }
    </style>
  `;
}

// Execute step action (like changing tab)
export function executeStepAction(stepIndex) {
  const step = tutorialSteps[stepIndex];
  if (step?.action) {
    step.action();
  }
}

// Highlight element for current step
export function highlightElement(stepIndex) {
  const step = tutorialSteps[stepIndex];
  if (!step?.highlight) return;

  // Remove previous highlights
  document.querySelectorAll('.tuto-highlighted').forEach(el => {
    el.classList.remove('tuto-highlighted');
  });

  // Find and highlight element
  setTimeout(() => {
    const selector = step.highlight;
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('tuto-highlighted');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

export { tutorialSteps };
export default { renderTutorial, tutorialSteps, executeStepAction, highlightElement };
