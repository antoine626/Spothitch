/**
 * Quest System Service
 * Manage quests and missions for gamification
 * Feature #159
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'
import { addPoints, addSeasonPoints } from './gamification.js'

/**
 * Quest types available
 */
export const QuestType = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  SPECIAL: 'special',
  ACHIEVEMENT: 'achievement',
}

/**
 * Quest status enum
 */
export const QuestStatus = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLAIMED: 'claimed',
  EXPIRED: 'expired',
}

/**
 * Quest difficulty levels
 */
export const QuestDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
}

/**
 * Quest definitions
 */
export const questDefinitions = [
  // Daily quests
  {
    id: 'daily_checkin',
    type: QuestType.DAILY,
    difficulty: QuestDifficulty.EASY,
    name: 'Check-in Quotidien',
    nameEn: 'Daily Check-in',
    description: 'Faire un check-in aujourd\'hui',
    descriptionEn: 'Complete a check-in today',
    icon: '📍',
    target: 1,
    metric: 'checkins',
    rewardPoints: 20,
    rewardXP: 10,
    minLevel: 1,
  },
  {
    id: 'daily_review',
    type: QuestType.DAILY,
    difficulty: QuestDifficulty.EASY,
    name: 'Critique du Jour',
    nameEn: 'Daily Review',
    description: 'Donner un avis sur un spot',
    descriptionEn: 'Give a review on a spot',
    icon: '⭐',
    target: 1,
    metric: 'reviews',
    rewardPoints: 15,
    rewardXP: 8,
    minLevel: 1,
  },
  {
    id: 'daily_explorer',
    type: QuestType.DAILY,
    difficulty: QuestDifficulty.MEDIUM,
    name: 'Explorateur Quotidien',
    nameEn: 'Daily Explorer',
    description: 'Visiter 3 spots différents',
    descriptionEn: 'Visit 3 different spots',
    icon: '🗺️',
    target: 3,
    metric: 'spotsVisited',
    rewardPoints: 30,
    rewardXP: 15,
    minLevel: 3,
  },
  // Weekly quests
  {
    id: 'weekly_distance',
    type: QuestType.WEEKLY,
    difficulty: QuestDifficulty.MEDIUM,
    name: 'Voyageur Hebdomadaire',
    nameEn: 'Weekly Traveler',
    description: 'Parcourir 100 km en autostop',
    descriptionEn: 'Travel 100 km by hitchhiking',
    icon: '🚗',
    target: 100,
    metric: 'distance',
    rewardPoints: 100,
    rewardXP: 50,
    minLevel: 5,
  },
  {
    id: 'weekly_social',
    type: QuestType.WEEKLY,
    difficulty: QuestDifficulty.MEDIUM,
    name: 'Social Butterfly',
    nameEn: 'Social Butterfly',
    description: 'Envoyer 10 messages',
    descriptionEn: 'Send 10 messages',
    icon: '💬',
    target: 10,
    metric: 'messages',
    rewardPoints: 80,
    rewardXP: 40,
    minLevel: 3,
  },
  {
    id: 'weekly_streak',
    type: QuestType.WEEKLY,
    difficulty: QuestDifficulty.HARD,
    name: 'Série Parfaite',
    nameEn: 'Perfect Streak',
    description: 'Se connecter 7 jours d\'affilée',
    descriptionEn: 'Login 7 days in a row',
    icon: '🔥',
    target: 7,
    metric: 'streak',
    rewardPoints: 150,
    rewardXP: 75,
    minLevel: 1,
  },
  // Special quests
  {
    id: 'special_country',
    type: QuestType.SPECIAL,
    difficulty: QuestDifficulty.HARD,
    name: 'Tour d\'Europe',
    nameEn: 'European Tour',
    description: 'Visiter 5 pays différents',
    descriptionEn: 'Visit 5 different countries',
    icon: '🌍',
    target: 5,
    metric: 'countries',
    rewardPoints: 300,
    rewardXP: 150,
    minLevel: 10,
    badge: 'european_explorer',
  },
  {
    id: 'special_night',
    type: QuestType.SPECIAL,
    difficulty: QuestDifficulty.EXPERT,
    name: 'Voyageur Nocturne',
    nameEn: 'Night Traveler',
    description: 'Faire 5 check-ins de nuit',
    descriptionEn: 'Complete 5 night check-ins',
    icon: '🌙',
    target: 5,
    metric: 'nightCheckins',
    rewardPoints: 200,
    rewardXP: 100,
    minLevel: 8,
  },
  // Achievement quests
  {
    id: 'achievement_master',
    type: QuestType.ACHIEVEMENT,
    difficulty: QuestDifficulty.EXPERT,
    name: 'Maître des Quêtes',
    nameEn: 'Quest Master',
    description: 'Compléter 50 quêtes',
    descriptionEn: 'Complete 50 quests',
    icon: '🏆',
    target: 50,
    metric: 'questsCompleted',
    rewardPoints: 500,
    rewardXP: 250,
    minLevel: 15,
    badge: 'quest_master',
  },
  {
    id: 'achievement_veteran',
    type: QuestType.ACHIEVEMENT,
    difficulty: QuestDifficulty.EXPERT,
    name: 'Vétéran SpotHitch',
    nameEn: 'SpotHitch Veteran',
    description: 'Faire 100 check-ins',
    descriptionEn: 'Complete 100 check-ins',
    icon: '🎖️',
    target: 100,
    metric: 'totalCheckins',
    rewardPoints: 1000,
    rewardXP: 500,
    minLevel: 20,
    badge: 'veteran',
  },
]

