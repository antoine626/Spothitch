/**
 * City Panel Component
 * Shows city info with nearby spots and routes when user searches for a city
 * Renders as a slide-up panel at bottom of map
 */

import { t } from '../../i18n/index.js'
import { icon } from '../../utils/icons.js'
import { escapeHTML } from '../../utils/sanitize.js'

/**
 * Render the city panel
 * @param {Object} state - App state (needs selectedCity data)
 * @returns {string} HTML
 */
export function renderCityPanel(state) {
  const city = state.cityData
  if (!city) return ''

  const cityName = escapeHTML(city.name || '')
  const countryName = escapeHTML(city.countryName || '')
  const countryCode = city.country || ''
  const spotCount = city.spotCount || 0
  const avgWait = city.avgWait || 0
  const avgRating = city.avgRating || 0
  const routes = city.routesList || []

  return `
    <div class="fixed bottom-20 left-0 right-0 z-30 bg-dark-primary/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[50vh] overflow-y-auto slide-up"
         role="dialog" aria-label="${t('hitchhikingFrom')} ${cityName}">
      <!-- Header -->
      <div class="p-5 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <h2 class="text-lg font-bold text-white truncate">
              ${icon('map-pin', 'w-5 h-5 text-primary-400 inline mr-1.5')}${t('hitchhikingFrom')} ${cityName}
            </h2>
            <p class="text-sm text-slate-400 mt-1">
              ${spotCount} spots
              ${avgWait > 0 ? ` · ~${avgWait} min` : ''}
              ${avgRating > 0 ? ` · ${icon('star', 'w-3.5 h-3.5 text-amber-400 inline')} ${avgRating}` : ''}
            </p>
          </div>
          <button onclick="closeCityPanel()"
            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white/20 transition-colors"
            aria-label="${t('close')}">
            ${icon('x', 'w-5 h-5 text-white')}
          </button>
        </div>
      </div>

      <!-- Routes list -->
      ${routes.length > 0 ? `
        <div class="p-4">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">${t('popularRoutes')}</h3>
          <div class="space-y-2">
            ${routes.slice(0, 10).map((route, i) => `
              <button onclick="selectCityRoute('${city.slug}', '${route.slug}')"
                class="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left flex items-center justify-between transition-colors group">
                <div class="min-w-0">
                  <div class="font-medium text-white text-sm truncate">
                    ${icon('arrow-right', 'w-4 h-4 text-primary-400 inline mr-1.5')}${t('direction')} ${i + 1}
                  </div>
                  <div class="text-xs text-slate-400 mt-0.5">
                    ${route.spotCount} spots${route.avgWait > 0 ? ` · ~${route.avgWait} min` : ''}
                  </div>
                </div>
                <div class="flex-shrink-0">
                  ${icon('chevron-right', 'w-4 h-4 text-slate-500 group-hover:text-white transition-colors')}
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Quick actions -->
      <div class="p-4 border-t border-white/10 flex gap-2">
        ${countryCode ? `
          <button onclick="openCountryGuide('${countryCode}')"
            class="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors text-center">
            ${icon('book-open', 'w-4 h-4 inline mr-1.5')}${t('openCityGuide')} ${countryName}
          </button>
        ` : ''}
        <button onclick="viewCitySpotsOnMap()"
          class="flex-1 py-2.5 px-4 rounded-xl bg-primary-500/20 text-primary-400 text-sm font-medium hover:bg-primary-500/30 transition-colors text-center">
          ${icon('map', 'w-4 h-4 inline mr-1.5')}${t('viewOnMap')}
        </button>
      </div>
    </div>
  `
}
