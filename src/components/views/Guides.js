/**
 * Guides View Component
 * 6 sections: Getting Started, By Country, Safety, Useful Phrases, Events, Legality
 * Accessible from: Map overlay, Profile, SOS
 */

import { t } from '../../i18n/index.js'
import { countryGuides, getGuideByCode, getUniversalPhrases } from '../../data/guides.js'
import { icon } from '../../utils/icons.js'
import { renderCommunityTips } from '../../services/communityTips.js'
import { renderTipVoteButtons, renderSuggestionForm } from '../../services/feedbackService.js'

// ==================== STATIC DATA: CULTURAL ETIQUETTE (#76) ====================
const ETIQUETTE_DATA = {
  FR: {
    greeting: 'Poignée de main ferme. Entre amis, bises sur les joues (1 à 4 selon la région).',
    hitchhiking: 'Les Français sont souvent curieux, ils aiment converser. Un peu de français est très apprécié.',
    tipping: 'Pas obligatoire, mais laisser des pièces au café ou 5–10 % au restaurant est bien vu.',
    dos: ['Dire bonjour en entrant dans une boutique', 'Vouvoyer les inconnus', 'Apprécier la gastronomie locale'],
    donts: ['Couper la file', 'Parler fort dans les transports', 'Oublier de dire merci'],
  },
  DE: {
    greeting: 'Poignée de main franche au premier contact. Pas de bises entre inconnus.',
    hitchhiking: 'Les Allemands sont ponctuels et directs. Un itinéraire clair aide à obtenir un trajet.',
    tipping: 'Arrondir à l\'euro supérieur ou laisser 5–10 %. Dire le montant total au serveur.',
    dos: ['Être ponctuel', 'Séparer les déchets (poubelles colorées)', 'Respecter le silence le dimanche'],
    donts: ['Traverser au rouge même sans voiture', 'Parler fort inutilement', 'Ignorer les règles locales'],
  },
  ES: {
    greeting: 'Deux bises sur les joues pour tout le monde (même les hommes entre eux dans certaines régions).',
    hitchhiking: 'Les Espagnols sont chaleureux. Montrez de la joie et de l\'enthousiasme.',
    tipping: '5–10 % dans les restaurants, arrondir au café. Pas toujours attendu.',
    dos: ['Dîner tard (21h–23h)', 'Saluer chaque personne individuellement', 'Apprécier la sieste locale'],
    donts: ['Se plaindre de la chaleur', 'Manger en marchant dans les villes historiques', 'Être trop formel'],
  },
  IT: {
    greeting: 'Deux bises sur les joues. Poignée de main en contexte professionnel.',
    hitchhiking: 'Italiens expressifs et généreux. Sourire et gestes sont universels ici.',
    tipping: 'Non obligatoire mais apprécié : 1–2 € au café, 10 % au restaurant si content.',
    dos: ['Apprécier la nourriture locale', 'Être bien habillé en visite d\'église', 'Saluer en entrant'],
    donts: ['Commander un cappuccino après 11h (selon les puristes)', 'Toucher les fruits au marché', 'Se presser'],
  },
  PT: {
    greeting: 'Deux bises (femmes), poignée de main (hommes). Contact chaleureux.',
    hitchhiking: 'Les Portugais sont mélancoliques et hospitaliers. La saudade est dans l\'air.',
    tipping: 'Non obligatoire, mais laisser quelques pièces est apprécié.',
    dos: ['Apprécier le fado', 'Goûter les pastéis de nata', 'Être patient et calme'],
    donts: ['Comparer le Portugal à l\'Espagne', 'Parler espagnol si vous savez un peu de portugais', 'Se précipiter'],
  },
  NL: {
    greeting: 'Poignée de main ou trois bises (alternées). Très directs et informels.',
    hitchhiking: 'Les Néerlandais sont pragmatiques et anglophones. Soyez direct sur votre destination.',
    tipping: 'Optionnel, arrondir ou 5–10 % si le service est bon.',
    dos: ['Faire du vélo (respecter les pistes cyclables)', 'Être direct', 'Être à l\'heure'],
    donts: ['Bloquer une piste cyclable', 'Être indirect ou trop poli (perçu comme suspect)', 'Laisser votre vélo mal attaché'],
  },
  BE: {
    greeting: 'Une bise au nord (Flandre), trois au sud (Wallonie). Poignée de main formelle.',
    hitchhiking: 'Belges discrets et accueillants. L\'humour belge est subtil et apprécié.',
    tipping: 'Service inclus légalement mais un extra (5–10 %) est toujours bienvenu.',
    dos: ['Apprécier la bière et les moules-frites', 'Respecter la division linguistique', 'Parler lentement'],
    donts: ['Confondre belge et français', 'Prendre parti dans les disputes linguistiques', 'Être pressé'],
  },
  PL: {
    greeting: 'Poignée de main ferme. Les hommes baisent parfois la main des femmes.',
    hitchhiking: 'Les Polonais sont hospitaliers et fiers. Quelques mots de polonais font des miracles.',
    tipping: '10–15 % dans les restaurants. Pas toujours attendu.',
    dos: ['Enlever ses chaussures chez l\'hôte', 'Apporter un cadeau si invité', 'Apprécier le bigos et le pierogi'],
    donts: ['Refuser de la nourriture chez quelqu\'un', 'Débuter une conversation sur la guerre', 'Oublier de dire "smacznego" (bon appétit)'],
  },
  CZ: {
    greeting: 'Poignée de main. Contacts physiques réservés aux proches.',
    hitchhiking: 'Les Tchèques sont réservés mais ouverts une fois le contact établi.',
    tipping: '10 % dans les restaurants. Dire le montant total à la caisse.',
    dos: ['Enlever ses chaussures chez l\'hôte', 'Porter un toast avant de boire', 'Apprécier la bière locale'],
    donts: ['Parler fort dans les espaces publics', 'Refuser un verre offert', 'Confondre tchèque et slovaque'],
  },
  HR: {
    greeting: 'Deux bises entre amis. Poignée de main entre hommes.',
    hitchhiking: 'Les Croates sont chaleureux avec les visiteurs. Complimenter le pays aide beaucoup.',
    tipping: '10 % dans les restaurants si satisfait.',
    dos: ['Saluer en croate (dobar dan)', 'Apprécier le café et les conversations longues', 'Respecter les sites naturels'],
    donts: ['Nager dans des zones interdites', 'Sous-évaluer la beauté du pays', 'Oublier de négocier parfois'],
  },
  RO: {
    greeting: 'Poignée de main ou bises entre proches. Le "tu" est vite adopté.',
    hitchhiking: 'L\'auto-stop est très courant en Roumanie. Les gens s\'attendent parfois à être payés (negotiated ride).',
    tipping: '10 % dans les restaurants. Souvent attendu.',
    dos: ['Accepter l\'hospitalité avec grâce', 'Apprécier la cuisine (sarmale, mici)', 'Apprendre "mulțumesc" (merci)'],
    donts: ['Refuser la nourriture offerte', 'Ignorer les anciens', 'Photographier des gens sans permission'],
  },
  HU: {
    greeting: 'Poignée de main. Les Hongrois peuvent sembler réservés au début.',
    hitchhiking: 'Moins commun qu\'avant mais faisable. Être clair sur sa destination.',
    tipping: '10–15 % dans les restaurants. Dire le montant total avant de rendre la monnaie.',
    dos: ['Apprécier le goulasch et les bains thermaux', 'Apprendre "köszönöm" (merci)', 'Être patient'],
    donts: ['Confondre hongrois et autre langue slave', 'Refuser une invitation à manger', 'Parler fort en public'],
  },
  AT: {
    greeting: 'Poignée de main ferme. Formels avec les inconnus (Herr/Frau + nom).',
    hitchhiking: 'Moins répandu qu\'en Allemagne. Stations-service et aires d\'autoroute conseillées.',
    tipping: 'Arrondir ou laisser 5–10 %. Dire le montant total au serveur.',
    dos: ['Respecter le calme (surtout le dimanche)', 'Apprécier la musique classique', 'Être poli et formel'],
    donts: ['Négliger les salutations formelles', 'Faire du bruit la nuit', 'Critiquer la famille impériale'],
  },
  SE: {
    greeting: 'Poignée de main. Pas de bises. Les Suédois respectent l\'espace personnel.',
    hitchhiking: 'Rare mais possible. Soyez patient et très visible.',
    tipping: 'Optionnel, 10–15 % si service excellent.',
    dos: ['Respecter la file d\'attente (la queue est sacrée)', 'Parler à voix basse', 'Apprécier la nature (Allemensrätten)'],
    donts: ['S\'asseoir à côté de quelqu\'un si d\'autres places libres', 'Être trop intrusif', 'Négliger l\'environnement'],
  },
  NO: {
    greeting: 'Poignée de main directe. Très informels une fois le contact établi.',
    hitchhiking: 'Très sûr et pratiqué. Les Norvégiens aident volontiers les voyageurs.',
    tipping: '10–15 % dans les restaurants si apprécié. Pas toujours attendu.',
    dos: ['Respecter la nature (laisser sans trace)', 'Apprécier le silence', 'Être autosuffisant en randonnée'],
    donts: ['Jeter des déchets en nature', 'Sous-estimer la météo', 'Parler trop de politique'],
  },
  GB: {
    greeting: 'Poignée de main. Les bises sont rares sauf entre amis proches.',
    hitchhiking: 'Moins commun qu\'avant. Soyez bien habillé et ayez l\'air fiable.',
    tipping: '10–12.5 % dans les restaurants (parfois inclus). Arrondir dans les pubs.',
    dos: ['Faire la queue sans se plaindre', 'S\'excuser souvent (même sans raison)', 'Parler de la météo'],
    donts: ['Pousser dans une file', 'Être trop direct (perçu comme impoli)', 'Parler fort dans les transports'],
  },
  IE: {
    greeting: 'Poignée de main ou hochement de tête. Très chaleureux et informels.',
    hitchhiking: 'Encore pratiqué surtout en zones rurales. Irlandais très serviables.',
    tipping: '10–15 % dans les restaurants. Pas attendu dans les pubs.',
    dos: ['Apprécier le pub et les sessions de musique', 'Participer aux conversations', 'Rire de soi-même'],
    donts: ['Parler de politique nord-irlandaise avec inconnus', 'Confondre irlandais et britannique', 'Refuser un verre offert'],
  },
  US: {
    greeting: 'Poignée de main ferme et sourire. "How are you?" est une formule, pas une vraie question.',
    hitchhiking: 'Légal dans la plupart des États mais perçu comme inhabituel. Soyez rassurant et clair.',
    tipping: 'Obligatoire de fait : 15–20 % dans les restaurants, taxis, hôtels. Ne pas tiper est un affront.',
    dos: ['Sourire et être amical', 'Respecter les files', 'Dire "please" et "thank you"'],
    donts: ['Parler de politique ou de religion d\'emblée', 'Négliger le pourboire', 'Envahir l\'espace personnel'],
  },
  CA: {
    greeting: 'Poignée de main. Au Québec, deux bises entre proches. Très informels partout.',
    hitchhiking: 'Légal mais moins courant dans les grandes villes. Campagne et Québec plus favorables.',
    tipping: '15–20 % dans les restaurants. Similaire aux États-Unis.',
    dos: ['Être respectueux des deux langues (EN/FR au Québec)', 'Apprécier la nature', 'S\'excuser facilement'],
    donts: ['Confondre canadien et américain', 'Ignorer le français au Québec', 'Sous-estimer les hivers'],
  },
  AU: {
    greeting: 'Poignée de main décontractée. Très informels, "mate" est universel.',
    hitchhiking: 'Légal mais en déclin. Dans les zones reculées (Outback), c\'est encore pratiqué.',
    tipping: 'Non obligatoire, pas attendu. Laisser quelque chose si service exceptionnel.',
    dos: ['Respect de la culture aborigène', 'Apprécier l\'humour local (auto-dérision)', 'Être décontracté'],
    donts: ['Se plaindre de la chaleur', 'Nager sans vérifier les zones (méduses, requins)', 'Négliger la crème solaire'],
  },
}

