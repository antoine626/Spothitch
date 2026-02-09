/**
 * Route Search Service (#97)
 * Recherche de spots par direction avec multi-destinations
 * Exemple: "Paris -> Lyon" affiche tous les spots sur le trajet
 */

import { getState, setState } from '../stores/state.js'
import { getRoute, searchLocation, formatDistance, formatDuration } from './osrm.js'
import { sampleSpots } from '../data/spots.js'
import { showToast } from './notifications.js'

/**
 * Constantes
 */
export const MAX_DESTINATIONS = 5

/**
 * État de la recherche de route
 */
const routeSearchState = {
  origin: null,
  destination: null,
  waypoints: [],
  searchResults: null,
  isSearching: false,
  lastSearch: null,
  savedRoutes: [],
}

/**
 * Clé localStorage pour les parcours sauvegardés
 */
const STORAGE_KEY = 'spothitch_saved_routes'

/**
 * Récupère l'état actuel de la recherche
 * @returns {Object} État de recherche
 */
export function getRouteSearchState() {
  return { ...routeSearchState }
}

/**
 * Calcule la distance entre deux points (formule de Haversine)
 * @param {number} lat1 - Latitude point 1
 * @param {number} lng1 - Longitude point 1
 * @param {number} lat2 - Latitude point 2
 * @param {number} lng2 - Longitude point 2
 * @returns {number} Distance en kilomètres
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calcule la distance d'un point à un segment de ligne
 * @param {Object} point - Point avec lat, lng
 * @param {Array} segStart - [lng, lat] du début du segment
 * @param {Array} segEnd - [lng, lat] de la fin du segment
 * @returns {number} Distance en km
 */
function distanceToSegment(point, segStart, segEnd) {
  const [lng1, lat1] = segStart
  const [lng2, lat2] = segEnd

  // Vecteur du segment
  const dx = lng2 - lng1
  const dy = lat2 - lat1

  // Si le segment est un point
  if (dx === 0 && dy === 0) {
    return haversineDistance(point.lat, point.lng, lat1, lng1)
  }

  // Projection du point sur le segment
  const t = Math.max(0, Math.min(1,
    ((point.lng - lng1) * dx + (point.lat - lat1) * dy) / (dx * dx + dy * dy)
  ))

  // Point le plus proche sur le segment
  const closestLng = lng1 + t * dx
  const closestLat = lat1 + t * dy

  return haversineDistance(point.lat, point.lng, closestLat, closestLng)
}

/**
 * Vérifie si un point est proche d'une route
 * @param {Object} point - Point avec lat, lng
 * @param {Array} routeCoords - Array de [lng, lat]
 * @param {number} maxDistanceKm - Distance max en km
 * @returns {Object|null} Info de proximité ou null
 */
function getPointProximityToRoute(point, routeCoords, maxDistanceKm = 15) {
  let minDistance = Infinity
  let closestIndex = -1

  // Échantillonnage pour performance (tous les 5 points)
  const step = Math.max(1, Math.floor(routeCoords.length / 200))

  for (let i = 0; i < routeCoords.length - 1; i += step) {
    const distance = distanceToSegment(
      point,
      routeCoords[i],
      routeCoords[Math.min(i + step, routeCoords.length - 1)]
    )

    if (distance < minDistance) {
      minDistance = distance
      closestIndex = i
    }
  }

  if (minDistance <= maxDistanceKm) {
    return {
      distance: minDistance,
      routeIndex: closestIndex,
      routeProgress: closestIndex / routeCoords.length,
    }
  }

  return null
}

/**
 * Parse une chaîne de recherche de direction
 * @param {string} query - Requête de type "Paris -> Lyon" ou "Paris - Lyon"
 * @returns {Object|null} { origin, destination, waypoints }
 */
