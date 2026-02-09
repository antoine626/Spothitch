/**
 * Hostel Recommendations Service
 * Allows users to recommend hostels near spots/cities with affiliate links
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'
import { t } from '../i18n/index.js'

// Affiliate IDs - TODO: Replace with real affiliate IDs when available
const HOSTELWORLD_AFFILIATE_ID = 'SPOTHITCH_HW_ID'
const BOOKING_AFFILIATE_ID = 'SPOTHITCH_BOOKING_AID'

const STORAGE_KEY = 'spothitch_hostel_recs'
const UPVOTES_KEY = 'spothitch_hostel_upvotes'

/**
 * Get all recommendations from storage
 * @returns {Array} All hostel recommendations
 */
function getAllRecommendations() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * Save recommendations to storage
 * @param {Array} recommendations - Recommendations to save
 */
function saveRecommendations(recommendations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendations))
}

/**
 * Get user's upvoted hostels
 * @returns {Array} Array of upvoted hostel keys
 */
function getUserUpvotes() {
  const state = getState()
  const userId = state.user?.uid || 'anonymous'
  const data = localStorage.getItem(UPVOTES_KEY)
  const upvotes = data ? JSON.parse(data) : {}
  return upvotes[userId] || []
}

/**
 * Save user's upvotes
 * @param {Array} upvotes - Array of upvoted hostel keys
 */
function saveUserUpvotes(upvotes) {
  const state = getState()
  const userId = state.user?.uid || 'anonymous'
  const data = localStorage.getItem(UPVOTES_KEY)
  const allUpvotes = data ? JSON.parse(data) : {}
  allUpvotes[userId] = upvotes
  localStorage.setItem(UPVOTES_KEY, JSON.stringify(allUpvotes))
}

/**
 * Get hostel key for duplicate detection
 * @param {string} city - City name
 * @param {string} hostelName - Hostel name
 * @returns {string} Unique key
 */
function getHostelKey(city, hostelName) {
  return `${city.toLowerCase().trim()}_${hostelName.toLowerCase().trim()}`
}

/**
 * Add a hostel recommendation
 * @param {string} cityName - City name
 * @param {string} hostelName - Hostel name
 * @param {string} category - Category: 'party' | 'cozy' | 'budget'
 * @returns {Promise<boolean>} Success status
 */
export async function addRecommendation(cityName, hostelName, category) {
  if (!cityName || !hostelName || !category) {
    showToast(t('hostelErrorMissing') || 'Veuillez remplir tous les champs', 'error')
    return false
  }

  const validCategories = ['party', 'cozy', 'budget']
  if (!validCategories.includes(category)) {
    showToast('Catégorie invalide', 'error')
    return false
  }

  const state = getState()
  const recommendations = getAllRecommendations()
  const hostelKey = getHostelKey(cityName, hostelName)

  // Check for duplicate
  const exists = recommendations.some(rec =>
    getHostelKey(rec.city, rec.hostelName) === hostelKey
  )

  if (exists) {
    showToast(t('hostelAlreadyExists') || 'Cette auberge a déjà été recommandée', 'warning')
    return false
  }

  const newRecommendation = {
    city: cityName.trim(),
    hostelName: hostelName.trim(),
    category,
    userId: state.user?.uid || 'anonymous',
    timestamp: new Date().toISOString(),
    upvotes: 0,
    upvotedBy: []
  }

  // Save to localStorage first
  recommendations.push(newRecommendation)
  saveRecommendations(recommendations)

  // Also save to Firestore
  try {
    const { db } = await import('./firebase.js')
    const { collection, addDoc } = await import('firebase/firestore')
    await addDoc(collection(db, 'hostel_recs'), newRecommendation)
    console.log('Hostel recommendation saved to Firestore')
  } catch (error) {
    console.warn('Could not save hostel recommendation to Firestore:', error)
  }

  showToast(t('hostelAdded') || 'Auberge recommandée !', 'success')
  return true
}

/**
 * Get recommendations for a city, grouped by category
 * @param {string} cityName - City name
 * @returns {Promise<Object>} Recommendations grouped by category
 */
