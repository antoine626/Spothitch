/**
 * Companion Search Service
 * Feature #188 - Recherche de compagnons de voyage
 *
 * Search for travel companions by destination, dates, languages
 * Post travel plans and respond to others' plans
 * Matching by compatibility
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { Storage } from '../utils/storage.js';
import { icon } from '../utils/icons.js'

// Storage keys
const TRAVEL_PLANS_KEY = 'spothitch_travel_plans';
const PLAN_RESPONSES_KEY = 'spothitch_plan_responses';
const COMPATIBILITY_CACHE_KEY = 'spothitch_compatibility_cache';

/**
 * Travel plan status enum
 */
export const PlanStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Response status enum
 */
export const ResponseStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  WITHDRAWN: 'withdrawn',
};

/**
 * Compatibility factors and their weights
 */
export const COMPATIBILITY_WEIGHTS = {
  sameDestination: 30,
  overlappingDates: 25,
  sharedLanguages: 20,
  similarExperience: 10,
  mutualFriends: 10,
  verificationLevel: 5,
};

/**
 * Available travel styles
 */
export const TravelStyles = {
  FAST: { id: 'fast', label: 'Rapide', icon: '⚡', description: 'Privilegie la vitesse' },
  RELAXED: { id: 'relaxed', label: 'Detendu', icon: '🌴', description: 'Prend son temps' },
  ADVENTUROUS: { id: 'adventurous', label: 'Aventurier', icon: '🏔️', description: 'Aime les detours' },
  BUDGET: { id: 'budget', label: 'Economique', icon: '💰', description: 'Depenses minimales' },
  SOCIAL: { id: 'social', label: 'Social', icon: '🎉', description: 'Aime les rencontres' },
};

/**
 * Get travel plans from storage
 * @returns {Array}
 */