export function parseDirectionQuery(query) {
  if (!query || typeof query !== 'string') {
    return null
  }

  // Normaliser les séparateurs (ordre important: plus long d'abord)
  const normalized = query
    .replace(/\s*-->\s*/g, ' | ')  // --> avant ->
    .replace(/\s*->\s*/g, ' | ')
    .replace(/\s*→\s*/g, ' | ')
    .replace(/\s*=>\s*/g, ' | ')
    .replace(/\s+vers\s+/gi, ' | ')
    .replace(/\s+to\s+/gi, ' | ')
    .replace(/\s+-\s+/g, ' | ')

  const parts = normalized.split(' | ').map(p => p.trim()).filter(p => p.length > 0)

  if (parts.length < 2) {
    return null
  }

  return {
    origin: parts[0],
    destination: parts[parts.length - 1],
    waypoints: parts.slice(1, -1),
  }
}

/**
 * Recherche une localisation par nom
 * @param {string} name - Nom de la ville/lieu
 * @returns {Promise<Object|null>} Coordonnées ou null
 */
export async function geocodeLocation(name) {
  try {
    const results = await searchLocation(name)
    if (results && results.length > 0) {
      return {
        name: results[0].name.split(',')[0],
        fullName: results[0].name,
        lat: results[0].lat,
        lng: results[0].lng || results[0].lon, // Support both lng and lon (OSRM uses lon)
      }
    }
    return null
  } catch (error) {
    console.error('Erreur de géocodage:', error)
    return null
  }
}

/**
 * Recherche les spots sur une direction
 * @param {string} query - Requête "Paris -> Lyon" ou coordonnées directes
 * @param {Object} options - Options de recherche
 * @returns {Promise<Object>} Résultats de recherche
 */
export async function searchByDirection(query, options = {}) {
  const {
    maxDistanceKm = 15,
    minRating = 0,
    sortBy = 'route', // 'route', 'rating', 'wait'
    limit = 50,
  } = options

  routeSearchState.isSearching = true

  try {
    // Parser la requête
    const parsed = parseDirectionQuery(query)
    if (!parsed) {
      throw new Error('Format de recherche invalide. Utilisez "Paris -> Lyon"')
    }

    // Géocoder l'origine
    const origin = await geocodeLocation(parsed.origin)
    if (!origin) {
      throw new Error(`Lieu non trouvé: ${parsed.origin}`)
    }

    // Géocoder la destination
    const destination = await geocodeLocation(parsed.destination)
    if (!destination) {
      throw new Error(`Lieu non trouvé: ${parsed.destination}`)
    }

    // Géocoder les étapes intermédiaires
    const waypoints = []
    for (const wp of parsed.waypoints) {
      const location = await geocodeLocation(wp)
      if (location) {
        waypoints.push(location)
      }
    }

    // Construire la liste des points pour le calcul de route
    const allPoints = [origin, ...waypoints, destination]

    // Valider le nombre de destinations (origine + waypoints + destination)
    if (allPoints.length > MAX_DESTINATIONS) {
      throw new Error(`Maximum ${MAX_DESTINATIONS} destinations autorisées`)
    }

    // Obtenir la route via OSRM
    const route = await getRoute(allPoints)
    if (!route || !route.geometry) {
      throw new Error('Impossible de calculer l\'itinéraire')
    }

    // Récupérer les spots
    const spots = getState().spots || sampleSpots

    // Trouver les spots proches de la route
    const spotsOnRoute = []

    for (const spot of spots) {
      if (!spot.coordinates) continue
      if (spot.globalRating < minRating) continue

      const proximity = getPointProximityToRoute(
        spot.coordinates,
        route.geometry,
        maxDistanceKm
      )

      if (proximity) {
        spotsOnRoute.push({
          ...spot,
          distanceFromRoute: proximity.distance,
          routeProgress: proximity.routeProgress,
        })
      }
    }

    // Trier les spots
    switch (sortBy) {
      case 'rating':
        spotsOnRoute.sort((a, b) => b.globalRating - a.globalRating)
        break
      case 'wait':
        spotsOnRoute.sort((a, b) => (a.avgWaitTime || 999) - (b.avgWaitTime || 999))
        break
      case 'route':
      default:
        spotsOnRoute.sort((a, b) => a.routeProgress - b.routeProgress)
        break
    }

    // Limiter les résultats
    const limitedSpots = spotsOnRoute.slice(0, limit)

    // Construire le résultat
    const result = {
      id: `search_${Date.now()}`,
      query,
      origin,
      destination,
      waypoints,
      route: {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        distanceFormatted: formatDistance(route.distance),
        durationFormatted: formatDuration(route.duration),
      },
      spots: limitedSpots,
      totalSpots: spotsOnRoute.length,
      searchedAt: new Date().toISOString(),
    }

    // Mettre à jour l'état
    routeSearchState.origin = origin
    routeSearchState.destination = destination
    routeSearchState.waypoints = waypoints
    routeSearchState.searchResults = result
    routeSearchState.lastSearch = query
    routeSearchState.isSearching = false

    // Mettre à jour l'état global pour l'UI
    setState({
      tripFrom: origin.name,
      tripTo: destination.name,
      tripResults: result,
    })

    return result

  } catch (error) {
    routeSearchState.isSearching = false
    console.error('Erreur de recherche par direction:', error)
    throw error
  }
}