export async function getRecommendations(cityName) {
  // Try to get from Firestore first
  let firestoreRecs = []
  try {
    const { db } = await import('./firebase.js')
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const q = query(
      collection(db, 'hostel_recs'),
      where('city', '==', cityName.trim())
    )
    const snapshot = await getDocs(q)
    firestoreRecs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log(`Loaded ${firestoreRecs.length} hostel recs from Firestore`)
  } catch (error) {
    console.warn('Could not load hostel recommendations from Firestore:', error)
  }

  // Fallback to localStorage
  const localRecs = getAllRecommendations()
  const cityLocalRecs = localRecs.filter(rec =>
    rec.city.toLowerCase() === cityName.toLowerCase()
  )

  // Merge Firestore and local, preferring Firestore
  const allRecs = [...firestoreRecs, ...cityLocalRecs]
  const uniqueRecs = []
  const seen = new Set()

  allRecs.forEach(rec => {
    const key = getHostelKey(rec.city, rec.hostelName)
    if (!seen.has(key)) {
      seen.add(key)
      uniqueRecs.push(rec)
    }
  })

  const grouped = {
    party: [],
    cozy: [],
    budget: []
  }

  uniqueRecs.forEach(rec => {
    if (grouped[rec.category]) {
      grouped[rec.category].push(rec)
    }
  })

  // Sort by upvotes (desc) and take top 5 per category
  Object.keys(grouped).forEach(category => {
    grouped[category] = grouped[category]
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      .slice(0, 5)
  })

  return grouped
}

/**
 * Upvote a hostel recommendation
 * @param {string} city - City name
 * @param {string} hostelName - Hostel name
 * @returns {Promise<boolean>} Success status
 */
export async function upvoteRecommendation(city, hostelName) {
  const recommendations = getAllRecommendations()
  const hostelKey = getHostelKey(city, hostelName)
  const userUpvotes = getUserUpvotes()
  const state = getState()
  const userId = state.user?.uid || 'anonymous'

  // Check if user already upvoted
  if (userUpvotes.includes(hostelKey)) {
    showToast(t('hostelAlreadyUpvoted') || 'Vous avez déjà voté pour cette auberge', 'warning')
    return false
  }

  // Find and update recommendation in localStorage
  const rec = recommendations.find(r =>
    getHostelKey(r.city, r.hostelName) === hostelKey
  )

  if (!rec) {
    showToast('Auberge non trouvée', 'error')
    return false
  }

  rec.upvotes = (rec.upvotes || 0) + 1
  saveRecommendations(recommendations)

  // Save user upvote
  userUpvotes.push(hostelKey)
  saveUserUpvotes(userUpvotes)

  // Also update in Firestore
  try {
    const { db } = await import('./firebase.js')
    const { collection, query, where, getDocs, updateDoc, doc, increment, arrayUnion } = await import('firebase/firestore')

    const q = query(
      collection(db, 'hostel_recs'),
      where('city', '==', city.trim()),
      where('hostelName', '==', hostelName.trim())
    )
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const docRef = doc(db, 'hostel_recs', snapshot.docs[0].id)
      await updateDoc(docRef, {
        upvotes: increment(1),
        upvotedBy: arrayUnion(userId)
      })
      console.log('Hostel upvote saved to Firestore')
    }
  } catch (error) {
    console.warn('Could not save upvote to Firestore:', error)
  }

  showToast(t('hostelUpvoted') || 'Vote ajouté !', 'success')
  return true
}

/**
 * Get booking affiliate links for a hostel
 * @param {string} hostelName - Hostel name
 * @param {string} cityName - City name
 * @returns {Object} Object with affiliate URLs
 */
export function getBookingLinks(hostelName, cityName) {
  const query = encodeURIComponent(`${hostelName} ${cityName}`)

  return {
    hostelworld: `https://www.hostelworld.com/s?q=${query}&affiliate=${HOSTELWORLD_AFFILIATE_ID}`,
    booking: `https://www.booking.com/searchresults.html?ss=${query}&aid=${BOOKING_AFFILIATE_ID}`
  }
}

/**
 * Render hostel section HTML
 * @param {string} cityName - City name
 * @returns {Promise<string>} HTML string
 */