function getPlansFromStorage() {
  try {
    const data = Storage.get(TRAVEL_PLANS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[CompanionSearch] Error reading plans:', error);
    return [];
  }
}

/**
 * Save travel plans to storage
 * @param {Array} plans
 */
function savePlansToStorage(plans) {
  try {
    Storage.set(TRAVEL_PLANS_KEY, plans);
  } catch (error) {
    console.error('[CompanionSearch] Error saving plans:', error);
  }
}

/**
 * Get responses from storage
 * @returns {Array}
 */
function getResponsesFromStorage() {
  try {
    const data = Storage.get(PLAN_RESPONSES_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[CompanionSearch] Error reading responses:', error);
    return [];
  }
}

/**
 * Save responses to storage
 * @param {Array} responses
 */
function saveResponsesToStorage(responses) {
  try {
    Storage.set(PLAN_RESPONSES_KEY, responses);
  } catch (error) {
    console.error('[CompanionSearch] Error saving responses:', error);
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format date for display
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

/**
 * Check if two date ranges overlap
 * @param {string} start1
 * @param {string} end1
 * @param {string} start2
 * @param {string} end2
 * @returns {boolean}
 */
function datesOverlap(start1, end1, start2, end2) {
  if (!start1 || !start2) return false;

  const s1 = new Date(start1);
  const e1 = end1 ? new Date(end1) : new Date(start1);
  const s2 = new Date(start2);
  const e2 = end2 ? new Date(end2) : new Date(start2);

  return s1 <= e2 && s2 <= e1;
}

/**
 * Count overlapping days between two date ranges
 * @param {string} start1
 * @param {string} end1
 * @param {string} start2
 * @param {string} end2
 * @returns {number}
 */
function countOverlappingDays(start1, end1, start2, end2) {
  if (!datesOverlap(start1, end1, start2, end2)) return 0;

  const s1 = new Date(start1);
  const e1 = end1 ? new Date(end1) : new Date(start1);
  const s2 = new Date(start2);
  const e2 = end2 ? new Date(end2) : new Date(start2);

  const overlapStart = new Date(Math.max(s1, s2));
  const overlapEnd = new Date(Math.min(e1, e2));

  const diffTime = overlapEnd - overlapStart;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Count shared items between two arrays
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {number}
 */
function countSharedItems(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return 0;
  return arr1.filter((item) => arr2.includes(item)).length;
}

// ========================================
// TRAVEL PLAN FUNCTIONS
// ========================================

/**
 * Post a travel plan to find companions
 * @param {Object} plan - Travel plan details
 * @returns {Object}
 */
export function postTravelPlan(plan) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  // Validation
  if (!plan) {
    return { success: false, error: 'invalid_plan' };
  }

  if (!plan.destination && !plan.destinationCity) {
    showToast(t('destinationRequired') || 'La destination est obligatoire', 'error');
    return { success: false, error: 'destination_required' };
  }

  if (!plan.startDate) {
    showToast(t('startDateRequired') || 'La date de depart est obligatoire', 'error');
    return { success: false, error: 'start_date_required' };
  }

  // Check for duplicate active plans
  const plans = getPlansFromStorage();
  const existingActive = plans.find(
    (p) => p.userId === userId && p.status === PlanStatus.ACTIVE
  );

  if (existingActive) {
    showToast(t('alreadyHaveActivePlan') || 'Tu as deja un voyage actif. Pause-le d\'abord.', 'warning');
    return { success: false, error: 'already_has_active_plan' };
  }

  const newPlan = {
    id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    userLevel: state.level || 1,
    verificationLevel: state.verificationLevel || 0,

    // Destination
    destination: plan.destination || plan.destinationCity,
    destinationCountry: plan.destinationCountry || '',
    departure: plan.departure || plan.departureCity || null,
    departureCountry: plan.departureCountry || '',

    // Dates
    startDate: plan.startDate,
    endDate: plan.endDate || null,
    flexibility: plan.flexibility || 0, // days of flexibility

    // Preferences
    languages: plan.languages || ['fr'],
    travelStyle: plan.travelStyle || TravelStyles.RELAXED.id,
    maxCompanions: plan.maxCompanions || 2,
    description: plan.description || '',
    requirements: plan.requirements || [],

    // Status
    status: PlanStatus.ACTIVE,
    responses: [],
    acceptedCount: 0,

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: plan.endDate
      ? new Date(new Date(plan.endDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  plans.push(newPlan);
  savePlansToStorage(plans);

  showToast(t('travelPlanPosted') || 'Ton voyage a ete publie !', 'success');
  return { success: true, plan: newPlan };
}

/**
 * Update a travel plan
 * @param {string} planId
 * @param {Object} updates
 * @returns {Object}
 */
export function updateTravelPlan(planId, updates) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  if (!planId) {
    return { success: false, error: 'invalid_plan_id' };
  }

  const plans = getPlansFromStorage();
  const planIndex = plans.findIndex((p) => p.id === planId);

  if (planIndex === -1) {
    return { success: false, error: 'plan_not_found' };
  }

  const plan = plans[planIndex];

  // Check ownership
  if (plan.userId !== userId) {
    return { success: false, error: 'not_owner' };
  }

  // Apply updates
  const updatedPlan = {
    ...plan,
    ...updates,
    id: plan.id, // Prevent ID change
    userId: plan.userId, // Prevent user change
    updatedAt: new Date().toISOString(),
  };

  plans[planIndex] = updatedPlan;
  savePlansToStorage(plans);

  showToast(t('planUpdated') || 'Voyage mis a jour', 'success');
  return { success: true, plan: updatedPlan };
}

/**
 * Cancel/delete a travel plan
 * @param {string} planId
 * @returns {Object}
 */
export function cancelTravelPlan(planId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const plans = getPlansFromStorage();
  const planIndex = plans.findIndex((p) => p.id === planId);

  if (planIndex === -1) {
    return { success: false, error: 'plan_not_found' };
  }

  const plan = plans[planIndex];

  if (plan.userId !== userId) {
    return { success: false, error: 'not_owner' };
  }

  plan.status = PlanStatus.CANCELLED;
  plan.updatedAt = new Date().toISOString();

  plans[planIndex] = plan;
  savePlansToStorage(plans);

  showToast(t('planCancelled') || 'Voyage annule', 'info');
  return { success: true };
}

/**
 * Get a travel plan by ID
 * @param {string} planId
 * @returns {Object|null}
 */
export function getTravelPlanById(planId) {
  if (!planId) return null;

  const plans = getPlansFromStorage();
  return plans.find((p) => p.id === planId) || null;
}

/**
 * Get current user's travel plans
 * @returns {Array}
 */
export function getMyTravelPlans() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const plans = getPlansFromStorage();
  return plans.filter((p) => p.userId === userId);
}

/**
 * Get active travel plan for current user
 * @returns {Object|null}
 */
export function getMyActivePlan() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const plans = getPlansFromStorage();
  return plans.find((p) => p.userId === userId && p.status === PlanStatus.ACTIVE) || null;
}

// ========================================
// SEARCH FUNCTIONS
// ========================================

/**
 * Search for travel companions matching criteria
 * @param {Object} criteria - Search criteria
 * @returns {Array} Matching travel plans with compatibility scores
 */
export function searchCompanions(criteria = {}) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  let plans = getPlansFromStorage();

  // Filter active plans only
  plans = plans.filter((p) => p.status === PlanStatus.ACTIVE);

  // Exclude own plans
  plans = plans.filter((p) => p.userId !== userId);

  // Filter expired plans
  const now = new Date();
  plans = plans.filter((p) => new Date(p.expiresAt) > now);

  // Filter by destination
  if (criteria.destination) {
    const dest = criteria.destination.toLowerCase();
    plans = plans.filter((p) =>
      (p.destination && p.destination.toLowerCase().includes(dest)) ||
      (p.destinationCountry && p.destinationCountry.toLowerCase().includes(dest))
    );
  }

  // Filter by destination country
  if (criteria.destinationCountry) {
    plans = plans.filter((p) =>
      p.destinationCountry &&
      p.destinationCountry.toLowerCase() === criteria.destinationCountry.toLowerCase()
    );
  }

  // Filter by dates (overlapping)
  if (criteria.startDate) {
    plans = plans.filter((p) =>
      datesOverlap(
        criteria.startDate,
        criteria.endDate || criteria.startDate,
        p.startDate,
        p.endDate || p.startDate
      )
    );
  }

  // Filter by languages (at least one shared)
  if (criteria.languages && criteria.languages.length > 0) {
    plans = plans.filter((p) =>
      countSharedItems(p.languages || [], criteria.languages) > 0
    );
  }

  // Filter by travel style
  if (criteria.travelStyle) {
    plans = plans.filter((p) => p.travelStyle === criteria.travelStyle);
  }

  // Filter by verification level (minimum)
  if (criteria.minVerificationLevel) {
    plans = plans.filter((p) =>
      (p.verificationLevel || 0) >= criteria.minVerificationLevel
    );
  }

  // Calculate compatibility scores
  const plansWithScores = plans.map((plan) => {
    const score = calculateCompatibility(plan, criteria, state);
    return { ...plan, compatibilityScore: score };
  });

  // Sort by compatibility score (highest first)
  plansWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Apply limit
  if (criteria.limit && criteria.limit > 0) {
    return plansWithScores.slice(0, criteria.limit);
  }

  return plansWithScores;
}

/**
 * Calculate compatibility score between a plan and search criteria
 * @param {Object} plan
 * @param {Object} criteria
 * @param {Object} userState
 * @returns {number} Score 0-100
 */
export function calculateCompatibility(plan, criteria = {}, userState = {}) {
  let score = 0;
  let maxScore = 0;

  // Same destination (30 points)
  maxScore += COMPATIBILITY_WEIGHTS.sameDestination;
  if (criteria.destination) {
    const dest = criteria.destination.toLowerCase();
    if (plan.destination && plan.destination.toLowerCase() === dest) {
      score += COMPATIBILITY_WEIGHTS.sameDestination;
    } else if (plan.destination && plan.destination.toLowerCase().includes(dest)) {
      score += COMPATIBILITY_WEIGHTS.sameDestination * 0.5;
    }
  } else {
    score += COMPATIBILITY_WEIGHTS.sameDestination * 0.5; // Neutral
  }

  // Overlapping dates (25 points)
  maxScore += COMPATIBILITY_WEIGHTS.overlappingDates;
  if (criteria.startDate) {
    const overlappingDays = countOverlappingDays(
      criteria.startDate,
      criteria.endDate,
      plan.startDate,
      plan.endDate
    );
    if (overlappingDays > 0) {
      // More overlapping days = higher score
      const overlapRatio = Math.min(overlappingDays / 7, 1); // Cap at 7 days
      score += COMPATIBILITY_WEIGHTS.overlappingDates * overlapRatio;
    }
  } else {
    score += COMPATIBILITY_WEIGHTS.overlappingDates * 0.3; // Small bonus for any dates
  }

  // Shared languages (20 points)
  maxScore += COMPATIBILITY_WEIGHTS.sharedLanguages;
  if (criteria.languages && criteria.languages.length > 0) {
    const sharedCount = countSharedItems(plan.languages || [], criteria.languages);
    if (sharedCount > 0) {
      const langRatio = sharedCount / criteria.languages.length;
      score += COMPATIBILITY_WEIGHTS.sharedLanguages * langRatio;
    }
  } else {
    score += COMPATIBILITY_WEIGHTS.sharedLanguages * 0.5; // Neutral
  }

  // Similar experience level (10 points)
  maxScore += COMPATIBILITY_WEIGHTS.similarExperience;
  if (userState.level) {
    const levelDiff = Math.abs((plan.userLevel || 1) - userState.level);
    if (levelDiff <= 3) {
      score += COMPATIBILITY_WEIGHTS.similarExperience;
    } else if (levelDiff <= 10) {
      score += COMPATIBILITY_WEIGHTS.similarExperience * 0.5;
    }
  } else {
    score += COMPATIBILITY_WEIGHTS.similarExperience * 0.5;
  }

  // Mutual friends (10 points) - would need friends list
  maxScore += COMPATIBILITY_WEIGHTS.mutualFriends;
  // For now, give partial score based on user activity
  score += COMPATIBILITY_WEIGHTS.mutualFriends * 0.3;

  // Verification level (5 points)
  maxScore += COMPATIBILITY_WEIGHTS.verificationLevel;
  const verificationBonus = Math.min((plan.verificationLevel || 0) / 4, 1);
  score += COMPATIBILITY_WEIGHTS.verificationLevel * verificationBonus;

  // Normalize to 0-100
  return Math.round((score / maxScore) * 100);
}

// ========================================
// RESPONSE FUNCTIONS
// ========================================

/**
 * Respond to a travel plan with a message
 * @param {string} planId
 * @param {string} message
 * @returns {Object}
 */
export function respondToTravelPlan(planId, message) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  if (!planId) {
    return { success: false, error: 'invalid_plan_id' };
  }

  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    showToast(t('messageRequired') || 'Ecris un message (min 5 caracteres)', 'error');
    return { success: false, error: 'message_required' };
  }

  const plans = getPlansFromStorage();
  const planIndex = plans.findIndex((p) => p.id === planId);

  if (planIndex === -1) {
    showToast(t('planNotFound') || 'Voyage introuvable', 'error');
    return { success: false, error: 'plan_not_found' };
  }

  const plan = plans[planIndex];

  // Can't respond to own plan
  if (plan.userId === userId) {
    return { success: false, error: 'cannot_respond_to_own_plan' };
  }

  // Check if already responded
  const existingResponse = (plan.responses || []).find(
    (r) => r.userId === userId && r.status === ResponseStatus.PENDING
  );

  if (existingResponse) {
    showToast(t('alreadyResponded') || 'Tu as deja repondu a ce voyage', 'warning');
    return { success: false, error: 'already_responded' };
  }

  // Create response
  const response = {
    id: `resp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    planId,
    userId,
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    userLevel: state.level || 1,
    verificationLevel: state.verificationLevel || 0,
    message: message.trim(),
    status: ResponseStatus.PENDING,
    createdAt: new Date().toISOString(),
  };

  plan.responses = plan.responses || [];
  plan.responses.push(response);
  plan.updatedAt = new Date().toISOString();

  plans[planIndex] = plan;
  savePlansToStorage(plans);

  // Also save to responses storage for easy access
  const allResponses = getResponsesFromStorage();
  allResponses.push(response);
  saveResponsesToStorage(allResponses);

  showToast(t('responseSent') || 'Message envoye !', 'success');
  return { success: true, response };
}

/**
 * Accept a response to your travel plan
 * @param {string} planId
 * @param {string} responseId
 * @returns {Object}
 */
export function acceptResponse(planId, responseId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const plans = getPlansFromStorage();
  const planIndex = plans.findIndex((p) => p.id === planId);

  if (planIndex === -1) {
    return { success: false, error: 'plan_not_found' };
  }

  const plan = plans[planIndex];

  // Must be plan owner
  if (plan.userId !== userId) {
    return { success: false, error: 'not_owner' };
  }

  // Find response
  const responseIndex = (plan.responses || []).findIndex((r) => r.id === responseId);
  if (responseIndex === -1) {
    return { success: false, error: 'response_not_found' };
  }

  const response = plan.responses[responseIndex];

  if (response.status !== ResponseStatus.PENDING) {
    return { success: false, error: 'response_not_pending' };
  }

  // Check max companions
  if (plan.acceptedCount >= plan.maxCompanions) {
    showToast(t('maxCompanionsReached') || 'Nombre max de compagnons atteint', 'warning');
    return { success: false, error: 'max_companions_reached' };
  }

  // Accept
  plan.responses[responseIndex].status = ResponseStatus.ACCEPTED;
  plan.responses[responseIndex].acceptedAt = new Date().toISOString();
  plan.acceptedCount = (plan.acceptedCount || 0) + 1;
  plan.updatedAt = new Date().toISOString();

  plans[planIndex] = plan;
  savePlansToStorage(plans);

  showToast(t('responseAccepted') || `${response.username} accepte comme compagnon !`, 'success');
  return { success: true, response: plan.responses[responseIndex] };
}

/**
 * Decline a response to your travel plan
 * @param {string} planId
 * @param {string} responseId
 * @returns {Object}
 */
export function declineResponse(planId, responseId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const plans = getPlansFromStorage();
  const planIndex = plans.findIndex((p) => p.id === planId);

  if (planIndex === -1) {
    return { success: false, error: 'plan_not_found' };
  }

  const plan = plans[planIndex];

  if (plan.userId !== userId) {
    return { success: false, error: 'not_owner' };
  }

  const responseIndex = (plan.responses || []).findIndex((r) => r.id === responseId);
  if (responseIndex === -1) {
    return { success: false, error: 'response_not_found' };
  }

  plan.responses[responseIndex].status = ResponseStatus.DECLINED;
  plan.responses[responseIndex].declinedAt = new Date().toISOString();
  plan.updatedAt = new Date().toISOString();

  plans[planIndex] = plan;
  savePlansToStorage(plans);

  showToast(t('responseDeclined') || 'Reponse declinee', 'info');
  return { success: true };
}

/**
 * Withdraw your response to a travel plan
 * @param {string} planId
 * @param {string} responseId
 * @returns {Object}
 */
export function withdrawResponse(planId, responseId) {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const plans = getPlansFromStorage();
  const planIndex = plans.findIndex((p) => p.id === planId);

  if (planIndex === -1) {
    return { success: false, error: 'plan_not_found' };
  }

  const plan = plans[planIndex];
  const responseIndex = (plan.responses || []).findIndex(
    (r) => r.id === responseId && r.userId === userId
  );

  if (responseIndex === -1) {
    return { success: false, error: 'response_not_found' };
  }

  const response = plan.responses[responseIndex];

  // Can only withdraw pending responses
  if (response.status !== ResponseStatus.PENDING) {
    return { success: false, error: 'cannot_withdraw' };
  }

  plan.responses[responseIndex].status = ResponseStatus.WITHDRAWN;
  plan.responses[responseIndex].withdrawnAt = new Date().toISOString();
  plan.updatedAt = new Date().toISOString();

  plans[planIndex] = plan;
  savePlansToStorage(plans);

  showToast(t('responseWithdrawn') || 'Reponse retiree', 'info');
  return { success: true };
}

/**
 * Get responses to your travel plans
 * @returns {Array}
 */
export function getMyPlanResponses() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const plans = getPlansFromStorage();
  const myPlans = plans.filter((p) => p.userId === userId);

  const allResponses = [];
  myPlans.forEach((plan) => {
    (plan.responses || []).forEach((response) => {
      allResponses.push({
        ...response,
        planId: plan.id,
        planDestination: plan.destination,
        planStartDate: plan.startDate,
      });
    });
  });

  return allResponses;
}

/**
 * Get my responses to others' plans
 * @returns {Array}
 */
export function getMyResponses() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const plans = getPlansFromStorage();
  const myResponses = [];

  plans.forEach((plan) => {
    (plan.responses || []).forEach((response) => {
      if (response.userId === userId) {
        myResponses.push({
          ...response,
          planId: plan.id,
          planUserId: plan.userId,
          planUsername: plan.username,
          planDestination: plan.destination,
          planStartDate: plan.startDate,
        });
      }
    });
  });

  return myResponses;
}

// ========================================
// RENDER FUNCTIONS
// ========================================

/**
 * Render a travel plan card
 * @param {Object} plan
 * @returns {string}
 */
export function renderTravelPlanCard(plan) {
  if (!plan) return '';

  const hasScore = typeof plan.compatibilityScore === 'number';
  const scoreColor = plan.compatibilityScore >= 70 ? 'text-emerald-400' :
    plan.compatibilityScore >= 40 ? 'text-amber-400' : 'text-slate-400';

  const travelStyle = TravelStyles[plan.travelStyle?.toUpperCase()] || TravelStyles.RELAXED;
  const pendingResponses = (plan.responses || []).filter((r) => r.status === ResponseStatus.PENDING).length;

  return `
    <div
      class="travel-plan-card bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer"
      data-plan-id="${escapeHTML(plan.id)}"
      onclick="openTravelPlanDetail('${escapeHTML(plan.id)}')"
      role="article"
      aria-label="${t('travelPlan') || 'Voyage'}: ${escapeHTML(plan.destination)}"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-2xl">
            ${escapeHTML(plan.avatar || '🤙')}
          </div>
          <div>
            <div class="font-medium text-white">${escapeHTML(plan.username || 'Anonyme')}</div>
            <div class="text-xs text-slate-400 flex items-center gap-2">
              <span>${t('level') || 'Niveau'} ${plan.userLevel || 1}</span>
              ${plan.verificationLevel > 0 ? `
                <span class="text-emerald-400">${icon('check-circle', 'w-5 h-5')}</span>
              ` : ''}
            </div>
          </div>
        </div>
        ${hasScore ? `
          <div class="text-right">
            <div class="${scoreColor} font-bold text-lg">${plan.compatibilityScore}%</div>
            <div class="text-xs text-slate-500">${t('compatibility') || 'compatibilite'}</div>
          </div>
        ` : ''}
      </div>

      <div class="mb-3">
        <div class="flex items-center gap-2 text-lg font-semibold">
          ${plan.departure ? `
            <span>${escapeHTML(plan.departure)}</span>
            ${icon('arrow-right', 'w-4 h-4 text-primary-400')}
          ` : ''}
          <span class="text-primary-400">${escapeHTML(plan.destination)}</span>
        </div>
        <div class="text-sm text-slate-400 mt-1">
          ${icon('calendar', 'w-5 h-5 mr-1')}
          ${formatDate(plan.startDate)}
          ${plan.endDate ? ` - ${formatDate(plan.endDate)}` : ''}
        </div>
      </div>

      ${plan.description ? `
        <p class="text-sm text-slate-400 mb-3 line-clamp-2">${escapeHTML(plan.description)}</p>
      ` : ''}

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 bg-white/10 rounded-full text-xs flex items-center gap-1">
            <span>${travelStyle.icon}</span>
            <span>${travelStyle.label}</span>
          </span>
          ${(plan.languages || []).slice(0, 2).map((lang) => `
            <span class="px-2 py-1 bg-white/10 rounded-full text-xs uppercase">${escapeHTML(lang)}</span>
          `).join('')}
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-400">
          ${pendingResponses > 0 ? `
            <span class="text-amber-400">${pendingResponses} ${t('pending') || 'en attente'}</span>
          ` : ''}
          <span>${plan.acceptedCount || 0}/${plan.maxCompanions || 2}</span>
          ${icon('users', 'w-5 h-5')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render response card
 * @param {Object} response
 * @param {boolean} isOwner - Whether current user owns the plan
 * @returns {string}
 */
export function renderResponseCard(response, isOwner = false) {
  if (!response) return '';

  const statusColors = {
    [ResponseStatus.PENDING]: 'bg-amber-500/20 text-amber-400',
    [ResponseStatus.ACCEPTED]: 'bg-emerald-500/20 text-emerald-400',
    [ResponseStatus.DECLINED]: 'bg-red-500/20 text-red-400',
    [ResponseStatus.WITHDRAWN]: 'bg-slate-500/20 text-slate-400',
  };

  const statusLabels = {
    [ResponseStatus.PENDING]: t('pending') || 'En attente',
    [ResponseStatus.ACCEPTED]: t('accepted') || 'Accepte',
    [ResponseStatus.DECLINED]: t('declined') || 'Decline',
    [ResponseStatus.WITHDRAWN]: t('withdrawn') || 'Retire',
  };

  return `
    <div
      class="response-card bg-white/5 rounded-xl p-4"
      data-response-id="${escapeHTML(response.id)}"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-xl">
          ${escapeHTML(response.avatar || '🤙')}
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div class="font-medium text-white">${escapeHTML(response.username || 'Anonyme')}</div>
            <span class="px-2 py-1 rounded-full text-xs ${statusColors[response.status] || statusColors[ResponseStatus.PENDING]}">
              ${statusLabels[response.status] || statusLabels[ResponseStatus.PENDING]}
            </span>
          </div>
          <div class="text-xs text-slate-400 mb-2">
            ${t('level') || 'Niveau'} ${response.userLevel || 1}
            ${response.verificationLevel > 0 ? ' ${icon('check-circle', 'w-5 h-5 text-emerald-400')}' : ''}
          </div>
          <p class="text-sm text-slate-300">${escapeHTML(response.message)}</p>

          ${isOwner && response.status === ResponseStatus.PENDING ? `
            <div class="flex gap-2 mt-3">
              <button
                onclick="event.stopPropagation(); acceptPlanResponse('${escapeHTML(response.planId)}', '${escapeHTML(response.id)}')"
                class="btn btn-sm btn-primary"
              >
                ${icon('check', 'w-5 h-5 mr-1')}
                ${t('accept') || 'Accepter'}
              </button>
              <button
                onclick="event.stopPropagation(); declinePlanResponse('${escapeHTML(response.planId)}', '${escapeHTML(response.id)}')"
                class="btn btn-sm bg-white/10 hover:bg-white/20"
              >
                ${icon('times', 'w-5 h-5 mr-1')}
                ${t('decline') || 'Refuser'}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Clear all companion search data (for testing/reset)
 * @returns {Object}
 */
export function clearAllCompanionData() {
  savePlansToStorage([]);
  saveResponsesToStorage([]);
  Storage.remove(COMPATIBILITY_CACHE_KEY);
  return { success: true };
}

// ========================================
// GLOBAL HANDLERS
// ========================================

window.openTravelPlanDetail = (planId) => {
  const plan = getTravelPlanById(planId);
  if (plan) {
    setState({ selectedTravelPlan: plan, showTravelPlanDetail: true });
  }
};

window.closeTravelPlanDetail = () => {
  setState({ selectedTravelPlan: null, showTravelPlanDetail: false });
};

window.acceptPlanResponse = (planId, responseId) => {
  acceptResponse(planId, responseId);
};

window.declinePlanResponse = (planId, responseId) => {
  declineResponse(planId, responseId);
};

window.postTravelPlanHandler = () => {
  setState({ showPostTravelPlan: true });
};

window.searchCompanionsHandler = (criteria) => {
  const results = searchCompanions(criteria);
  setState({ companionSearchResults: results });
  return results;
};

// ========================================
// EXPORTS
// ========================================

export default {
  // Constants
  PlanStatus,
  ResponseStatus,
  COMPATIBILITY_WEIGHTS,
  TravelStyles,

  // Travel Plans
  postTravelPlan,
  updateTravelPlan,
  cancelTravelPlan,
  getTravelPlanById,
  getMyTravelPlans,
  getMyActivePlan,

  // Search
  searchCompanions,
  calculateCompatibility,

  // Responses
  respondToTravelPlan,
  acceptResponse,
  declineResponse,
  withdrawResponse,
  getMyPlanResponses,
  getMyResponses,

  // Render
  renderTravelPlanCard,
  renderResponseCard,

  // Utils
  clearAllCompanionData,
};
