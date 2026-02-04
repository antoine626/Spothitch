/**
 * Skill Tree Service
 * RPG-style progression system for hitchhikers
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';
import { launchConfetti } from '../utils/confetti.js';

// Skill categories
export const SKILL_CATEGORIES = {
  EXPLORER: {
    id: 'explorer',
    name: 'Explorateur',
    description: 'Compétences de voyage et découverte',
    icon: 'fa-compass',
    color: 'from-blue-500 to-cyan-400',
  },
  SOCIAL: {
    id: 'social',
    name: 'Social',
    description: 'Compétences de communication',
    icon: 'fa-users',
    color: 'from-purple-500 to-pink-400',
  },
  SURVIVOR: {
    id: 'survivor',
    name: 'Survivaliste',
    description: 'Compétences de survie et sécurité',
    icon: 'fa-shield-alt',
    color: 'from-emerald-500 to-green-400',
  },
  VETERAN: {
    id: 'veteran',
    name: 'Vétéran',
    description: 'Compétences avancées',
    icon: 'fa-crown',
    color: 'from-amber-500 to-orange-400',
  },
};

// Skill tree definition
export const SKILLS = {
  // Explorer branch
  first_steps: {
    id: 'first_steps',
    name: 'Premiers pas',
    description: 'Commence ton aventure en auto-stop',
    category: 'explorer',
    icon: 'fa-shoe-prints',
    tier: 1,
    cost: 0,
    requires: [],
    bonuses: ['+5% points par trajet'],
    effect: { bonusMultiplier: 1.05 },
  },
  map_reader: {
    id: 'map_reader',
    name: 'Lecteur de cartes',
    description: 'Maîtrise la navigation',
    category: 'explorer',
    icon: 'fa-map',
    tier: 2,
    cost: 100,
    requires: ['first_steps'],
    bonuses: ['Accès aux cartes détaillées', '+10 points par nouveau spot'],
    effect: { mapDetailLevel: 2, newSpotBonus: 10 },
  },
  pathfinder: {
    id: 'pathfinder',
    name: 'Éclaireur',
    description: 'Trouve les meilleurs itinéraires',
    category: 'explorer',
    icon: 'fa-route',
    tier: 3,
    cost: 250,
    requires: ['map_reader'],
    bonuses: ['Suggestions d\'itinéraires optimisés', '+15% XP exploration'],
    effect: { routeOptimization: true, explorationXpBonus: 1.15 },
  },
  globe_trotter: {
    id: 'globe_trotter',
    name: 'Globe-trotter',
    description: 'Voyage sans frontières',
    category: 'explorer',
    icon: 'fa-globe-europe',
    tier: 4,
    cost: 500,
    requires: ['pathfinder'],
    bonuses: ['+50 points par nouveau pays', 'Badge exclusif'],
    effect: { countryBonus: 50, unlockBadge: 'globe_trotter' },
  },

  // Social branch
  friendly_face: {
    id: 'friendly_face',
    name: 'Visage amical',
    description: 'Fais une bonne première impression',
    category: 'social',
    icon: 'fa-smile',
    tier: 1,
    cost: 0,
    requires: [],
    bonuses: ['+5% chances d\'être pris', 'Accès au chat'],
    effect: { pickupChance: 1.05, chatAccess: true },
  },
  storyteller: {
    id: 'storyteller',
    name: 'Conteur',
    description: 'Partage tes aventures',
    category: 'social',
    icon: 'fa-book-open',
    tier: 2,
    cost: 100,
    requires: ['friendly_face'],
    bonuses: ['+20% likes sur tes posts', 'Rédige de meilleurs avis'],
    effect: { postLikeBonus: 1.2, reviewQuality: 'enhanced' },
  },
  community_leader: {
    id: 'community_leader',
    name: 'Leader communautaire',
    description: 'Guide la communauté',
    category: 'social',
    icon: 'fa-users',
    tier: 3,
    cost: 250,
    requires: ['storyteller'],
    bonuses: ['Crée des groupes de voyage', '+2 votes de validation'],
    effect: { canCreateGroups: true, validationVotes: 2 },
  },
  influencer: {
    id: 'influencer',
    name: 'Influenceur',
    description: 'Inspire les autres',
    category: 'social',
    icon: 'fa-star',
    tier: 4,
    cost: 500,
    requires: ['community_leader'],
    bonuses: ['Profil mis en avant', 'Cadre de profil exclusif'],
    effect: { featuredProfile: true, unlockFrame: 'influencer' },
  },

  // Survivor branch
  prepared: {
    id: 'prepared',
    name: 'Bien préparé',
    description: 'Toujours prêt pour l\'aventure',
    category: 'survivor',
    icon: 'fa-backpack',
    tier: 1,
    cost: 0,
    requires: [],
    bonuses: ['Checklist de voyage', 'Alertes météo'],
    effect: { checklist: true, weatherAlerts: true },
  },
  night_owl: {
    id: 'night_owl',
    name: 'Oiseau de nuit',
    description: 'Voyage même la nuit',
    category: 'survivor',
    icon: 'fa-moon',
    tier: 2,
    cost: 100,
    requires: ['prepared'],
    bonuses: ['Spots de nuit visibles', '+15% points trajets nocturnes'],
    effect: { nightSpots: true, nightBonus: 1.15 },
  },
  emergency_expert: {
    id: 'emergency_expert',
    name: 'Expert urgences',
    description: 'Gère les situations difficiles',
    category: 'survivor',
    icon: 'fa-first-aid',
    tier: 3,
    cost: 250,
    requires: ['night_owl'],
    bonuses: ['Mode SOS amélioré', 'Contacts d\'urgence illimités'],
    effect: { enhancedSOS: true, unlimitedEmergencyContacts: true },
  },
  road_master: {
    id: 'road_master',
    name: 'Maître de la route',
    description: 'Rien ne t\'arrête',
    category: 'survivor',
    icon: 'fa-road',
    tier: 4,
    cost: 500,
    requires: ['emergency_expert'],
    bonuses: ['Tous les spots débloqués', 'Titre exclusif'],
    effect: { allSpotsUnlocked: true, unlockTitle: 'road_master' },
  },

  // Veteran branch (requires skills from other branches)
  experienced: {
    id: 'experienced',
    name: 'Expérimenté',
    description: 'Tu as vu du pays',
    category: 'veteran',
    icon: 'fa-medal',
    tier: 1,
    cost: 200,
    requires: ['map_reader', 'storyteller', 'night_owl'],
    bonuses: ['+10% tous les bonus', 'Badge Vétéran'],
    effect: { globalBonus: 1.1, unlockBadge: 'veteran' },
  },
  mentor: {
    id: 'mentor',
    name: 'Mentor',
    description: 'Guide les nouveaux',
    category: 'veteran',
    icon: 'fa-chalkboard-teacher',
    tier: 2,
    cost: 400,
    requires: ['experienced'],
    bonuses: ['Programme mentorat', '+50 points par filleul actif'],
    effect: { mentorProgram: true, referralBonus: 50 },
  },
  legend: {
    id: 'legend',
    name: 'Légende',
    description: 'Tu es une légende vivante',
    category: 'veteran',
    icon: 'fa-crown',
    tier: 3,
    cost: 1000,
    requires: ['mentor', 'globe_trotter', 'influencer', 'road_master'],
    bonuses: ['Cadre légendaire', 'Titre personnalisé', 'Badge ultime'],
    effect: {
      unlockFrame: 'legend',
      customTitle: true,
      unlockBadge: 'legend',
    },
  },
};

/**
 * Get user's unlocked skills
 * @returns {string[]} Array of skill IDs
 */