/**
 * Initialize quest system
 */
export function initQuestSystem() {
  const state = getState()

  if (!state.quests) {
    setState({
      quests: [],
      questProgress: {},
      questsCompleted: 0,
      questsCompletedToday: 0,
      lastQuestReset: new Date().toISOString(),
    })
  }

  // Generate daily/weekly quests if needed
  refreshQuests()
}

/**
 * Refresh quest list (daily/weekly rotation)
 */
export function refreshQuests() {
  const state = getState()
  const now = new Date()
  const lastReset = state.lastQuestReset ? new Date(state.lastQuestReset) : new Date(0)

  // Check if daily reset needed (new day)
  const needsDailyReset = now.toDateString() !== lastReset.toDateString()

  // Check if weekly reset needed (new week, Monday)
  const needsWeeklyReset = needsDailyReset && now.getDay() === 1 &&
    (now.getTime() - lastReset.getTime()) > 24 * 60 * 60 * 1000

  if (!needsDailyReset && !needsWeeklyReset) {
    return
  }

  const quests = state.quests || []
  const userLevel = state.level || 1

  // Reset daily quests
  if (needsDailyReset) {
    // Remove expired daily quests
    const filtered = quests.filter(q => {
      if (q.type === QuestType.DAILY && q.status !== QuestStatus.CLAIMED) {
        return false
      }
      return true
    })

    // Generate new daily quests
    const dailyQuests = questDefinitions
      .filter(def => def.type === QuestType.DAILY && def.minLevel <= userLevel)
      .map(def => createQuestFromDefinition(def))

    setState({
      quests: [...filtered, ...dailyQuests],
      questsCompletedToday: 0,
      lastQuestReset: now.toISOString(),
    })
  }

  // Reset weekly quests
  if (needsWeeklyReset) {
    const filtered = quests.filter(q => {
      if (q.type === QuestType.WEEKLY && q.status !== QuestStatus.CLAIMED) {
        return false
      }
      return true
    })

    // Generate new weekly quests
    const weeklyQuests = questDefinitions
      .filter(def => def.type === QuestType.WEEKLY && def.minLevel <= userLevel)
      .map(def => createQuestFromDefinition(def))

    setState({
      quests: [...filtered, ...weeklyQuests],
    })
  }
}

/**
 * Create a quest instance from definition
 */
