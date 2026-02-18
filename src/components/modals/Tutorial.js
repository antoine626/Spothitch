/**
 * Interactive Tutorial Component
 * 3 clean screens onboarding + contextual tooltips
 */

import { getState, setState } from '../../stores/state.js'
import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

const TUTORIAL_REWARDS = {
  completeAll: { points: 50, badge: 'tutorial_master' },
}

// 3 screens only
const tutorialSteps = [
  {
    id: 'discover',
    emoji: '🗺️',
    title: t('tutDiscoverTitle') || 'Découvre les spots',
    desc: t('tutDiscoverDesc') || 'SpotHitch recense des milliers de spots d\'auto-stop dans le monde. Explore la carte, filtre par note, et trouve le meilleur endroit pour lever le pouce.',
    features: [
      { icon: 'map-pin', text: t('tutFeatureSpots') || '14 000+ spots vérifiés' },
      { icon: 'route', text: t('tutFeaturePlanner') || 'Planifie ton itinéraire' },
      { icon: 'funnel', text: t('tutFeatureFilter') || 'Filtre par note et attente' },
    ],
    color: 'amber',
  },
  {
    id: 'community',
    emoji: '🤝',
    title: t('tutCommunityTitle') || 'Rejoins la communauté',
    desc: t('tutCommunityDesc') || 'Discute avec d\'autres autostoppeurs, partage tes expériences, forme des groupes de voyage et participe aux événements.',
    features: [
      { icon: 'message-circle', text: t('tutFeatureChat') || 'Chat par région et privé' },
      { icon: 'users', text: t('tutFeatureGroups') || 'Groupes de voyage' },
      { icon: 'calendar', text: t('tutFeatureEvents') || 'Événements communautaires' },
    ],
    color: 'primary',
  },
  {
    id: 'safety',
    emoji: '🛡️',
    title: t('tutSafetyTitle') || 'Voyage en sécurité',
    desc: t('tutSafetyDesc') || 'Le mode compagnon partage ta position en temps réel avec tes proches. Le bouton SOS est toujours accessible en haut de l\'écran.',
    features: [
      { icon: 'shield', text: t('tutFeatureCompanion') || 'Mode compagnon temps réel' },
      { icon: 'phone', text: t('tutFeatureSOS') || 'Bouton SOS + numéros d\'urgence' },
      { icon: 'book-open', text: t('tutFeatureGuides') || 'Guides par pays' },
    ],
    color: 'emerald',
  },
]

export function renderTutorial(state) {
  const stepIndex = state.tutorialStep || 0
  const step = tutorialSteps[stepIndex]

  if (!step) {
    window.finishTutorial?.()
    return ''
  }

  const isLast = stepIndex === tutorialSteps.length - 1
  const isFirst = stepIndex === 0

  return `
    <div class="tutorial-overlay" id="tutorial-overlay">
      <!-- Dark backdrop -->
      <div class="fixed inset-0 z-[100] bg-black/80" onclick="skipTutorial()"></div>

      <!-- Tutorial card -->
      <div class="fixed inset-0 z-[101] flex items-center justify-center p-5">
        <div class="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

          <!-- Top section with emoji -->
          <div class="pt-8 pb-4 text-center bg-${step.color}-500/10">
            <div class="text-6xl mb-3">${step.emoji}</div>
            <!-- Step dots -->
            <div class="flex items-center justify-center gap-2">
              ${tutorialSteps.map((_, i) => `
                <div class="w-2 h-2 rounded-full transition-all ${i === stepIndex ? `bg-${step.color}-400 w-6` : i < stepIndex ? 'bg-white/40' : 'bg-white/15'}"></div>
              `).join('')}
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <h2 class="text-xl font-bold text-white mb-2 text-center">${step.title}</h2>
            <p class="text-slate-400 text-sm text-center mb-5 leading-relaxed">${step.desc}</p>

            <!-- Feature list -->
            <div class="space-y-3 mb-6">
              ${step.features.map(f => `
                <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                  ${icon(f.icon, `w-5 h-5 text-${step.color}-400 shrink-0`)}
                  <span class="text-sm text-slate-300">${f.text}</span>
                </div>
              `).join('')}
            </div>

            <!-- Actions -->
            <div class="flex gap-3">
              ${!isFirst ? `
                <button onclick="prevTutorial()" class="px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
                  ${icon('arrow-left', 'w-5 h-5')}
                </button>
              ` : `
                <button onclick="skipTutorial()" class="px-4 py-3 rounded-xl bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-all">
                  ${t('skip') || 'Passer'}
                </button>
              `}
              <button onclick="${isLast ? 'finishTutorial()' : 'nextTutorial()'}" class="flex-1 py-3 rounded-xl bg-${step.color}-500 text-white font-medium hover:bg-${step.color}-600 transition-all text-center">
                ${isLast ? (t('letsGo') || 'C\'est parti !') : (t('next') || 'Suivant')}
                ${icon(isLast ? 'rocket' : 'arrow-right', 'w-5 h-5 ml-2 inline-block')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
}

// Position spotlight — kept for compatibility but simplified
export function positionSpotlight() {
  // No spotlight needed in 3-screen tutorial
}

export function cleanupTutorialTargets() {
  document.querySelectorAll('[data-tutorial-target]').forEach(el => {
    el.style.zIndex = ''
    el.style.position = ''
    delete el.dataset.tutorialTarget
  })
}

export function executeStepAction(stepIndex) {
  // No step actions needed in 3-screen tutorial
}

// Fallback global handlers (main.js has priority)
if (typeof window.nextTutorial === 'undefined') {
  window.nextTutorial = () => {
    const state = getState()
    const newStep = (state.tutorialStep || 0) + 1
    if (newStep >= tutorialSteps.length) {
      window.finishTutorial?.()
    } else {
      setState({ tutorialStep: newStep })
    }
  }
}

if (typeof window.prevTutorial === 'undefined') {
  window.prevTutorial = () => {
    const state = getState()
    const newStep = Math.max(0, (state.tutorialStep || 0) - 1)
    setState({ tutorialStep: newStep })
  }
}

if (typeof window.skipTutorial === 'undefined') {
  window.skipTutorial = () => {
    cleanupTutorialTargets()
    setState({ showTutorial: false, tutorialStep: 0 })
  }
}

if (typeof window.finishTutorial === 'undefined') {
  window.finishTutorial = () => {
    cleanupTutorialTargets()
    const state = getState()
    setState({
      showTutorial: false,
      tutorialStep: 0,
      tutorialCompleted: true,
      points: (state.points || 0) + TUTORIAL_REWARDS.completeAll.points,
      totalPoints: (state.totalPoints || 0) + TUTORIAL_REWARDS.completeAll.points,
    })
    window.showToast?.(t('tutorialComplete') || 'Tutoriel terminé ! +50 👍', 'success')
  }
}

if (typeof window.startTutorial === 'undefined') {
  window.startTutorial = () => {
    setState({ showTutorial: true, tutorialStep: 0 })
  }
}

export { tutorialSteps }
export default { renderTutorial, tutorialSteps, positionSpotlight, executeStepAction, cleanupTutorialTargets }