/**
 * Recherche directe avec coordonnées
 * @param {Object} origin - { lat, lng, name }
 * @param {Object} destination - { lat, lng, name }
 * @param {Array} waypoints - Étapes intermédiaires
 * @param {Object} options - Options de recherche
 * @returns {Promise<Object>} Résultats
 */
export async function searchByCoordinates(origin, destination, waypoints = [], options = {}) {
  const {
    maxDistanceKm = 15,
    minRating = 0,
    sortBy = 'route',
    limit = 50,
  } = options

  if (!origin || !destination) {
    throw new Error('Origine et destination requises')
  }

  if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
    throw new Error('Coordonnées invalides')
  }

  routeSearchState.isSearching = true

  try {
    // Construire la liste des points
    const allPoints = [origin, ...waypoints, destination]

    // Valider le nombre de destinations
    if (allPoints.length > MAX_DESTINATIONS) {
      throw new Error(`Maximum ${MAX_DESTINATIONS} destinations autorisées`)
    }

    // Obtenir la route
    const route = await getRoute(allPoints)
    if (!route || !route.geometry) {
      throw new Error('Impossible de calculer l\'itinéraire')
    }

    // Récupérer les spots
    const spots = getState().spots || sampleSpots

    // Trouver les spots proches
    const spotsOnRoute = []

    for (const spot of spots) {
      if (!spot.coordinates) continue
      if (spot.globalRating < minRating) continue

      const proximity = getPointProximityToRoute(
        spot.coordinates,
        route.geometry,
        maxDistanceKm
      )

      if (proximity) {
        spotsOnRoute.push({
          ...spot,
          distanceFromRoute: proximity.distance,
          routeProgress: proximity.routeProgress,
        })
      }
    }

    // Trier
    switch (sortBy) {
      case 'rating':
        spotsOnRoute.sort((a, b) => b.globalRating - a.globalRating)
        break
      case 'wait':
        spotsOnRoute.sort((a, b) => (a.avgWaitTime || 999) - (b.avgWaitTime || 999))
        break
      default:
        spotsOnRoute.sort((a, b) => a.routeProgress - b.routeProgress)
        break
    }

    const limitedSpots = spotsOnRoute.slice(0, limit)

    const result = {
      id: `search_${Date.now()}`,
      origin,
      destination,
      waypoints,
      route: {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        distanceFormatted: formatDistance(route.distance),
        durationFormatted: formatDuration(route.duration),
      },
      spots: limitedSpots,
      totalSpots: spotsOnRoute.length,
      searchedAt: new Date().toISOString(),
    }

    routeSearchState.origin = origin
    routeSearchState.destination = destination
    routeSearchState.waypoints = waypoints
    routeSearchState.searchResults = result
    routeSearchState.isSearching = false

    setState({
      tripFrom: origin.name || 'Origine',
      tripTo: destination.name || 'Destination',
      tripResults: result,
    })

    return result

  } catch (error) {
    routeSearchState.isSearching = false
    throw error
  }
}

/**
 * Ajoute une étape intermédiaire
 * @param {Object} waypoint - { lat, lng, name }
 * @param {number} index - Position (optionnel, ajoute à la fin si non spécifié)
 */
