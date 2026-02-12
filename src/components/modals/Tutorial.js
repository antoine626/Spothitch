/**
 * Interactive Tutorial Component
 * Step-by-step onboarding where users click on actual elements
 */

import { getState, setState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

// Tutorial rewards
const TUTORIAL_REWARDS = {
  completeAll: { points: 100, badge: 'tutorial_master' },
  perStep: 10,
};

// Interactive tutorial steps
const tutorialSteps = [
  // Welcome
  {
    id: 'welcome',
    icon: '🤙',
    title: t('tutWelcomeTitle') || 'Bienvenue sur SpotHitch !',
    desc: t('tutWelcomeDesc') || 'Découvre l\'app en quelques clics. Je vais te guider vers chaque fonctionnalité.',
    type: 'modal', // Just show modal, no interaction
    position: 'center',
  },
  // Step 1: Map tab
  {
    id: 'nav-map',
    icon: '🗺️',
    title: t('tutMapTitle') || 'La Carte',
    desc: t('tutMapDesc') || 'Clique sur l\'onglet Carte pour voir tous les spots d\'auto-stop.',
    type: 'click',
    target: 'nav-map', // ID of the nav button
    targetSelector: '[data-tab="map"], [aria-label*="Carte"]',
    position: 'top',
    onComplete: () => window.changeTab?.('map'),
  },
  // Step 2: Explain the map
  {
    id: 'map-explore',
    icon: '📍',
    title: t('tutMapExploreTitle') || 'Explore les spots',
    desc: t('tutMapExploreDesc') || 'Les marqueurs colorés sont des spots. Vert = excellent, Rouge = à éviter. Utilise les boutons à gauche pour zoomer.',
    type: 'modal',
    position: 'center',
    prerequisiteTab: 'map',
  },
  // Step 3: Add spot button
  {
    id: 'add-spot-btn',
    icon: '➕',
    title: t('tutAddSpotTitle') || 'Ajouter un spot',
    desc: t('tutAddSpotDesc') || 'Tu connais un bon spot ? Clique sur le bouton + bleu pour le partager !',
    type: 'highlight',
    targetSelector: '[aria-label*="Ajouter"]',
    position: 'left',
    prerequisiteTab: 'map',
  },
  // Step 4: Challenges tab
  {
    id: 'nav-challenges',
    icon: '🎯',
    title: t('tutChallengesTitle') || 'Les Défis',
    desc: t('tutChallengesDesc') || 'Clique sur Défis pour découvrir la gamification : badges, quiz, boutique...',
    type: 'click',
    targetSelector: '[data-tab="challenges"], [aria-label*="Défis"]',
    position: 'top',
    onComplete: () => window.changeTab?.('challenges'),
  },
  // Step 5: Explain challenges
  {
    id: 'challenges-explore',
    icon: '🏆',
    title: t('tutChallengesExploreTitle') || 'Gagne des récompenses',
    desc: t('tutChallengesExploreDesc') || 'Complète des défis quotidiens, gagne des points, monte de niveau et débloque des badges !',
    type: 'modal',
    position: 'center',
    prerequisiteTab: 'challenges',
  },
  // Step 6: Social tab
  {
    id: 'nav-social',
    icon: '💬',
    title: t('tutSocialTitle') || 'La Communauté',
    desc: t('tutSocialDesc') || 'Clique sur Social pour discuter avec d\'autres autostoppeurs.',
    type: 'click',
    targetSelector: '[data-tab="social"], [aria-label*="Social"]',
    position: 'top',
    onComplete: () => window.changeTab?.('social'),
  },
  // Step 7: Explain social
  {
    id: 'social-explore',
    icon: '👥',
    title: t('tutSocialExploreTitle') || 'Chat & Groupes',
    desc: t('tutSocialExploreDesc') || 'Discute dans le chat général, ajoute des amis, et crée des groupes de voyage !',
    type: 'modal',
    position: 'center',
    prerequisiteTab: 'social',
  },
  // Step 8: Profile tab
  {
    id: 'nav-profile',
    icon: '👤',
    title: t('tutProfileTitle') || 'Ton Profil',
    desc: t('tutProfileDesc') || 'Clique sur Profil pour personnaliser ton compte et accéder aux paramètres.',
    type: 'click',
    targetSelector: '[data-tab="profile"], [aria-label*="Profil"]',
    position: 'top',
    onComplete: () => window.changeTab?.('profile'),
  },
  // Step 9: Profile features
  {
    id: 'profile-features',
    icon: '⚙️',
    title: t('tutProfileFeaturesTitle') || 'Personnalisation',
    desc: t('tutProfileFeaturesDesc') || 'Change ton avatar, accède à l\'arbre de compétences, gère tes paramètres et bien plus !',
    type: 'modal',
    position: 'center',
    prerequisiteTab: 'profile',
  },
  // Step 10: SOS Button
  {
    id: 'sos-btn',
    icon: '🆘',
    title: t('tutSOSTitle') || 'Mode SOS',
    desc: t('tutSOSDesc') || 'En cas d\'urgence, le bouton SOS (en haut) partage ta position et affiche les numéros utiles.',
    type: 'highlight',
    targetSelector: '[aria-label*="SOS"], .sos-btn',
    position: 'bottom',
  },
  // Step 11: Admin panel
  {
    id: 'admin-panel',
    icon: '🛡️',
    title: t('tutAdminTitle') || 'Panneau Admin',
    desc: t('tutAdminDesc') || 'Le bouton orange en bas à droite ouvre le panneau admin pour accéder rapidement à TOUTES les fonctionnalités.',
    type: 'highlight',
    targetSelector: '[aria-label*="Admin"]',
    position: 'left',
  },
  // Conclusion
  {
    id: 'ready',
    icon: '🚀',
    title: t('tutReadyTitle') || 'Tu es prêt !',
    desc: t('tutReadyDesc') || 'Tu connais maintenant SpotHitch. Bonne route et n\'oublie pas de partager tes spots !',
    type: 'modal',
    position: 'center',
    isLast: true,
  },
];

export function renderTutorial(state) {
  const stepIndex = state.tutorialStep || 0;
  const step = tutorialSteps[stepIndex];

  if (!step) {
    window.finishTutorial?.();
    return '';
  }

  const isLast = step.isLast || stepIndex === tutorialSteps.length - 1;
  const progress = ((stepIndex + 1) / tutorialSteps.length) * 100;

  // Check prerequisite tab
  if (step.prerequisiteTab && state.activeTab !== step.prerequisiteTab) {
    window.changeTab?.(step.prerequisiteTab);
  }

  return `
    <div class="tutorial-overlay" id="tutorial-overlay">
      <!-- Progress bar at top -->
      <div class="fixed top-0 left-0 right-0 z-[102] h-1 bg-slate-800">
        <div class="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500" style="width: ${progress}%"></div>
      </div>

      <!-- Skip button -->
      <button
        onclick="skipTutorial()"
        class="fixed top-4 right-4 z-[103] px-4 py-2 rounded-full bg-slate-800/90 text-slate-400 text-sm hover:text-white hover:bg-slate-700 transition-all"
      >
        ${t('skip') || 'Passer'} ${icon('forward', 'w-5 h-5 ml-1')}
      </button>

      <!-- Dark overlay -->
      <div class="fixed inset-0 z-[100] bg-black/70 transition-opacity duration-300" id="tutorial-backdrop"></div>

      <!-- Spotlight on target element -->
      ${step.targetSelector ? `<div class="tutorial-spotlight" id="tutorial-spotlight"></div>` : ''}

      <!-- Tutorial card -->
      <div class="tutorial-card ${getPositionClass(step.position)}" id="tutorial-card">
        <div class="flex items-start gap-4">
          <div class="text-4xl shrink-0">${step.icon}</div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-white mb-2">${step.title}</h3>
            <p class="text-slate-300 text-sm leading-relaxed">${step.desc}</p>
          </div>
        </div>

        <!-- Action hint -->
        ${step.type === 'click' ? `
          <div class="mt-4 flex items-center gap-2 text-primary-400 text-sm animate-pulse">
            ${icon('hand-pointer', 'w-5 h-5')}
            <span>${t('tutClickHighlighted') || 'Clique sur l\'élément mis en surbrillance'}</span>
          </div>
        ` : step.type === 'highlight' ? `
          <div class="mt-4 flex gap-2">
            <button onclick="nextTutorial()" class="flex-1 py-2 px-4 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
              ${t('understood') || 'Compris !'} ${icon('arrow-right', 'w-5 h-5 ml-2')}
            </button>
          </div>
        ` : `
          <div class="mt-4 flex gap-2">
            ${stepIndex > 0 ? `
              <button onclick="prevTutorial()" class="py-2 px-4 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors">
                ${icon('arrow-left', 'w-5 h-5')}
              </button>
            ` : ''}
            <button onclick="${isLast ? 'finishTutorial()' : 'nextTutorial()'}" class="flex-1 py-2 px-4 rounded-lg ${isLast ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary-500 hover:bg-primary-600'} text-white font-medium transition-colors">
              ${isLast ? t('letsStart') || 'Commencer !' : t('next') || 'Suivant'} ${icon(isLast ? 'rocket' : 'arrow-right', 'w-5 h-5 ml-2 inline-block')}
            </button>
          </div>
        `}

        <!-- Step indicator -->
        <div class="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>${t('step') || 'Étape'} ${stepIndex + 1}/${tutorialSteps.length}</span>
          <span class="text-amber-400">${icon('star', 'w-5 h-5 mr-1')}+${TUTORIAL_REWARDS.perStep} pts</span>
        </div>
      </div>
    </div>

    <style>
      .tutorial-overlay {
        position: fixed;
        inset: 0;
        z-index: 99;
        pointer-events: none;
      }
      /* Only specific elements capture clicks - not the backdrop for click-type steps */
      .tutorial-overlay .tutorial-card,
      .tutorial-overlay button {
        pointer-events: auto;
      }
      /* Backdrop blocks clicks except on click-type steps where target needs to be clickable */
      .tutorial-overlay #tutorial-backdrop {
        pointer-events: auto;
      }
      /* Progress bar doesn't need to capture clicks */
      .tutorial-overlay .h-1 {
        pointer-events: none;
      }
      .tutorial-card {
        position: fixed;
        z-index: 103;
        max-width: 360px;
        width: calc(100% - 32px);
        padding: 20px;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.3s ease-out;
      }
      .tutorial-card.pos-center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      .tutorial-card.pos-top {
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
      }
      .tutorial-card.pos-bottom {
        bottom: 140px;
        left: 50%;
        transform: translateX(-50%);
      }
      .tutorial-card.pos-left {
        bottom: 140px;
        left: 16px;
        transform: none;
      }
      .tutorial-spotlight {
        position: fixed;
        z-index: 101;
        border-radius: 12px;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.75);
        pointer-events: none;
        transition: all 0.3s ease-out;
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
      .tutorial-card.pos-top {
        animation: slideInTop 0.3s ease-out;
      }
      @keyframes slideInTop {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      .tutorial-card.pos-bottom, .tutorial-card.pos-left {
        animation: slideInBottom 0.3s ease-out;
      }
      @keyframes slideInBottom {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .tutorial-card.pos-left {
        animation: slideInLeft 0.3s ease-out;
      }
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
    </style>
  `;
}

function getPositionClass(position) {
  const posMap = {
    'center': 'pos-center',
    'top': 'pos-top',
    'bottom': 'pos-bottom',
    'left': 'pos-left',
  };
  return posMap[position] || 'pos-center';
}

// Track active click handlers to prevent duplicates
let activeClickHandler = null;
let activeClickTarget = null;

// Position spotlight on target element
export function positionSpotlight() {
  const state = getState();
  const stepIndex = state.tutorialStep || 0;
  const step = tutorialSteps[stepIndex];

  // Clean up previous click handler if exists
  if (activeClickHandler && activeClickTarget) {
    activeClickTarget.removeEventListener('click', activeClickHandler);
    activeClickHandler = null;
    activeClickTarget = null;
  }

  if (!step?.targetSelector) return;

  const spotlight = document.getElementById('tutorial-spotlight');
  const backdrop = document.getElementById('tutorial-backdrop');
  if (!spotlight) return;

  const target = document.querySelector(step.targetSelector);
  if (target) {
    const rect = target.getBoundingClientRect();
    const padding = 8;
    spotlight.style.top = `${rect.top - padding}px`;
    spotlight.style.left = `${rect.left - padding}px`;
    spotlight.style.width = `${rect.width + padding * 2}px`;
    spotlight.style.height = `${rect.height + padding * 2}px`;
    spotlight.style.display = 'block';

    // Make target clickable for 'click' type steps
    if (step.type === 'click') {
      // Make backdrop click-through so user can click the target
      if (backdrop) {
        backdrop.style.pointerEvents = 'none';
      }

      target.style.position = 'relative';
      target.style.zIndex = '102';
      target.dataset.tutorialTarget = 'true';

      // Create and store click handler
      activeClickHandler = () => {
        // Clean up
        if (activeClickTarget) {
          activeClickTarget.style.zIndex = '';
          activeClickTarget.style.position = '';
          delete activeClickTarget.dataset.tutorialTarget;
        }
        if (backdrop) {
          backdrop.style.pointerEvents = '';
        }
        activeClickHandler = null;
        activeClickTarget = null;

        // Execute step completion callback
        if (step.onComplete) step.onComplete();

        // Move to next step
        window.nextTutorial?.();
      };
      activeClickTarget = target;

      target.addEventListener('click', activeClickHandler, { once: true });
    } else {
      // For non-click steps, backdrop should block clicks
      if (backdrop) {
        backdrop.style.pointerEvents = 'auto';
      }
    }
  } else {
    spotlight.style.display = 'none';
    // Restore backdrop blocking
    if (backdrop) {
      backdrop.style.pointerEvents = 'auto';
    }
  }
}

/**
 * Clean up tutorial target elements (remove z-index and data attributes)
 * Also cleans up any active click handlers
 */
export function cleanupTutorialTargets() {
  // Remove click handler if active
  if (activeClickHandler && activeClickTarget) {
    activeClickTarget.removeEventListener('click', activeClickHandler);
    activeClickHandler = null;
    activeClickTarget = null;
  }

  // Clean up all tutorial target elements
  document.querySelectorAll('[data-tutorial-target]').forEach(el => {
    el.style.zIndex = '';
    el.style.position = '';
    delete el.dataset.tutorialTarget;
  });

  // Restore backdrop pointer events
  const backdrop = document.getElementById('tutorial-backdrop');
  if (backdrop) {
    backdrop.style.pointerEvents = '';
  }
}

/**
 * Execute action for a specific step (called from main.js handlers)
 * @param {number} stepIndex - The step index
 */
export function executeStepAction(stepIndex) {
  const step = tutorialSteps[stepIndex];
  if (!step) return;

  // Position spotlight after DOM update
  requestAnimationFrame(() => {
    requestAnimationFrame(() => positionSpotlight());
  });
}

// NOTE: Global handlers are defined in main.js to avoid duplicate definitions
// The following are kept as fallbacks only if main.js handlers aren't loaded yet

if (typeof window.nextTutorial === 'undefined') {
  window.nextTutorial = () => {
    const state = getState();
    const newStep = (state.tutorialStep || 0) + 1;

    if (newStep >= tutorialSteps.length) {
      window.finishTutorial?.();
    } else {
      setState({ tutorialStep: newStep });
      executeStepAction(newStep);
    }
  };
}

if (typeof window.prevTutorial === 'undefined') {
  window.prevTutorial = () => {
    const state = getState();
    const newStep = Math.max(0, (state.tutorialStep || 0) - 1);
    setState({ tutorialStep: newStep });
    executeStepAction(newStep);
  };
}

if (typeof window.skipTutorial === 'undefined') {
  window.skipTutorial = () => {
    cleanupTutorialTargets();
    setState({ showTutorial: false, tutorialStep: 0 });
    // No toast on skip — silent close
  };
}

if (typeof window.finishTutorial === 'undefined') {
  window.finishTutorial = () => {
    cleanupTutorialTargets();

    const state = getState();
    const totalPoints = tutorialSteps.length * TUTORIAL_REWARDS.perStep + TUTORIAL_REWARDS.completeAll.points;

    setState({
      showTutorial: false,
      tutorialStep: 0,
      tutorialCompleted: true,
      points: (state.points || 0) + totalPoints,
      totalPoints: (state.totalPoints || 0) + totalPoints,
    });

    // No toast on finish — silent completion
  };
}

if (typeof window.startTutorial === 'undefined') {
  window.startTutorial = () => {
    setState({ showTutorial: true, tutorialStep: 0 });
    executeStepAction(0);
  };
}

export { tutorialSteps };
export default { renderTutorial, tutorialSteps, positionSpotlight, executeStepAction, cleanupTutorialTargets };
