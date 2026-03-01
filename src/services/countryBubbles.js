/**
 * Country Bubbles Service
 * Displays orange bubbles per country on the map when zoomed out (zoom < 7)
 * Each bubble shows the flag + spot count, with download/display actions
 */

import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'
import { escapeJSString } from '../utils/sanitize.js'

/**
 * Build GeoJSON FeatureCollection for country bubbles
 * @param {object} indexData - spot index with countries array
 * @param {object} countryCenters - { CODE: { lat, lon } }
 * @param {Set<string>} downloadedCodes - country codes downloaded for offline
 * @param {Set<string>} loadedCodes - country codes currently loaded in memory
 * @returns {object} GeoJSON FeatureCollection
 */
export function buildCountryBubblesGeoJSON(
  indexData, countryCenters, downloadedCodes = new Set(), loadedCodes = new Set(),
) {
  if (!indexData?.countries) return { type: 'FeatureCollection', features: [] }

  const displayNames = getCountryDisplayNames()
  const features = []

  for (const country of indexData.countries) {
    const code = country.code
    const center = countryCenters[code]
    if (!center) continue

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [center.lon, center.lat] },
      properties: {
        code,
        name: safeDisplayName(displayNames, code),
        spotCount: country.locations || 0,
        isDownloaded: downloadedCodes.has(code) ? 1 : 0,
        isLoaded: loadedCodes.has(code) ? 1 : 0,
        label: `${country.locations || 0}`,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

/**
 * Add country bubble layers to the map
 */
export function addCountryBubbleLayers(map) {
  map.addSource('country-bubbles', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  })

  // Orange circles — radius proportional to spot count
  map.addLayer({
    id: 'country-bubble-circles',
    type: 'circle',
    source: 'country-bubbles',
    paint: {
      'circle-color': [
        'case',
        ['==', ['get', 'isDownloaded'], 1], 'rgba(34, 197, 94, 0.7)',
        ['==', ['get', 'isLoaded'], 1], 'rgba(245, 158, 11, 0.5)',
        'rgba(245, 158, 11, 0.7)',
      ],
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'spotCount'],
        1, 14,
        50, 20,
        200, 28,
        500, 34,
        1000, 40,
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'isDownloaded'], 1], 'rgba(34, 197, 94, 0.9)',
        'rgba(245, 158, 11, 0.9)',
      ],
      'circle-stroke-width': 2,
      'circle-opacity': [
        'interpolate', ['linear'], ['zoom'],
        6, 1,
        7, 0,
      ],
      'circle-stroke-opacity': [
        'interpolate', ['linear'], ['zoom'],
        6, 1,
        7, 0,
      ],
    },
  })

  // Labels: flag + count
  map.addLayer({
    id: 'country-bubble-labels',
    type: 'symbol',
    source: 'country-bubbles',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 12,
      'text-font': ['Noto Sans Bold'],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#ffffff',
      'text-opacity': [
        'interpolate', ['linear'], ['zoom'],
        6, 1,
        7, 0,
      ],
    },
  })

  // Downloaded badge (checkmark)
  map.addLayer({
    id: 'country-bubble-badges',
    type: 'circle',
    source: 'country-bubbles',
    filter: ['==', ['get', 'isDownloaded'], 1],
    paint: {
      'circle-color': '#22c55e',
      'circle-radius': 8,
      'circle-translate': [16, -16],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
      'circle-opacity': [
        'interpolate', ['linear'], ['zoom'],
        6, 1,
        7, 0,
      ],
      'circle-stroke-opacity': [
        'interpolate', ['linear'], ['zoom'],
        6, 1,
        7, 0,
      ],
    },
  })
}

/**
 * Update the GeoJSON data on the country-bubbles source
 */
export function updateCountryBubbleData(map, indexData, countryCenters, loadedCodes, downloadedCodes) {
  const source = map.getSource('country-bubbles')
  if (!source) return
  const geojson = buildCountryBubblesGeoJSON(indexData, countryCenters, downloadedCodes, loadedCodes)
  source.setData(geojson)
}

/**
 * Create a MapLibre popup for a country bubble
 * Download button shows a thick glow ring animation during progress
 */
export function createBubblePopup(maplibregl, feature, lngLat) {
  const { code, name, spotCount, isDownloaded } = feature.properties

  const downloadBtn = isDownloaded
    ? `<div class="w-full px-3 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-medium flex items-center justify-center gap-2">
        ${icon('check', 'w-4 h-4')}
        ${t('countryDownloaded') || 'Téléchargé'}
      </div>`
    : `<button onclick="downloadCountryFromBubble('${code}', '${escapeJSString(name)}')"
        id="bubble-download-${code}"
        class="w-full px-3 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
        ${icon('download', 'w-4 h-4')}
        ${t('downloadOffline') || 'Télécharger'}
      </button>`

  const html = `
    <div class="p-3 min-w-[200px]">
      <div class="flex items-center gap-3 mb-3">
        <div class="relative flex-shrink-0" id="bubble-ring-wrap-${code}" style="width:56px;height:56px">
          <svg viewBox="0 0 56 56" style="position:absolute;top:0;left:0;width:56px;height:56px;transform:rotate(-90deg)">
            <circle cx="28" cy="28" r="25" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="5"/>
            <circle id="bubble-ring-${code}" cx="28" cy="28" r="25" fill="none" stroke="#22c55e" stroke-width="5" stroke-linecap="round"
              stroke-dasharray="157" stroke-dashoffset="157" style="transition:stroke-dashoffset 0.3s ease;filter:drop-shadow(0 0 4px rgba(34,197,94,0.5))"/>
          </svg>
          <div style="position:absolute;top:0;left:0;width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">
            ${getFlagEmoji(code)}
          </div>
          <div id="bubble-ring-pct-${code}" style="display:none;position:absolute;bottom:-2px;left:0;right:0;text-align:center;font-size:0.55rem;font-weight:700;color:#22c55e"></div>
        </div>
        <div>
          <div class="text-sm font-bold leading-tight">${name}</div>
          <div class="text-xs text-slate-400 mt-0.5">${spotCount} ${t('spotsInCountry') || 'spots'}</div>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <button onclick="loadCountryOnMap('${code}')"
          class="w-full px-3 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2">
          ${icon('eye', 'w-4 h-4')}
          ${t('displayCountry') || 'Afficher'}
        </button>
        ${downloadBtn}
      </div>
    </div>
  `

  return new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
    .setLngLat(lngLat)
    .setHTML(html)
}

/**
 * Set visibility of bubble layers
 */
export function setBubbleLayersVisibility(map, visible) {
  const v = visible ? 'visible' : 'none'
  const layers = ['country-bubble-circles', 'country-bubble-labels', 'country-bubble-badges']
  layers.forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v)
  })
}

/**
 * Set visibility of spot layers
 */
export function setSpotLayersVisibility(map, visible) {
  const v = visible ? 'visible' : 'none'
  const layers = ['home-clusters', 'home-cluster-count', 'home-spot-points']
  layers.forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v)
  })
}

// --- Helpers ---

function safeDisplayName(displayNames, code) {
  try { return displayNames.of(code) || code } catch { return code }
}

function getCountryDisplayNames() {
  try {
    const lang = document.documentElement.lang || 'fr'
    return new Intl.DisplayNames([lang], { type: 'region' })
  } catch {
    return { of: (code) => code }
  }
}

function getFlagEmoji(code) {
  if (!code || code.length !== 2) return ''
  const codePoints = [...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  return String.fromCodePoint(...codePoints)
}
