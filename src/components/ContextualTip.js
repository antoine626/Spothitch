/**
 * ContextualTip Component
 * UI component for displaying contextual tips
 * Can be used for inline tips or as a floating component
 */

import { getCurrentTip, dismissTip, TIPS } from '../services/contextualTips.js';
import { t } from '../i18n/index.js';

/**
 * Render a floating contextual tip (bottom of screen)
 * This is primarily handled by the service itself with DOM manipulation,
 * but this component can be used for inline rendering in templates
 */
export function renderContextualTip() {
  const tip = getCurrentTip();
  if (!tip) return '';

  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
    primary: 'from-primary-500/20 to-primary-600/20 border-primary-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
    amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
    rose: 'from-rose-500/20 to-rose-600/20 border-rose-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    danger: 'from-danger-500/20 to-danger-600/20 border-danger-500/30',
  };

  const iconColorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    primary: 'bg-primary-500/20 text-primary-400',
    purple: 'bg-purple-500/20 text-purple-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    amber: 'bg-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/20 text-rose-400',
    orange: 'bg-orange-500/20 text-orange-400',
    danger: 'bg-danger-500/20 text-danger-400',
  };

  const gradientClass = colorClasses[tip.color] || colorClasses.primary;
  const iconClass = iconColorClasses[tip.color] || iconColorClasses.primary;

  return `
    <div
      class="fixed bottom-24 left-4 right-4 z-[100] slide-up"
      role="alert"
      aria-live="polite"
    >
      <div class="bg-gradient-to-r ${gradientClass} backdrop-blur-xl border rounded-2xl p-4 shadow-2xl">
        <div class="flex items-start gap-3">
          <!-- Lightbulb Icon -->
          <div class="shrink-0 w-10 h-10 rounded-xl ${iconClass} flex items-center justify-center">
            <i class="fas fa-lightbulb text-lg" aria-hidden="true"></i>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">${t('tip') || 'Tip'}</span>
            </div>
            <p class="text-white text-sm leading-relaxed">${tip.message}</p>
          </div>

          <!-- Dismiss Button -->
          <button
            onclick="window.dismissContextualTip()"
            class="shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            aria-label="${t('closeTip') || 'Close tip'}"
            type="button"
          >
            <i class="fas fa-check text-sm" aria-hidden="true"></i>
          </button>
        </div>

        <!-- OK Button -->
        <button
          onclick="window.dismissContextualTip()"
          class="mt-3 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
          type="button"
        >
          <i class="fas fa-thumbs-up" aria-hidden="true"></i>
          ${t('gotIt') || 'Got it!'}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render an inline tip (can be placed anywhere in a component)
 * @param {object} tip - The tip configuration object
 * @param {boolean} dismissible - Whether the tip can be dismissed
 */
export function renderInlineTip(tip, dismissible = true) {
  if (!tip) return '';

  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    primary: 'bg-primary-500/10 border-primary-500/20 text-primary-300',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
    danger: 'bg-danger-500/10 border-danger-500/20 text-danger-300',
  };

  const iconColorClasses = {
    emerald: 'text-emerald-400',
    primary: 'text-primary-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    orange: 'text-orange-400',
    danger: 'text-danger-400',
  };

  const bgClass = colorClasses[tip.color] || colorClasses.primary;
  const iconClass = iconColorClasses[tip.color] || iconColorClasses.primary;

  return `
    <div class="${bgClass} border rounded-xl p-3 flex items-start gap-3" role="note">
      <i class="fas fa-lightbulb ${iconClass} mt-0.5" aria-hidden="true"></i>
      <div class="flex-1">
        <p class="text-sm">${tip.message}</p>
      </div>
      ${dismissible ? `
        <button
          onclick="window.dismissInlineTip && window.dismissInlineTip('${tip.id}')"
          class="text-white/50 hover:text-white transition-colors"
          aria-label="Fermer l'astuce"
          type="button"
        >
          <i class="fas fa-times text-xs" aria-hidden="true"></i>
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Render a tooltip-style tip (small popup near an element)
 * @param {object} tip - The tip configuration object
 * @param {string} position - Position: 'top' | 'bottom' | 'left' | 'right'
 */
export function renderTooltipTip(tip, position = 'bottom') {
  if (!tip) return '';

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent',
  };

  return `
    <div class="absolute ${positionClasses[position]} z-50 w-64 fade-in" role="tooltip">
      <div class="bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl">
        <div class="flex items-start gap-2">
          <i class="fas fa-lightbulb text-amber-400 mt-0.5" aria-hidden="true"></i>
          <p class="text-white text-xs leading-relaxed">${tip.message}</p>
        </div>
        <button
          onclick="window.dismissContextualTip()"
          class="mt-2 w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
          type="button"
        >
          ${t('gotIt') || 'Got it!'}
        </button>
      </div>
      <div class="absolute ${arrowClasses[position]} border-4 w-0 h-0"></div>
    </div>
  `;
}

/**
 * Get a tip by its ID
 * @param {string} tipId - The tip ID
 * @returns {object|null} The tip configuration or null
 */
export function getTipById(tipId) {
  return Object.values(TIPS).find(t => t.id === tipId) || null;
}

export default {
  renderContextualTip,
  renderInlineTip,
  renderTooltipTip,
  getTipById,
};