function createQuestFromDefinition(definition) {
  const now = new Date()
  let expiresAt

  if (definition.type === QuestType.DAILY) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    expiresAt = tomorrow.toISOString()
  } else if (definition.type === QuestType.WEEKLY) {
    const nextMonday = new Date(now)
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
    nextMonday.setHours(0, 0, 0, 0)
    expiresAt = nextMonday.toISOString()
  }

  return {
    id: `quest_${definition.id}_${Date.now()}`,
    definitionId: definition.id,
    type: definition.type,
    difficulty: definition.difficulty,
    name: definition.name,
    description: definition.description,
    icon: definition.icon,
    target: definition.target,
    metric: definition.metric,
    progress: 0,
    status: QuestStatus.AVAILABLE,
    rewardPoints: definition.rewardPoints,
    rewardXP: definition.rewardXP,
    badge: definition.badge,
    createdAt: now.toISOString(),
    expiresAt,
  }
}

/**
 * Get all quests
 */
export function getAllQuests() {
  const state = getState()
  return state.quests || []
}

/**
 * Get quests by type
 */
export function getQuestsByType(type) {
  const quests = getAllQuests()
  return quests.filter(q => q.type === type)
}

/**
 * Get quests by status
 */
export function getQuestsByStatus(status) {
  const quests = getAllQuests()
  return quests.filter(q => q.status === status)
}

/**
 * Get available quests
 */
export function getAvailableQuests() {
  return getQuestsByStatus(QuestStatus.AVAILABLE)
}

/**
 * Get in-progress quests
 */
export function getInProgressQuests() {
  return getQuestsByStatus(QuestStatus.IN_PROGRESS)
}

/**
 * Get completed quests
 */
export function getCompletedQuests() {
  return getQuestsByStatus(QuestStatus.COMPLETED)
}

/**
 * Get quest by ID
 */
export function getQuestById(questId) {
  const quests = getAllQuests()
  return quests.find(q => q.id === questId)
}

/**
 * Update quest progress
 */
export function updateQuestProgress(questId, progress) {
  const state = getState()
  const quests = state.quests || []
  const index = quests.findIndex(q => q.id === questId)

  if (index === -1) return false

  const quest = quests[index]

  // Check if quest is available or in progress
  if (quest.status !== QuestStatus.AVAILABLE && quest.status !== QuestStatus.IN_PROGRESS) {
    return false
  }

  // Update progress
  const newProgress = Math.max(0, Math.min(quest.target, progress))
  quests[index] = {
    ...quest,
    progress: newProgress,
    status: newProgress > 0 ? QuestStatus.IN_PROGRESS : QuestStatus.AVAILABLE,
  }

  // Check if completed
  if (newProgress >= quest.target) {
    quests[index].status = QuestStatus.COMPLETED
    quests[index].completedAt = new Date().toISOString()

    showToast(`Quête terminée : ${quest.name}`, 'success')
  }

  setState({ quests: [...quests] })
  return true
}

/**
 * Claim quest reward
 */
export function claimQuestReward(questId) {
  const state = getState()
  const quests = state.quests || []
  const index = quests.findIndex(q => q.id === questId)

  if (index === -1) {
    showToast('Quête introuvable', 'error')
    return null
  }

  const quest = quests[index]

  if (quest.status !== QuestStatus.COMPLETED) {
    showToast('Quête non terminée', 'error')
    return null
  }

  // Mark as claimed
  quests[index] = {
    ...quest,
    status: QuestStatus.CLAIMED,
    claimedAt: new Date().toISOString(),
  }

  // Award rewards
  addPoints(quest.rewardPoints, 'quest_completed')
  if (quest.rewardXP) {
    addSeasonPoints(quest.rewardXP)
  }

  // Award badge if present
  if (quest.badge) {
    const badges = state.badges || []
    if (!badges.includes(quest.badge)) {
      setState({
        badges: [...badges, quest.badge],
        newBadge: { id: quest.badge, name: quest.name },
      })
    }
  }

  // Update stats
  setState({
    quests: [...quests],
    questsCompleted: (state.questsCompleted || 0) + 1,
    questsCompletedToday: (state.questsCompletedToday || 0) + 1,
  })

  showToast(`Récompense réclamée : +${quest.rewardPoints} points`, 'success')

  return {
    points: quest.rewardPoints,
    xp: quest.rewardXP,
    badge: quest.badge,
  }
}

