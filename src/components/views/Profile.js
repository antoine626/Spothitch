/**
 * Profile View Component
 * Instagram-style profile with 3 sub-tabs: Profil, Progression, Réglages
 */

import { t } from '../../i18n/index.js'
import { renderDonationCard } from '../ui/DonationCard.js'
import { renderTrustScoreCard } from '../../services/trustScore.js'
import { icon } from '../../utils/icons.js'
import { getVipLevel, getLeague } from '../../data/vip-levels.js'
import { allBadges } from '../../data/badges.js'
import { allChallenges } from '../../data/challenges.js'

// ==================== LANGUAGE + COUNTRY MAPS ====================

const LANG_FLAG_MAP = {
  'Français': '🇫🇷', 'French': '🇫🇷',
  'English': '🇬🇧', 'Anglais': '🇬🇧',
  'Español': '🇪🇸', 'Spanish': '🇪🇸', 'Espagnol': '🇪🇸',
  'Deutsch': '🇩🇪', 'German': '🇩🇪', 'Allemand': '🇩🇪',
  'Português': '🇵🇹', 'Portuguese': '🇵🇹', 'Portugais': '🇵🇹',
  'Italiano': '🇮🇹', 'Italian': '🇮🇹', 'Italien': '🇮🇹',
  'Русский': '🇷🇺', 'Russian': '🇷🇺', 'Russe': '🇷🇺',
  'العربية': '🇸🇦', 'Arabic': '🇸🇦', 'Arabe': '🇸🇦',
  '中文': '🇨🇳', 'Chinese': '🇨🇳', 'Chinois': '🇨🇳',
  '日本語': '🇯🇵', 'Japanese': '🇯🇵', 'Japonais': '🇯🇵',
  'हिन्दी': '🇮🇳', 'Hindi': '🇮🇳',
  'Nederlands': '🇳🇱', 'Dutch': '🇳🇱', 'Néerlandais': '🇳🇱',
  'Polski': '🇵🇱', 'Polish': '🇵🇱', 'Polonais': '🇵🇱',
  'Română': '🇷🇴', 'Romanian': '🇷🇴', 'Roumain': '🇷🇴',
  'Türkçe': '🇹🇷', 'Turkish': '🇹🇷', 'Turc': '🇹🇷',
  'Svenska': '🇸🇪', 'Swedish': '🇸🇪', 'Suédois': '🇸🇪',
  'Norsk': '🇳🇴', 'Norwegian': '🇳🇴', 'Norvégien': '🇳🇴',
  'Dansk': '🇩🇰', 'Danish': '🇩🇰', 'Danois': '🇩🇰',
  'Suomi': '🇫🇮', 'Finnish': '🇫🇮', 'Finnois': '🇫🇮',
  'Čeština': '🇨🇿', 'Czech': '🇨🇿', 'Tchèque': '🇨🇿',
  'Magyar': '🇭🇺', 'Hungarian': '🇭🇺', 'Hongrois': '🇭🇺',
  'Ελληνικά': '🇬🇷', 'Greek': '🇬🇷', 'Grec': '🇬🇷',
  'Українська': '🇺🇦', 'Ukrainian': '🇺🇦', 'Ukrainien': '🇺🇦',
}

const COUNTRY_MAP = {
  'FR': { flag: '🇫🇷', name: 'France' }, 'DE': { flag: '🇩🇪', name: 'Allemagne' },
  'ES': { flag: '🇪🇸', name: 'Espagne' }, 'IT': { flag: '🇮🇹', name: 'Italie' },
  'PT': { flag: '🇵🇹', name: 'Portugal' }, 'GB': { flag: '🇬🇧', name: 'Royaume-Uni' },
  'BE': { flag: '🇧🇪', name: 'Belgique' }, 'NL': { flag: '🇳🇱', name: 'Pays-Bas' },
  'CH': { flag: '🇨🇭', name: 'Suisse' }, 'AT': { flag: '🇦🇹', name: 'Autriche' },
  'PL': { flag: '🇵🇱', name: 'Pologne' }, 'CZ': { flag: '🇨🇿', name: 'Tchéquie' },
  'HU': { flag: '🇭🇺', name: 'Hongrie' }, 'RO': { flag: '🇷🇴', name: 'Roumanie' },
  'SE': { flag: '🇸🇪', name: 'Suède' }, 'NO': { flag: '🇳🇴', name: 'Norvège' },
  'DK': { flag: '🇩🇰', name: 'Danemark' }, 'FI': { flag: '🇫🇮', name: 'Finlande' },
  'GR': { flag: '🇬🇷', name: 'Grèce' }, 'TR': { flag: '🇹🇷', name: 'Turquie' },
  'HR': { flag: '🇭🇷', name: 'Croatie' }, 'RS': { flag: '🇷🇸', name: 'Serbie' },
  'SK': { flag: '🇸🇰', name: 'Slovaquie' }, 'SI': { flag: '🇸🇮', name: 'Slovénie' },
  'BG': { flag: '🇧🇬', name: 'Bulgarie' }, 'UA': { flag: '🇺🇦', name: 'Ukraine' },
  'RU': { flag: '🇷🇺', name: 'Russie' }, 'MA': { flag: '🇲🇦', name: 'Maroc' },
  'US': { flag: '🇺🇸', name: 'États-Unis' }, 'CA': { flag: '🇨🇦', name: 'Canada' },
  'MX': { flag: '🇲🇽', name: 'Mexique' }, 'BR': { flag: '🇧🇷', name: 'Brésil' },
  'AR': { flag: '🇦🇷', name: 'Argentine' }, 'AU': { flag: '🇦🇺', name: 'Australie' },
  'JP': { flag: '🇯🇵', name: 'Japon' }, 'CN': { flag: '🇨🇳', name: 'Chine' },
  'IN': { flag: '🇮🇳', name: 'Inde' }, 'GE': { flag: '🇬🇪', name: 'Géorgie' },
  'AM': { flag: '🇦🇲', name: 'Arménie' }, 'AZ': { flag: '🇦🇿', name: 'Azerbaïdjan' },
  'EE': { flag: '🇪🇪', name: 'Estonie' }, 'LV': { flag: '🇱🇻', name: 'Lettonie' },
  'LT': { flag: '🇱🇹', name: 'Lituanie' },
}

function normalizeLangs(raw) {
  return raw.map(l =>
    typeof l === 'string'
      ? { name: l, flag: LANG_FLAG_MAP[l] || '🌐', level: 'courant' }
      : { name: l.name || '?', flag: l.flag || LANG_FLAG_MAP[l.name] || '🌐', level: l.level || 'courant' }
  )
}

// ==================== MAIN RENDER ====================

export function renderProfile(state) {
  const subTab = state.profileSubTab || 'profil'

  return `
    <div class="flex flex-col min-h-[calc(100vh-140px)] pb-28 overflow-x-hidden">
      ${renderProfileSubTabs(subTab)}
      <div class="p-4 space-y-4 flex-1">
        ${subTab === 'profil' ? renderProfilTab(state) : ''}
        ${subTab === 'progression' ? renderProgressionTab(state) : ''}
        ${subTab === 'reglages' ? `${renderReglagesTab(state)}${renderProfileFooter()}${renderVersionReset()}` : ''}
      </div>
    </div>
  `
}