export function getUnlockedSkills() {
  const state = getState();
  return state.unlockedSkills || [];
}

/**
 * Get user's available skill points
 * @returns {number}
 */
export function getSkillPoints() {
  const state = getState();
  return state.skillPoints || 0;
}

/**
 * Check if a skill can be unlocked
 * @param {string} skillId
 * @returns {{canUnlock: boolean, reason?: string}}
 */
export function canUnlockSkill(skillId) {
  const skill = SKILLS[skillId];
  if (!skill) return { canUnlock: false, reason: 'Compétence introuvable' };

  const unlockedSkills = getUnlockedSkills();
  const skillPoints = getSkillPoints();

  // Already unlocked
  if (unlockedSkills.includes(skillId)) {
    return { canUnlock: false, reason: 'Déjà débloquée' };
  }

  // Check requirements
  const missingRequirements = skill.requires.filter(
    (req) => !unlockedSkills.includes(req)
  );
  if (missingRequirements.length > 0) {
    const missingNames = missingRequirements
      .map((id) => SKILLS[id]?.name || id)
      .join(', ');
    return {
      canUnlock: false,
      reason: `Requiert: ${missingNames}`,
    };
  }

  // Check points
  if (skillPoints < skill.cost) {
    return {
      canUnlock: false,
      reason: `Pas assez de points (${skillPoints}/${skill.cost})`,
    };
  }

  return { canUnlock: true };
}

