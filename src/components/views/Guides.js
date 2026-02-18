/**
 * Guides View Component
 * 6 sections: Getting Started, By Country, Safety, Useful Phrases, Events, Legality
 * Accessible from: Map overlay, Profile, SOS
 */

import { t } from '../../i18n/index.js'
import { countryGuides, getGuideByCode, getUniversalPhrases } from '../../data/guides.js'
import { icon } from '../../utils/icons.js'
import { renderCommunityTips } from '../../services/communityTips.js'

const GUIDE_SECTIONS = [
  { id: 'start', icon: 'compass', color: 'amber', labelKey: 'guideStart', fallback: 'Débuter' },
  { id: 'countries', icon: 'globe', color: 'primary', labelKey: 'guideCountries', fallback: 'Par pays' },
  { id: 'safety', icon: 'shield', color: 'emerald', labelKey: 'guideSafety', fallback: 'Sécurité' },
  { id: 'phrases', icon: 'message-circle', color: 'purple', labelKey: 'guidePhrases', fallback: 'Phrases utiles' },
  { id: 'events', icon: 'calendar', color: 'pink', labelKey: 'guideEvents', fallback: 'Événements' },
  { id: 'legality', icon: 'scale', color: 'blue', labelKey: 'guideLegality', fallback: 'Légalité' },
]

export function renderGuides(state) {
  const activeSection = state.guideSection || 'start'
  const selectedGuide = state.selectedCountryGuide ? getGuideByCode(state.selectedCountryGuide) : null

  if (selectedGuide) {
    return renderCountryDetail(selectedGuide)
  }

  return `
    <div class="space-y-4">
      <!-- Section tabs (scrollable pills) -->
      <div class="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        ${GUIDE_SECTIONS.map(s => `
          <button
            onclick="setGuideSection('${s.id}')"
            class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
  activeSection === s.id
    ? `bg-${s.color}-500 text-white`
    : 'bg-white/5 text-slate-400 hover:bg-white/10'
}"
          >
            ${icon(s.icon, 'w-4 h-4')}
            ${t(s.labelKey) || s.fallback}
          </button>
        `).join('')}
      </div>

      <!-- Section content -->
      ${renderSection(activeSection, state)}
    </div>
  `
}

function renderSection(section, state) {
  switch (section) {
    case 'start': return renderStartSection()
    case 'countries': return renderCountriesSection()
    case 'safety': return renderSafetySection()
    case 'phrases': return renderPhrasesSection()
    case 'events': return renderEventsSection()
    case 'legality': return renderLegalitySection()
    default: return renderStartSection()
  }
}

