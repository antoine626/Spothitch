/**
 * Country Bubbles Service
 * Displays orange bubbles per country on the map when zoomed out (zoom < 7)
 * Each bubble shows the flag + spot count, with download/display actions
 */

import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'

/**
 * Build GeoJSON FeatureCollection for country bubbles
 * @param {object} indexData - spot index with countries array
 * @param {object} countryCenters - { CODE: { lat, lon } }
 * @param {Set<string>} downloadedCodes - country codes downloaded for offline
 * @param {Set<string>} loadedCodes - country codes currently loaded in memory
 * @returns {object} GeoJSON FeatureCollection
 */
export function buildCountryBubblesGeoJSON(indexData, countryCenters, downloadedCodes = new Set(), loadedCodes = new Set()) {
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
        name: displayNames.of(code) || code,
        spotCount: country.locations || 0,
        isDownloaded: downloadedCodes.has(code) ? 1 : 0,
        isLoaded: loadedCodes.has(code) ? 1 : 0,
        label: `${getFlagEmoji(code)} ${country.locations || 0}`,
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
 */
export function createBubblePopup(maplibregl, feature, lngLat) {
  const { code, name, spotCount, isDownloaded } = feature.properties

  const html = `
    <div class="p-3 min-w-[180px]">
      <div class="text-base font-bold mb-1">${getFlagEmoji(code)} ${name}</div>
      <div class="text-sm text-slate-300 mb-3">${spotCount} ${t('spotsInCountry') || 'spots'}</div>
      <div class="flex flex-col gap-2">
        <button onclick="loadCountryOnMap('${code}')"
          class="w-full px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2">
          ${icon('eye', 'w-4 h-4')}
          ${t('displayCountry') || 'Afficher'}
        </button>
        ${isDownloaded
          ? `<div class="w-full px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium flex items-center justify-center gap-2">
              ${icon('check', 'w-4 h-4')}
              ${t('countryDownloaded') || 'Téléchargé'}
            </div>`
          : `<button onclick="downloadCountryFromBubble('${code}', '${name.replace(/'/g, "\\'")}')"
              id="bubble-download-${code}"
              class="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              ${icon('download', 'w-4 h-4')}
              ${t('downloadOffline') || 'Télécharger'}
            </button>`
        }
      </div>
    </div>
  `

  return new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
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