/**
 * Unlock a skill
 * @param {string} skillId
 * @returns {boolean}
 */
export function unlockSkill(skillId) {
  const { canUnlock, reason } = canUnlockSkill(skillId);

  if (!canUnlock) {
    showToast(reason, 'warning');
    return false;
  }

  const skill = SKILLS[skillId];
  const state = getState();

  // Deduct points and add skill
  const newSkillPoints = (state.skillPoints || 0) - skill.cost;
  const newUnlockedSkills = [...(state.unlockedSkills || []), skillId];

  // Apply skill effects
  applySkillEffects(skill.effect);

  setState({
    skillPoints: newSkillPoints,
    unlockedSkills: newUnlockedSkills,
  });

  // Celebrate
  launchConfetti();
  showToast(`🎯 Compétence "${skill.name}" débloquée !`, 'success');

  return true;
}

/**
 * Apply skill effects to user state
 * @param {Object} effects
 */
function applySkillEffects(effects) {
  if (!effects) return;

  const state = getState();
  const updates = {};

  if (effects.unlockBadge) {
    const badges = state.earnedBadges || [];
    if (!badges.includes(effects.unlockBadge)) {
      updates.earnedBadges = [...badges, effects.unlockBadge];
    }
  }

  if (effects.unlockFrame) {
    const frames = state.unlockedFrames || [];
    if (!frames.includes(effects.unlockFrame)) {
      updates.unlockedFrames = [...frames, effects.unlockFrame];
    }
  }

  if (effects.unlockTitle) {
    const titles = state.unlockedTitles || [];
    if (!titles.includes(effects.unlockTitle)) {
      updates.unlockedTitles = [...titles, effects.unlockTitle];
    }
  }

  if (Object.keys(updates).length > 0) {
    setState(updates);
  }
}

/**
 * Award skill points
 * @param {number} amount
 * @param {string} reason
 */
export function awardSkillPoints(amount, reason = '') {
  const state = getState();
  const newPoints = (state.skillPoints || 0) + amount;

  setState({ skillPoints: newPoints });

  if (reason) {
    showToast(`+${amount} points de compétence: ${reason}`, 'info');
  }
}

/**
 * Get skill tree progress
 * @returns {Object}
 */
export function getSkillTreeProgress() {
  const unlockedSkills = getUnlockedSkills();
  const totalSkills = Object.keys(SKILLS).length;

  const categoryProgress = {};
  Object.keys(SKILL_CATEGORIES).forEach((catId) => {
    const catSkills = Object.values(SKILLS).filter(
      (s) => s.category === catId.toLowerCase()
    );
    const unlockedInCat = catSkills.filter((s) =>
      unlockedSkills.includes(s.id)
    );
    categoryProgress[catId] = {
      unlocked: unlockedInCat.length,
      total: catSkills.length,
      percentage: Math.round((unlockedInCat.length / catSkills.length) * 100),
    };
  });

  return {
    unlocked: unlockedSkills.length,
    total: totalSkills,
    percentage: Math.round((unlockedSkills.length / totalSkills) * 100),
    byCategory: categoryProgress,
  };
}

/**
 * Render skill tree UI
 * @param {Object} state
 * @returns {string}
 */