export function addWaypoint(waypoint, index = -1) {
  if (!waypoint || !waypoint.lat || !waypoint.lng) {
    throw new Error('Étape invalide')
  }

  const waypoints = [...routeSearchState.waypoints]

  if (index >= 0 && index <= waypoints.length) {
    waypoints.splice(index, 0, waypoint)
  } else {
    waypoints.push(waypoint)
  }

  routeSearchState.waypoints = waypoints
  return waypoints
}

/**
 * Supprime une étape intermédiaire
 * @param {number} index - Index de l'étape à supprimer
 */
export function removeWaypoint(index) {
  if (index < 0 || index >= routeSearchState.waypoints.length) {
    throw new Error('Index invalide')
  }

  routeSearchState.waypoints = routeSearchState.waypoints.filter((_, i) => i !== index)
  return routeSearchState.waypoints
}

/**
 * Réordonne les étapes
 * @param {number} fromIndex - Index source
 * @param {number} toIndex - Index destination
 */
export function reorderWaypoints(fromIndex, toIndex) {
  const waypoints = [...routeSearchState.waypoints]

  if (fromIndex < 0 || fromIndex >= waypoints.length) {
    throw new Error('Index source invalide')
  }
  if (toIndex < 0 || toIndex >= waypoints.length) {
    throw new Error('Index destination invalide')
  }

  const [removed] = waypoints.splice(fromIndex, 1)
  waypoints.splice(toIndex, 0, removed)

  routeSearchState.waypoints = waypoints
  return waypoints
}

/**
 * Définit l'origine de la recherche
 * @param {Object} origin - { lat, lng, name }
 */
export function setOrigin(origin) {
  routeSearchState.origin = origin
}

/**
 * Définit la destination de la recherche
 * @param {Object} destination - { lat, lng, name }
 */
export function setDestination(destination) {
  routeSearchState.destination = destination
}

/**
 * Inverse l'origine et la destination
 */
export function swapOriginDestination() {
  const temp = routeSearchState.origin
  routeSearchState.origin = routeSearchState.destination
  routeSearchState.destination = temp

  // Inverser aussi les waypoints
  routeSearchState.waypoints = routeSearchState.waypoints.reverse()

  return {
    origin: routeSearchState.origin,
    destination: routeSearchState.destination,
    waypoints: routeSearchState.waypoints,
  }
}

/**
 * Efface la recherche actuelle
 */
export function clearRouteSearch() {
  routeSearchState.origin = null
  routeSearchState.destination = null
  routeSearchState.waypoints = []
  routeSearchState.searchResults = null
  routeSearchState.lastSearch = null
  routeSearchState.isSearching = false

  setState({
    tripFrom: '',
    tripTo: '',
    tripResults: null,
  })
}

/**
 * Sauvegarde un parcours avec ses destinations et spots
 * @param {string} name - Nom du parcours
 * @param {Array} destinations - Liste des destinations [origin, ...waypoints, destination]
 * @param {Array} spots - Liste des spots trouvés sur le parcours
 * @param {Object} routeData - Données de la route (geometry, distance, duration)
 * @returns {Object} Parcours sauvegardé
 */