// ==================== STATIC DATA: VISA INFO (#77) ====================
const VISA_DATA = {
  FR: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  DE: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  ES: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  IT: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  PT: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  NL: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  BE: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  PL: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  CZ: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  HR: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  RO: { eu: 'free', us: '90 jours', duration: '90 jours', onArrival: true },
  HU: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  AT: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  SE: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  NO: { eu: 'free', us: 'free', duration: '90 jours (Schengen)', onArrival: false },
  GB: { eu: 'free (ETA req.)', us: 'free (ETA req.)', duration: '6 mois', onArrival: false },
  IE: { eu: 'free', us: 'free (90 j)', duration: '90 jours', onArrival: false },
  US: { eu: 'ESTA (72h)', us: 'Citoyens', duration: '90 jours (ESTA)', onArrival: false },
  CA: { eu: 'AVE (eTA)', us: 'free', duration: '6 mois', onArrival: false },
  AU: { eu: 'ETA/eVisitor', us: 'ETA', duration: '3 mois', onArrival: false },
}

// ==================== STATIC DATA: CURRENCY INFO (#78) ====================
const CURRENCY_DATA = {
  FR: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['cash', 'card', 'mobile'], budget: '30–50 €/jour' },
  DE: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['cash', 'card', 'mobile'], budget: '25–45 €/jour' },
  ES: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['cash', 'card', 'mobile'], budget: '20–40 €/jour' },
  IT: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['cash', 'card', 'mobile'], budget: '25–45 €/jour' },
  PT: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['cash', 'card', 'mobile'], budget: '20–35 €/jour' },
  NL: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['card', 'mobile', 'cash'], budget: '30–55 €/jour' },
  BE: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['cash', 'card', 'mobile'], budget: '30–50 €/jour' },
  PL: { name: 'Zloty polonais', symbol: 'PLN', rateEUR: 0.23, rateUSD: 0.25, payment: ['cash', 'card', 'mobile'], budget: '15–30 €/jour' },
  CZ: { name: 'Couronne tchèque', symbol: 'CZK', rateEUR: 0.041, rateUSD: 0.044, payment: ['cash', 'card', 'mobile'], budget: '15–30 €/jour' },
  HR: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['cash', 'card', 'mobile'], budget: '25–45 €/jour' },
  RO: { name: 'Leu roumain', symbol: 'RON', rateEUR: 0.2, rateUSD: 0.22, payment: ['cash', 'card', 'mobile'], budget: '15–25 €/jour' },
  HU: { name: 'Forint hongrois', symbol: 'HUF', rateEUR: 0.0026, rateUSD: 0.0028, payment: ['cash', 'card', 'mobile'], budget: '15–30 €/jour' },
  AT: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['cash', 'card', 'mobile'], budget: '30–55 €/jour' },
  SE: { name: 'Couronne suédoise', symbol: 'SEK', rateEUR: 0.088, rateUSD: 0.095, payment: ['card', 'mobile', 'cash'], budget: '35–60 €/jour' },
  NO: { name: 'Couronne norvégienne', symbol: 'NOK', rateEUR: 0.086, rateUSD: 0.093, payment: ['card', 'mobile', 'cash'], budget: '50–90 €/jour' },
  GB: { name: 'Livre sterling', symbol: '£', rateEUR: 1.17, rateUSD: 1.27, payment: ['card', 'mobile', 'cash'], budget: '40–70 €/jour' },
  IE: { name: 'Euro', symbol: '€', rateEUR: 1, rateUSD: 1.08, payment: ['card', 'mobile', 'cash'], budget: '35–60 €/jour' },
  US: { name: 'Dollar US', symbol: '$', rateEUR: 0.93, rateUSD: 1, payment: ['card', 'mobile', 'cash'], budget: '40–80 €/jour' },
  CA: { name: 'Dollar canadien', symbol: 'CAD', rateEUR: 0.68, rateUSD: 0.74, payment: ['card', 'mobile', 'cash'], budget: '35–65 €/jour' },
  AU: { name: 'Dollar australien', symbol: 'AUD', rateEUR: 0.59, rateUSD: 0.64, payment: ['card', 'mobile', 'cash'], budget: '40–70 €/jour' },
}

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
      <!-- Section grid (Design B: 3×2 icon tiles) -->
      <div class="grid grid-cols-3 gap-2">
        ${GUIDE_SECTIONS.map(s => `
          <button
            onclick="setGuideSection('${s.id}')"
            class="flex flex-col items-center gap-2 p-3 rounded-xl font-medium text-xs transition-colors ${
              activeSection === s.id
                ? `bg-${s.color}-500 text-white shadow-lg`
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }"
          >
            <div class="w-10 h-10 rounded-xl ${
              activeSection === s.id
                ? 'bg-white/20'
                : `bg-${s.color}-500/20`
            } flex items-center justify-center">
              ${icon(s.icon, `w-5 h-5 ${activeSection === s.id ? 'text-white' : `text-${s.color}-400`}`)}
            </div>
            <span class="text-center leading-tight">${t(s.labelKey) || s.fallback}</span>
          </button>
        `).join('')}
      </div>

      <!-- Section content -->
      ${renderSection(activeSection, state)}
    </div>
  `
}

function renderSection(section, _state) {
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
      ${tips.map((tip, i) => `
        <div class="card p-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              ${icon(tip.icon, 'w-5 h-5 text-amber-400')}
            </div>
            <div class="flex-1">
              <div class="font-medium mb-1">${tip.title}</div>
              <p class="text-sm text-slate-400 leading-relaxed">${tip.desc}</p>
              ${renderTipVoteButtons('start', i)}
            </div>
          </div>
        </div>
      `).join('')}

      ${renderSuggestionForm('start')}
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
            class="card p-4 text-left hover:border-primary-500/50 transition-colors guide-card"
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
      ${rules.map((r, i) => `
        <div class="card p-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-${r.color}-500/20 flex items-center justify-center shrink-0">
              ${icon(r.icon, `w-5 h-5 text-${r.color}-400`)}
            </div>
            <div class="flex-1">
              <div class="font-medium mb-1">${r.title}</div>
              <p class="text-sm text-slate-400 leading-relaxed">${r.desc}</p>
              ${renderTipVoteButtons('safety', i)}
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
      <button onclick="openSOS()" class="card p-4 w-full text-left bg-danger-500/10 border-danger-500/30 hover:bg-danger-500/20 transition-colors">
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

      ${renderSuggestionForm('safety')}
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
        <button onclick="selectGuide('${guide.code}')" class="card p-4 w-full text-left hover:border-primary-500/50 transition-colors">
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

