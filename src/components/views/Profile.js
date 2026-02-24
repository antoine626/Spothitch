/**
 * Profile View Component
 * Instagram-style profile with 3 sub-tabs: Profil, Roadmap, Réglages
 */

import { t } from '../../i18n/index.js'
import { renderDonationCard } from '../ui/DonationCard.js'
import { renderTrustScoreCard } from '../../services/trustScore.js'
import { icon } from '../../utils/icons.js'
import { renderToggle } from '../../utils/toggle.js'
import { getVipLevel } from '../../data/vip-levels.js'
import { allBadges } from '../../data/badges.js'

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
        ${subTab === 'progression' ? renderRoadmapTab(state) : ''}
        ${subTab === 'reglages' ? `${renderReglagesTab(state)}${renderProfileFooter()}${renderVersionReset()}` : ''}
      </div>
    </div>
    ${state.showLanguagePicker ? renderLanguagePickerModal(state) : ''}
    ${state.showLanguageLevelPicker ? renderLanguageLevelModal(state) : ''}
  `
}

function renderLanguagePickerModal(state) {
  const search = (state.langPickerSearch || '').toLowerCase()
  const filtered = POPULAR_LANGUAGES.filter(l => l.toLowerCase().includes(search))
  return `
    <div class="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center" onclick="if(event.target===this)closeLanguagePicker()">
      <div class="bg-dark-secondary rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col">
        <div class="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 class="font-bold">${t('addLanguage') || 'Ajouter une langue'}</h3>
          <button onclick="closeLanguagePicker()" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">${icon('x', 'w-4 h-4')}</button>
        </div>
        <div class="p-3 border-b border-white/10">
          <input type="text" placeholder="${t('searchLanguage') || 'Rechercher...'}" class="input-field w-full text-sm" oninput="langPickerFilter(this.value)" value="${state.langPickerSearch || ''}" autofocus />
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          ${filtered.map(lang => `
            <button onclick="selectLanguageFromPicker('${lang}')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left">
              <span class="text-xl">${LANG_FLAG_MAP[lang] || '🌐'}</span>
              <span class="text-sm font-medium">${lang}</span>
            </button>
          `).join('')}
          ${filtered.length === 0 ? `<p class="text-center text-slate-500 py-4 text-sm">${t('noResults') || 'Aucun résultat'}</p>` : ''}
        </div>
      </div>
    </div>
  `
}

function renderLanguageLevelModal(state) {
  const name = state.langPickerSelectedName || ''
  const levels = [
    { id: 'debutant', label: t('langLevelDebutant') || 'Débutant', desc: t('langLevelDebutantDesc') || 'Quelques mots et phrases', dots: 1 },
    { id: 'courant', label: t('langLevelCourant') || 'Courant', desc: t('langLevelCourantDesc') || 'Conversations fluides', dots: 2 },
    { id: 'natif', label: t('langLevelNatif') || 'Natif', desc: t('langLevelNatifDesc') || 'Langue maternelle', dots: 3 },
  ]
  return `
    <div class="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center" onclick="if(event.target===this)closeLanguageLevelPicker()">
      <div class="bg-dark-secondary rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-5 space-y-4">
        <h3 class="font-bold text-center">${LANG_FLAG_MAP[name] || '🌐'} ${name}</h3>
        <p class="text-xs text-slate-400 text-center">${t('selectLevel') || 'Choisis ton niveau'}</p>
        <div class="space-y-2">
          ${levels.map(l => `
            <button onclick="selectLanguageLevel('${l.id}')" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
              <div class="flex gap-1">${Array.from({ length: 3 }, (_, i) => `<span class="w-3 h-3 rounded-full ${i < l.dots ? 'bg-emerald-400' : 'bg-white/15'}"></span>`).join('')}</div>
              <div>
                <div class="text-sm font-semibold">${l.label}</div>
                <div class="text-[10px] text-slate-400">${l.desc}</div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `
}

// ==================== SUB-TABS BAR ====================

function renderProfileSubTabs(activeTab) {
  const tabs = [
    { id: 'profil', icon: 'user', label: t('profileTabProfil') || 'Profil' },
    { id: 'progression', icon: 'star', label: t('profileTabRoadmap') || 'Roadmap' },
    { id: 'reglages', icon: 'settings', label: t('profileTabSettings') || 'Réglages' },
  ]
  return `
    <div class="flex bg-dark-secondary/50 border-b border-white/5">
      ${tabs.map(tab => `
        <button
          onclick="setProfileSubTab('${tab.id}')"
          class="flex-1 py-3 px-2 font-medium text-sm transition-colors relative border-b-2 ${
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
    ${renderSocialLinksCard(state)}
    ${renderPhotoGalleryCard(state)}
    ${renderTrustScoreCard()}
    ${renderReferencesCard(state)}
    ${renderPublicTripsCard(state)}
    ${renderBadgesGrid(state)}
    ${renderDonationCard()}
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
          class="px-3 py-1.5 rounded-lg bg-primary-500/15 text-primary-400 text-xs font-semibold hover:bg-primary-500/25 transition-colors"
        >
          ${icon('pencil', 'w-3 h-3 mr-1')}${t('edit') || 'Modifier'}
        </button>
        <button
          onclick="shareApp()"
          class="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs font-semibold hover:bg-white/10 transition-colors"
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
        class="card p-3 text-center hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors active:scale-95"
        aria-label="${t('spotsCreated') || 'Spots créés'}"
      >
        <div class="text-xl font-bold text-emerald-400">${spotsCreated}</div>
        <div class="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">${t('spotsCreatedShort') || 'Spots créés'}</div>
        <div class="text-[9px] text-slate-600 mt-0.5">${t('tapForDetails') || 'Voir détails'} →</div>
      </button>
      <button
        onclick="openMyValidations()"
        class="card p-3 text-center hover:border-sky-500/30 hover:bg-sky-500/5 transition-colors active:scale-95"
        aria-label="${t('spotsValidated') || 'Spots validés'}"
      >
        <div class="text-xl font-bold text-sky-400">${validations}</div>
        <div class="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">${t('spotsValidatedShort') || 'Validations'}</div>
        <div class="text-[9px] text-slate-600 mt-0.5">${t('tapForDetails') || 'Voir détails'} →</div>
      </button>
      <button
        onclick="openMyCountries()"
        class="card p-3 text-center hover:border-primary-500/30 hover:bg-primary-500/5 transition-colors active:scale-95"
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
          <button onclick="closeAddPastTrip()" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors">
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
          <!-- Dates -->
          <div class="grid grid-cols-2 gap-2">
            <div class="p-3 rounded-xl bg-white/5">
              <div class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">📅 ${t('startDate') || 'Début'}</div>
              <input id="past-trip-date" type="date"
                class="w-full bg-transparent text-sm text-slate-300 outline-none" />
            </div>
            <div class="p-3 rounded-xl bg-white/5">
              <div class="text-[10px] text-slate-500 uppercase tracking-wider mb-1">📅 ${t('endDate') || 'Fin'}</div>
              <input id="past-trip-date-end" type="date"
                class="w-full bg-transparent text-sm text-slate-300 outline-none" />
            </div>
          </div>
          <!-- Stats -->
          <div class="grid grid-cols-2 gap-2">
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
        <button onclick="editLanguages()" class="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 hover:bg-primary-500/30 transition-colors" aria-label="${t('addLanguage') || 'Ajouter'}">
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
                  class="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title="${t('changeLevel') || 'Changer le niveau'}"
                >
                  ${levelDots(l.level)}
                </button>
                <button
                  onclick="removeLanguage(${idx})"
                  class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                  aria-label="${t('remove') || 'Supprimer'}"
                >
                  ${icon('x', 'w-3.5 h-3.5')}
                </button>
              </div>
            `).join('')}
          </div>
          <button onclick="editLanguages()" class="mt-3 w-full text-xs text-primary-400 hover:text-primary-300 flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-primary-500/30 hover:border-primary-500/50 transition-colors">
            ${icon('plus', 'w-3 h-3')} ${t('addLanguage') || 'Ajouter une langue'}
          </button>`
        : `<p class="text-xs text-slate-500 italic mb-3">${t('languagesEmpty') || 'Quelles langues parles-tu ?'}</p>
           <button onclick="editLanguages()" class="w-full text-xs text-primary-400 hover:text-primary-300 flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-primary-500/30 hover:border-primary-500/50 transition-colors">
             ${icon('plus', 'w-3 h-3')} ${t('addLanguage') || 'Ajouter une langue'}
           </button>`
      }
    </div>
  `
}

// D3: Social links card
function renderSocialLinksCard(_state) {
  const social = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('spothitch_social_links') || '{}')
    : {}
  const networks = [
    { id: 'instagram', icon: 'camera', label: 'Instagram', color: 'text-pink-400' },
    { id: 'tiktok', icon: 'video', label: 'TikTok', color: 'text-slate-300' },
    { id: 'facebook', icon: 'users', label: 'Facebook', color: 'text-blue-400' },
  ]
  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          ${icon('link', 'w-4 h-4 text-purple-400')}
          ${t('socialLinks') || 'Réseaux sociaux'}
        </h3>
      </div>
      <div class="space-y-2">
        ${networks.map(n => `
          <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
            ${icon(n.icon, `w-4 h-4 ${n.color} flex-shrink-0`)}
            <input
              type="text"
              id="social-link-${n.id}"
              placeholder="@${t('username') || 'pseudo'}"
              value="${social[n.id] || ''}"
              onblur="saveSocialLink('${n.id}', this.value)"
              class="flex-1 bg-transparent text-sm outline-none placeholder-slate-600"
            />
          </div>
        `).join('')}
      </div>
    </div>
  `
}

