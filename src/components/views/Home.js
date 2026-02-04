/**
 * Home View Component
 * Activity feed and popular spots
 */

import { t } from '../../i18n/index.js';
import { renderSpotCard } from '../SpotCard.js';

export function renderHome(state) {
  const topSpots = state.spots
    .filter(s => s.globalRating >= 4.5)
    .slice(0, 5);

  const recentSpots = state.spots
    .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
    .slice(0, 5);

  return `
    <div class="p-4 space-y-6">
      <!-- Welcome Banner -->
      <div class="card p-6 bg-gradient-to-r from-primary-500/20 to-emerald-500/20 border-primary-500/30">
        <div class="flex items-center gap-4">
          <div class="text-4xl">${state.avatar || '🤙'}</div>
          <div>
            <h2 class="text-xl font-bold">Salut ${state.username || 'voyageur'} !</h2>
            <p class="text-slate-400 text-sm">${t('tagline')}</p>
          </div>
        </div>
      </div>
      
      <!-- Map Preview -->
      <div class="card overflow-hidden">
        <div id="home-map" class="h-48 bg-gray-800 relative cursor-pointer" onclick="openFullMap()">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <i class="fas fa-map-marked-alt text-5xl text-primary-400 mb-2"></i>
              <p class="text-slate-400 text-sm">${state.spots?.length || 0} spots disponibles</p>
            </div>
          </div>
        </div>
        <button
          onclick="openFullMap()"
          class="w-full p-3 text-center text-primary-400 hover:bg-white/5 transition-colors"
        >
          <i class="fas fa-expand-arrows-alt mr-2"></i>
          Voir la carte complète
        </button>
      </div>

      <!-- Quick Stats (clickable) -->
      <div class="grid grid-cols-3 gap-3">
        <button onclick="openStats()" class="card p-4 text-center hover:border-primary-500/50 transition-all">
          <div class="text-2xl font-bold gradient-text">${state.spots.length}</div>
          <div class="text-xs text-slate-400">Spots</div>
        </button>
        <button onclick="openStats()" class="card p-4 text-center hover:border-primary-500/50 transition-all">
          <div class="text-2xl font-bold gradient-text">${state.points || 0}</div>
          <div class="text-xs text-slate-400">Points</div>
        </button>
        <button onclick="openStats()" class="card p-4 text-center hover:border-primary-500/50 transition-all">
          <div class="text-2xl font-bold gradient-text">${state.level || 1}</div>
          <div class="text-xs text-slate-400">Niveau</div>
        </button>
      </div>

      <!-- Gamification Section -->
      <section>
        <h3 class="text-lg font-bold mb-4">🎮 Progression</h3>
        <div class="grid grid-cols-2 gap-3">
          <button
            onclick="openBadges()"
            class="card p-4 flex items-center gap-3 hover:border-amber-500/50 transition-all"
          >
            <span class="text-3xl">🏅</span>
            <div class="text-left">
              <div class="font-bold text-white">${state.badges?.length || 0} Badges</div>
              <div class="text-xs text-slate-400">Voir collection</div>
            </div>
          </button>
          <button
            onclick="openChallenges()"
            class="card p-4 flex items-center gap-3 hover:border-purple-500/50 transition-all"
          >
            <span class="text-3xl">🎯</span>
            <div class="text-left">
              <div class="font-bold text-white">Défis</div>
              <div class="text-xs text-slate-400">Quotidien & hebdo</div>
            </div>
          </button>
          <button
            onclick="openShop()"
            class="card p-4 flex items-center gap-3 hover:border-emerald-500/50 transition-all"
          >
            <span class="text-3xl">🛒</span>
            <div class="text-left">
              <div class="font-bold text-white">Boutique</div>
              <div class="text-xs text-slate-400">Récompenses</div>
            </div>
          </button>
          <button
            onclick="openQuiz()"
            class="card p-4 flex items-center gap-3 hover:border-sky-500/50 transition-all"
          >
            <span class="text-3xl">🧠</span>
            <div class="text-left">
              <div class="font-bold text-white">Quiz</div>
              <div class="text-xs text-slate-400">Teste tes savoirs</div>
            </div>
          </button>
        </div>
      </section>
      
      <!-- Top Spots -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">🔥 Top Spots</h3>
          <button 
            onclick="changeTab('spots')"
            class="text-primary-400 text-sm"
          >
            Voir tout →
          </button>
        </div>
        
        <div class="space-y-3">
          ${topSpots.map(spot => renderSpotCard(spot, 'compact')).join('')}
        </div>
      </section>
      
      <!-- Recent Activity -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">🕐 Récemment utilisés</h3>
        </div>
        
        <div class="space-y-3">
          ${recentSpots.map(spot => renderSpotCard(spot, 'compact')).join('')}
        </div>
      </section>
      
      <!-- Quick Actions -->
      <section>
        <h3 class="text-lg font-bold mb-4">⚡ Actions rapides</h3>

        <div class="grid grid-cols-2 gap-3">
          <button
            onclick="openAddSpot()"
            class="card p-4 flex flex-col items-center gap-2 hover:border-primary-500/50 transition-all"
          >
            <i class="fas fa-plus-circle text-2xl text-primary-400"></i>
            <span class="text-sm">${t('addSpot')}</span>
          </button>

          <button
            onclick="changeTab('planner')"
            class="card p-4 flex flex-col items-center gap-2 hover:border-primary-500/50 transition-all"
          >
            <i class="fas fa-route text-2xl text-emerald-400"></i>
            <span class="text-sm">${t('planTrip')}</span>
          </button>

          <button
            onclick="changeTab('chat')"
            class="card p-4 flex flex-col items-center gap-2 hover:border-primary-500/50 transition-all"
          >
            <i class="fas fa-comments text-2xl text-purple-400"></i>
            <span class="text-sm">${t('chat')}</span>
          </button>

          <button
            onclick="openSOS()"
            class="card p-4 flex flex-col items-center gap-2 hover:border-danger-500/50 transition-all"
          >
            <i class="fas fa-exclamation-triangle text-2xl text-danger-400"></i>
            <span class="text-sm">SOS</span>
          </button>
        </div>
      </section>

      <!-- Help Section -->
      <section>
        <button
          onclick="startTutorial()"
          class="w-full card p-4 flex items-center justify-center gap-3 hover:border-amber-500/50 transition-all"
        >
          <span class="text-2xl">📖</span>
          <span class="font-medium">Revoir le tutoriel</span>
          <i class="fas fa-chevron-right text-slate-500"></i>
        </button>
      </section>
    </div>
  `;
}

export default { renderHome };
