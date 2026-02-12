/**
 * Guides View Component
 * Country guides and safety information
 */

import { getState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';
import { countryGuides, getGuideByCode, getEasiestCountries } from '../../data/guides.js';
import { icon } from '../../utils/icons.js'

/**
 * Render guides list view
 */
export function renderGuides(state) {
  const { lang = 'fr', searchGuideQuery = '' } = state;

  // Filter guides by search
  let displayGuides = countryGuides;
  if (searchGuideQuery) {
    const query = searchGuideQuery.toLowerCase();
    displayGuides = countryGuides.filter(
      g => g.name.toLowerCase().includes(query) ||
           (g.nameEn && g.nameEn.toLowerCase().includes(query))
    );
  }

  // Sort by difficulty
  const sortedGuides = [...displayGuides].sort((a, b) => a.difficulty - b.difficulty);
  const easiest = getEasiestCountries(3);

  return `
    <div class="guides-view pb-24 overflow-x-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-white/10">
        <h1 class="text-xl font-bold text-white mb-1">Guides Pays</h1>
        <p class="text-slate-400 text-sm">Tout savoir sur l'autostop par pays</p>
      </div>

      <!-- Search -->
      <div class="p-4">
        <label for="guide-search" class="sr-only">Rechercher un pays</label>
        <input
          type="search"
          id="guide-search"
          placeholder="Rechercher un pays..."
          value="${searchGuideQuery}"
          oninput="setState({searchGuideQuery: this.value})"
          class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white
                 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <!-- Quick Stats -->
      <div class="px-4 mb-4">
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white/5 rounded-xl p-3 text-center">
            <div class="text-2xl font-bold text-white">${countryGuides.length}</div>
            <div class="text-xs text-slate-500">Pays</div>
          </div>
          <div class="bg-white/5 rounded-xl p-3 text-center">
            <div class="text-2xl text-white">${easiest[0]?.flag || '🇳🇱'}</div>
            <div class="text-xs text-slate-500">Plus facile</div>
          </div>
          <div class="bg-white/5 rounded-xl p-3 text-center cursor-pointer" onclick="showSafetyPage()">
            <div class="text-2xl">🆘</div>
            <div class="text-xs text-slate-500">Sécurité</div>
          </div>
        </div>
      </div>

      <!-- Featured: Easiest Countries -->
      ${!searchGuideQuery ? `
        <div class="px-4 mb-4">
          <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Les plus faciles
          </h2>
          <div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            ${easiest.map(guide => `
              <div class="shrink-0 w-32 bg-gradient-to-br from-green-500/20 to-green-600/20
                          border border-green-500/30 rounded-xl p-3 cursor-pointer"
                   onclick="showCountryDetail('${guide.code}')">
                <div class="text-3xl mb-2">${guide.flag}</div>
                <div class="text-white font-medium text-sm">${lang === 'en' && guide.nameEn ? guide.nameEn : guide.name}</div>
                <div class="text-green-400 text-xs">${guide.difficultyText}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- All Countries List -->
      <div class="px-4">
        <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Tous les pays (${sortedGuides.length})
        </h2>
        <div class="space-y-2">
          ${sortedGuides.map(guide => renderGuideCard(guide, lang)).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a guide card
 */
function renderGuideCard(guide, lang = 'fr') {
  const difficultyColors = {
    1: 'text-green-400 bg-green-500/20',
    2: 'text-sky-400 bg-sky-500/20',
    3: 'text-amber-400 bg-amber-500/20',
    4: 'text-orange-400 bg-orange-500/20',
    5: 'text-red-400 bg-red-500/20',
  };
  const color = difficultyColors[guide.difficulty] || difficultyColors[3];
  const name = lang === 'en' && guide.nameEn ? guide.nameEn : guide.name;

  return `
    <div class="guide-card flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer
                hover:bg-white/10 transition-colors"
         onclick="showCountryDetail('${guide.code}')">
      <div class="text-3xl">${guide.flag}</div>
      <div class="flex-1 min-w-0">
        <div class="text-white font-medium">${name}</div>
        <div class="text-slate-500 text-xs truncate">${guide.legalityText}</div>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-1 rounded-full text-xs ${color}">
          ${guide.difficultyText}
        </span>
        <span class="text-slate-500">→</span>
      </div>
    </div>
  `;
}

/**
 * Render country detail page
 */
export function renderCountryDetail(countryCode) {
  const guide = getGuideByCode(countryCode);
  const { lang = 'fr' } = getState();

  if (!guide) {
    return `
      <div class="text-center py-20 text-slate-500">
        <span class="text-4xl">❌</span>
        <p class="mt-4">Pays non trouvé</p>
        <button onclick="showGuides()" class="mt-4 text-sky-400 hover:text-sky-300">
          Retour aux guides
        </button>
      </div>
    `;
  }

  const name = lang === 'en' && guide.nameEn ? guide.nameEn : guide.name;
  const tips = lang === 'en' && guide.tipsEn ? guide.tipsEn : guide.tips;
  const legalityText = lang === 'en' && guide.legalityTextEn ? guide.legalityTextEn : guide.legalityText;
  const difficultyText = lang === 'en' && guide.difficultyTextEn ? guide.difficultyTextEn : guide.difficultyText;

  const difficultyColors = {
    1: 'from-green-500 to-green-600',
    2: 'from-sky-500 to-cyan-500',
    3: 'from-amber-500 to-orange-500',
    4: 'from-orange-500 to-red-500',
    5: 'from-red-500 to-red-600',
  };

  return `
    <div class="country-detail pb-24">
      <!-- Hero Header -->
      <div class="relative h-48 bg-gradient-to-br ${difficultyColors[guide.difficulty] || difficultyColors[3]}">
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-8xl opacity-50">${guide.flag}</span>
        </div>
        <button onclick="showGuides()"
                class="absolute top-4 left-4 p-2 bg-black/30 rounded-full text-white">
          ←
        </button>
        <div class="absolute bottom-4 left-4 right-4">
          <h1 class="text-3xl font-bold text-white">${guide.flag} ${name}</h1>
          <p class="text-white/80">${difficultyText}</p>
        </div>
      </div>

      <!-- Disclaimer Banner -->
      <div class="p-4">
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2">
          ${icon('info-circle', 'w-5 h-5 mt-0.5 shrink-0')}
          <span>Ces conseils sont basés sur des retours de voyageurs. Vérifiez toujours les lois locales avant de partir.</span>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-3 gap-3 p-4 -mt-6 relative z-10">
        <div class="bg-white/5 rounded-xl p-3 text-center shadow-lg">
          <div class="text-xl font-bold text-white">${guide.avgWaitTime}'</div>
          <div class="text-xs text-slate-500">Attente moy.</div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center shadow-lg">
          <div class="text-xl font-bold text-green-400">✓</div>
          <div class="text-xs text-slate-500">Légalité</div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 text-center shadow-lg">
          <div class="text-xl font-bold text-white">${guide.bestMonths?.length || '-'}</div>
          <div class="text-xs text-slate-500">Mois idéaux</div>
        </div>
      </div>

      <!-- Legality Section -->
      <div class="p-4">
        <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Légalité</h2>
        <div class="bg-white/5 rounded-xl p-4">
          <p class="text-white">${legalityText}</p>
        </div>
      </div>

      <!-- Tips Section -->
      <div class="p-4">
        <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Conseils</h2>
        <div class="bg-white/5 rounded-xl p-4 space-y-3">
          ${tips.map(tip => `
            <div class="flex gap-3">
              <span class="text-sky-400">💡</span>
              <p class="text-slate-300 text-sm">${tip}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Best Months -->
      ${guide.bestMonths ? `
        <div class="p-4">
          <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Meilleure période</h2>
          <div class="flex flex-wrap gap-2">
            ${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    .map((month, i) => `
                <span class="px-3 py-1 rounded-full text-sm
                            ${guide.bestMonths.includes(i + 1) ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-slate-500'}">
                  ${month}
                </span>
              `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Emergency Numbers -->
      <div class="p-4">
        <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Numéros d'urgence</h2>
        <div class="grid grid-cols-2 gap-3">
          ${Object.entries(guide.emergencyNumbers || {}).map(([key, number]) => `
            <a href="tel:${number}"
               class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <span class="text-xl">
                ${key === 'police' ? '👮' : key === 'ambulance' ? '🚑' : key === 'fire' ? '🚒' : '📞'}
              </span>
              <div>
                <div class="text-white font-bold">${number}</div>
                <div class="text-slate-500 text-xs capitalize">${key === 'universal' ? 'Universel' : key}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>

      <!-- Best Spots -->
      ${guide.bestSpots ? `
        <div class="p-4">
          <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Meilleurs spots</h2>
          <div class="space-y-2">
            ${guide.bestSpots.map(spot => `
              <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <span class="text-xl">📍</span>
                <span class="text-white">${spot}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Offline Download -->
      <div class="p-4">
        <button
          id="offline-download-${guide.code}"
          onclick="downloadCountryOffline('${guide.code}', '${name}')"
          class="w-full p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-400 text-sm hover:bg-primary-500/20 transition-all flex items-center justify-center gap-2"
        >
          ${icon('download', 'w-5 h-5')}
          Télécharger pour offline
        </button>
      </div>

      <!-- Report Error Button -->
      <div class="p-4 -mt-2">
        <button onclick="reportGuideError('${guide.code}')" class="w-full p-3 rounded-xl border border-slate-600 text-slate-400 text-sm hover:border-red-500/50 hover:text-red-400 transition-all flex items-center justify-center gap-2">
          ${icon('flag', 'w-5 h-5')}
          Signaler une erreur dans ce guide
        </button>
      </div>
    </div>
  `;
}

/**
 * Render safety page
 */
export function renderSafety() {
  return `
    <div class="safety-page pb-24">
      <!-- Header -->
      <div class="sticky top-0 bg-dark-primary/80 backdrop-blur-xl z-10 border-b border-white/10">
        <div class="flex items-center gap-3 p-4">
          <button onclick="showGuides()" class="p-2 hover:bg-white/5 rounded-full">
            ←
          </button>
          <h1 class="text-lg font-bold text-white">Conseils de Sécurité</h1>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 space-y-6">
        <!-- General Safety -->
        <section>
          <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
            🛡️ Sécurité Générale
          </h2>
          <div class="space-y-3">
            ${[
    'Fais confiance à ton instinct - si quelque chose ne va pas, refuse poliment',
    'Informe toujours quelqu\'un de ton itinéraire prévu',
    'Garde ton téléphone chargé et accessible',
    'Note les plaques d\'immatriculation et partage-les',
    'Assieds-toi près de la porte quand possible',
  ].map(tip => `
              <div class="flex gap-3 p-3 bg-white/5 rounded-xl">
                <span class="text-green-400">✓</span>
                <p class="text-slate-300 text-sm">${tip}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- What to Avoid -->
        <section>
          <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
            ⚠️ À éviter
          </h2>
          <div class="space-y-3">
            ${[
    'Ne fais pas de stop la nuit si possible',
    'Évite les véhicules avec plusieurs occupants inconnus',
    'Ne révèle pas où tu loges exactement',
    'N\'accepte pas de nourriture/boissons ouvertes',
    'Ne laisse pas tes affaires hors de ta vue',
  ].map(tip => `
              <div class="flex gap-3 p-3 bg-white/5 rounded-xl">
                <span class="text-red-400">✕</span>
                <p class="text-slate-300 text-sm">${tip}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Women Safety -->
        <section>
          <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
            👩 Conseils pour les femmes
          </h2>
          <div class="space-y-3">
            ${[
    'Privilégie les familles et les couples',
    'Voyage en binôme quand possible',
    'Fais semblant d\'appeler quelqu\'un si tu te sens mal à l\'aise',
    'Porte une alliance factice si tu le souhaites',
    'Aie un numéro d\'urgence en raccourci',
  ].map(tip => `
              <div class="flex gap-3 p-3 bg-white/5 rounded-xl">
                <span class="text-purple-400">💜</span>
                <p class="text-slate-300 text-sm">${tip}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Emergency -->
        <section>
          <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
            🆘 En cas d'urgence
          </h2>
          <div class="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <p class="text-red-400 font-bold mb-3">Numéro européen : 112</p>
            <p class="text-slate-300 text-sm mb-3">
              Ce numéro fonctionne dans toute l'Europe, même sans carte SIM.
            </p>
            <button onclick="openSOS()"
                    class="w-full py-3 bg-red-500 text-white font-bold rounded-xl">
              Activer le mode SOS
            </button>
          </div>
        </section>

        <!-- Checklist -->
        <section>
          <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2" id="checklist-heading">
            <span aria-hidden="true">📋</span> Checklist Voyage
          </h2>
          <div class="space-y-2" role="group" aria-labelledby="checklist-heading">
            ${[
    'Telephone charge + batterie externe',
    'Carte papier en backup',
    'Eau et snacks',
    'Pancarte et feutre',
    'Contacts d\'urgence notes',
    'Copie des documents d\'identite',
    'Premiers soins basiques',
  ].map((item, index) => `
              <label class="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer" for="checklist-item-${index}">
                <input type="checkbox"
                       id="checklist-item-${index}"
                       class="w-5 h-5 rounded bg-white/10 border-white/10
                              text-sky-500 focus:ring-sky-500">
                <span class="text-slate-300">${item}</span>
              </label>
            `).join('')}
          </div>
        </section>
      </div>
    </div>
  `;
}

export default {
  renderGuides,
  renderCountryDetail,
  renderSafety,
};