// ==================== CULTURAL ETIQUETTE (#76) ====================
function renderEtiquetteSection(code) {
  const data = ETIQUETTE_DATA[code]

  if (!data) {
    return `
      <div class="card p-4">
        <h3 class="font-bold mb-2 flex items-center gap-2">
          ${icon('users', 'w-5 h-5 text-pink-400')}
          ${t('guideEtiquetteTitle') || 'Cultural etiquette'}
        </h3>
        <p class="text-sm text-slate-400">${t('guideEtiquetteGeneric') || 'Be respectful of local customs, always smile and thank your drivers.'}</p>
      </div>
    `
  }

  return `
    <div class="card p-4">
      <h3 class="font-bold mb-3 flex items-center gap-2">
        ${icon('users', 'w-5 h-5 text-pink-400')}
        ${t('guideEtiquetteTitle') || 'Cultural etiquette'}
      </h3>
      <div class="space-y-3">
        <div class="p-3 rounded-xl bg-white/5">
          <div class="flex items-center gap-2 mb-1">
            ${icon('hand-shake', 'w-4 h-4 text-pink-400')}
            <span class="text-xs font-semibold text-pink-300 uppercase tracking-wide">${t('guideEtiquetteGreeting') || 'Greetings'}</span>
          </div>
          <p class="text-sm text-slate-300">${data.greeting}</p>
        </div>
        <div class="p-3 rounded-xl bg-white/5">
          <div class="flex items-center gap-2 mb-1">
            ${icon('thumbs-up', 'w-4 h-4 text-pink-400')}
            <span class="text-xs font-semibold text-pink-300 uppercase tracking-wide">${t('guideEtiquetteHitchhiking') || 'Local hitchhiking'}</span>
          </div>
          <p class="text-sm text-slate-300">${data.hitchhiking}</p>
        </div>
        <div class="p-3 rounded-xl bg-white/5">
          <div class="flex items-center gap-2 mb-1">
            ${icon('coins', 'w-4 h-4 text-pink-400')}
            <span class="text-xs font-semibold text-pink-300 uppercase tracking-wide">${t('guideEtiquetteTipping') || 'Tipping'}</span>
          </div>
          <p class="text-sm text-slate-300">${data.tipping}</p>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div class="flex items-center gap-1.5 mb-2">
              ${icon('check-circle', 'w-4 h-4 text-emerald-400')}
              <span class="text-xs font-semibold text-emerald-300 uppercase tracking-wide">${t('guideEtiquetteDos') || "Do's"}</span>
            </div>
            <ul class="space-y-1">
              ${data.dos.map(d => `<li class="text-xs text-slate-300 flex items-start gap-1">${icon('check', 'w-3 h-3 text-emerald-400 mt-0.5 shrink-0')}<span>${d}</span></li>`).join('')}
            </ul>
          </div>
          <div class="p-3 rounded-xl bg-danger-500/10 border border-danger-500/20">
            <div class="flex items-center gap-1.5 mb-2">
              ${icon('x-circle', 'w-4 h-4 text-danger-400')}
              <span class="text-xs font-semibold text-danger-300 uppercase tracking-wide">${t('guideEtiquetteDonts') || "Don'ts"}</span>
            </div>
            <ul class="space-y-1">
              ${data.donts.map(d => `<li class="text-xs text-slate-300 flex items-start gap-1">${icon('x', 'w-3 h-3 text-danger-400 mt-0.5 shrink-0')}<span>${d}</span></li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
}