export function renderSkillTree(state) {
  const unlockedSkills = state.unlockedSkills || [];
  const skillPoints = state.skillPoints || 0;
  const progress = getSkillTreeProgress();

  return `
    <div class="skill-tree p-4 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">Arbre de compétences</h2>
          <p class="text-sm text-slate-400">${progress.unlocked}/${progress.total} débloquées</p>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-primary-400">${skillPoints}</div>
          <div class="text-xs text-slate-400">Points disponibles</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all"
          style="width: ${progress.percentage}%"
        ></div>
      </div>

      <!-- Categories -->
      <div class="space-y-6">
        ${Object.entries(SKILL_CATEGORIES)
    .map(([key, category]) => {
      const catSkills = Object.values(SKILLS).filter(
        (s) => s.category === key.toLowerCase()
      );
      const catProgress = progress.byCategory[key];

      return `
            <div class="bg-dark-card rounded-2xl overflow-hidden">
              <!-- Category Header -->
              <div class="p-4 bg-gradient-to-r ${category.color}">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <i class="fas ${category.icon} text-white" aria-hidden="true"></i>
                  </div>
                  <div class="flex-1">
                    <h3 class="font-bold text-white">${category.name}</h3>
                    <p class="text-white/70 text-sm">${category.description}</p>
                  </div>
                  <div class="text-white/80 text-sm">
                    ${catProgress.unlocked}/${catProgress.total}
                  </div>
                </div>
              </div>

              <!-- Skills -->
              <div class="p-4 grid grid-cols-2 gap-3">
                ${catSkills
    .sort((a, b) => a.tier - b.tier)
    .map((skill) => {
      const isUnlocked = unlockedSkills.includes(skill.id);
      const { canUnlock } = canUnlockSkill(skill.id);
      const statusClass = isUnlocked
        ? 'border-emerald-500 bg-emerald-500/10'
        : canUnlock
          ? 'border-primary-500 bg-primary-500/10 cursor-pointer hover:bg-primary-500/20'
          : 'border-slate-700 bg-white/5 opacity-60';

      return `
                    <button
                      onclick="${!isUnlocked && canUnlock ? `unlockSkillAction('${skill.id}')` : ''}"
                      class="p-3 rounded-xl border-2 ${statusClass} text-left transition-all"
                      ${isUnlocked || !canUnlock ? 'disabled' : ''}
                    >
                      <div class="flex items-center gap-2 mb-2">
                        <i class="fas ${skill.icon} ${isUnlocked ? 'text-emerald-400' : 'text-slate-400'}" aria-hidden="true"></i>
                        <span class="font-medium text-sm">${skill.name}</span>
                        ${isUnlocked ? '<i class="fas fa-check text-emerald-400 ml-auto" aria-hidden="true"></i>' : ''}
                      </div>
                      <p class="text-xs text-slate-400 mb-2">${skill.description}</p>
                      ${
  !isUnlocked
    ? `
                        <div class="text-xs ${canUnlock ? 'text-primary-400' : 'text-slate-500'}">
                          <i class="fas fa-coins mr-1" aria-hidden="true"></i>
                          ${skill.cost} points
                        </div>
                      `
    : ''
}
                    </button>
                  `;
    })
    .join('')}
              </div>
            </div>
          `;
    })
    .join('')}
      </div>
    </div>
  `;
}

/**
 * Render compact skill summary
 * @returns {string}
 */
export function renderSkillSummary() {
  const progress = getSkillTreeProgress();
  const skillPoints = getSkillPoints();

  return `
    <div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold">Compétences</h3>
        <span class="text-sm text-purple-400">${skillPoints} pts</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full"
              style="width: ${progress.percentage}%"
            ></div>
          </div>
        </div>
        <span class="text-sm text-slate-400">${progress.unlocked}/${progress.total}</span>
      </div>
      <button
        onclick="openSkillTree()"
        class="text-sm text-purple-400 hover:text-purple-300 mt-3 transition-colors"
      >
        Voir l'arbre →
      </button>
    </div>
  `;
}

// Global handlers
window.unlockSkillAction = unlockSkill;
window.openSkillTree = () => setState({ showSkillTree: true });
window.closeSkillTree = () => setState({ showSkillTree: false });

export default {
  SKILL_CATEGORIES,
  SKILLS,
  getUnlockedSkills,
  getSkillPoints,
  canUnlockSkill,
  unlockSkill,
  awardSkillPoints,
  getSkillTreeProgress,
  renderSkillTree,
  renderSkillSummary,
};