/**
 * Sync quest progress with user stats
 */
export function syncQuestProgress() {
  const state = getState()
  const quests = state.quests || []
  const now = new Date()

  let updated = false

  quests.forEach((quest, index) => {
    // Skip if already completed or claimed
    if (quest.status === QuestStatus.COMPLETED || quest.status === QuestStatus.CLAIMED) {
      return
    }

    // Check expiration
    if (quest.expiresAt && new Date(quest.expiresAt) < now) {
      quests[index] = {
        ...quest,
        status: QuestStatus.EXPIRED,
      }
      updated = true
      return
    }

    // Get progress from state based on metric
    let currentProgress = 0
    switch (quest.metric) {
      case 'checkins':
        currentProgress = state.dailyCheckins || 0
        break
      case 'reviews':
        currentProgress = state.dailyReviews || 0
        break
      case 'spotsVisited':
        currentProgress = state.dailySpotsVisited || 0
        break
      case 'distance':
        currentProgress = state.weeklyDistance || 0
        break
      case 'messages':
        currentProgress = state.weeklyMessages || 0
        break
      case 'streak':
        currentProgress = state.streak || 0
        break
      case 'countries':
        currentProgress = state.countriesVisited || 0
        break
      case 'nightCheckins':
        currentProgress = state.nightCheckins || 0
        break
      case 'questsCompleted':
        currentProgress = state.questsCompleted || 0
        break
      case 'totalCheckins':
        currentProgress = state.checkins || 0
        break
    }

    if (currentProgress !== quest.progress) {
      updateQuestProgress(quest.id, currentProgress)
      updated = true
    }
  })

  if (updated) {
    setState({ quests: [...quests] })
  }
}

/**
 * Get quest statistics
 */
export function getQuestStats() {
  const state = getState()
  const quests = state.quests || []

  return {
    total: quests.length,
    available: quests.filter(q => q.status === QuestStatus.AVAILABLE).length,
    inProgress: quests.filter(q => q.status === QuestStatus.IN_PROGRESS).length,
    completed: quests.filter(q => q.status === QuestStatus.COMPLETED).length,
    claimed: quests.filter(q => q.status === QuestStatus.CLAIMED).length,
    expired: quests.filter(q => q.status === QuestStatus.EXPIRED).length,
    totalCompleted: state.questsCompleted || 0,
    completedToday: state.questsCompletedToday || 0,
  }
}

/**
 * Unlock special quest
 */
export function unlockSpecialQuest(definitionId) {
  const state = getState()
  const definition = questDefinitions.find(d => d.id === definitionId)

  if (!definition) {
    return false
  }

  const userLevel = state.level || 1
  if (definition.minLevel > userLevel) {
    showToast(`Niveau ${definition.minLevel} requis`, 'warning')
    return false
  }

  const quests = state.quests || []
  const exists = quests.find(q => q.definitionId === definitionId)

  if (exists) {
    return false
  }

  const newQuest = createQuestFromDefinition(definition)
  setState({
    quests: [...quests, newQuest],
  })

  showToast(`Nouvelle quête débloquée : ${definition.name}`, 'success')
  return true
}

/**
 * Get quest definitions by type
 */
export function getQuestDefinitions(type) {
  if (type) {
    return questDefinitions.filter(d => d.type === type)
  }
  return questDefinitions
}

/**
 * Render quest card HTML
 */