// ==================== VISA INFO (#77) ====================
function renderVisaSection(code) {
  const data = VISA_DATA[code]

  if (!data) {
    return `
      <div class="card p-4">
        <h3 class="font-bold mb-2 flex items-center gap-2">
          ${icon('passport', 'w-5 h-5 text-indigo-400')}
          ${t('guideVisaTitle') || 'Visa info'}
        </h3>
        <p class="text-sm text-slate-400">${t('guideVisaCheck') || "Check your embassy's website for the most up-to-date information."}</p>
      </div>
    `
  }

  const freeLabel = t('guideVisaFree') || 'Visa-free'
  const yesLabel = t('guideVisaYes') || 'Yes'
  const noLabel = t('guideVisaNo') || 'No'

  const euBadge = data.eu === 'free'
    ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">${freeLabel}</span>`
    : `<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">${data.eu}</span>`

  const usBadge = data.us === 'free'
    ? `<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">${freeLabel}</span>`
    : `<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">${data.us}</span>`

  const onArrivalBadge = data.onArrival
    ? `<span class="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-xs">${yesLabel}</span>`
    : `<span class="px-2 py-0.5 rounded-full bg-white/10 text-slate-400 text-xs">${noLabel}</span>`

  return `
    <div class="card p-4">
      <h3 class="font-bold mb-3 flex items-center gap-2">
        ${icon('file-text', 'w-5 h-5 text-indigo-400')}
        ${t('guideVisaTitle') || 'Visa info'}
      </h3>
      <div class="space-y-2">
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
          <span class="text-sm text-slate-300">${t('guideVisaEU') || 'EU citizens'}</span>
          ${euBadge}
        </div>
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
          <span class="text-sm text-slate-300">${t('guideVisaUS') || 'US citizens'}</span>
          ${usBadge}
        </div>
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
          <span class="text-sm text-slate-300">${t('guideVisaDuration') || 'Tourist stay duration'}</span>
          <span class="text-sm font-medium text-slate-200">${data.duration}</span>
        </div>
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
          <span class="text-sm text-slate-300">${t('guideVisaOnArrival') || 'Visa on arrival'}</span>
          ${onArrivalBadge}
        </div>
      </div>
      <p class="text-xs text-slate-500 mt-3 flex items-start gap-1.5">
        ${icon('info', 'w-3.5 h-3.5 shrink-0 mt-0.5')}
        ${t('guideVisaDisclaimer') || 'This info is indicative. Always check with your embassy.'}
      </p>
    </div>
  `
}

