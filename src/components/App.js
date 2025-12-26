/**
 * Main App Component
 * Orchestrates all views and modals
 */

import { t } from '../i18n/index.js';
import { renderHeader } from './Header.js';
import { renderNavigation } from './Navigation.js';
import { renderHome } from './views/Home.js';
import { renderSpots } from './views/Spots.js';
import { renderChat } from './views/Chat.js';
import { renderProfile } from './views/Profile.js';
import { renderWelcome } from './modals/Welcome.js';
import { renderSpotDetail } from './modals/SpotDetail.js';
import { renderAddSpot } from './modals/AddSpot.js';
import { renderSOS } from './modals/SOS.js';
import { renderTutorial } from './modals/Tutorial.js';
import { renderAuth } from './modals/Auth.js';

/**
 * Render the complete application
 */
export function renderApp(state) {
  // Show welcome screen for new users
  if (state.showWelcome && !state.username) {
    return renderWelcome(state);
  }
  
  // Main app content
  return `
    ${renderHeader(state)}
    
    <main class="pb-20 pt-16 min-h-screen">
      ${renderActiveView(state)}
    </main>
    
    ${renderNavigation(state)}
    
    <!-- FAB Button -->
    ${state.activeTab === 'spots' ? `
      <button 
        onclick="openAddSpot()"
        class="fab"
        aria-label="${t('addSpot')}"
      >
        <i class="fas fa-plus"></i>
      </button>
    ` : ''}
    
    <!-- Modals -->
    ${state.selectedSpot ? renderSpotDetail(state) : ''}
    ${state.showAddSpot ? renderAddSpot(state) : ''}
    ${state.showSOS ? renderSOS(state) : ''}
    ${state.showAuth ? renderAuth(state) : ''}
    ${state.showTutorial ? renderTutorial(state) : ''}
  `;
}

/**
 * Render the active view based on current tab
 */
function renderActiveView(state) {
  switch (state.activeTab) {
    case 'home':
      return renderHome(state);
    case 'spots':
      return renderSpots(state);
    case 'planner':
      return renderPlanner(state);
    case 'chat':
      return renderChat(state);
    case 'profile':
      return renderProfile(state);
    default:
      return renderHome(state);
  }
}

/**
 * Render Trip Planner (simplified for now)
 */
function renderPlanner(state) {
  return `
    <div class="p-4">
      <h2 class="text-2xl font-bold gradient-text mb-6">${t('planTrip')}</h2>
      
      <div class="card p-6 mb-4">
        <div class="space-y-4">
          <div>
            <label class="text-sm text-slate-400 block mb-2">${t('startCity')}</label>
            <input 
              type="text" 
              class="input-modern"
              placeholder="Paris, France"
            />
          </div>
          
          <div>
            <label class="text-sm text-slate-400 block mb-2">${t('endCity')}</label>
            <input 
              type="text" 
              class="input-modern"
              placeholder="Barcelona, Spain"
            />
          </div>
          
          <button class="btn btn-primary w-full">
            <i class="fas fa-route mr-2"></i>
            ${t('planTrip')}
          </button>
        </div>
      </div>
      
      <div class="text-center text-slate-400 py-8">
        <i class="fas fa-car-side text-4xl mb-4"></i>
        <p>${t('noTrips')}</p>
      </div>
    </div>
  `;
}

export default { renderApp };