export function renderQuestCard(quest) {
  const progressPercent = Math.min(100, Math.round((quest.progress / quest.target) * 100))

  const difficultyColors = {
    [QuestDifficulty.EASY]: 'text-green-400',
    [QuestDifficulty.MEDIUM]: 'text-yellow-400',
    [QuestDifficulty.HARD]: 'text-orange-400',
    [QuestDifficulty.EXPERT]: 'text-red-400',
  }

  const statusColors = {
    [QuestStatus.LOCKED]: 'bg-gray-500/20 text-gray-400',
    [QuestStatus.AVAILABLE]: 'bg-blue-500/20 text-blue-400',
    [QuestStatus.IN_PROGRESS]: 'bg-yellow-500/20 text-yellow-400',
    [QuestStatus.COMPLETED]: 'bg-green-500/20 text-green-400',
    [QuestStatus.CLAIMED]: 'bg-gray-500/20 text-gray-400',
    [QuestStatus.EXPIRED]: 'bg-red-500/20 text-red-400',
  }

  const statusLabels = {
    [QuestStatus.LOCKED]: 'Verrouillée',
    [QuestStatus.AVAILABLE]: 'Disponible',
    [QuestStatus.IN_PROGRESS]: 'En cours',
    [QuestStatus.COMPLETED]: 'Terminée',
    [QuestStatus.CLAIMED]: 'Réclamée',
    [QuestStatus.EXPIRED]: 'Expirée',
  }

  return `
    <div class="bg-dark-700 rounded-xl p-4 border border-dark-600">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${quest.icon}</span>
          <div>
            <h4 class="font-semibold text-white">${quest.name}</h4>
            <p class="text-xs ${difficultyColors[quest.difficulty]}">${quest.difficulty.toUpperCase()}</p>
          </div>
        </div>
        <span class="px-2 py-1 rounded-full text-xs ${statusColors[quest.status]}">
          ${statusLabels[quest.status]}
        </span>
      </div>

      <p class="text-sm text-gray-300 mb-3">${quest.description}</p>

      ${quest.status === QuestStatus.AVAILABLE || quest.status === QuestStatus.IN_PROGRESS ? `
        <div class="mb-3">
          <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Progression</span>
            <span>${quest.progress}/${quest.target}</span>
          </div>
          <div class="w-full bg-dark-600 rounded-full h-2 overflow-hidden">
            <div class="bg-primary h-full transition-all" style="width: ${progressPercent}%"></div>
          </div>
        </div>
      ` : ''}

      <div class="flex items-center justify-between">
        <div class="flex gap-3 text-xs text-gray-400">
          <span>💰 ${quest.rewardPoints} pts</span>
          ${quest.rewardXP ? `<span>⭐ ${quest.rewardXP} XP</span>` : ''}
          ${quest.badge ? `<span>🏅 Badge</span>` : ''}
        </div>
        ${quest.status === QuestStatus.COMPLETED ? `
          <button onclick="window.claimQuestReward('${quest.id}')"
            class="bg-primary text-white px-4 py-1 rounded-lg text-sm hover:bg-primary/80">
            Réclamer
          </button>
        ` : ''}
      </div>

      ${quest.expiresAt && quest.status !== QuestStatus.CLAIMED && quest.status !== QuestStatus.EXPIRED ? `
        <p class="text-xs text-gray-500 mt-2">
          Expire le ${new Date(quest.expiresAt).toLocaleDateString()}
        </p>
      ` : ''}
    </div>
  `
}

/**
 * Render quest list HTML
 */
export function renderQuestList(quests, options = {}) {
  const { title = 'Quêtes', emptyMessage = 'Aucune quête disponible' } = options

  if (!quests || quests.length === 0) {
    return `
      <div class="text-center py-8 text-gray-400">
        <p>${emptyMessage}</p>
      </div>
    `
  }

  const questCards = quests.map(q => renderQuestCard(q)).join('')

  return `
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-white">${title}</h3>
      <div class="space-y-3">
        ${questCards}
      </div>
    </div>
  `
}

export default {
  QuestType,
  QuestStatus,
  QuestDifficulty,
  questDefinitions,
  initQuestSystem,
  refreshQuests,
  getAllQuests,
  getQuestsByType,
  getQuestsByStatus,
  getAvailableQuests,
  getInProgressQuests,
  getCompletedQuests,
  getQuestById,
  updateQuestProgress,
  claimQuestReward,
  syncQuestProgress,
  getQuestStats,
  unlockSpecialQuest,
  getQuestDefinitions,
  renderQuestCard,
  renderQuestList,
}