// ==================== CURRENCY INFO (#78) ====================
function renderCurrencySection(code) {
  const data = CURRENCY_DATA[code]

  if (!data) {
    return `
      <div class="card p-4">
        <h3 class="font-bold mb-2 flex items-center gap-2">
          ${icon('banknote', 'w-5 h-5 text-amber-400')}
          ${t('guideCurrencyTitle') || 'Currency & budget'}
        </h3>
        <p class="text-sm text-slate-400">${t('guideCurrencyUnknown') || 'Consult your bank for current exchange rates.'}</p>
      </div>
    `
  }

  const paymentIcons = {
    cash: { icon: 'banknote', label: t('guideCurrencyPaymentCash') || 'Cash', color: 'text-amber-400 bg-amber-500/20' },
    card: { icon: 'credit-card', label: t('guideCurrencyPaymentCard') || 'Card', color: 'text-primary-400 bg-primary-500/20' },
    mobile: { icon: 'smartphone', label: t('guideCurrencyPaymentMobile') || 'Mobile', color: 'text-emerald-400 bg-emerald-500/20' },
  }

  const rateStr = data.rateEUR === 1
    ? `1 ${data.symbol} = 1.00 EUR / ${data.rateUSD.toFixed(2)} USD`
    : `1 EUR ≈ ${(1 / data.rateEUR).toFixed(2)} ${data.symbol}`

  return `
    <div class="card p-4">
      <h3 class="font-bold mb-3 flex items-center gap-2">
        ${icon('banknote', 'w-5 h-5 text-amber-400')}
        ${t('guideCurrencyTitle') || 'Currency & budget'}
      </h3>
      <div class="space-y-2">
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
          <span class="text-sm text-slate-300">${t('guideCurrencyName') || 'Local currency'}</span>
          <span class="text-sm font-bold text-amber-300">${data.name} (${data.symbol})</span>
        </div>
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
          <span class="text-sm text-slate-300">${t('guideCurrencyRate') || 'Indicative rate'}</span>
          <span class="text-sm font-medium text-slate-200">${rateStr}</span>
        </div>
        <div class="p-2.5 rounded-xl bg-white/5">
          <div class="text-sm text-slate-300 mb-2">${t('guideCurrencyPayment') || 'Common payments'}</div>
          <div class="flex gap-2 flex-wrap">
            ${data.payment.map(p => {
    const pi = paymentIcons[p] || paymentIcons.cash
    return `<span class="flex items-center gap-1 px-2 py-1 rounded-full text-xs ${pi.color}">${icon(pi.icon, 'w-3 h-3')}${pi.label}</span>`
  }).join('')}
          </div>
        </div>
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span class="text-sm text-slate-300">${t('guideCurrencyBudget') || 'Daily backpacker budget'}</span>
          <span class="text-sm font-bold text-amber-300">${data.budget}</span>
        </div>
      </div>
      <p class="text-xs text-slate-500 mt-3 flex items-start gap-1.5">
        ${icon('info', 'w-3.5 h-3.5 shrink-0 mt-0.5')}
        ${t('guideCurrencyRateDisclaimer') || 'Approximate rates, check before you go.'}
      </p>
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
        class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
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

      <!-- B4: Guide sub-tabs -->
      ${(() => {
        const guideTab = window.getState?.()?.guideDetailTab || 'info'
        const tabs = [
          { id: 'info', icon: 'info', label: t('guideTabInfo') || 'Info' },
          { id: 'culture', icon: 'heart', label: t('guideTabCulture') || 'Culture' },
          { id: 'pratique', icon: 'map-pin', label: t('guideTabPractical') || 'Pratique' },
        ]
        return `
        <div class="flex bg-dark-secondary/50 rounded-xl overflow-hidden border border-white/5">
          ${tabs.map(tab => `
            <button
              onclick="setState({guideDetailTab:'${tab.id}'})"
              class="flex-1 py-2.5 px-2 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 ${
                guideTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400 border-b-2 border-primary-500'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }"
            >
              ${icon(tab.icon, 'w-3.5 h-3.5')}
              ${tab.label}
            </button>
          `).join('')}
        </div>
        `
      })()}

      ${(() => {
        const guideTab = window.getState?.()?.guideDetailTab || 'info'
        if (guideTab === 'culture') return renderGuideCultureTab(guide, isEn)
        if (guideTab === 'pratique') return renderGuidePratiqueTab(guide, isEn)
        return renderGuideInfoTab(guide, isEn)
      })()}

      <!-- Suggest a tip -->
      ${renderSuggestionForm(`country_${guide.code}`)}

      <!-- Community Tips -->
      ${renderCommunityTips(guide.code)}

      <!-- Bottom padding for scroll -->
      <div class="h-8"></div>
    </div>
  `
}

