/**
 * Lightweight Tutorial Component
 * 3 quick screens shown as overlay on the map.
 * Focused on value: spots → contribute → safety.
 */

import { getState, setState } from '../../stores/state.js'
import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

const TUTORIAL_REWARDS = {
  completeAll: { points: 50, badge: 'tutorial_master' },
}

// 3 screens — map-oriented, action-focused
const tutorialSteps = [
  {
    id: 'spots',
    icon: 'map-pin',
    title: () => t('tutSpotsTitle') || 'Hitchhiking spots near you',
    desc: () => t('tutSpotsDesc') || 'The map shows the best spots to hitchhike. Zoom in to see details, ratings and tips from other travelers.',
    color: 'amber',
  },
  {
    id: 'contribute',
    icon: 'plus-circle',
    title: () => t('tutContributeTitle') || 'Share your spots',
    desc: () => t('tutContributeDesc') || 'Found a great spot? Tap the + button to add it with a photo and tips. Every spot helps the community!',
    color: 'primary',
  },
  {
    id: 'safety',
    icon: 'shield',
    title: () => t('tutSafetyTitle') || 'Stay safe',
    desc: () => t('tutSafetyDesc') || 'Activate Companion Mode to share your location with a trusted contact. The SOS button is always at the top.',
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

  return `
    <div class="tutorial-overlay" id="tutorial-overlay">
      <!-- Transparent backdrop — map visible behind -->
      <div class="fixed inset-0 z-[100] bg-black/50" onclick="skipTutorial()"></div>

      <!-- Bottom card (like a tooltip, not blocking the map) -->
      <div class="fixed bottom-24 left-0 right-0 z-[101] flex justify-center px-4">
        <div class="w-full max-w-sm bg-dark-primary/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

          <!-- Content -->
          <div class="p-5">
            <!-- Step indicator + icon -->
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-full bg-${step.color}-500/20 flex items-center justify-center shrink-0">
                ${icon(step.icon, `w-5 h-5 text-${step.color}-400`)}
              </div>
              <div class="flex-1">
                <h2 class="text-base font-bold text-white">${step.title()}</h2>
              </div>
              <!-- Step dots -->
              <div class="flex items-center gap-1.5">
                ${tutorialSteps.map((_, i) => `
                  <div class="w-1.5 h-1.5 rounded-full transition-colors ${i === stepIndex ? `bg-${step.color}-400 w-4` : i < stepIndex ? 'bg-white/40' : 'bg-white/15'}"></div>
                `).join('')}
              </div>
            </div>

            <p class="text-slate-400 text-sm leading-relaxed mb-4">${step.desc()}</p>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                onclick="skipTutorial()"
                class="px-3 py-2.5 rounded-xl bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-colors"
              >
                ${t('skip') || 'Skip'}
              </button>
              <button
                onclick="${isLast ? 'finishTutorial()' : 'nextTutorial()'}"
                class="flex-1 py-2.5 rounded-xl bg-${step.color}-500 text-white font-medium hover:bg-${step.color}-600 transition-colors text-center text-sm flex items-center justify-center gap-2"
              >
                ${isLast ? (t('gotIt') || 'Got it!') : (t('next') || 'Next')}
                ${icon(isLast ? 'check' : 'arrow-right', 'w-4 h-4')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
}

export function cleanupTutorialTargets() {
  document.querySelectorAll('[data-tutorial-target]').forEach(el => {
    el.style.zIndex = ''
    el.style.position = ''
    delete el.dataset.tutorialTarget
  })
}

export function executeStepAction(stepIndex) {
  const step = tutorialSteps[stepIndex]
  if (!step) return
  // Ensure map tab is active during tutorial
  if (typeof window.changeTab === 'function') {
    window.changeTab('map')
  }
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
  }
}

if (typeof window.startTutorial === 'undefined') {
  window.startTutorial = () => {
    setState({ showTutorial: true, tutorialStep: 0 })
  }
}

export { tutorialSteps }
export default { renderTutorial, tutorialSteps, executeStepAction, cleanupTutorialTargets }
