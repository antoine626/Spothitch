/**
 * Titles Modal Component
 * Shows all narrative titles with unlock progress
 */

import { getAllTitles, getTitleForLevel, getUnlockedTitles, getLockedTitles } from '../../data/titles.js'
import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'

export function renderTitlesModal(state) {
  const level = state.level || 1
  const currentTitle = getTitleForLevel(level)
  const unlocked = getUnlockedTitles(level)
  const locked = getLockedTitles(level)
  const all = getAllTitles()

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeTitles()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titles-modal-title"
    >
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>
      <div
        class="relative modal-panel rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-6 text-center border-b border-white/10">
          <span class="text-5xl mb-3 block">${currentTitle.emoji}</span>
          <h2 id="titles-modal-title" class="text-xl font-bold" style="color: ${currentTitle.color}">
            ${currentTitle.name}
          </h2>
          <p class="text-slate-400 text-sm mt-1">${t('level')} ${level} - ${currentTitle.description}</p>
          <p class="text-xs text-slate-500 mt-2">${unlocked.length}/${all.length} ${t('titlesUnlocked')}</p>
        </div>

        <!-- Titles List -->
        <div class="p-4 space-y-3">
          ${all.map(title => {
    const isUnlocked = level >= title.minLevel
    const isCurrent = title.id === currentTitle.id
    return `
              <div class="p-4 rounded-xl ${isCurrent ? 'border-2 ring-2 ring-offset-2 ring-offset-dark-primary' : 'border'} ${isUnlocked ? 'bg-white/5 border-white/20' : 'bg-white/[0.02] border-white/5 opacity-60'}" style="${isCurrent ? `border-color: ${title.color}; --tw-ring-color: ${title.color}40` : ''}">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: ${isUnlocked ? `${title.color}30` : 'rgba(255,255,255,0.05)'}">
                    ${isUnlocked ? title.emoji : '🔒'}
                  </div>
                  <div class="flex-1">
                    <div class="font-bold ${isUnlocked ? '' : 'text-slate-500'}" ${isUnlocked ? `style="color: ${title.color}"` : ''}>
                      ${title.name}
                    </div>
                    <div class="text-xs text-slate-400">
                      ${isUnlocked ? title.description : `${t('unlockAtLevel')} ${title.minLevel}`}
                    </div>
                  </div>
                  <div class="text-right text-xs">
                    <div class="${isUnlocked ? 'text-emerald-400' : 'text-slate-500'}">
                      ${t('levelShort')} ${title.minLevel}${title.maxLevel < Infinity ? `-${title.maxLevel}` : '+'}
                    </div>
                    ${isCurrent ? `<div class="text-primary-400 font-bold mt-1">${t('current')}</div>` : ''}
                  </div>
                </div>
              </div>
            `
  }).join('')}
        </div>

        <!-- Close -->
        <button
          onclick="closeTitles()"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          aria-label="${t('close') || 'Close'}"
        >
          ${icon('times', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

export default { renderTitlesModal }
