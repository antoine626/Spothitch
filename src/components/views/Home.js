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
      
      <!-- Quick Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold gradient-text">${state.spots.length}</div>
          <div class="text-xs text-slate-400">Spots</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold gradient-text">${state.points}</div>
          <div class="text-xs text-slate-400">Points</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold gradient-text">${state.level}</div>
          <div class="text-xs text-slate-400">Niveau</div>
        </div>
      </div>
      
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
    </div>
  `;
}

export default { renderHome };
