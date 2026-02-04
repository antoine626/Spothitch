/**
 * Main App Component
 * Orchestrates all views and modals
 *
 * New Structure:
 * - Map (Carte): Full map with search, scores, add spot button
 * - Travel (Voyage): Planner + Country Guides
 * - Challenges (Défis): Gamification hub
 * - Social: Chat + Friends
 * - Profile: User info + Settings
 */

import { t } from '../i18n/index.js';
import { renderHeader } from './Header.js';
import { renderNavigation } from './Navigation.js';

// Views
import { renderMap, initMainMap } from './views/Map.js';
import { renderTravel } from './views/Travel.js';
import { renderChallengesHub } from './views/ChallengesHub.js';
import { renderSocial } from './views/Social.js';
import { renderProfile } from './views/Profile.js';

// Keep old views for backward compatibility
import { renderHome } from './views/Home.js';
import { renderSpots } from './views/Spots.js';
import { renderChat } from './views/Chat.js';

// Modals
import { renderWelcome } from './modals/Welcome.js';
import { renderSpotDetail } from './modals/SpotDetail.js';
import { renderAddSpot } from './modals/AddSpot.js';
import { renderSOS } from './modals/SOS.js';
import { renderTutorial } from './modals/Tutorial.js';
import { renderAuth } from './modals/Auth.js';
import { renderFiltersModal } from './modals/Filters.js';
import { renderStatsModal } from './modals/Stats.js';
import { renderBadgesModal, renderBadgePopup } from './modals/Badges.js';
import { renderChallengesModal } from './modals/Challenges.js';
import { renderShopModal, renderMyRewardsModal } from './modals/Shop.js';
import { renderQuiz } from './modals/Quiz.js';
import { renderLeaderboardModal } from './modals/Leaderboard.js';

// UI Components
import { renderNavigationOverlay } from './ui/NavigationOverlay.js';
import { renderDonationModal } from './ui/DonationCard.js';

// New Feature Modals
import { renderSkillTree } from '../services/skillTree.js';
import { renderTeamDashboard } from '../services/teamChallenges.js';
import { renderTravelGroupsList, renderTravelGroupDetail } from '../services/travelGroups.js';
import { renderNearbyFriendsWidget, renderNearbyFriendsList } from '../services/nearbyFriends.js';
import { renderCustomizationModal } from '../services/profileCustomization.js';
import { renderAccessibilityHelp } from '../services/screenReader.js';
import { renderReportModal } from '../services/moderation.js';
import { renderSOSTrackingWidget } from '../services/sosTracking.js';

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
    <!-- Skip Link for Accessibility -->
    <a href="#main-content" class="skip-link">
      Aller au contenu principal
    </a>

    ${renderHeader(state)}

    <main id="main-content" class="pb-20 pt-16 min-h-screen" role="main" tabindex="-1">
      ${renderActiveView(state)}
    </main>

    ${renderNavigation(state)}

    <!-- Modals -->
    ${state.selectedSpot ? renderSpotDetail(state) : ''}
    ${state.showAddSpot ? renderAddSpot(state) : ''}
    ${state.showSOS ? renderSOS(state) : ''}
    ${state.showAuth ? renderAuth(state) : ''}
    ${state.showTutorial ? renderTutorial(state) : ''}
    ${state.showFilters ? renderFiltersModal() : ''}
    ${state.showStats ? renderStatsModal() : ''}
    ${state.showBadges ? renderBadgesModal() : ''}
    ${state.showChallenges ? renderChallengesModal() : ''}
    ${state.showShop ? renderShopModal() : ''}
    ${state.showMyRewards ? renderMyRewardsModal() : ''}
    ${state.showQuiz ? renderQuiz() : ''}
    ${state.showLeaderboard ? renderLeaderboardModal() : ''}
    ${state.newBadge ? renderBadgePopup(state.newBadge) : ''}

    <!-- Navigation Overlay -->
    ${state.navigationActive ? renderNavigationOverlay(state) : ''}

    <!-- Donation Modal -->
    ${state.showDonation ? renderDonationModal(state) : ''}

    <!-- New Feature Modals -->
    ${state.showSkillTree ? renderSkillTree(state) : ''}
    ${state.showProfileCustomization ? renderCustomizationModal(state) : ''}
    ${state.showNearbyFriends ? renderNearbyFriendsList(state) : ''}
    ${state.showReport ? renderReportModal(state) : ''}
    ${state.showAccessibilityHelp ? renderAccessibilityHelp(state) : ''}
    ${state.showTravelGroupDetail ? renderTravelGroupDetail(state) : ''}

    <!-- Floating Widgets -->
    ${renderNearbyFriendsWidget(state)}
    ${renderSOSTrackingWidget(state)}
  `;
}

/**
 * Render the active view based on current tab
 */
function renderActiveView(state) {
  switch (state.activeTab) {
    // New structure
    case 'map':
      return renderMap(state);
    case 'travel':
      return renderTravel(state);
    case 'challenges':
      return renderChallengesHub(state);
    case 'social':
      return renderSocial(state);
    case 'profile':
      return renderProfile(state);

    // Old structure (backward compatibility)
    case 'home':
      return renderMap(state); // Redirect to new map
    case 'spots':
      return renderSpots(state);
    case 'planner':
      return renderTravel(state); // Redirect to new travel
    case 'chat':
      return renderSocial(state); // Redirect to new social

    default:
      return renderMap(state);
  }
}

/**
 * Post-render hook to initialize map
 */
export function afterRender(state) {
  if (state.activeTab === 'map' || state.activeTab === 'home') {
    setTimeout(() => initMainMap(state), 100);
  }
}

export default { renderApp, afterRender };
