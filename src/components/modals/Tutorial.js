/**
 * Tutorial Modal Component
 * Interactive onboarding tutorial
 */

import { t } from '../../i18n/index.js';

const tutorialSteps = [
  {
    icon: '🏠',
    title: 'tuto1Title',
    desc: 'tuto1Desc',
    highlight: 'nav-btn[aria-label*="Accueil"], nav-btn:first-child',
  },
  {
    icon: '🗺️',
    title: 'tuto2Title',
    desc: 'tuto2Desc',
    highlight: 'nav-btn[aria-label*="Spots"]',
  },
  {
    icon: '➕',
    title: 'tuto3Title',
    desc: 'tuto3Desc',
    highlight: '.fab',
  },
  {
    icon: '📸',
    title: 'tuto4Title',
    desc: 'tuto4Desc',
    highlight: '.card',
  },
  {
    icon: '💬',
    title: 'tuto5Title',
    desc: 'tuto5Desc',
    highlight: 'nav-btn[aria-label*="Chat"]',
  },
  {
    icon: '🧭',
    title: 'tuto6Title',
    desc: 'tuto6Desc',
    highlight: 'nav-btn[aria-label*="Voyage"]',
  },
  {
    icon: '👤',
    title: 'tuto7Title',
    desc: 'tuto7Desc',
    highlight: 'nav-btn[aria-label*="Profil"]',
  },
  {
    icon: '🆘',
    title: 'tuto8Title',
    desc: 'tuto8Desc',
    highlight: '.sos-header-btn',
  },
];

export function renderTutorial(state) {
  const step = tutorialSteps[state.tutorialStep] || tutorialSteps[0];
  const isLast = state.tutorialStep === tutorialSteps.length - 1;
  const isFirst = state.tutorialStep === 0;
  
  return `
    <!-- Overlay -->
    <div class="tuto-overlay" onclick="skipTutorial()"></div>
    
    <!-- Tutorial Bubble -->
    <div class="tuto-bubble" style="bottom: 140px; left: 16px; right: 16px; max-width: 400px; margin: 0 auto;">
      <!-- Icon -->
      <div class="text-4xl mb-3">${step.icon}</div>
      
      <!-- Title -->
      <h3 class="text-xl font-bold mb-2">${t(step.title)}</h3>
      
      <!-- Description -->
      <p class="text-slate-300 text-sm leading-relaxed mb-4">
        ${t(step.desc)}
      </p>
      
      <!-- Progress Dots -->
      <div class="tuto-dots mb-4">
        ${tutorialSteps.map((_, i) => `
          <div class="tuto-dot ${i === state.tutorialStep ? 'active' : ''} ${i < state.tutorialStep ? 'done' : ''}"></div>
        `).join('')}
      </div>
      
      <!-- Navigation -->
      <div class="flex gap-3">
        ${!isFirst ? `
          <button 
            onclick="prevTutorial()"
            class="btn btn-ghost flex-1"
          >
            <i class="fas fa-chevron-left mr-1"></i>
            ${t('tutoPrev')}
          </button>
        ` : `
          <button 
            onclick="skipTutorial()"
            class="btn btn-ghost flex-1"
          >
            ${t('tutoSkip')}
          </button>
        `}
        
        <button 
          onclick="${isLast ? 'skipTutorial()' : 'nextTutorial()'}"
          class="btn btn-primary flex-1"
        >
          ${isLast ? t('tutoFinish') : t('tutoNext')}
          ${!isLast ? '<i class="fas fa-chevron-right ml-1"></i>' : ''}
        </button>
      </div>
      
      <!-- Step counter -->
      <div class="text-center text-slate-500 text-xs mt-3">
        ${state.tutorialStep + 1} / ${tutorialSteps.length}
      </div>
    </div>
  `;
}

export default { renderTutorial };