export async function renderHostelSection(cityName) {
  if (!cityName) return ''

  const recommendations = await getRecommendations(cityName)
  const totalCount = recommendations.party.length + recommendations.cozy.length + recommendations.budget.length

  if (totalCount === 0) {
    return `
      <div class="card p-4 mt-4">
        <h3 class="font-bold text-lg flex items-center gap-2 mb-3">
          🏠 ${t('hostelRecommendations') || 'Auberges recommandées'} à ${cityName}
        </h3>
        <div class="text-center py-6 text-slate-400">
          <p class="mb-3">Aucune auberge recommandée pour l'instant</p>
          <button onclick="openAddHostel('${cityName}')" class="btn-primary">
            <i class="fas fa-plus mr-2" aria-hidden="true"></i>
            ${t('hostelRecommend') || 'Recommander une auberge'}
          </button>
        </div>
      </div>
    `
  }

  return `
    <div class="card p-4 mt-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg flex items-center gap-2">
          🏠 ${t('hostelRecommendations') || 'Auberges recommandées'} à ${cityName}
        </h3>
        <button onclick="openAddHostel('${cityName}')" class="text-sm text-primary-400 hover:text-primary-300">
          <i class="fas fa-plus mr-1" aria-hidden="true"></i>
          Ajouter
        </button>
      </div>

      <!-- Category Tabs -->
      <div class="flex gap-2 mb-4" id="hostel-tabs">
        <button
          onclick="switchHostelCategory('party', '${cityName}')"
          class="hostel-tab flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-primary-500 text-white"
          data-category="party"
        >
          🎉 ${t('hostelParty') || 'Festif'}
          ${recommendations.party.length > 0 ? `<span class="ml-1">(${recommendations.party.length})</span>` : ''}
        </button>
        <button
          onclick="switchHostelCategory('cozy', '${cityName}')"
          class="hostel-tab flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5"
          data-category="cozy"
        >
          🛋️ ${t('hostelCozy') || 'Cozy'}
          ${recommendations.cozy.length > 0 ? `<span class="ml-1">(${recommendations.cozy.length})</span>` : ''}
        </button>
        <button
          onclick="switchHostelCategory('budget', '${cityName}')"
          class="hostel-tab flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5"
          data-category="budget"
        >
          💰 ${t('hostelBudget') || 'Pas cher'}
          ${recommendations.budget.length > 0 ? `<span class="ml-1">(${recommendations.budget.length})</span>` : ''}
        </button>
      </div>

      <!-- Hostels List -->
      <div id="hostels-list">
        ${renderHostelList(recommendations.party, cityName)}
      </div>
    </div>
  `
}

/**
 * Render list of hostels for a category
 * @param {Array} hostels - Array of hostel recommendations
 * @param {string} cityName - City name
 * @returns {string} HTML string
 */
function renderHostelList(hostels, cityName) {
  if (hostels.length === 0) {
    return `
      <div class="text-center py-6 text-slate-400">
        <p>Aucune auberge dans cette catégorie</p>
      </div>
    `
  }

  return `
    <div class="space-y-3">
      ${hostels.map(hostel => renderHostelCard(hostel, cityName)).join('')}
    </div>
  `
}

/**
 * Render a single hostel card
 * @param {Object} hostel - Hostel recommendation
 * @param {string} cityName - City name
 * @returns {string} HTML string
 */