export function saveRoute(name, destinations = null, spots = null, routeData = null) {
  // Si pas de destinations fournies, utiliser la recherche actuelle
  if (!destinations) {
    const searchResult = routeSearchState.searchResults
    if (!searchResult) {
      throw new Error('Aucun résultat de recherche à sauvegarder')
    }

    name = name || `${searchResult.origin.name} → ${searchResult.destination.name}`
    destinations = [searchResult.origin, ...searchResult.waypoints, searchResult.destination]
    spots = searchResult.spots
    routeData = searchResult.route
  }

  // Valider le nombre de destinations
  if (destinations.length > MAX_DESTINATIONS) {
    throw new Error(`Maximum ${MAX_DESTINATIONS} destinations autorisées`)
  }

  if (destinations.length < 2) {
    throw new Error('Au moins une origine et une destination sont requises')
  }

  // Charger les parcours existants
  const savedRoutes = loadSavedRoutesFromStorage()

  // Créer le parcours avec visibilité pour chaque spot
  const route = {
    id: `route_${Date.now()}`,
    name: name || `${destinations[0].name} → ${destinations[destinations.length - 1].name}`,
    destinations: destinations.map(d => ({
      lat: d.lat,
      lng: d.lng,
      name: d.name,
      fullName: d.fullName || d.name,
    })),
    spots: (spots || []).map(s => ({
      id: s.id,
      from: s.from,
      to: s.to,
      coordinates: s.coordinates,
      globalRating: s.globalRating,
      avgWaitTime: s.avgWaitTime,
      distanceFromRoute: s.distanceFromRoute,
      routeProgress: s.routeProgress,
      visible: true, // Par défaut, tous les spots sont visibles
    })),
    route: routeData ? {
      geometry: routeData.geometry,
      distance: routeData.distance,
      duration: routeData.duration,
      distanceFormatted: routeData.distanceFormatted,
      durationFormatted: routeData.durationFormatted,
    } : null,
    createdAt: new Date().toISOString(),
  }

  // Vérifier si déjà sauvegardé (même origine, destination et nombre de waypoints)
  const existing = savedRoutes.find(r => {
    if (r.destinations.length !== route.destinations.length) return false
    const firstMatch = r.destinations[0].name === route.destinations[0].name
    const lastMatch = r.destinations[r.destinations.length - 1].name === route.destinations[route.destinations.length - 1].name
    return firstMatch && lastMatch
  })

  if (existing) {
    showToast('Ce parcours est déjà sauvegardé', 'info')
    return existing
  }

  // Ajouter le nouveau parcours
  savedRoutes.push(route)
  saveSavedRoutesToStorage(savedRoutes)

  // Mettre à jour l'état local et global
  routeSearchState.savedRoutes = savedRoutes
  const state = getState()
  setState({
    savedTrips: [...(state.savedTrips || []), {
      ...route,
      source: 'routeSearch',
      origin: route.destinations[0],
      destination: route.destinations[route.destinations.length - 1],
      waypoints: route.destinations.slice(1, -1),
      totalSpots: route.spots.length,
    }],
  })

  showToast('Parcours enregistré !', 'success')
  return route
}

/**
 * Récupère les parcours sauvegardés
 * @returns {Array} Liste des parcours
 */
export function getSavedRoutes() {
  const routes = loadSavedRoutesFromStorage()
  routeSearchState.savedRoutes = routes
  return routes
}

/**
 * Récupère un parcours par son ID
 * @param {string} routeId - ID du parcours
 * @returns {Object} Parcours trouvé
 */
export function getRouteById(routeId) {
  const routes = loadSavedRoutesFromStorage()
  const route = routes.find(r => r.id === routeId)

  if (!route) {
    throw new Error('Parcours non trouvé')
  }

  return route
}

/**
 * Supprime un parcours sauvegardé
 * @param {string} routeId - ID du parcours
 */
export function deleteRoute(routeId) {
  const routes = loadSavedRoutesFromStorage()
  const filteredRoutes = routes.filter(r => r.id !== routeId)

  if (filteredRoutes.length === routes.length) {
    throw new Error('Parcours non trouvé')
  }

  saveSavedRoutesToStorage(filteredRoutes)
  routeSearchState.savedRoutes = filteredRoutes

  // Mettre à jour aussi l'état global
  const state = getState()
  setState({
    savedTrips: (state.savedTrips || []).filter(t => t.id !== routeId),
  })

  showToast('Parcours supprimé', 'info')
}

/**
 * Affiche ou masque un spot dans un parcours
 * @param {string} routeId - ID du parcours
 * @param {number} spotId - ID du spot
 * @returns {Object} Parcours mis à jour
 */
export function toggleSpotVisibility(routeId, spotId) {
  const routes = loadSavedRoutesFromStorage()
  const route = routes.find(r => r.id === routeId)

  if (!route) {
    throw new Error('Parcours non trouvé')
  }

  const spot = route.spots.find(s => s.id === spotId)

  if (!spot) {
    throw new Error('Spot non trouvé dans ce parcours')
  }

  // Inverser la visibilité
  spot.visible = !spot.visible

  saveSavedRoutesToStorage(routes)
  routeSearchState.savedRoutes = routes

  return route
}