// ==================== DÉBUTER ====================
function renderStartSection() {
  const tips = [
    { icon: 'map-pin', title: t('guideStartSpot') || 'Choisir son spot', desc: t('guideStartSpotDesc') || 'Sortie de ville, station-service, aire de péage. Là où les voitures ralentissent et peuvent s\'arrêter en sécurité.' },
    { icon: 'pen-tool', title: t('guideStartSign') || 'Le panneau', desc: t('guideStartSignDesc') || 'Un carton avec la destination en gros. Privilégiez les villes intermédiaires connues plutôt que la destination finale.' },
    { icon: 'smile', title: t('guideStartAttitude') || 'L\'attitude', desc: t('guideStartAttitudeDesc') || 'Sourire, contact visuel, apparence soignée. Enlevez lunettes de soleil et capuche pour inspirer confiance.' },
    { icon: 'briefcase', title: t('guideStartGear') || 'L\'équipement', desc: t('guideStartGearDesc') || 'Un sac pas trop gros, de l\'eau, des snacks, un chargeur, une lampe frontale et une carte papier en backup.' },
    { icon: 'clock', title: t('guideStartTiming') || 'Le timing', desc: t('guideStartTimingDesc') || 'Partez tôt le matin (7-9h). Évitez la nuit et le dimanche quand le trafic est faible.' },
    { icon: 'shield', title: t('guideStartSafety') || 'La sécurité', desc: t('guideStartSafetyDesc') || 'Faites confiance à votre instinct. Partagez votre position avec un proche. N\'hésitez jamais à refuser un trajet.' },
  ]

  return `
    <div class="space-y-3">
      <div class="card p-4 bg-amber-500/10 border-amber-500/20">
        <h3 class="font-bold text-lg mb-1">${t('guideStartTitle') || 'Prêt à lever le pouce ?'}</h3>
        <p class="text-sm text-slate-400">${t('guideStartIntro') || 'Les bases de l\'auto-stop pour les débutants comme les confirmés.'}</p>
      </div>
      ${tips.map(tip => `
        <div class="card p-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              ${icon(tip.icon, 'w-5 h-5 text-amber-400')}
            </div>
            <div>
              <div class="font-medium mb-1">${tip.title}</div>
              <p class="text-sm text-slate-400 leading-relaxed">${tip.desc}</p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

// ==================== PAR PAYS ====================
function renderCountriesSection() {
  const sortedGuides = [...countryGuides].sort((a, b) => a.difficulty - b.difficulty)

  return `
    <div class="space-y-3">
      <div class="relative">
        <input
          type="text"
          placeholder="${t('searchCountry') || 'Rechercher un pays...'}"
          class="input-field w-full pl-10"
          oninput="filterGuides(this.value)"
          aria-label="${t('searchCountry') || 'Rechercher un pays'}"
        />
        ${icon('search', 'w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400')}
      </div>

      <div class="flex flex-wrap gap-2 text-xs">
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
          ${icon('smile', 'w-4 h-4')} ${t('veryEasy') || 'Très facile'}
        </span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/20 text-primary-400">
          ${icon('meh', 'w-4 h-4')} ${t('easy') || 'Facile'}
        </span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
          ${icon('frown', 'w-4 h-4')} ${t('medium') || 'Moyen'}
        </span>
      </div>

      <div id="guides-list" class="grid grid-cols-2 gap-3">
        ${sortedGuides.map(guide => `
          <button
            onclick="selectGuide('${guide.code}')"
            class="card p-4 text-left hover:border-primary-500/50 transition-all guide-card"
            data-country="${guide.name.toLowerCase()} ${(guide.nameEn || '').toLowerCase()}"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-3xl">${guide.flag}</span>
              <div>
                <div class="font-bold">${guide.name}</div>
                <div class="text-xs ${
  guide.difficulty === 1 ? 'text-emerald-400' :
    guide.difficulty === 2 ? 'text-primary-400' : 'text-amber-400'
}">${guide.difficultyText}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-400">
              ${icon('clock', 'w-4 h-4')}
              <span>~${guide.avgWaitTime} min</span>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
  `
}

// ==================== SÉCURITÉ ====================
function renderSafetySection() {
  const rules = [
    { icon: 'eye', color: 'emerald', title: t('guideSafetyTrust') || 'Faites confiance à votre instinct', desc: t('guideSafetyTrustDesc') || 'Si quelque chose ne va pas, refusez le trajet. Mieux vaut attendre que monter dans une voiture suspecte.' },
    { icon: 'map-pin', color: 'primary', title: t('guideSafetyPosition') || 'Partagez votre position', desc: t('guideSafetyPositionDesc') || 'Utilisez le mode compagnon de SpotHitch pour partager votre trajet en temps réel avec vos proches.' },
    { icon: 'phone', color: 'danger', title: t('guideSafetyPhone') || 'Téléphone chargé', desc: t('guideSafetyPhoneDesc') || 'Gardez toujours votre téléphone chargé. Emportez une batterie externe. Notez les numéros d\'urgence.' },
    { icon: 'users', color: 'purple', title: t('guideSafetyGroup') || 'Voyagez à deux', desc: t('guideSafetyGroupDesc') || 'Voyager en binôme est plus sûr, surtout pour les débutants et la nuit. Utilisez SpotHitch pour trouver un compagnon.' },
    { icon: 'moon', color: 'amber', title: t('guideSafetyNight') || 'Évitez la nuit', desc: t('guideSafetyNightDesc') || 'L\'auto-stop de nuit est déconseillé. Si vous êtes coincé, trouvez un endroit sûr pour dormir.' },
    { icon: 'car', color: 'blue', title: t('guideSafetyCar') || 'Montez informé', desc: t('guideSafetyCarDesc') || 'Avant de monter : vérifiez la plaque, le visage du conducteur, demandez où il va. Gardez votre sac accessible.' },
  ]

  const womenTips = [
    t('guideSafetyWomen1') || 'Privilégiez les familles et les couples',
    t('guideSafetyWomen2') || 'Voyagez en binôme quand possible',
    t('guideSafetyWomen3') || 'Faites semblant d\'appeler quelqu\'un si mal à l\'aise',
    t('guideSafetyWomen4') || 'Ayez un numéro d\'urgence en raccourci',
  ]

  return `
    <div class="space-y-3">
      <div class="card p-4 bg-emerald-500/10 border-emerald-500/20">
        <h3 class="font-bold text-lg mb-1">${t('guideSafetyTitle') || 'Voyager en sécurité'}</h3>
        <p class="text-sm text-slate-400">${t('guideSafetyIntro') || 'Les règles d\'or pour un auto-stop serein.'}</p>
      </div>
      ${rules.map(r => `
        <div class="card p-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-${r.color}-500/20 flex items-center justify-center shrink-0">
              ${icon(r.icon, `w-5 h-5 text-${r.color}-400`)}
            </div>
            <div>
              <div class="font-medium mb-1">${r.title}</div>
              <p class="text-sm text-slate-400 leading-relaxed">${r.desc}</p>
            </div>
          </div>
        </div>
      `).join('')}

      <!-- Women safety -->
      <div class="card p-4 border-purple-500/20">
        <h4 class="font-medium mb-3 flex items-center gap-2">
          ${icon('heart', 'w-5 h-5 text-purple-400')}
          ${t('guideSafetyWomenTitle') || 'Conseils pour les femmes'}
        </h4>
        <div class="space-y-2">
          ${womenTips.map(tip => `
            <div class="flex items-start gap-2 text-sm">
              ${icon('check', 'w-4 h-4 text-purple-400 mt-0.5 shrink-0')}
              <span class="text-slate-400">${tip}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- SOS reminder -->
      <button onclick="openSOS()" class="card p-4 w-full text-left bg-danger-500/10 border-danger-500/30 hover:bg-danger-500/20 transition-all">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-danger-500/30 flex items-center justify-center">
            ${icon('triangle-alert', 'w-5 h-5 text-danger-400')}
          </div>
          <div>
            <div class="font-medium text-danger-400">${t('guideSafetySOS') || 'En cas d\'urgence'}</div>
            <p class="text-sm text-slate-400">${t('guideSafetySOSDesc') || 'Le bouton SOS est toujours en haut de l\'écran.'}</p>
          </div>
        </div>
      </button>

      <!-- Checklist -->
      <div class="card p-4">
        <h4 class="font-medium mb-3 flex items-center gap-2">
          ${icon('clipboard-list', 'w-5 h-5 text-amber-400')}
          ${t('guideChecklist') || 'Checklist avant de partir'}
        </h4>
        <div class="space-y-2">
          ${[
    t('guideCheckItem1') || 'Téléphone chargé + batterie externe',
    t('guideCheckItem2') || 'Eau et snacks',
    t('guideCheckItem3') || 'Panneau et feutre',
    t('guideCheckItem4') || 'Contacts d\'urgence notés',
    t('guideCheckItem5') || 'Carte papier en backup',
    t('guideCheckItem6') || 'Copie des documents d\'identité',
  ].map(item => `
            <div class="flex items-center gap-2 text-sm">
              ${icon('square', 'w-4 h-4 text-slate-400 shrink-0')}
              <span class="text-slate-400">${item}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `
}

// ==================== PHRASES UTILES ====================
function renderPhrasesSection() {
  const lang = window.getState?.()?.lang || 'fr'
  const isEn = lang === 'en'

  return `
    <div class="space-y-3">
      <div class="card p-4 bg-purple-500/10 border-purple-500/20">
        <h3 class="font-bold text-lg mb-1">${t('guidePhrasesTitle') || 'Phrases utiles'}</h3>
        <p class="text-sm text-slate-400">${t('guidePhrasesIntro') || '5 phrases essentielles pour l\'auto-stop, traduites dans chaque langue.'}</p>
      </div>
      ${countryGuides.map(guide => {
        const phrases = getUniversalPhrases(guide.code)
        return `
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-2xl">${guide.flag}</span>
            <span class="font-bold">${guide.name}</span>
          </div>
          <div class="space-y-2">
            ${phrases.map(p => `
              <div class="p-2.5 rounded-xl bg-white/5">
                <div class="font-medium text-sm text-purple-300">"${p.local}"</div>
                <div class="text-xs text-slate-400 mt-1">${isEn ? p.meaningEn : p.meaning}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `}).join('')}
    </div>
  `
}

// ==================== ÉVÉNEMENTS ====================
function renderEventsSection() {
  const countriesWithEvents = countryGuides.filter(g => g.events && g.events.length > 0)
  const lang = window.getState?.()?.lang || 'fr'
  const isEn = lang === 'en'

  return `
    <div class="space-y-3">
      <div class="card p-4 bg-pink-500/10 border-pink-500/20">
        <h3 class="font-bold text-lg mb-1">${t('guideEventsTitle') || 'Événements & Festivals'}</h3>
        <p class="text-sm text-slate-400">${t('guideEventsIntro') || 'Les événements qui impactent le trafic et les opportunités de trajet.'}</p>
      </div>
      ${countriesWithEvents.map(guide => `
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-2xl">${guide.flag}</span>
            <span class="font-bold">${guide.name}</span>
          </div>
          <div class="space-y-2">
            ${guide.events.map(event => {
    const eventName = (isEn && event.nameEn) ? event.nameEn : event.name
    const eventDate = (isEn && event.dateEn) ? event.dateEn : event.date
    const eventDesc = (isEn && event.descriptionEn) ? event.descriptionEn : event.description
    const typeColor = event.type === 'festival' ? 'text-pink-400 bg-pink-500/20' : event.type === 'gathering' ? 'text-cyan-400 bg-cyan-500/20' : 'text-amber-400 bg-amber-500/20'
    return `
              <div class="flex items-start gap-3 p-2.5 rounded-xl bg-white/5">
                <div class="shrink-0 w-8 h-8 rounded-full ${typeColor} flex items-center justify-center">
                  ${icon(event.type === 'festival' ? 'music' : event.type === 'gathering' ? 'users' : 'flag', 'w-4 h-4')}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-sm">${eventName}</span>
                    <span class="text-xs text-slate-400">${eventDate}</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">${eventDesc}</p>
                </div>
              </div>
            `
  }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `
}

// ==================== LÉGALITÉ ====================
function renderLegalitySection() {
  const sortedByLegality = [...countryGuides].sort((a, b) => {
    const order = { legal: 0, mostly_legal: 1, gray: 2, restricted: 3 }
    return (order[a.legality] || 2) - (order[b.legality] || 2)
  })

  const legalityColors = {
    legal: 'text-emerald-400 bg-emerald-500/20',
    mostly_legal: 'text-primary-400 bg-primary-500/20',
    gray: 'text-amber-400 bg-amber-500/20',
    restricted: 'text-danger-400 bg-danger-500/20',
  }

  const legalityLabels = {
    legal: t('legalityLegal') || 'Légal',
    mostly_legal: t('legalityMostlyLegal') || 'Quasi légal',
    gray: t('legalityGray') || 'Zone grise',
    restricted: t('legalityRestricted') || 'Restreint',
  }

  return `
    <div class="space-y-3">
      <div class="card p-4 bg-blue-500/10 border-blue-500/20">
        <h3 class="font-bold text-lg mb-1">${t('guideLegalityTitle') || 'Légalité par pays'}</h3>
        <p class="text-sm text-slate-400">${t('guideLegalityIntro') || 'Le statut légal de l\'auto-stop varie selon les pays.'}</p>
      </div>

      <div class="flex flex-wrap gap-2 text-xs">
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">${legalityLabels.legal}</span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/20 text-primary-400">${legalityLabels.mostly_legal}</span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">${legalityLabels.gray}</span>
        <span class="flex items-center gap-1 px-2 py-1 rounded-full bg-danger-500/20 text-danger-400">${legalityLabels.restricted}</span>
      </div>

      ${sortedByLegality.map(guide => `
        <button onclick="selectGuide('${guide.code}')" class="card p-4 w-full text-left hover:border-primary-500/50 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${guide.flag}</span>
              <div>
                <div class="font-medium">${guide.name}</div>
                <div class="text-xs text-slate-400 mt-0.5 line-clamp-1">${guide.legalityText}</div>
              </div>
            </div>
            <span class="px-2 py-1 rounded-full text-xs font-medium shrink-0 ${legalityColors[guide.legality] || legalityColors.gray}">
              ${legalityLabels[guide.legality] || legalityLabels.gray}
            </span>
          </div>
        </button>
      `).join('')}
    </div>
  `
}

// ==================== COUNTRY DETAIL ====================
export function renderCountryDetail(guideOrCode) {
  const guide = typeof guideOrCode === 'string' ? getGuideByCode(guideOrCode) : guideOrCode
  if (!guide) return ''

  const difficultyColors = {
    1: 'text-emerald-400 bg-emerald-500/20',
    2: 'text-primary-400 bg-primary-500/20',
    3: 'text-amber-400 bg-amber-500/20',
  }
  const lang = window.getState?.()?.lang || 'fr'
  const isEn = lang === 'en'

  return `
    <div class="space-y-4">
      <button
        onclick="selectGuide(null)"
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-all"
      >
        ${icon('arrow-left', 'w-5 h-5')}
        ${t('backToGuides') || 'Retour aux guides'}
      </button>

      <div class="card p-6 text-center">
        <span class="text-6xl mb-4 block">${guide.flag}</span>
        <h2 class="text-2xl font-bold mb-2">${guide.name}</h2>
        <div class="flex justify-center gap-3 flex-wrap">
          <span class="px-3 py-1 rounded-full text-sm ${difficultyColors[guide.difficulty]}">${guide.difficultyText}</span>
          <span class="px-3 py-1 rounded-full text-sm bg-white/10 text-slate-300">~${guide.avgWaitTime} ${t('minWait') || "min d'attente"}</span>
        </div>
      </div>

      <!-- Legality -->
      <div class="card p-4">
        <h3 class="font-bold mb-2 flex items-center gap-2">
          ${icon('scale', 'w-5 h-5 text-blue-400')}
          ${t('legality') || 'Légalité'}
        </h3>
        <p class="text-slate-300 mb-3">${isEn && guide.legalityTextEn ? guide.legalityTextEn : guide.legalityText}</p>
        ${guide.laws && guide.laws.length > 0 ? `
          <ul class="space-y-1.5">
            ${(isEn && guide.lawsEn ? guide.lawsEn : guide.laws).map(law => `
              <li class="flex items-start gap-2 text-sm">
                ${icon('info', 'w-4 h-4 text-blue-400 mt-0.5 shrink-0')}
                <span class="text-slate-400">${law}</span>
              </li>
            `).join('')}
          </ul>
        ` : ''}
      </div>

      <!-- Tips -->
      <div class="card p-4">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('lightbulb', 'w-5 h-5 text-amber-400')}
          ${t('tips') || 'Conseils'}
        </h3>
        <ul class="space-y-2">
          ${(isEn && guide.tipsEn ? guide.tipsEn : guide.tips).map(tip => `
            <li class="flex items-start gap-2">
              ${icon('check', 'w-4 h-4 text-emerald-400 mt-1 shrink-0')}
              <span class="text-slate-300 text-sm">${tip}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Strategies -->
      ${guide.strategies && guide.strategies.length > 0 ? `
        <div class="card p-4">
          <h3 class="font-bold mb-3 flex items-center gap-2">
            ${icon('target', 'w-5 h-5 text-primary-400')}
            ${t('strategies') || 'Stratégies'}
          </h3>
          <ul class="space-y-2">
            ${(isEn && guide.strategiesEn ? guide.strategiesEn : guide.strategies).map(s => `
              <li class="flex items-start gap-2">
                ${icon('zap', 'w-4 h-4 text-primary-400 mt-1 shrink-0')}
                <span class="text-slate-300 text-sm">${s}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Phrases (5 universal phrases) -->
      <div class="card p-4">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('message-circle', 'w-5 h-5 text-purple-400')}
          ${t('usefulPhrases') || 'Phrases utiles'}
        </h3>
        <div class="space-y-2">
          ${getUniversalPhrases(guide.code).map(p => `
            <div class="p-2.5 rounded-xl bg-white/5">
              <div class="font-medium text-sm text-purple-300">"${p.local}"</div>
              <div class="text-xs text-slate-400 mt-1">${isEn ? p.meaningEn : p.meaning}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Best months -->
      <div class="card p-4">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('calendar', 'w-5 h-5 text-purple-400')}
          ${t('bestMonths') || 'Meilleurs mois'}
        </h3>
        <div class="flex flex-wrap gap-2">
          ${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, i) => `
            <span class="px-3 py-1 rounded-full text-sm ${
  guide.bestMonths.includes(i + 1)
    ? 'bg-emerald-500/20 text-emerald-400'
    : 'bg-white/5 text-slate-400'
}">${month}</span>
          `).join('')}
        </div>
      </div>

      <!-- Best spots -->
      ${guide.bestSpots && guide.bestSpots.length > 0 ? `
        <div class="card p-4">
          <h3 class="font-bold mb-3 flex items-center gap-2">
            ${icon('map-pin', 'w-5 h-5 text-danger-400')}
            ${t('bestSpots') || 'Meilleurs spots'}
          </h3>
          <div class="space-y-2">
            ${guide.bestSpots.map(spot => `
              <div class="flex items-center gap-2 p-2 rounded-xl bg-white/5">
                ${icon('thumbs-up', 'w-4 h-4 text-primary-400')}
                <span class="text-slate-300 text-sm">${spot}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Emergency numbers -->
      <div class="card p-4 border-danger-500/30">
        <h3 class="font-bold mb-3 flex items-center gap-2 text-danger-400">
          ${icon('phone', 'w-5 h-5')}
          ${t('emergencyNumbers') || "Numéros d'urgence"}
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="text-center p-3 rounded-xl bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Police</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.police}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">Ambulance</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.ambulance}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-danger-500/10">
            <div class="text-xs text-slate-400 mb-1">${t('fire') || 'Pompiers'}</div>
            <div class="font-bold text-lg">${guide.emergencyNumbers.fire}</div>
          </div>
          <div class="text-center p-3 rounded-xl bg-emerald-500/10">
            <div class="text-xs text-slate-400 mb-1">${t('worldwide') || 'Monde'}</div>
            <div class="font-bold text-lg text-emerald-400">${guide.emergencyNumbers.universal}</div>
          </div>
        </div>
      </div>

      <!-- Events -->
      ${guide.events && guide.events.length > 0 ? `
        <div class="card p-4">
          <h3 class="font-bold mb-3 flex items-center gap-2">
            ${icon('calendar', 'w-5 h-5 text-pink-400')}
            ${t('eventsAndFestivals') || 'Événements & festivals'}
          </h3>
          <div class="space-y-2">
            ${guide.events.map(event => {
    const eventName = (isEn && event.nameEn) ? event.nameEn : event.name
    const eventDate = (isEn && event.dateEn) ? event.dateEn : event.date
    const eventDesc = (isEn && event.descriptionEn) ? event.descriptionEn : event.description
    return `
              <div class="p-2.5 rounded-xl bg-white/5">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">${eventName}</span>
                  <span class="text-xs text-slate-400">${eventDate}</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">${eventDesc}</p>
              </div>
            `
  }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Cultural notes -->
      ${guide.culturalNotes ? `
        <div class="card p-4">
          <h3 class="font-bold mb-2 flex items-center gap-2">
            ${icon('heart', 'w-5 h-5 text-pink-400')}
            ${t('culturalNotes') || 'Notes culturelles'}
          </h3>
          <p class="text-slate-300 text-sm leading-relaxed">${isEn && guide.culturalNotesEn ? guide.culturalNotesEn : guide.culturalNotes}</p>
        </div>
      ` : ''}

      <!-- Recommendations -->
      <div class="card p-4 bg-primary-500/10 border-primary-500/20">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('thumbs-up', 'w-5 h-5 text-primary-400')}
          ${t('recommendations') || 'Recommandations'}
        </h3>
        <div class="space-y-2 text-sm text-slate-300">
          <p>${t('guideRecommendation1') || 'Consultez les spots vérifiés par la communauté sur la carte avant de partir.'}</p>
          <p>${t('guideRecommendation2') || 'Activez le mode compagnon pour partager votre trajet en temps réel.'}</p>
          <p>${t('guideRecommendation3') || 'Après chaque trajet, validez les spots que vous avez utilisés pour aider les prochains voyageurs.'}</p>
        </div>
      </div>

      <!-- Community Tips -->
      ${renderCommunityTips(guide.code)}

      <!-- Bottom padding for scroll -->
      <div class="h-8"></div>
    </div>
  `
}

// Render safety page (kept for backward compatibility)
export function renderSafety() {
  return renderSafetySection()
}

// ==================== GLOBAL HANDLERS ====================
window.setGuideSection = (section) => {
  window.setState?.({ guideSection: section })
}

window.selectGuide = (code) => {
  window.setState?.({ selectedCountryGuide: code })
}

window.filterGuides = (query) => {
  const cards = document.querySelectorAll('.guide-card')
  const lowerQuery = query.toLowerCase()
  cards.forEach(card => {
    const country = card.dataset.country || ''
    card.style.display = country.includes(lowerQuery) ? '' : 'none'
  })
}

export default { renderGuides, renderCountryDetail, renderSafety }