function renderHostelCard(hostel, cityName) {
  const links = getBookingLinks(hostel.hostelName, cityName)
  const userUpvotes = getUserUpvotes()
  const hostelKey = getHostelKey(hostel.city, hostel.hostelName)
  const hasUpvoted = userUpvotes.includes(hostelKey)

  return `
    <div class="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <h4 class="font-semibold">${hostel.hostelName}</h4>
          <div class="flex items-center gap-2 mt-1">
            <button
              onclick="upvoteHostel('${hostel.city}', '${hostel.hostelName}')"
              class="flex items-center gap-1 text-sm ${hasUpvoted ? 'text-primary-400' : 'text-slate-400 hover:text-primary-400'} transition-all"
              ${hasUpvoted ? 'disabled' : ''}
            >
              <i class="fas fa-thumbs-up" aria-hidden="true"></i>
              <span>${hostel.upvotes || 0}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <a
          href="${links.hostelworld}"
          target="_blank"
          rel="noopener"
          class="flex-1 py-2 px-3 rounded-lg text-center text-sm font-medium text-white transition-all"
          style="background-color: #f47521"
          onmouseover="this.style.backgroundColor='#d86818'"
          onmouseout="this.style.backgroundColor='#f47521'"
        >
          Hostelworld
        </a>
        <a
          href="${links.booking}"
          target="_blank"
          rel="noopener"
          class="flex-1 py-2 px-3 rounded-lg text-center text-sm font-medium text-white transition-all"
          style="background-color: #003580"
          onmouseover="this.style.backgroundColor='#002a66'"
          onmouseout="this.style.backgroundColor='#003580'"
        >
          Booking
        </a>
      </div>
    </div>
  `
}

/**
 * Render add hostel form
 * @param {string} cityName - City name
 * @returns {string} HTML string
 */
export function renderAddHostelForm(cityName) {
  return `
    <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onclick="if(event.target === this) closeAddHostel()">
      <div class="card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">
            ${t('hostelRecommend') || 'Recommander une auberge'}
          </h3>
          <button onclick="closeAddHostel()" class="text-slate-400 hover:text-white">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <p class="text-sm text-slate-400 mb-4">
          à ${cityName}
        </p>

        <div class="space-y-4">
          <!-- Hostel Name -->
          <div>
            <label for="hostel-name" class="block text-sm text-slate-400 mb-1">
              Nom de l'auberge
            </label>
            <input
              type="text"
              id="hostel-name"
              placeholder="Ex: Generator Paris"
              class="input-field w-full"
              required
            />
          </div>

          <!-- Category Selection -->
          <div>
            <label class="block text-sm text-slate-400 mb-2">
              Catégorie
            </label>
            <div class="grid grid-cols-3 gap-2" id="category-selector">
              <button
                onclick="setHostelCategory('party')"
                class="category-btn py-3 px-2 rounded-lg text-center transition-all border border-white/10 hover:border-primary-500"
                data-category="party"
              >
                <div class="text-2xl mb-1">🎉</div>
                <div class="text-xs">Festif</div>
              </button>
              <button
                onclick="setHostelCategory('cozy')"
                class="category-btn py-3 px-2 rounded-lg text-center transition-all border border-white/10 hover:border-primary-500"
                data-category="cozy"
              >
                <div class="text-2xl mb-1">🛋️</div>
                <div class="text-xs">Cozy</div>
              </button>
              <button
                onclick="setHostelCategory('budget')"
                class="category-btn py-3 px-2 rounded-lg text-center transition-all border border-white/10 hover:border-primary-500"
                data-category="budget"
              >
                <div class="text-2xl mb-1">💰</div>
                <div class="text-xs">Pas cher</div>
              </button>
            </div>
            <input type="hidden" id="selected-category" value="" />
          </div>

          <!-- Submit Button -->
          <button
            onclick="submitHostelRec('${cityName}')"
            class="btn-primary w-full"
          >
            <i class="fas fa-check mr-2" aria-hidden="true"></i>
            Recommander
          </button>
        </div>
      </div>
    </div>
  `
}

/**
 * Switch hostel category tab
 * @param {string} category - Category to show
 * @param {string} cityName - City name
 */
export async function switchHostelCategory(category, cityName) {
  const recommendations = await getRecommendations(cityName)

  // Update tabs
  document.querySelectorAll('.hostel-tab').forEach(tab => {
    if (tab.dataset.category === category) {
      tab.className = 'hostel-tab flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all bg-primary-500 text-white'
    } else {
      tab.className = 'hostel-tab flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all text-slate-400 hover:text-white hover:bg-white/5'
    }
  })

  // Update list
  const listContainer = document.getElementById('hostels-list')
  if (listContainer) {
    listContainer.innerHTML = renderHostelList(recommendations[category], cityName)
  }
}

export default {
  addRecommendation,
  getRecommendations,
  upvoteRecommendation,
  getBookingLinks,
  renderHostelSection,
  renderAddHostelForm,
  switchHostelCategory
}