/**
 * Récupère uniquement les spots visibles d'un parcours
 * @param {string} routeId - ID du parcours
 * @returns {Array} Liste des spots visibles
 */
export function getVisibleSpots(routeId) {
  const route = getRouteById(routeId)
  return route.spots.filter(s => s.visible !== false)
}

/**
 * Charge les parcours depuis le localStorage
 * @returns {Array} Liste des parcours
 */
function loadSavedRoutesFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const routes = JSON.parse(data)
    return Array.isArray(routes) ? routes : []
  } catch (error) {
    console.error('Erreur lors du chargement des parcours:', error)
    return []
  }
}

/**
 * Sauvegarde les parcours dans le localStorage
 * @param {Array} routes - Liste des parcours
 */
function saveSavedRoutesToStorage(routes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routes))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des parcours:', error)
    throw new Error('Impossible de sauvegarder le parcours')
  }
}

/**
 * Charge un parcours sauvegardé dans la recherche
 * @param {string} routeId - ID du parcours
 * @returns {Object} Données du parcours
 */
export function loadSavedRoute(routeId) {
  const route = getRouteById(routeId)

  // Reconstruire l'état de recherche
  routeSearchState.origin = route.destinations[0]
  routeSearchState.destination = route.destinations[route.destinations.length - 1]
  routeSearchState.waypoints = route.destinations.slice(1, -1)
  routeSearchState.searchResults = {
    id: route.id,
    origin: route.destinations[0],
    destination: route.destinations[route.destinations.length - 1],
    waypoints: route.destinations.slice(1, -1),
    route: route.route,
    spots: route.spots,
    totalSpots: route.spots.length,
    searchedAt: new Date().toISOString(),
  }

  setState({
    tripFrom: route.destinations[0].name,
    tripTo: route.destinations[route.destinations.length - 1].name,
    tripResults: routeSearchState.searchResults,
  })

  return route
}

/**
 * Génère le HTML pour l'UI de recherche par direction
 * @returns {string} HTML du composant
 */