// D2: Photo gallery card
function renderPhotoGalleryCard(_state) {
  const photos = typeof localStorage !== 'undefined'
    ? JSON.parse(localStorage.getItem('spothitch_profile_photos') || '[]')
    : []
  const maxPhotos = 6
  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold flex items-center gap-2">
          ${icon('camera', 'w-4 h-4 text-pink-400')}
          ${t('myPhotos') || 'Mes Photos'} (${photos.length}/${maxPhotos})
        </h3>
      </div>
      <div class="grid grid-cols-3 gap-2">
        ${photos.map((photo, i) => `
          <div class="relative aspect-square rounded-xl overflow-hidden bg-white/5">
            <img src="${photo}" alt="" class="w-full h-full object-cover" loading="lazy" />
            <button
              onclick="removeProfilePhoto(${i})"
              class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white"
            >
              ${icon('x', 'w-3 h-3')}
            </button>
          </div>
        `).join('')}
        ${photos.length < maxPhotos ? `
          <label class="aspect-square rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-primary-500/50 transition-colors">
            <input type="file" accept="image/*" onchange="addProfilePhoto(this)" class="hidden" />
            ${icon('plus', 'w-6 h-6 text-slate-500')}
          </label>
        ` : ''}
      </div>
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
          <button onclick="showBadgeDetail('${b.id}')" class="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
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
    <button onclick="closeProfileDetail()" class="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
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

// ==================== TAB 2: ROADMAP ====================

const ROADMAP_FEATURES = [
  {
    id: 'tech',
    icon: '🚀',
    title: { fr: 'Améliorations techniques', en: 'Technical Improvements', es: 'Mejoras técnicas', de: 'Technische Verbesserungen' },
    desc: { fr: 'Google Maps, serveurs rapides', en: 'Google Maps, faster servers', es: 'Google Maps, servidores rápidos', de: 'Google Maps, schnellere Server' },
    status: 'in_progress',
    items: [
      { icon: '🗺️', color: 'amber', title: { fr: 'Google Maps intégré', en: 'Integrated Google Maps', es: 'Google Maps integrado', de: 'Google Maps integriert' }, desc: { fr: 'Navigation plus fluide, vue satellite, meilleure précision GPS.', en: 'Smoother navigation, satellite view, better GPS accuracy.', es: 'Navegación más fluida, vista satélite, mejor precisión GPS.', de: 'Flüssigere Navigation, Satellitenansicht, bessere GPS-Genauigkeit.' }, impact: { fr: 'Navigation ++', en: 'Navigation ++', es: 'Navegación ++', de: 'Navigation ++' } },
      { icon: '⚡', color: 'blue', title: { fr: 'Serveurs plus puissants', en: 'More powerful servers', es: 'Servidores más potentes', de: 'Leistungsstärkere Server' }, desc: { fr: 'Chargement instantané, même avec tous les spots.', en: 'Instant loading, even with all spots.', es: 'Carga instantánea, incluso con todos los spots.', de: 'Sofortiges Laden, auch mit allen Spots.' }, impact: { fr: 'Vitesse x10', en: 'Speed x10', es: 'Velocidad x10', de: 'Geschwindigkeit x10' } },
      { icon: '📱', color: 'green', title: { fr: 'App plus réactive', en: 'More responsive app', es: 'App más reactiva', de: 'Reaktivere App' }, desc: { fr: 'Animations smooth, transitions rapides.', en: 'Smooth animations, fast transitions.', es: 'Animaciones suaves, transiciones rápidas.', de: 'Flüssige Animationen, schnelle Übergänge.' }, impact: { fr: 'Fluidité ++', en: 'Fluidity ++', es: 'Fluidez ++', de: 'Flüssigkeit ++' } },
      { icon: '🔄', color: 'purple', title: { fr: 'Synchronisation temps réel', en: 'Real-time sync', es: 'Sincronización en tiempo real', de: 'Echtzeit-Synchronisation' }, desc: { fr: 'Spots et commentaires se mettent à jour instantanément.', en: 'Spots and comments update instantly.', es: 'Spots y comentarios se actualizan al instante.', de: 'Spots und Kommentare werden sofort aktualisiert.' }, impact: { fr: 'Actualité ++', en: 'Freshness ++', es: 'Actualidad ++', de: 'Aktualität ++' } },
    ]
  },
  {
    id: 'thumbs',
    icon: '👍',
    title: { fr: 'Pouces & Partenaires', en: 'Thumbs & Partners', es: 'Pulgares & Socios', de: 'Daumen & Partner' },
    desc: { fr: 'Réductions Hostelworld, Patagonia...', en: 'Hostelworld, Patagonia discounts...', es: 'Descuentos Hostelworld, Patagonia...', de: 'Hostelworld, Patagonia Rabatte...' },
    status: 'thinking',
  },
  {
    id: 'leagues',
    icon: '🏆',
    title: { fr: 'Leagues & Classements', en: 'Leagues & Rankings', es: 'Ligas & Clasificaciones', de: 'Ligen & Ranglisten' },
    desc: { fr: 'Compétition par pays, monde', en: 'Competition by country, worldwide', es: 'Competencia por país, mundial', de: 'Wettbewerb nach Land, weltweit' },
    status: 'thinking',
  },
  {
    id: 'cities',
    icon: '🏙️',
    title: { fr: 'Pages Villes', en: 'City Pages', es: 'Páginas de Ciudades', de: 'Stadtseiten' },
    desc: { fr: 'Spots par direction, conseils', en: 'Spots by direction, tips', es: 'Spots por dirección, consejos', de: 'Spots nach Richtung, Tipps' },
    status: 'thinking',
  },
  {
    id: 'hostels',
    icon: '🏨',
    title: { fr: 'Auberges partenaires', en: 'Partner Hostels', es: 'Albergues asociados', de: 'Partnerherbergen' },
    desc: { fr: 'Chill, Cheap, Party par ville', en: 'Chill, Cheap, Party by city', es: 'Chill, Barato, Fiesta por ciudad', de: 'Chill, Günstig, Party nach Stadt' },
    status: 'thinking',
  },
  {
    id: 'events',
    icon: '🎉',
    title: { fr: 'Événements', en: 'Events', es: 'Eventos', de: 'Veranstaltungen' },
    desc: { fr: 'Meetups, rassemblements', en: 'Meetups, gatherings', es: 'Encuentros, reuniones', de: 'Meetups, Treffen' },
    status: 'thinking',
  },
  {
    id: 'groups',
    icon: '👥',
    title: { fr: 'Groupes & Courses', en: 'Groups & Races', es: 'Grupos & Carreras', de: 'Gruppen & Rennen' },
    desc: { fr: 'Localisation amis, courses', en: 'Friends location, races', es: 'Ubicación amigos, carreras', de: 'Freunde-Standort, Rennen' },
    status: 'thinking',
  },
]

const ROADMAP_STATUS = {
  in_progress: { fr: 'En cours', en: 'In progress', es: 'En curso', de: 'In Arbeit', cls: 'bg-amber-500/20 text-amber-500' },
  thinking: { fr: 'En réflexion', en: 'Under review', es: 'En revisión', de: 'In Prüfung', cls: 'bg-blue-500/20 text-blue-400' },
  shipped: { fr: 'Livré', en: 'Shipped', es: 'Entregado', de: 'Ausgeliefert', cls: 'bg-emerald-500/20 text-emerald-400' },
}

function getRoadmapVotes() {
  try { return JSON.parse(localStorage.getItem('spothitch_roadmap_votes') || '{}') } catch { return {} }
}
function getRoadmapComments() {
  try { return JSON.parse(localStorage.getItem('spothitch_roadmap_comments') || '[]') } catch { return [] }
}

function getFeatureVoteCounts(featureId) {
  const allVotes = getRoadmapVotes()
  const baseVotes = { tech: 47, thumbs: 38, leagues: 29, cities: 25, hostels: 22, events: 19, groups: 17 }
  const base = baseVotes[featureId] || 0
  const myVote = allVotes[featureId]
  return base + (myVote === 'up' ? 1 : 0)
}

function getFeatureCommentCount(featureId) {
  const comments = getRoadmapComments()
  const baseCounts = { tech: 12, thumbs: 23, leagues: 8, cities: 15, hostels: 11, events: 7, groups: 14 }
  return (baseCounts[featureId] || 0) + comments.filter(c => c.featureId === featureId).length
}

function lt(obj) {
  if (!obj) return ''
  const lang = (window.getState?.()?.lang) || 'en'
  return obj[lang] || obj.en || obj.fr || ''
}

function renderRoadmapTab(state) {
  if (state.roadmapFeatureId) {
    const feature = ROADMAP_FEATURES.find(f => f.id === state.roadmapFeatureId)
    if (feature) return renderRoadmapDetail(state, feature)
  }
  return renderRoadmapList(state)
}

function renderRoadmapList(state) {
  const tab = state.roadmapListTab || 'popular'
  let features = [...ROADMAP_FEATURES]
  if (tab === 'popular') features.sort((a, b) => getFeatureVoteCounts(b.id) - getFeatureVoteCounts(a.id))
  if (tab === 'shipped') features = features.filter(f => f.status === 'shipped')
  const myVotes = getRoadmapVotes()

  return `
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-bold">${icon('rocket', 'w-5 h-5 text-amber-400 inline-block mr-1')} ${t('roadmapTitle') || 'Feature Requests'}</h2>
      </div>
      <p class="text-slate-400 text-sm mb-3">${t('roadmapSubtitle') || 'Top des demandes de la communauté'}</p>

      <div class="flex gap-2 mb-4">
        <button onclick="setRoadmapListTab('popular')" class="${tab === 'popular' ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-white'} px-3 py-1.5 rounded-full text-xs transition-colors">🔥 ${t('roadmapPopular') || 'Populaires'}</button>
        <button onclick="setRoadmapListTab('recent')" class="${tab === 'recent' ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-white'} px-3 py-1.5 rounded-full text-xs transition-colors">🆕 ${t('roadmapRecent') || 'Récents'}</button>
        <button onclick="setRoadmapListTab('shipped')" class="${tab === 'shipped' ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-white'} px-3 py-1.5 rounded-full text-xs transition-colors">✅ ${t('roadmapShipped') || 'Livrés'}</button>
      </div>

      <div class="space-y-2.5">
        ${features.length === 0 ? `<p class="text-center text-slate-500 py-8">${t('roadmapNoShipped') || 'Aucune feature livrée pour le moment'}</p>` : ''}
        ${features.map(f => {
          const votes = getFeatureVoteCounts(f.id)
          const comments = getFeatureCommentCount(f.id)
          const voted = myVotes[f.id] === 'up'
          const status = ROADMAP_STATUS[f.status] || ROADMAP_STATUS.thinking
          return `
            <div class="flex items-center gap-3 card p-3 cursor-pointer active:scale-[0.98] transition-transform" onclick="openRoadmapFeature('${f.id}')">
              <button onclick="event.stopPropagation();roadmapVote('${f.id}')" class="flex flex-col items-center ${voted ? 'bg-amber-500 text-black' : 'bg-white/10 hover:bg-amber-500/20'} px-2.5 py-1.5 rounded-lg transition-colors shrink-0" aria-label="${t('roadmapUpvote') || 'Voter'}">
                <span class="text-sm">▲</span>
                <span class="font-bold text-sm">${votes}</span>
              </button>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-lg">${f.icon}</span>
                  <h3 class="font-semibold text-sm truncate">${lt(f.title)}</h3>
                </div>
                <p class="text-slate-400 text-xs truncate">${lt(f.desc)}</p>
                <div class="flex gap-2 mt-1">
                  <span class="text-[10px] ${status.cls} px-2 py-0.5 rounded">${lt(status)}</span>
                  <span class="text-slate-500 text-[10px]">💬 ${comments}</span>
                </div>
              </div>
              ${icon('chevron-right', 'w-4 h-4 text-slate-600 shrink-0')}
            </div>
          `
        }).join('')}
      </div>

      <button onclick="openProgressionStats()" class="block text-center text-slate-500 text-xs mt-5 w-full hover:text-amber-400 transition-colors">
        ${t('roadmapSeeStats') || 'Voir mes stats & badges →'}
      </button>
    </div>
  `
}

function renderRoadmapDetail(state, feature) {
  const myVotes = getRoadmapVotes()
  const myVote = myVotes[feature.id]
  const comments = getRoadmapComments().filter(c => c.featureId === feature.id)
  const commentCount = getFeatureCommentCount(feature.id)
  const status = ROADMAP_STATUS[feature.status] || ROADMAP_STATUS.thinking

  return `
    <div>
      <button onclick="closeRoadmapFeature()" class="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1">
        ${icon('arrow-left', 'w-4 h-4')} ${t('back') || 'Retour'}
      </button>

      <div class="mb-5">
        <span class="text-[10px] ${status.cls} px-2 py-0.5 rounded font-bold uppercase">${lt(status)}</span>
        <h2 class="text-xl font-bold mt-2">${feature.icon} ${lt(feature.title)}</h2>
        <p class="text-slate-400 text-sm mt-1">${lt(feature.desc)}</p>
      </div>

      ${feature.items ? `
        <div class="space-y-3 mb-5">
          ${feature.items.map(item => `
            <div class="card p-3">
              <div class="flex items-start gap-3">
                <div class="w-11 h-11 bg-${item.color}-500 rounded-xl flex items-center justify-center shrink-0">
                  <span class="text-xl">${item.icon}</span>
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-sm">${lt(item.title)}</h3>
                  <p class="text-slate-400 text-xs mt-0.5">${lt(item.desc)}</p>
                  <span class="text-${item.color}-400 text-[10px] mt-1 inline-block">🎯 ${lt(item.impact)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="mb-5">
        <p class="text-slate-400 text-sm mb-2">${t('roadmapWhatDoYouThink') || "Qu'en penses-tu ?"}</p>
        <div class="flex gap-2">
          <button onclick="roadmapVoteDetail('${feature.id}','up')" class="flex-1 py-2.5 rounded-xl font-bold text-sm border transition-colors ${myVote === 'up' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}">
            👍 ${t('roadmapApprove') || "J'approuve"}
          </button>
          <button onclick="roadmapVoteDetail('${feature.id}','down')" class="flex-1 py-2.5 rounded-xl font-bold text-sm border transition-colors ${myVote === 'down' ? 'bg-red-500 text-white border-red-500' : 'bg-red-500/10 text-red-400 border-red-500/30'}">
            👎 ${t('roadmapDisapprove') || 'Pas convaincu'}
          </button>
        </div>
        <button onclick="roadmapShowCommentInput('${feature.id}')" class="w-full bg-white/5 text-slate-400 py-2.5 rounded-xl mt-2 text-sm hover:bg-white/10 transition-colors">
          💬 ${t('roadmapLeaveComment') || 'Laisser une remarque'}
        </button>
      </div>

      ${state.roadmapCommentInput === feature.id ? `
        <div class="card p-3 mb-4">
          <textarea id="roadmap-comment-input" class="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm resize-none h-20 focus:border-amber-500/50 focus:outline-none" placeholder="${t('roadmapCommentPlaceholder') || 'Ton avis compte...'}" maxlength="500"></textarea>
          <div class="flex gap-2 mt-2">
            <button onclick="submitRoadmapComment('${feature.id}')" class="bg-amber-500 text-black px-4 py-1.5 rounded-lg text-sm font-bold">${t('send') || 'Envoyer'}</button>
            <button onclick="roadmapHideCommentInput()" class="text-slate-400 text-sm">${t('cancel') || 'Annuler'}</button>
          </div>
        </div>
      ` : ''}

      <div>
        <h3 class="font-bold text-sm flex items-center gap-2 mb-3">💬 ${t('roadmapComments') || 'Commentaires'} (${commentCount})</h3>
        <div class="space-y-2">
          ${comments.map(c => `
            <div class="card p-3">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-[10px] font-bold">${(c.username || '?')[0].toUpperCase()}</div>
                <span class="font-bold text-xs">${c.username || t('anonymous') || 'Anonyme'}</span>
                <span class="text-slate-500 text-[10px]">${c.date || ''}</span>
              </div>
              <p class="text-slate-300 text-xs">${c.text}</p>
            </div>
          `).join('')}
          ${comments.length === 0 ? `<p class="text-slate-500 text-xs text-center py-3">${t('roadmapNoComments') || 'Aucun commentaire pour le moment'}</p>` : ''}
        </div>
      </div>
    </div>
  `
}

// ==================== TAB 3: RÉGLAGES ====================

function renderReglagesTab(state) {
  return `
    ${renderSettingsMiniHeader(state)}
    ${renderVerificationCard(state)}
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
        ${renderToggle(state.theme === 'dark', "toggleTheme()", t('toggleDarkMode') || 'Activer le thème sombre')}
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
              class="flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${state.lang === lang.code ? 'bg-primary-500/20 border-2 border-primary-500 ring-1 ring-primary-500/30' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}"
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
        ${renderToggle(state.notifications !== false, "toggleNotifications()", t('toggleNotifications') || 'Activer les notifications')}
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <div class="flex items-center gap-3">
          ${icon('map-pin', 'w-5 h-5 text-emerald-400')}
          <div>
            <span class="text-sm block">${t('proximityAlerts') || 'Alertes de proximité'}</span>
            <span class="text-xs text-slate-400">${t('proximityAlertsDesc') || 'Notifié près d\'un spot'}</span>
          </div>
        </div>
        ${renderToggle(state.proximityAlerts !== false, "toggleProximityAlertsSetting()", t('proximityAlerts') || 'Alertes de proximité')}
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <div class="flex items-center gap-3">
          ${icon('bell-ring', 'w-5 h-5 text-blue-400')}
          <div>
            <span class="text-sm block">${t('pushNotifications') || 'Notifications push'}</span>
            <span class="text-xs text-slate-400">${t('pushNotificationsDesc') || 'Alertes push'}</span>
          </div>
        </div>
        ${renderToggle(pushOn, "togglePushNotifications()", t('pushNotifications') || 'Notifications push')}
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
        ${renderToggle(privacy.showToNonFriends, "togglePrivacy('showToNonFriends')", t('showToNonFriends') || 'Profil visible par tous')}
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <span class="text-sm">${t('showLocationHistory') || 'Historique de position'}</span>
        ${renderToggle(privacy.showLocationHistory, "togglePrivacy('showLocationHistory')", t('showLocationHistory') || 'Historique de position')}
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <span class="text-sm">${t('showTravelStats') || 'Statistiques visibles'}</span>
        ${renderToggle(privacy.showTravelStats, "togglePrivacy('showTravelStats')", t('showTravelStats') || 'Statistiques visibles')}
      </div>
      <button
        onclick="openBlockedUsers()"
        class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div class="flex items-center gap-3">
          ${icon('ban', 'w-4 h-4 text-slate-400')}
          <span class="text-sm">${t('blockedUsers') || 'Utilisateurs bloqués'}</span>
        </div>
        ${icon('chevron-right', 'w-4 h-4 text-slate-500')}
      </button>
      <button
        onclick="openMyData()"
        class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
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
        class="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
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
          class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors text-danger-400"
        >
          ${icon('log-out', 'w-4 h-4')}
          <span class="text-sm">${t('logout') || 'Se déconnecter'}</span>
        </button>
        <button
          onclick="openDeleteAccount()"
          class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors text-red-400"
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
        <button onclick="openFAQ()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
          ${icon('help-circle', 'w-4 h-4 text-primary-400')}
          <span class="text-sm text-slate-300">${t('faqAndHelp') || 'FAQ & Aide'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <button onclick="openContactForm()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
          ${icon('mail', 'w-4 h-4 text-blue-400')}
          <span class="text-sm text-slate-300">${t('contactUs') || 'Nous contacter'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <button onclick="openBugReport()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
          ${icon('bug', 'w-4 h-4 text-red-400')}
          <span class="text-sm text-slate-300">${t('reportBug') || 'Signaler un bug'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
      </div>
      <div class="card p-4">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">${t('footerLegal') || 'Légal'}</h4>
        <button onclick="showLegalPage('privacy')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
          ${icon('shield', 'w-4 h-4 text-emerald-400')}
          <span class="text-sm text-slate-300">${t('privacyPolicy') || 'Politique de confidentialité'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <button onclick="showLegalPage('cgu')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
          ${icon('file-text', 'w-4 h-4 text-slate-400')}
          <span class="text-sm text-slate-300">${t('termsOfService') || "Conditions d'utilisation"}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <button onclick="showLegalPage('guidelines')" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
          ${icon('scroll-text', 'w-4 h-4 text-amber-400')}
          <span class="text-sm text-slate-300">${t('communityGuidelines') || 'Règles de la communauté'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
      </div>
      <div class="card p-4">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">${t('footerAbout') || 'À propos'}</h4>
        <button onclick="openChangelog()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
          ${icon('sparkles', 'w-4 h-4 text-purple-400')}
          <span class="text-sm text-slate-300">${t('whatsNew') || 'Quoi de neuf'}</span>
          <span class="text-xs text-slate-500 ml-auto">v2.0.0</span>
        </button>
        <button onclick="shareApp()" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left">
          ${icon('share-2', 'w-4 h-4 text-primary-400')}
          <span class="text-sm text-slate-300">${t('inviteFriends') || 'Inviter des amis'}</span>
          ${icon('chevron-right', 'w-4 h-4 text-slate-500 ml-auto')}
        </button>
        <div class="flex items-center gap-4 p-3 pt-4 border-t border-white/5 mt-2">
          <span class="text-xs text-slate-500">${t('followUs') || 'Nous suivre'}</span>
          <div class="flex gap-3 ml-auto">
            <a href="https://instagram.com/spothitch" target="_blank" rel="noopener" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 transition-colors" aria-label="Instagram">
              ${icon('instagram', 'w-4 h-4')}
            </a>
            <a href="https://tiktok.com/@spothitch" target="_blank" rel="noopener" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors" aria-label="TikTok">
              ${icon('video', 'w-4 h-4')}
            </a>
            <a href="https://discord.gg/spothitch" target="_blank" rel="noopener" class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" aria-label="Discord">
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
// D5: Language picker modal (no more prompt())
const POPULAR_LANGUAGES = [
  'Français', 'English', 'Español', 'Deutsch', 'Português', 'Italiano',
  'Русский', 'العربية', '中文', '日本語', 'हिन्दी', 'Nederlands',
  'Polski', 'Română', 'Türkçe', 'Svenska', 'Norsk', 'Dansk',
  'Suomi', 'Čeština', 'Magyar', 'Ελληνικά', 'Українська',
  'Bahasa Indonesia', 'Tiếng Việt', 'ภาษาไทย', '한국어',
  'فارسی', 'עברית', 'Kiswahili', 'Tagalog',
]

window.editLanguages = () => {
  window.setState?.({ showLanguagePicker: true, langPickerSearch: '' })
}

window.closeLanguagePicker = () => {
  window.setState?.({ showLanguagePicker: false })
}

window.langPickerFilter = (query) => {
  window.setState?.({ langPickerSearch: query })
}

window.selectLanguageFromPicker = (name) => {
  window.setState?.({ showLanguagePicker: false, langPickerSelectedName: name, langPickerLevel: 'courant' })
  // Show level selector
  setTimeout(() => window.setState?.({ showLanguageLevelPicker: true }), 100)
}

window.selectLanguageLevel = (level) => {
  const name = window.getState?.()?.langPickerSelectedName || ''
  if (!name) return
  const raw = JSON.parse(localStorage.getItem('spothitch_languages') || '[]')
  const langs = normalizeLangs(raw)
  langs.push({ name, flag: LANG_FLAG_MAP[name] || '🌐', level })
  localStorage.setItem('spothitch_languages', JSON.stringify(langs.slice(0, 10)))
  window.showToast?.(t('languagesSaved') || 'Langue ajoutée !', 'success')
  window.setState?.({ showLanguageLevelPicker: false, langPickerSelectedName: null })
  window.render?.()
}

window.closeLanguageLevelPicker = () => {
  window.setState?.({ showLanguageLevelPicker: false })
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

// D3: Social links handler
window.saveSocialLink = (network, value) => {
  const social = JSON.parse(localStorage.getItem('spothitch_social_links') || '{}')
  social[network] = value.trim()
  localStorage.setItem('spothitch_social_links', JSON.stringify(social))
}

// D2: Photo gallery handlers
window.addProfilePhoto = async (input) => {
  const file = input?.files?.[0]
  if (!file) return
  const photos = JSON.parse(localStorage.getItem('spothitch_profile_photos') || '[]')
  if (photos.length >= 6) {
    window.showToast?.('Maximum 6 photos', 'warning')
    return
  }
  // Compress to WebP-like quality using canvas
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const maxSize = 400
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/webp', 0.7) || canvas.toDataURL('image/jpeg', 0.7)
    photos.push(dataUrl)
    localStorage.setItem('spothitch_profile_photos', JSON.stringify(photos))
    window.render?.()
  }
  img.src = URL.createObjectURL(file)
}

window.removeProfilePhoto = (idx) => {
  const photos = JSON.parse(localStorage.getItem('spothitch_profile_photos') || '[]')
  photos.splice(idx, 1)
  localStorage.setItem('spothitch_profile_photos', JSON.stringify(photos))
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

// shareTrip is defined in Planner.js (full async implementation)

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

// ==================== ROADMAP HANDLERS ====================

window.openRoadmapFeature = (featureId) => {
  window.setState?.({ roadmapFeatureId: featureId, roadmapCommentInput: null })
}

window.closeRoadmapFeature = () => {
  window.setState?.({ roadmapFeatureId: null, roadmapCommentInput: null })
}

window.setRoadmapListTab = (tab) => {
  window.setState?.({ roadmapListTab: tab })
}

window.roadmapVote = (featureId) => {
  const votes = getRoadmapVotes()
  if (votes[featureId] === 'up') {
    delete votes[featureId]
  } else {
    votes[featureId] = 'up'
  }
  localStorage.setItem('spothitch_roadmap_votes', JSON.stringify(votes))
  window.render?.()
}

window.roadmapVoteDetail = (featureId, vote) => {
  const votes = getRoadmapVotes()
  if (votes[featureId] === vote) {
    delete votes[featureId]
  } else {
    votes[featureId] = vote
  }
  localStorage.setItem('spothitch_roadmap_votes', JSON.stringify(votes))
  window.render?.()
}

window.roadmapShowCommentInput = (featureId) => {
  const state = window.getState?.() || {}
  if (!state.isLoggedIn) {
    window.showToast?.(t('loginRequired') || 'Connecte-toi pour commenter', 'warning')
    return
  }
  window.setState?.({ roadmapCommentInput: featureId })
}

window.roadmapHideCommentInput = () => {
  window.setState?.({ roadmapCommentInput: null })
}

window.submitRoadmapComment = (featureId) => {
  const textarea = document.getElementById('roadmap-comment-input')
  const text = textarea?.value?.trim()
  if (!text) return
  const state = window.getState?.() || {}
  const comments = getRoadmapComments()
  comments.push({
    featureId,
    text: text.slice(0, 500),
    username: state.username || 'Anonyme',
    date: new Date().toLocaleDateString(),
  })
  localStorage.setItem('spothitch_roadmap_comments', JSON.stringify(comments))
  window.setState?.({ roadmapCommentInput: null })
  window.showToast?.(t('roadmapCommentSent') || 'Merci pour ton avis !', 'success')
}

window.openProgressionStats = () => {
  window.setState?.({ showBadges: true })
}

export default { renderProfile }