// ==================== SUB-TABS BAR ====================

function renderProfileSubTabs(activeTab) {
  const tabs = [
    { id: 'profil', icon: 'user', label: t('profileTabProfil') || 'Profil' },
    { id: 'progression', icon: 'trending-up', label: t('profileTabProgression') || 'Progression' },
    { id: 'reglages', icon: 'settings', label: t('profileTabSettings') || 'Réglages' },
  ]
  return `
    <div class="flex bg-dark-secondary/50 border-b border-white/5">
      ${tabs.map(tab => `
        <button
          onclick="setProfileSubTab('${tab.id}')"
          class="flex-1 py-3 px-2 font-medium text-sm transition-all relative border-b-2 ${
            activeTab === tab.id
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }"
        >
          ${icon(tab.icon, 'w-4 h-4 mr-1 inline-block')}
          ${tab.label}
        </button>
      `).join('')}
    </div>
  `
}

// ==================== TAB 1: PROFIL (V2 — Voyageur Enrichi) ====================

function renderProfilTab(state) {
  // Detail views replace the normal profil content
  if (state.profileDetailView === 'spots') return renderMySpotsList(state)
  if (state.profileDetailView === 'validations') return renderMyValidationsList(state)
  if (state.profileDetailView === 'countries') return renderMyCountriesList(state)

  return `
    ${renderProfileHeader(state)}
    ${renderClickableStats(state)}
    ${renderBioCard(state)}
    ${renderLanguagesCard(state)}
    ${renderTrustScoreCard()}
    ${renderVerificationCard(state)}
    ${renderReferencesCard(state)}
    ${renderPublicTripsCard(state)}
    ${renderBadgesGrid(state)}
  `
}

function renderProfileHeader(state) {
  const level = state.level || 1
  const vipLevel = getVipLevel(state.points || 0)
  const verifiedLevel = state.verificationLevel || 0
  const verifiedBadge = verifiedLevel >= 2
    ? `<span class="text-emerald-400 text-xs font-semibold ml-1">✓</span>`
    : ''
  const memberSince = state.user?.metadata?.creationTime
    ? new Date(state.user.metadata.creationTime).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null

  return `
    <div class="flex items-start gap-4 pt-2 pb-4 border-b border-white/10">
      <!-- Avatar -->
      <div class="relative flex-shrink-0">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-primary-600 p-[3px]">
          <div class="w-full h-full rounded-full bg-dark-primary flex items-center justify-center text-3xl">
            ${state.avatar || '🤙'}
          </div>
        </div>
        <button
          onclick="openProfileCustomization()"
          class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-all shadow-lg"
          aria-label="${t('customizeProfile') || 'Personnaliser'}"
        >
          ${icon('palette', 'w-3 h-3')}
        </button>
      </div>
      <!-- Name + level -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1 flex-wrap">
          <h2 class="text-base font-bold">@${state.username || t('traveler') || 'Voyageur'}</h2>
          ${verifiedBadge}
        </div>
        <div class="mt-1">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
            ${vipLevel.icon} ${t('level') || 'Niv.'} ${level} — ${vipLevel.name}
          </span>
        </div>
        ${memberSince ? `<p class="text-[10px] text-slate-500 mt-1">${t('memberSince') || 'Membre depuis'} ${memberSince}</p>` : ''}
        <p class="text-[10px] text-slate-500 truncate">${state.user?.email || t('notConnected') || 'Non connecté'}</p>
      </div>
      <!-- Quick actions -->
      <div class="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onclick="openProfileCustomization()"
          class="px-3 py-1.5 rounded-lg bg-primary-500/15 text-primary-400 text-xs font-semibold hover:bg-primary-500/25 transition-all"
        >
          ${icon('pencil', 'w-3 h-3 mr-1')}${t('edit') || 'Modifier'}
        </button>
        <button
          onclick="shareApp()"
          class="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs font-semibold hover:bg-white/10 transition-all"
        >
          ${icon('share-2', 'w-3 h-3 mr-1')}${t('share') || 'Partager'}
        </button>
      </div>
    </div>
  `
}

function renderClickableStats(state) {
  const countries = (state.countriesVisited || []).length
  const validations = state.reviewsGiven || 0
  const spotsCreated = state.spotsCreated || 0
  return `
    <div class="grid grid-cols-3 gap-2">
      <button
        onclick="openMySpots()"
        class="card p-3 text-center hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all active:scale-95"
        aria-label="${t('spotsCreated') || 'Spots créés'}"
      >
        <div class="text-xl font-bold text-emerald-400">${spotsCreated}</div>
        <div class="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">${t('spotsCreatedShort') || 'Spots créés'}</div>
        <div class="text-[9px] text-slate-600 mt-0.5">${t('tapForDetails') || 'Voir détails'} →</div>
      </button>
      <button
        onclick="openMyValidations()"
        class="card p-3 text-center hover:border-sky-500/30 hover:bg-sky-500/5 transition-all active:scale-95"
        aria-label="${t('spotsValidated') || 'Spots validés'}"
      >
        <div class="text-xl font-bold text-sky-400">${validations}</div>
        <div class="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">${t('spotsValidatedShort') || 'Validations'}</div>
        <div class="text-[9px] text-slate-600 mt-0.5">${t('tapForDetails') || 'Voir détails'} →</div>
      </button>
      <button
        onclick="openMyCountries()"
        class="card p-3 text-center hover:border-primary-500/30 hover:bg-primary-500/5 transition-all active:scale-95"
        aria-label="${t('countriesVisited') || 'Pays visités'}"
      >
        <div class="text-xl font-bold text-primary-400">${countries}</div>
        <div class="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">${t('countriesShort') || 'Pays'}</div>
        <div class="text-[9px] text-slate-600 mt-0.5">${t('tapForDetails') || 'Voir détails'} →</div>
      </button>
    </div>
  `
}