function renderGuideInfoTab(guide, isEn) {
  return `
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

      <!-- Tips -->
      <div class="card p-4">
        <h3 class="font-bold mb-3 flex items-center gap-2">
          ${icon('lightbulb', 'w-5 h-5 text-amber-400')}
          ${t('tips') || 'Conseils'}
        </h3>
        <ul class="space-y-2">
          ${(isEn && guide.tipsEn ? guide.tipsEn : guide.tips).map((tip, i) => `
            <li class="flex items-start gap-2">
              ${icon('check', 'w-4 h-4 text-emerald-400 mt-1 shrink-0')}
              <div class="flex-1">
                <span class="text-slate-300 text-sm">${tip}</span>
                ${renderTipVoteButtons(`country_${guide.code}`, i)}
              </div>
            </li>
          `).join('')}
        </ul>
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
  `
}

function renderGuideCultureTab(guide, isEn) {
  return `
      <!-- Phrases -->
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

      <!-- Cultural Etiquette -->
      ${renderEtiquetteSection(guide.code)}

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
  `
}

function renderGuidePratiqueTab(guide, _isEn) {
  return `
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

      <!-- Visa Info -->
      ${renderVisaSection(guide.code)}

      <!-- Currency Info -->
      ${renderCurrencySection(guide.code)}

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
// selectGuide and filterGuides are defined in Travel.js (authoritative source)

export default { renderGuides, renderCountryDetail, renderSafety }