export function renderRouteSearchUI() {
  const state = routeSearchState

  return `
    <div class="route-search-container p-4 bg-dark-secondary rounded-xl">
      <h3 class="text-lg font-bold text-white mb-4">
        <i class="fas fa-route mr-2 text-primary-500"></i>
        Recherche par direction
      </h3>

      <!-- Champ de recherche rapide -->
      <div class="mb-4">
        <div class="relative">
          <input
            type="text"
            id="route-search-input"
            placeholder="Ex: Paris → Lyon ou Paris - Lyon"
            class="w-full px-4 py-3 bg-dark-primary text-white rounded-lg border border-dark-accent focus:border-primary-500 focus:outline-none"
            value="${state.lastSearch || ''}"
          />
          <button
            onclick="window.executeRouteSearch()"
            class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <i class="fas fa-search"></i>
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-1">
          Utilisez → ou - pour séparer les villes. Ajoutez des étapes: Paris → Dijon → Lyon
        </p>
      </div>

      <!-- Ou recherche détaillée -->
      <div class="border-t border-dark-accent pt-4">
        <div class="grid grid-cols-1 gap-3">
          <!-- Origine -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
              <i class="fas fa-play text-xs"></i>
            </div>
            <input
              type="text"
              id="route-origin"
              placeholder="Départ"
              class="flex-1 px-3 py-2 bg-dark-primary text-white rounded-lg border border-dark-accent focus:border-primary-500 focus:outline-none"
              value="${state.origin?.name || ''}"
            />
          </div>

          <!-- Étapes intermédiaires -->
          <div id="waypoints-container" class="space-y-2">
            ${state.waypoints.map((wp, i) => `
              <div class="flex items-center gap-2 ml-4">
                <div class="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-xs">
                  ${i + 1}
                </div>
                <input
                  type="text"
                  class="flex-1 px-3 py-2 bg-dark-primary text-white rounded-lg border border-dark-accent"
                  value="${wp.name || ''}"
                  readonly
                />
                <button
                  onclick="window.removeRouteWaypoint(${i})"
                  class="p-2 text-red-400 hover:text-red-500"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <!-- Bouton ajouter étape -->
          <button
            onclick="window.addRouteWaypoint()"
            class="ml-4 px-3 py-2 border border-dashed border-dark-accent text-gray-400 rounded-lg hover:border-primary-500 hover:text-primary-500 transition-colors text-sm"
          >
            <i class="fas fa-plus mr-2"></i>Ajouter une étape
          </button>

          <!-- Destination -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
              <i class="fas fa-flag-checkered text-xs"></i>
            </div>
            <input
              type="text"
              id="route-destination"
              placeholder="Arrivée"
              class="flex-1 px-3 py-2 bg-dark-primary text-white rounded-lg border border-dark-accent focus:border-primary-500 focus:outline-none"
              value="${state.destination?.name || ''}"
            />
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex gap-2 mt-4">
          <button
            onclick="window.swapRouteDirection()"
            class="p-2 bg-dark-primary text-white rounded-lg hover:bg-dark-accent transition-colors"
            title="Inverser origine/destination"
          >
            <i class="fas fa-exchange-alt"></i>
          </button>
          <button
            onclick="window.searchRouteByFields()"
            class="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            <i class="fas fa-search mr-2"></i>Rechercher
          </button>
          <button
            onclick="window.clearRouteSearch()"
            class="p-2 bg-dark-primary text-gray-400 rounded-lg hover:bg-dark-accent hover:text-white transition-colors"
            title="Effacer"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>

      <!-- Résultats -->
      ${state.searchResults ? renderRouteSearchResults(state.searchResults) : ''}
    </div>
  `
}

/**
 * Génère le HTML des résultats de recherche
 * @param {Object} results - Résultats de recherche
 * @returns {string} HTML
 */
export function renderRouteSearchResults(results) {
  if (!results) return ''

  return `
    <div class="mt-6 border-t border-dark-accent pt-4">
      <!-- En-tête résultats -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h4 class="text-white font-medium">
            ${results.origin.name} → ${results.destination.name}
          </h4>
          <p class="text-sm text-gray-400">
            ${results.route.distanceFormatted} • ${results.route.durationFormatted}
            ${results.waypoints.length > 0 ? ` • ${results.waypoints.length} étape(s)` : ''}
          </p>
        </div>
        <button
          onclick="window.saveCurrentRoute()"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        >
          <i class="fas fa-save mr-2"></i>Enregistrer ce voyage
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-dark-primary p-3 rounded-lg text-center">
          <div class="text-2xl font-bold text-primary-500">${results.spots.length}</div>
          <div class="text-xs text-gray-400">Spots trouvés</div>
        </div>
        <div class="bg-dark-primary p-3 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-500">
            ${results.spots.length > 0 ? results.spots[0].globalRating?.toFixed(1) || '-' : '-'}
          </div>
          <div class="text-xs text-gray-400">Meilleure note</div>
        </div>
        <div class="bg-dark-primary p-3 rounded-lg text-center">
          <div class="text-2xl font-bold text-yellow-500">
            ${results.spots.length > 0
              ? Math.min(...results.spots.map(s => s.avgWaitTime || 999))
              : '-'}
          </div>
          <div class="text-xs text-gray-400">Min. attente (min)</div>
        </div>
      </div>

      <!-- Liste des spots -->
      <div class="space-y-2 max-h-96 overflow-y-auto">
        ${results.spots.map((spot, index) => `
          <div
            class="bg-dark-primary p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-dark-accent transition-colors"
            onclick="window.selectSpotFromRoute(${spot.id})"
          >
            <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
              ${index + 1}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-medium truncate">${spot.from} → ${spot.to}</div>
              <div class="text-xs text-gray-400 flex items-center gap-2">
                <span><i class="fas fa-star text-yellow-500"></i> ${spot.globalRating?.toFixed(1) || '-'}</span>
                <span><i class="fas fa-clock"></i> ${spot.avgWaitTime || '?'} min</span>
                <span class="text-primary-400">${spot.distanceFromRoute?.toFixed(1) || '?'} km du trajet</span>
              </div>
            </div>
            <i class="fas fa-chevron-right text-gray-500"></i>
          </div>
        `).join('')}

        ${results.spots.length === 0 ? `
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-route text-4xl mb-2 opacity-50"></i>
            <p>Aucun spot trouvé sur ce trajet</p>
            <p class="text-sm">Essayez d'élargir la zone de recherche</p>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

/**
 * Initialise les handlers globaux pour l'UI
 */
export function initRouteSearchHandlers() {
  // Recherche rapide
  window.executeRouteSearch = async () => {
    const input = document.getElementById('route-search-input')
    if (!input || !input.value.trim()) {
      showToast('Entrez une recherche (ex: Paris → Lyon)', 'error')
      return
    }

    try {
      showToast('Recherche en cours...', 'info')
      await searchByDirection(input.value.trim())
      showToast('Recherche terminée !', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  // Recherche par champs
  window.searchRouteByFields = async () => {
    const originInput = document.getElementById('route-origin')
    const destInput = document.getElementById('route-destination')

    if (!originInput?.value.trim() || !destInput?.value.trim()) {
      showToast('Entrez un départ et une arrivée', 'error')
      return
    }

    const query = [
      originInput.value.trim(),
      ...routeSearchState.waypoints.map(w => w.name),
      destInput.value.trim(),
    ].join(' → ')

    try {
      showToast('Recherche en cours...', 'info')
      await searchByDirection(query)
      showToast('Recherche terminée !', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  // Inverser direction
  window.swapRouteDirection = () => {
    swapOriginDestination()
    // Rafraîchir l'UI
    const container = document.querySelector('.route-search-container')
    if (container) {
      container.outerHTML = renderRouteSearchUI()
    }
  }

  // Effacer
  window.clearRouteSearch = () => {
    clearRouteSearch()
    const container = document.querySelector('.route-search-container')
    if (container) {
      container.outerHTML = renderRouteSearchUI()
    }
  }

  // Ajouter étape
  window.addRouteWaypoint = async () => {
    const name = prompt('Nom de la ville étape:')
    if (!name || !name.trim()) return

    try {
      const location = await geocodeLocation(name.trim())
      if (!location) {
        showToast(`Lieu non trouvé: ${name}`, 'error')
        return
      }
      addWaypoint(location)
      // Rafraîchir l'UI
      const container = document.querySelector('.route-search-container')
      if (container) {
        container.outerHTML = renderRouteSearchUI()
      }
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  // Supprimer étape
  window.removeRouteWaypoint = (index) => {
    removeWaypoint(index)
    const container = document.querySelector('.route-search-container')
    if (container) {
      container.outerHTML = renderRouteSearchUI()
    }
  }

  // Sauvegarder
  window.saveCurrentRoute = () => {
    try {
      saveRoute()
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  // Sélectionner un spot
  window.selectSpotFromRoute = (spotId) => {
    const spots = getState().spots || sampleSpots
    const spot = spots.find(s => s.id === spotId)
    if (spot) {
      setState({ selectedSpot: spot })
    }
  }
}

// Export par défaut
export default {
  // Constants
  MAX_DESTINATIONS,

  // State
  getRouteSearchState,

  // Parsing
  parseDirectionQuery,

  // Search
  searchByDirection,
  searchByCoordinates,
  geocodeLocation,

  // Waypoints
  addWaypoint,
  removeWaypoint,
  reorderWaypoints,

  // Origin/Destination
  setOrigin,
  setDestination,
  swapOriginDestination,

  // Clear
  clearRouteSearch,

  // Save/Load
  saveRoute,
  getSavedRoutes,
  getRouteById,
  deleteRoute,
  loadSavedRoute,
  toggleSpotVisibility,
  getVisibleSpots,

  // Utils
  haversineDistance,

  // UI
  renderRouteSearchUI,
  renderRouteSearchResults,
  initRouteSearchHandlers,
}