function renderVerificationCard(state) {
  const level = state.verificationLevel || 0
  const steps = [
    { label: t('verifyEmailStep') || 'Email vérifié', done: level >= 1, icon: 'mail' },
    { label: t('verifyPhone') || 'Téléphone', done: level >= 2, icon: 'phone' },
    { label: t('verifySelfie') || 'Selfie + ID', done: level >= 3, icon: 'scan-face' },
  ]
  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          ${icon('shield-check', 'w-4 h-4 text-emerald-400')}
          ${t('identityVerification') || 'Vérification'}
        </h3>
        ${level < 3 ? `
          <button
            onclick="openIdentityVerification()"
            class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          >
            ${t('improve') || 'Améliorer'}
            ${icon('chevron-right', 'w-3 h-3')}
          </button>
        ` : `<span class="text-xs text-emerald-400 font-semibold">✓ ${t('fullyVerified') || 'Vérifié'}</span>`}
      </div>
      <div class="flex gap-2">
        ${steps.map((s, i) => `
          <div class="flex-1 flex flex-col items-center gap-1.5">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              s.done ? 'bg-emerald-500 text-white' : i === level ? 'bg-primary-500/20 border-2 border-primary-500/50 text-primary-400' : 'bg-white/5 text-slate-600'
            }">
              ${s.done ? icon('check', 'w-4 h-4') : (i + 1)}
            </div>
            <span class="text-[9px] text-center leading-tight ${s.done ? 'text-emerald-400' : 'text-slate-500'}">${s.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderReferencesCard(_state) {
  const refs = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('spothitch_references') || '[]')
    : []
  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          ${icon('star', 'w-4 h-4 text-amber-400')}
          ${t('references') || 'Références'} ${refs.length > 0 ? `(${refs.length})` : ''}
        </h3>
        <button
          onclick="openReferences()"
          class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
          aria-label="${t('seeAll') || 'Voir tout'}"
        >
          ${refs.length > 0 ? (t('seeAll') || 'Voir tout') : (t('add') || 'Ajouter')}
          ${icon('chevron-right', 'w-3 h-3')}
        </button>
      </div>
      ${refs.length > 0
        ? `<div class="space-y-2">
            ${refs.slice(0, 2).map(r => `
              <div class="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5">
                <div class="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-sm flex-shrink-0">
                  ${r.avatar || '👤'}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-semibold">${r.from || '?'}</div>
                  <div class="text-[11px] text-emerald-400 leading-snug">${r.text || ''}</div>
                </div>
              </div>
            `).join('')}
          </div>`
        : `<p class="text-xs text-slate-500 italic">${t('noReferencesYet') || 'Pas encore de références — voyage avec quelqu\'un pour en recevoir !'}</p>`
      }
    </div>
  `
}

function renderPublicTripsCard(state) {
  // Show the add past trip form (Format C — journal style)
  if (state.showAddPastTrip) {
    return `
      <div class="card p-4">
        <div class="flex items-center gap-3 mb-4">
          <button onclick="closeAddPastTrip()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all">
            ${icon('arrow-left', 'w-4 h-4')}
          </button>
          <h3 class="text-sm font-bold">🧳 ${t('addPastTrip') || 'Nouveau voyage passé'}</h3>
        </div>
        <div class="space-y-3">
          <!-- Route -->
          <div class="p-3 rounded-xl bg-white/5 space-y-2">
            <div class="text-[10px] text-slate-500 uppercase tracking-wider font-bold">📍 ${t('route') || 'ROUTE'}</div>
            <div class="flex items-center gap-2">
              <input id="past-trip-from" type="text" placeholder="${t('tripDeparture') || 'Départ'}"
                class="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm placeholder-slate-500 border border-white/10 focus:border-primary-500/50 outline-none" />
              <span class="text-slate-500 text-lg">→</span>
              <input id="past-trip-to" type="text" placeholder="${t('tripArrival') || 'Arrivée'}"
                class="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm placeholder-slate-500 border border-white/10 focus:border-primary-500/50 outline-none" />
            </div>
          </div>
          <!-- Stats -->
          <div class="grid grid-cols-3 gap-2">
            <div class="p-3 rounded-xl bg-white/5">
              <div class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">📅 ${t('date') || 'Date'}</div>
              <input id="past-trip-date" type="date"
                class="w-full bg-transparent text-sm text-slate-300 outline-none" />
            </div>
            <div class="p-3 rounded-xl bg-white/5">
              <div class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">📍 km</div>
              <input id="past-trip-km" type="number" min="0" placeholder="—"
                class="w-full bg-transparent text-sm text-slate-300 outline-none" />
            </div>
            <div class="p-3 rounded-xl bg-white/5">
              <div class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">🤙 ${t('lifts') || 'Stops'}</div>
              <input id="past-trip-lifts" type="number" min="0" placeholder="—"
                class="w-full bg-transparent text-sm text-slate-300 outline-none" />
            </div>
          </div>
          <!-- Journal note -->
          <div class="p-3 rounded-xl bg-white/5">
            <div class="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-2">
              📒 ${t('journalNote') || 'Ma note de voyage'}
            </div>
            <textarea id="past-trip-note" rows="3"
              placeholder="${t('journalNotePlaceholder') || 'Anecdote, conseil aux prochains...'}"
              class="w-full bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none resize-none leading-relaxed"></textarea>
          </div>
          <button onclick="submitPastTrip()" class="btn-primary w-full py-3">
            🧳 ${t('saveToJournal') || 'Sauvegarder dans mon journal'}
          </button>
        </div>
      </div>
    `
  }

  // Normal list view
  const savedTrips = (() => {
    try { return JSON.parse(localStorage.getItem('spothitch_saved_trips') || '[]') }
    catch (e) { return [] }
  })()

  const trips = savedTrips.slice(0, 5).map(tr => ({
    title: `${tr.from || '?'} → ${tr.to || '?'}`,
    meta: tr.distance ? `${Math.round(tr.distance)} km` : (tr.notes ? tr.notes.slice(0, 40) : ''),
    status: tr.completed ? 'done' : 'saved',
  }))

  const privacy = (() => {
    try { return JSON.parse(localStorage.getItem('spothitch_privacy') || '{}') }
    catch (e) { return {} }
  })()
  const isPublic = privacy.showTravelStats !== false

  const statusColor = { done: 'text-emerald-400', saved: 'text-amber-400', active: 'text-sky-400' }
  const statusLabel = {
    done: t('tripDone') || 'Réalisé',
    saved: t('tripStatusSaved') || 'Sauvegardé',
    active: t('tripActive') || 'En cours',
  }

  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          ${icon('route', 'w-4 h-4 text-primary-400')}
          ${t('myTrips') || 'Mes voyages'}
          ${!isPublic ? `<span class="text-[10px] text-slate-500">${icon('lock', 'w-3 h-3 inline-block mr-0.5')}${t('private') || 'Privé'}</span>` : ''}
        </h3>
        <div class="flex items-center gap-2">
          <button onclick="openAddPastTrip()" class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
            ${icon('plus', 'w-3 h-3')} ${t('add') || 'Ajouter'}
          </button>
          <button onclick="changeTab('challenges')" class="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            ${t('seeAll') || 'Voir tout'} ${icon('chevron-right', 'w-3 h-3')}
          </button>
        </div>
      </div>
      ${trips.length > 0
        ? `<div class="space-y-2">
            ${trips.map(tr => `
              <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                <div class="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  ${icon('route', 'w-4 h-4 text-primary-400')}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold truncate">${tr.title}</div>
                  ${tr.meta ? `<div class="text-[10px] text-slate-500 truncate">${tr.meta}</div>` : ''}
                </div>
                <span class="text-[10px] font-semibold flex-shrink-0 ${statusColor[tr.status] || 'text-slate-400'}">
                  ${statusLabel[tr.status] || tr.status}
                </span>
              </div>
            `).join('')}
          </div>`
        : `<div class="text-center py-3">
            <p class="text-xs text-slate-500 italic mb-2">${t('noTripsYet') || 'Aucun voyage encore — commence !'}</p>
            <div class="flex justify-center gap-3">
              <button onclick="changeTab('challenges')" class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                ${icon('route', 'w-3 h-3')} ${t('planTrip') || 'Planifier'}
              </button>
              <span class="text-slate-600">·</span>
              <button onclick="openAddPastTrip()" class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                ${icon('plus', 'w-3 h-3')} ${t('addPastTripShort') || 'Ajouter passé'}
              </button>
            </div>
          </div>`
      }
    </div>
  `
}

function renderLanguagesCard(_state) {
  const raw = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('spothitch_languages') || '[]')
    : []
  const langs = normalizeLangs(raw)

  const levelDots = (level) => {
    const filled = { natif: 3, courant: 2, debutant: 1 }[level] || 2
    return Array.from({ length: 3 }, (_, i) =>
      `<span class="inline-block w-2 h-2 rounded-full ${i < filled ? 'bg-emerald-400' : 'bg-white/15'}"></span>`
    ).join('')
  }
  const levelLabel = (level) => ({ natif: t('langLevelNatif') || 'Natif', courant: t('langLevelCourant') || 'Courant', debutant: t('langLevelDebutant') || 'Débutant' }[level] || 'Courant')
  const levelColor = (level) => ({ natif: 'text-emerald-400', courant: 'text-blue-400', debutant: 'text-amber-400' }[level] || 'text-slate-400')

  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          ${icon('message-circle', 'w-4 h-4 text-blue-400')}
          ${t('languagesSpoken') || 'Langues parlées'}
        </h3>
        <button onclick="editLanguages()" class="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 hover:bg-primary-500/30 transition-all" aria-label="${t('addLanguage') || 'Ajouter'}">
          ${icon('plus', 'w-3.5 h-3.5')}
        </button>
      </div>
      ${langs.length
        ? `<div class="space-y-2">
            ${langs.map((l, idx) => `
              <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                <span class="text-xl flex-shrink-0">${l.flag}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium">${l.name}</div>
                  <div class="text-[10px] ${levelColor(l.level)}">${levelLabel(l.level)}</div>
                </div>
                <button
                  onclick="cycleLanguageLevel(${idx})"
                  class="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  title="${t('changeLevel') || 'Changer le niveau'}"
                >
                  ${levelDots(l.level)}
                </button>
                <button
                  onclick="removeLanguage(${idx})"
                  class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                  aria-label="${t('remove') || 'Supprimer'}"
                >
                  ${icon('x', 'w-3.5 h-3.5')}
                </button>
              </div>
            `).join('')}
          </div>
          <button onclick="editLanguages()" class="mt-3 w-full text-xs text-primary-400 hover:text-primary-300 flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-primary-500/30 hover:border-primary-500/50 transition-all">
            ${icon('plus', 'w-3 h-3')} ${t('addLanguage') || 'Ajouter une langue'}
          </button>`
        : `<p class="text-xs text-slate-500 italic mb-3">${t('languagesEmpty') || 'Quelles langues parles-tu ?'}</p>
           <button onclick="editLanguages()" class="w-full text-xs text-primary-400 hover:text-primary-300 flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-primary-500/30 hover:border-primary-500/50 transition-all">
             ${icon('plus', 'w-3 h-3')} ${t('addLanguage') || 'Ajouter une langue'}
           </button>`
      }
    </div>
  `
}

function renderBioCard(_state) {
  const bio = typeof localStorage !== 'undefined' ? (localStorage.getItem('spothitch_bio') || '') : ''
  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-bold flex items-center gap-2">
          ${icon('user', 'w-4 h-4 text-slate-400')}
          ${t('profileBio') || 'À propos'}
        </h3>
        <button onclick="editBio()" class="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1" aria-label="${t('editBio') || 'Modifier'}">
          ${icon('pencil', 'w-3.5 h-3.5')}
        </button>
      </div>
      ${bio
        ? `<p class="text-sm text-slate-300 leading-relaxed">${bio}</p>`
        : `<p class="text-xs text-slate-500 italic">${t('bioEmpty') || 'Dis-leur qui tu es...'}</p>
           <button onclick="editBio()" class="mt-2 text-xs text-primary-400 hover:text-primary-300">${t('addBio') || 'Ajouter une bio'}</button>`
      }
    </div>
  `
}

function renderBadgesGrid(state) {
  const userBadges = state.badges || []
  const earned = allBadges.filter(b => userBadges.includes(b.id))
  if (earned.length === 0) return ''
  return `
    <div class="card p-4">
      <h3 class="text-sm font-bold flex items-center gap-2 mb-3">
        ${icon('award', 'w-4 h-4 text-amber-400')}
        ${t('badgesCount') || 'Badges'} (${earned.length})
      </h3>
      <div class="grid grid-cols-4 gap-2">
        ${earned.slice(0, 8).map(b => `
          <button onclick="showBadgeDetail('${b.id}')" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
            <span class="text-2xl">${b.icon}</span>
            <span class="text-[9px] text-slate-400 text-center leading-tight truncate w-full">${b.name}</span>
          </button>
        `).join('')}
      </div>
      ${earned.length > 8 ? `
        <button onclick="openBadges()" class="mt-2 text-xs text-primary-400 hover:text-primary-300 w-full text-center">${t('seeAll') || 'Voir tout'} (${earned.length})</button>
      ` : ''}
    </div>
  `
}

// ==================== DETAIL VIEWS ====================

function renderDetailBackButton() {
  return `
    <button onclick="closeProfileDetail()" class="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all mb-4">
      ${icon('arrow-left', 'w-4 h-4')} ${t('backToProfile') || 'Retour au profil'}
    </button>
  `
}

function renderMySpotsList(state) {
  const count = state.spotsCreated || 0
  // Mock data (real data would come from Firebase)
  const mockSpots = [
    { name: 'Aire de Ressons', location: 'Hauts-de-France, France', type: 'rest_area', validations: 14 },
    { name: 'Sortie A10 Orléans', location: 'Sortie autoroute · Loiret, France', type: 'highway_exit', validations: 8 },
    { name: 'Bahnhof München', location: 'Gare · Munich, Bavière', type: 'station', validations: 3 },
    { name: 'N12 — Péage Espagne', location: 'Péage · Catalogne, Espagne', type: 'other', validations: 0 },
    { name: 'Aire de repos A6', location: 'Aire de repos · Bourgogne, France', type: 'rest_area', validations: 21 },
  ].slice(0, count || 5)

  return `
    <div>
      ${renderDetailBackButton()}
      <h2 class="text-base font-bold flex items-center gap-2 mb-4">
        📍 ${t('myCreatedSpots') || 'Mes spots créés'} (${count})
      </h2>
      ${count === 0
        ? `<div class="card p-6 text-center">
            <p class="text-slate-400 text-sm mb-3">${t('noSpotsCreated') || "Tu n'as pas encore créé de spot"}</p>
            <button onclick="closeProfileDetail(); setTimeout(openAddSpot, 100)" class="text-xs text-primary-400 hover:text-primary-300">
              ${icon('plus', 'w-3 h-3 mr-1 inline-block')} ${t('addFirstSpot') || 'Créer ton premier spot'}
            </button>
          </div>`
        : `<div class="space-y-2">
            ${mockSpots.map(s => `
              <div class="card p-3 flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  ${icon('map-pin', 'w-5 h-5 text-emerald-400')}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold truncate">${s.name}</div>
                  <div class="text-[10px] text-slate-400 truncate">${s.location}</div>
                </div>
                <div class="flex-shrink-0 text-right">
                  <div class="text-xs ${s.validations > 0 ? 'text-emerald-400' : 'text-slate-500'} font-semibold">
                    ${s.validations > 0 ? `✓ ${s.validations}` : '0'}
                  </div>
                  <div class="text-[9px] text-slate-600">${t('validations') || 'valid.'}</div>
                </div>
              </div>
            `).join('')}
            ${count > mockSpots.length ? `<p class="text-xs text-slate-500 text-center pt-2">+ ${count - mockSpots.length} ${t('otherSpots') || 'autres spots'}</p>` : ''}
          </div>`
      }
    </div>
  `
}

function renderMyValidationsList(state) {
  const count = state.reviewsGiven || 0
  const mockValidations = [
    { name: 'Aire de Dole', location: 'Jura, France', date: '10 jan 2025', stars: 5 },
    { name: 'Stazione di Bologna', location: 'Bologne, Italie', date: '3 déc 2024', stars: 4 },
    { name: 'A4 — Strasbourg Est', location: 'Bas-Rhin, France', date: '20 nov 2024', stars: 3 },
    { name: 'Aire de Vienne', location: 'Isère, France', date: '12 oct 2024', stars: 5 },
    { name: 'Autobahn A9 München', location: 'Bavière, Allemagne', date: '2 sep 2024', stars: 4 },
  ].slice(0, count || 5)

  return `
    <div>
      ${renderDetailBackButton()}
      <h2 class="text-base font-bold flex items-center gap-2 mb-4">
        ✓ ${t('myValidations') || 'Mes validations'} (${count})
      </h2>
      ${count === 0
        ? `<div class="card p-6 text-center">
            <p class="text-slate-400 text-sm">${t('noValidationsYet') || 'Aucune validation encore — valide des spots que tu as utilisés !'}</p>
          </div>`
        : `<div class="space-y-2">
            ${mockValidations.map(v => `
              <div class="card p-3 flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <span class="text-amber-400">★</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold truncate">${v.name}</div>
                  <div class="text-[10px] text-slate-400">${v.location} · ${v.date}</div>
                </div>
                <div class="flex-shrink-0">
                  <div class="text-amber-400 text-xs">${'★'.repeat(v.stars)}${'☆'.repeat(5 - v.stars)}</div>
                </div>
              </div>
            `).join('')}
            ${count > mockValidations.length ? `<p class="text-xs text-slate-500 text-center pt-2">+ ${count - mockValidations.length} ${t('otherValidations') || 'autres validations'}</p>` : ''}
          </div>`
      }
    </div>
  `
}

function renderMyCountriesList(state) {
  const countryCodes = state.countriesVisited || []
  return `
    <div>
      ${renderDetailBackButton()}
      <h2 class="text-base font-bold flex items-center gap-2 mb-4">
        🌍 ${t('myCountries') || 'Pays visités'} (${countryCodes.length})
      </h2>
      ${countryCodes.length === 0
        ? `<div class="card p-6 text-center">
            <p class="text-slate-400 text-sm">${t('noCountriesYet') || 'Aucun pays encore — commence à bouger !'}</p>
          </div>`
        : `<div class="grid grid-cols-2 gap-2">
            ${countryCodes.map(code => {
              const c = COUNTRY_MAP[code] || { flag: '🌐', name: code }
              return `
                <div class="card p-3 flex items-center gap-3">
                  <span class="text-2xl flex-shrink-0">${c.flag}</span>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold truncate">${c.name}</div>
                    <div class="text-[10px] text-slate-400">${t('spotsUsedIn') || 'spots utilisés'}</div>
                  </div>
                </div>
              `
            }).join('')}
          </div>`
      }
    </div>
  `
}

// ==================== TAB 2: PROGRESSION ====================

function renderProgressionTab(state) {
  return `
    ${renderLeagueHeader(state)}
    ${renderProgressStatCards(state)}
    ${renderActiveChallenges(state)}
    ${renderTrophiesGrid(state)}
  `
}

function renderLeagueHeader(state) {
  const seasonPts = state.seasonPoints || 0
  const league = getLeague(seasonPts)
  const level = state.level || 1
  const points = state.points || 0
  const xpInLevel = points % 100
  const xpNeeded = 100 - xpInLevel
  return `
    <div class="card p-5 bg-gradient-to-br from-amber-500/10 to-primary-500/10 border-amber-500/20">
      <div class="flex items-center gap-3 mb-3">
        <span class="text-4xl">${league.icon}</span>
        <div>
          <div class="text-sm text-slate-400">${t('league') || 'Ligue'}</div>
          <div class="text-lg font-bold text-amber-400">${league.name}</div>
          <div class="text-xs text-slate-400">${t('level') || 'Niveau'} ${level}</div>
        </div>
      </div>
      <div class="w-full bg-white/10 rounded-full h-2.5 mb-2">
        <div class="bg-gradient-to-r from-amber-500 to-primary-500 h-2.5 rounded-full transition-all" style="width: ${xpInLevel}%"></div>
      </div>
      <p class="text-xs text-slate-400">${(t('xpRemaining') || '{xp} XP pour le prochain niveau').replace('{xp}', xpNeeded)}</p>
    </div>
  `
}

function renderProgressStatCards(state) {
  const streak = state.dailyRewardStreak || 0
  const rank = '#' + (state.leaderboardRank || '—')
  const badgeCount = (state.badges || []).length
  return `
    <div class="grid grid-cols-3 gap-2">
      <div class="card p-3 text-center">
        <div class="text-2xl mb-1">🔥</div>
        <div class="text-lg font-bold text-amber-400">${streak}</div>
        <div class="text-[10px] text-slate-400">${t('streakDaysShort') || 'Série'}</div>
      </div>
      <div class="card p-3 text-center">
        <div class="text-2xl mb-1">📊</div>
        <div class="text-lg font-bold text-primary-400">${rank}</div>
        <div class="text-[10px] text-slate-400">${t('rankShort') || 'Rang'}</div>
      </div>
      <div class="card p-3 text-center">
        <div class="text-2xl mb-1">🏅</div>
        <div class="text-lg font-bold text-emerald-400">${badgeCount}</div>
        <div class="text-[10px] text-slate-400">${t('badgesCount') || 'Badges'}</div>
      </div>
    </div>
  `
}

function renderActiveChallenges(state) {
  const weeklyDefs = allChallenges.weekly || []
  const items = weeklyDefs.slice(0, 3).map(ch => {
    let current = 0
    if (ch.type === 'spotsCreated') current = state.spotsCreated || 0
    else if (ch.type === 'reviews') current = state.reviewsGiven || 0
    else if (ch.type === 'checkins') current = state.checkins || 0
    const pct = Math.min(100, Math.round((current / ch.target) * 100))
    return { ...ch, current, pct }
  })
  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          ${icon('target', 'w-4 h-4 text-primary-400')}
          ${t('activeChallenges') || 'Défis actifs'}
        </h3>
        <button onclick="openChallenges()" class="text-xs text-primary-400 hover:text-primary-300">${t('seeAll') || 'Voir tout'}</button>
      </div>
      <div class="space-y-3">
        ${items.map(ch => `
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm">${ch.icon} ${ch.name}</span>
              <span class="text-xs text-slate-400">${ch.current}/${ch.target}</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2">
              <div class="bg-primary-500 h-2 rounded-full transition-all" style="width: ${ch.pct}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderTrophiesGrid(state) {
  const userBadges = state.badges || []
  const earned = allBadges.filter(b => userBadges.includes(b.id))
  return `
    <div class="card p-4">
      <h3 class="text-sm font-bold flex items-center gap-2 mb-3">
        ${icon('trophy', 'w-4 h-4 text-amber-400')}
        ${t('trophies') || 'Trophées'} (${earned.length}/${allBadges.length})
      </h3>
      <div class="grid grid-cols-6 gap-1.5">
        ${allBadges.slice(0, 18).map(b => {
          const unlocked = userBadges.includes(b.id)
          return `
            <button onclick="showBadgeDetail('${b.id}')" class="flex flex-col items-center p-1.5 rounded-lg ${unlocked ? 'bg-white/5' : 'bg-white/[0.02] opacity-40'} transition-all">
              <span class="text-xl">${b.icon}</span>
            </button>
          `
        }).join('')}
      </div>
      ${allBadges.length > 18 ? `
        <button onclick="openBadges()" class="mt-2 text-xs text-primary-400 hover:text-primary-300 w-full text-center">${t('seeAll') || 'Voir tout'}</button>
      ` : ''}
    </div>
  `
}

// ==================== TAB 3: RÉGLAGES ====================

function renderReglagesTab(state) {
  return `
    ${renderSettingsMiniHeader(state)}
    ${renderAppearanceCard(state)}
    ${renderNotificationsCard(state)}
    ${renderPrivacyCard(state)}
    ${renderActionsCard(state)}
    ${renderDonationCard({ variant: 'full' })}
  `
}

function renderSettingsMiniHeader(state) {
  return `
    <div class="flex items-center gap-3 mb-1">
      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-[2px]">
        <div class="w-full h-full rounded-full bg-dark-primary flex items-center justify-center text-xl">
          ${state.avatar || '🤙'}
        </div>
      </div>
      <div>
        <div class="font-medium text-sm">${state.username || t('traveler') || 'Voyageur'}</div>
        <div class="text-xs text-slate-400">@${state.username || 'user'}</div>
      </div>
    </div>
  `
}

function renderAppearanceCard(state) {
  return `
    <div class="card p-4 space-y-3">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        ${icon('palette', 'w-4 h-4')}
        ${t('settingsAppearance') || 'Apparence'}
      </h3>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <div class="flex items-center gap-3">
          ${icon('moon', 'w-5 h-5 text-purple-400')}
          <span class="text-sm">${t('darkMode') || 'Thème sombre'}</span>
        </div>
        <button
          onclick="toggleTheme()"
          class="w-14 h-8 rounded-full ${state.theme === 'dark' ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
          role="switch"
          aria-checked="${state.theme === 'dark'}"
          aria-label="${t('toggleDarkMode') || 'Activer le thème sombre'}"
        >
          <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${state.theme === 'dark' ? 'left-7' : 'left-1'}"></div>
        </button>
      </div>
      <div class="p-3 rounded-xl bg-white/5">
        <div class="flex items-center gap-3 mb-2">
          ${icon('globe', 'w-5 h-5 text-emerald-400')}
          <span class="text-sm">${t('language') || 'Langue'}</span>
        </div>
        <div class="grid grid-cols-4 gap-2" role="radiogroup" aria-label="${t('chooseLanguage') || 'Choisir la langue'}">
          ${[
            { code: 'fr', flag: '\uD83C\uDDEB\uD83C\uDDF7', name: 'FR' },
            { code: 'en', flag: '\uD83C\uDDEC\uD83C\uDDE7', name: 'EN' },
            { code: 'es', flag: '\uD83C\uDDEA\uD83C\uDDF8', name: 'ES' },
            { code: 'de', flag: '\uD83C\uDDE9\uD83C\uDDEA', name: 'DE' },
          ].map(lang => `
            <button
              onclick="setLanguage('${lang.code}')"
              class="flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${state.lang === lang.code ? 'bg-primary-500/20 border-2 border-primary-500 ring-1 ring-primary-500/30' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}"
              role="radio"
              aria-checked="${state.lang === lang.code}"
              aria-label="${lang.name}"
              type="button"
            >
              <span class="text-xl">${lang.flag}</span>
              <span class="text-xs font-medium ${state.lang === lang.code ? 'text-primary-400' : 'text-slate-400'}">${lang.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `
}

function renderNotificationsCard(state) {
  const pushConfig = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('spothitch_push_config') || '{}')
    : {}
  const pushOn = pushConfig.enabled === true
  return `
    <div class="card p-4 space-y-3">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        ${icon('bell', 'w-4 h-4')}
        ${t('settingsNotifications') || 'Notifications'}
      </h3>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <div class="flex items-center gap-3">
          ${icon('bell', 'w-5 h-5 text-amber-400')}
          <span class="text-sm">${t('notifications') || 'Notifications'}</span>
        </div>
        <button
          onclick="toggleNotifications()"
          class="w-14 h-8 rounded-full ${state.notifications !== false ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
          role="switch"
          aria-checked="${state.notifications !== false}"
          aria-label="${t('toggleNotifications') || 'Activer les notifications'}"
        >
          <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${state.notifications !== false ? 'left-7' : 'left-1'}"></div>
        </button>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <div class="flex items-center gap-3">
          ${icon('map-pin', 'w-5 h-5 text-emerald-400')}
          <div>
            <span class="text-sm block">${t('proximityAlerts') || 'Alertes de proximité'}</span>
            <span class="text-xs text-slate-400">${t('proximityAlertsDesc') || 'Notifié près d\'un spot'}</span>
          </div>
        </div>
        <button
          onclick="toggleProximityAlertsSetting()"
          class="w-14 h-8 rounded-full ${state.proximityAlerts !== false ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
          role="switch"
          aria-checked="${state.proximityAlerts !== false}"
          aria-label="${t('proximityAlerts') || 'Alertes de proximité'}"
        >
          <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${state.proximityAlerts !== false ? 'left-7' : 'left-1'}"></div>
        </button>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <div class="flex items-center gap-3">
          ${icon('bell-ring', 'w-5 h-5 text-blue-400')}
          <div>
            <span class="text-sm block">${t('pushNotifications') || 'Notifications push'}</span>
            <span class="text-xs text-slate-400">${t('pushNotificationsDesc') || 'Alertes push'}</span>
          </div>
        </div>
        <button
          onclick="togglePushNotifications()"
          class="w-14 h-8 rounded-full ${pushOn ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner"
          role="switch"
          aria-checked="${pushOn}"
          aria-label="${t('pushNotifications') || 'Notifications push'}"
        >
          <div class="w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${pushOn ? 'left-7' : 'left-1'}"></div>
        </button>
      </div>
    </div>
  `
}

function renderPrivacyCard(_state) {
  const privacy = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('spothitch_privacy') || '{"showToNonFriends":true,"showLocationHistory":false,"showTravelStats":true}')
    : { showToNonFriends: true, showLocationHistory: false, showTravelStats: true }
  return `
    <div class="card p-4 space-y-3">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        ${icon('lock', 'w-4 h-4')}
        ${t('settingsPrivacy') || 'Confidentialité'}
      </h3>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <span class="text-sm">${t('showToNonFriends') || 'Profil visible par tous'}</span>
        <button
          onclick="togglePrivacy('showToNonFriends')"
          class="w-12 h-7 rounded-full ${privacy.showToNonFriends ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner flex-shrink-0"
          role="switch"
          aria-checked="${privacy.showToNonFriends}"
        >
          <div class="w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${privacy.showToNonFriends ? 'left-6' : 'left-1'}"></div>
        </button>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <span class="text-sm">${t('showLocationHistory') || 'Historique de position'}</span>
        <button
          onclick="togglePrivacy('showLocationHistory')"
          class="w-12 h-7 rounded-full ${privacy.showLocationHistory ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner flex-shrink-0"
          role="switch"
          aria-checked="${privacy.showLocationHistory}"
        >
          <div class="w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${privacy.showLocationHistory ? 'left-6' : 'left-1'}"></div>
        </button>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <span class="text-sm">${t('showTravelStats') || 'Statistiques visibles'}</span>
        <button
          onclick="togglePrivacy('showTravelStats')"
          class="w-12 h-7 rounded-full ${privacy.showTravelStats ? 'bg-primary-500' : 'bg-slate-600'} relative transition-all shadow-inner flex-shrink-0"
          role="switch"
          aria-checked="${privacy.showTravelStats}"
        >
          <div class="w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${privacy.showTravelStats ? 'left-6' : 'left-1'}"></div>
        </button>
      </div>
      <button
        onclick="openBlockedUsers()"
        class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
      >
        <div class="flex items-center gap-3">
          ${icon('ban', 'w-4 h-4 text-slate-400')}
          <span class="text-sm">${t('blockedUsers') || 'Utilisateurs bloqués'}</span>
        </div>
        ${icon('chevron-right', 'w-4 h-4 text-slate-500')}
      </button>
      <button
        onclick="openMyData()"
        class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
      >
        <div class="flex items-center gap-3">
          ${icon('database', 'w-4 h-4 text-blue-400')}
          <span class="text-sm">${t('myData') || 'Mes données'} (RGPD)</span>
        </div>
        ${icon('chevron-right', 'w-4 h-4 text-slate-500')}
      </button>
    </div>
  `
}

function renderActionsCard(state) {
  return `
    <div class="card p-4 space-y-2">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">${t('actions') || 'Actions'}</h3>
      <button
        onclick="startTutorial()"
        class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
      >
        <div class="flex items-center gap-3">
          ${icon('info', 'w-4 h-4 text-primary-400')}
          <span class="text-sm">${t('reviewTutorial') || 'Revoir le tutoriel'}</span>
        </div>
        ${icon('chevron-right', 'w-4 h-4 text-slate-500')}
      </button>
      ${state.isLoggedIn ? `
        <button
          onclick="handleLogout()"
          class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-red-500/10 transition-all text-danger-400"
        >
          ${icon('log-out', 'w-4 h-4')}
          <span class="text-sm">${t('logout') || 'Se déconnecter'}</span>
        </button>
        <button
          onclick="openDeleteAccount()"
          class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-red-500/10 transition-all text-red-400"
        >
          ${icon('trash-2', 'w-4 h-4')}
          <span class="text-sm">${t('deleteAccount') || 'Supprimer le compte'}</span>
        </button>
      ` : `
        <button
          onclick="openAuth()"
          class="btn-primary w-full py-3"
        >
          ${icon('log-in', 'w-5 h-5 mr-2')}
          ${t('login') || 'Se connecter'}
        </button>
      `}
    </div>
  `
}

// ==================== FOOTER (always visible) ====================

function renderProfileFooter() {
  return `
    <div class="space-y-3 mt-4">
      <div class="card p-4">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">${t('footerHelp') || 'Aide'}</h4>
        <button onclick="openFAQ()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
          ${icon('help-circle', 'w-4 h-4 text-primary-400')}
          <span class="text-sm text-slate-300">${t('faqAndHelp') || 'FAQ & Aide'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <button onclick="openContactForm()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
          ${icon('mail', 'w-4 h-4 text-blue-400')}
          <span class="text-sm text-slate-300">${t('contactUs') || 'Nous contacter'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <button onclick="openBugReport()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
          ${icon('bug', 'w-4 h-4 text-red-400')}
          <span class="text-sm text-slate-300">${t('reportBug') || 'Signaler un bug'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
      </div>
      <div class="card p-4">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">${t('footerLegal') || 'Légal'}</h4>
        <button onclick="showLegalPage('privacy')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
          ${icon('shield', 'w-4 h-4 text-emerald-400')}
          <span class="text-sm text-slate-300">${t('privacyPolicy') || 'Politique de confidentialité'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <button onclick="showLegalPage('cgu')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
          ${icon('file-text', 'w-4 h-4 text-slate-400')}
          <span class="text-sm text-slate-300">${t('termsOfService') || "Conditions d'utilisation"}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <button onclick="showLegalPage('guidelines')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
          ${icon('scroll-text', 'w-4 h-4 text-amber-400')}
          <span class="text-sm text-slate-300">${t('communityGuidelines') || 'Règles de la communauté'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
      </div>
      <div class="card p-4">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">${t('footerAbout') || 'À propos'}</h4>
        <button onclick="openChangelog()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
          ${icon('sparkles', 'w-4 h-4 text-purple-400')}
          <span class="text-sm text-slate-300">${t('whatsNew') || 'Quoi de neuf'}</span>
          <span class="text-xs text-slate-500 ml-auto">v2.0.0</span>
        </button>
        <button onclick="shareApp()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
          ${icon('share-2', 'w-4 h-4 text-primary-400')}
          <span class="text-sm text-slate-300">${t('inviteFriends') || 'Inviter des amis'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <div class="flex items-center gap-4 p-3 pt-4 border-t border-white/5 mt-2">
          <span class="text-xs text-slate-500">${t('followUs') || 'Nous suivre'}</span>
          <div class="flex gap-3 ml-auto">
            <a href="https://instagram.com/spothitch" target="_blank" rel="noopener" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 transition-all" aria-label="Instagram">
              ${icon('instagram', 'w-4 h-4')}
            </a>
            <a href="https://tiktok.com/@spothitch" target="_blank" rel="noopener" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="TikTok">
              ${icon('video', 'w-4 h-4')}
            </a>
            <a href="https://discord.gg/spothitch" target="_blank" rel="noopener" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all" aria-label="Discord">
              ${icon('message-square', 'w-4 h-4')}
            </a>
          </div>
        </div>
        <div class="p-3 pt-2 border-t border-white/5">
          <p class="text-xs text-slate-500">${t('creditsText') || 'Données : Hitchwiki (ODBL) • Cartes : OpenFreeMap'}</p>
        </div>
      </div>
    </div>
  `
}

function renderVersionReset() {
  return `
    <div class="flex items-center justify-between text-xs text-slate-400 pt-4">
      <span>SpotHitch v2.0.0</span>
      <button
        onclick="resetApp()"
        class="text-amber-500 hover:text-amber-400"
      >
        ${t('resetApp') || "Réinitialiser l'app"}
      </button>
    </div>
  `
}

// ==================== GLOBAL HANDLERS ====================

window.setProfileSubTab = (tab) => {
  window.setState?.({ profileSubTab: tab })
}

// startTutorial is defined in main.js (canonical owner — includes tab change + step action)

window.handleLogout = async () => {
  try {
    const { logOut } = await import('../../services/firebase.js')
    await logOut()
    window.showToast?.(t('logoutSuccess') || 'Déconnexion réussie', 'success')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// setLanguage is defined in main.js (single source of truth)

window.toggleTheme = () => {
  const state = window.getState?.() || {}
  const newTheme = state.theme === 'dark' ? 'light' : 'dark'
  window.setState?.({ theme: newTheme })
  document.documentElement.classList.toggle('dark', newTheme === 'dark')
}

window.toggleNotifications = () => {
  const state = window.getState?.() || {}
  window.setState?.({ notifications: state.notifications === false ? true : false })
  window.showToast?.(
    state.notifications === false ? (t('notificationsEnabled') || 'Notifications activées') : (t('notificationsDisabled') || 'Notifications désactivées'),
    'info'
  )
}

window.toggleProximityAlertsSetting = async () => {
  const state = window.getState?.() || {}
  const newValue = state.proximityAlerts === false ? true : false
  window.setState?.({ proximityAlerts: newValue })
  try {
    const { initProximityAlerts, stopProximityAlerts } = await import('../../services/proximityAlerts.js')
    if (newValue) {
      initProximityAlerts()
    } else {
      stopProximityAlerts()
    }
  } catch (e) {
    console.warn('[Profile] Proximity alerts toggle failed:', e)
  }
  window.showToast?.(
    newValue ? (t('proximityAlertsEnabled') || 'Alertes de proximité activées') : (t('proximityAlertsDisabled') || 'Alertes de proximité désactivées'),
    'info'
  )
  window.render?.()
}

window.editAvatar = () => {
  window.setState?.({ showWelcome: true })
}

window.openBlockedUsers = () => {
  window.setState?.({ showBlockedUsers: true })
}

window.closeBlockedUsers = () => {
  window.setState?.({ showBlockedUsers: false })
}

// --- Bio handlers (#61) ---
window.editBio = () => {
  const current = localStorage.getItem('spothitch_bio') || ''
  const newBio = prompt(t('bioPrompt') || 'À propos de toi (200 caractères max) :', current)
  if (newBio === null) return
  const trimmed = newBio.trim().slice(0, 200)
  localStorage.setItem('spothitch_bio', trimmed)
  window.showToast?.(t('bioSaved') || 'Bio enregistrée !', 'success')
  window.render?.()
}

window.saveBio = (text) => {
  const trimmed = (text || '').trim().slice(0, 200)
  localStorage.setItem('spothitch_bio', trimmed)
  window.showToast?.(t('bioSaved') || 'Bio enregistrée !', 'success')
  window.render?.()
}

// --- Languages handlers (#59) ---
window.editLanguages = () => {
  const name = prompt(
    (t('languageNamePrompt') || 'Nom de la langue (ex: Français, English, Español) :')
  )
  if (!name) return
  const trimmedName = name.trim()
  if (!trimmedName) return

  const levelInput = prompt(
    `${t('languageLevelPrompt') || 'Niveau ?'}\n1 = ${t('langLevelDebutant') || 'Débutant'}\n2 = ${t('langLevelCourant') || 'Courant'}\n3 = ${t('langLevelNatif') || 'Natif'}`,
    '2'
  )
  if (levelInput === null) return
  const levelMap = { '1': 'debutant', '2': 'courant', '3': 'natif' }
  const level = levelMap[levelInput.trim()] || 'courant'

  const raw = JSON.parse(localStorage.getItem('spothitch_languages') || '[]')
  const langs = normalizeLangs(raw)
  langs.push({ name: trimmedName, flag: LANG_FLAG_MAP[trimmedName] || '🌐', level })
  localStorage.setItem('spothitch_languages', JSON.stringify(langs.slice(0, 10)))
  window.showToast?.(t('languagesSaved') || 'Langue ajoutée !', 'success')
  window.render?.()
}

window.removeLanguage = (idx) => {
  const raw = JSON.parse(localStorage.getItem('spothitch_languages') || '[]')
  const langs = normalizeLangs(raw)
  langs.splice(idx, 1)
  localStorage.setItem('spothitch_languages', JSON.stringify(langs))
  window.render?.()
}

window.cycleLanguageLevel = (idx) => {
  const raw = JSON.parse(localStorage.getItem('spothitch_languages') || '[]')
  const langs = normalizeLangs(raw)
  const levels = ['debutant', 'courant', 'natif']
  const cur = langs[idx]?.level || 'courant'
  langs[idx].level = levels[(levels.indexOf(cur) + 1) % levels.length]
  localStorage.setItem('spothitch_languages', JSON.stringify(langs))
  window.render?.()
}

// --- References handlers (#58) ---
window.openReferences = () => {
  window.setState?.({ showReferences: true })
}

window.closeReferences = () => {
  window.setState?.({ showReferences: false })
}

// --- Privacy controls handler (#62) ---
window.togglePrivacy = (key) => {
  const defaults = { showToNonFriends: true, showLocationHistory: false, showTravelStats: true }
  const privacy = JSON.parse(localStorage.getItem('spothitch_privacy') || JSON.stringify(defaults))
  privacy[key] = !privacy[key]
  localStorage.setItem('spothitch_privacy', JSON.stringify(privacy))
  window.render?.()
}

// --- Shared trips handler (#63) — kept for backward compat ---
window.shareTrip = () => {
  window.openAddPastTrip?.()
}

// --- Stats detail views ---
window.openMySpots = () => window.setState?.({ profileDetailView: 'spots' })
window.openMyValidations = () => window.setState?.({ profileDetailView: 'validations' })
window.openMyCountries = () => window.setState?.({ profileDetailView: 'countries' })
window.closeProfileDetail = () => window.setState?.({ profileDetailView: null })

// --- Add past trip (Format C — journal style) ---
window.openAddPastTrip = () => window.setState?.({ showAddPastTrip: true })
window.closeAddPastTrip = () => window.setState?.({ showAddPastTrip: false })

window.submitPastTrip = () => {
  const from = document.getElementById('past-trip-from')?.value?.trim() || ''
  const to = document.getElementById('past-trip-to')?.value?.trim() || ''
  const date = document.getElementById('past-trip-date')?.value || ''
  const km = parseInt(document.getElementById('past-trip-km')?.value || '0', 10) || 0
  const lifts = parseInt(document.getElementById('past-trip-lifts')?.value || '0', 10) || 0
  const notes = document.getElementById('past-trip-note')?.value?.trim() || ''

  if (!from || !to) {
    window.showToast?.(t('tripFromToRequired') || 'Départ et arrivée requis', 'error')
    return
  }

  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `manual_${Date.now()}`
  const trips = (() => {
    try { return JSON.parse(localStorage.getItem('spothitch_saved_trips') || '[]') }
    catch (e) { return [] }
  })()
  trips.push({
    id, from, to, date, distance: km, lifts, notes,
    completed: true, isManual: true,
    savedAt: new Date().toISOString(), finishedAt: new Date().toISOString(),
  })
  localStorage.setItem('spothitch_saved_trips', JSON.stringify(trips))
  window.setState?.({ showAddPastTrip: false })
  window.showToast?.(t('tripSaved') || 'Voyage enregistré !', 'success')
  window.render?.()
}

export default { renderProfile }
