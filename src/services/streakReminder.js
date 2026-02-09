/**
 * Streak Reminder Service (#225)
 * Manages streak tracking, milestones, and reminder notifications
 *
 * Features:
 * - Track current streak and start date
 * - Calculate hours until streak is lost
 * - Send reminder notifications
 * - Configurable reminder time
 * - Milestone rewards (7, 14, 30, 60, 90, 180, 365 days)
 * - Humorous localized messages
 */

import { getState, setState } from '../stores/state.js'
import { t } from '../i18n/index.js'
import { showToast } from './notifications.js'

// ==================== CONSTANTS ====================

const STORAGE_KEY = 'spothitch_streak_reminder'
const MS_PER_HOUR = 60 * 60 * 1000
const MS_PER_DAY = 24 * MS_PER_HOUR

// Streak milestones with rewards
const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365]

// Milestone rewards (points)
const MILESTONE_REWARDS = {
  7: 50,      // 1 week
  14: 100,    // 2 weeks
  30: 250,    // 1 month
  60: 500,    // 2 months
  90: 1000,   // 3 months
  180: 2500,  // 6 months
  365: 10000, // 1 year - legendary!
}

// Humorous streak messages per language
const STREAK_MESSAGES = {
  fr: {
    atRisk: [
      "Hep ! Ta serie de {days} jours est en danger ! Ton pouce va rouiller !",
      "Alerte rouge ! Plus que quelques heures pour sauver ta serie de {days} jours !",
      "SOS Serie ! {days} jours de legende menaces ! Un check-in et c'est regle !",
      "Ta serie de {days} jours te supplie : 'Ne m'abandonne pas !' ",
      "Le chrono tourne ! Serie de {days} jours en peril imminent !",
    ],
    milestone: [
      "{days} jours de suite ! Tu es une machine a autostop !",
      "Boom ! {days} jours ! Meme les camions s'arretent pour toi maintenant !",
      "{days} jours de serie ! Les routards te saluent !",
      "Incroyable ! {days} jours ! Tu merites une statue sur chaque aire d'autoroute !",
    ],
    regular: [
      "Serie de {days} jours ! Continue comme ca, champion !",
      "{days} jours ! Ton pouce est en feu !",
      "Serie en cours : {days} jours. Pas mal du tout !",
      "{days} jours de dedicace ! La route t'appartient !",
    ],
    lost: [
      "Oups ! Ta serie est partie faire du stop sans toi...",
      "Serie perdue ! Mais bon, meme les meilleurs routards ont des jours de repos !",
      "Fin de serie. Pas grave, demain est un nouveau depart !",
    ],
    start: [
      "Premiere journee ! Le debut d'une belle serie ?",
      "Jour 1 ! Tout grand voyage commence par un premier pas (ou un premier pouce leve) !",
    ],
  },
  en: {
    atRisk: [
      "Hey! Your {days}-day streak is at risk! Your thumb is getting rusty!",
      "Red alert! Only a few hours left to save your {days}-day streak!",
      "SOS Streak! {days} legendary days threatened! One check-in and you're safe!",
      "Your {days}-day streak is begging: 'Don't leave me!'",
      "The clock is ticking! {days}-day streak in imminent danger!",
    ],
    milestone: [
      "{days} days in a row! You're a hitchhiking machine!",
      "Boom! {days} days! Even trucks stop for you now!",
      "{days}-day streak! Fellow hitchhikers salute you!",
      "Incredible! {days} days! You deserve a statue at every rest stop!",
    ],
    regular: [
      "{days}-day streak! Keep it up, champion!",
      "{days} days! Your thumb is on fire!",
      "Current streak: {days} days. Not bad at all!",
      "{days} days of dedication! The road belongs to you!",
    ],
    lost: [
      "Oops! Your streak went hitchhiking without you...",
      "Streak lost! But hey, even the best hitchhikers have rest days!",
      "Streak ended. No worries, tomorrow is a fresh start!",
    ],
    start: [
      "Day one! The beginning of a great streak?",
      "Day 1! Every great journey starts with a first step (or a raised thumb)!",
    ],
  },
  es: {
    atRisk: [
      "Eh! Tu racha de {days} dias esta en peligro! Tu pulgar se esta oxidando!",
      "Alerta roja! Solo quedan unas horas para salvar tu racha de {days} dias!",
      "SOS Racha! {days} dias legendarios amenazados! Un check-in y estas a salvo!",
      "Tu racha de {days} dias te suplica: 'No me abandones!'",
      "El reloj corre! Racha de {days} dias en peligro inminente!",
    ],
    milestone: [
      "{days} dias seguidos! Eres una maquina de autostop!",
      "Boom! {days} dias! Hasta los camiones paran por ti ahora!",
      "Racha de {days} dias! Los autoestopistas te saludan!",
      "Increible! {days} dias! Mereces una estatua en cada area de descanso!",
    ],
    regular: [
      "Racha de {days} dias! Sigue asi, campeon!",
      "{days} dias! Tu pulgar esta en llamas!",
      "Racha actual: {days} dias. Nada mal!",
      "{days} dias de dedicacion! La carretera te pertenece!",
    ],
    lost: [
      "Ups! Tu racha se fue a hacer autostop sin ti...",
      "Racha perdida! Pero bueno, hasta los mejores autoestopistas descansan!",
      "Fin de racha. No pasa nada, manana es un nuevo comienzo!",
    ],
    start: [
      "Primer dia! El comienzo de una gran racha?",
      "Dia 1! Todo gran viaje empieza con un primer paso (o un pulgar levantado)!",
    ],
  },
  de: {
    atRisk: [
      "Hey! Deine {days}-Tage-Serie ist in Gefahr! Dein Daumen rostet ein!",
      "Roter Alarm! Nur noch wenige Stunden um deine {days}-Tage-Serie zu retten!",
      "SOS Serie! {days} legendare Tage bedroht! Ein Check-in und du bist sicher!",
      "Deine {days}-Tage-Serie fleht: 'Verlass mich nicht!'",
      "Die Uhr tickt! {days}-Tage-Serie in unmittelbarer Gefahr!",
    ],
    milestone: [
      "{days} Tage am Stuck! Du bist eine Tramper-Maschine!",
      "Boom! {days} Tage! Sogar LKWs halten jetzt fur dich!",
      "{days}-Tage-Serie! Tramper salutieren dir!",
      "Unglaublich! {days} Tage! Du verdienst eine Statue an jeder Raststatte!",
    ],
    regular: [
      "{days}-Tage-Serie! Weiter so, Champion!",
      "{days} Tage! Dein Daumen brennt!",
      "Aktuelle Serie: {days} Tage. Gar nicht schlecht!",
      "{days} Tage Hingabe! Die Strasse gehort dir!",
    ],
    lost: [
      "Ups! Deine Serie ist ohne dich trampen gegangen...",
      "Serie verloren! Aber hey, auch die besten Tramper haben Ruhetage!",
      "Serie beendet. Kein Problem, morgen ist ein neuer Anfang!",
    ],
    start: [
      "Erster Tag! Der Beginn einer grossen Serie?",
      "Tag 1! Jede grosse Reise beginnt mit dem ersten Schritt (oder einem erhobenen Daumen)!",
    ],
  },
}

// ==================== STATE ====================

const DEFAULT_SETTINGS = {
  enabled: false,
  reminderHour: 20, // Default: 8 PM
  lastReminderSent: null,
}

let reminderSettings = { ...DEFAULT_SETTINGS }

let reminderTimeout = null

// ==================== STORAGE ====================

/**
 * Reset settings to defaults (for testing)
 */
export function resetSettings() {
  reminderSettings = { ...DEFAULT_SETTINGS }
  if (reminderTimeout) {
    clearTimeout(reminderTimeout)
    reminderTimeout = null
  }
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      reminderSettings = { ...DEFAULT_SETTINGS, ...parsed }
    } else {
      // Reset to defaults if nothing saved
      reminderSettings = { ...DEFAULT_SETTINGS }
    }
  } catch (e) {
    console.warn('[StreakReminder] Failed to load settings:', e)
    reminderSettings = { ...DEFAULT_SETTINGS }
  }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminderSettings))
  } catch (e) {
    console.warn('[StreakReminder] Failed to save settings:', e)
  }
}

// ==================== STREAK DATA ====================

/**
 * Get current streak count from state
 * @returns {number} Current streak days
 */
export function getCurrentStreak() {
  const state = getState()
  return state.streak || 0
}

/**
 * Get the date when streak started
 * Based on current streak and last active date
 * @returns {Date|null} Streak start date or null if no streak
 */
export function getStreakStartDate() {
  const state = getState()
  const streak = state.streak || 0

  if (streak === 0) {
    return null
  }

  // Calculate start date based on streak count
  const lastActiveDate = state.lastActiveDate
  if (!lastActiveDate) {
    return null
  }

  const lastActive = new Date(lastActiveDate)
  const startDate = new Date(lastActive)
  startDate.setDate(startDate.getDate() - (streak - 1))
  startDate.setHours(0, 0, 0, 0)

  return startDate
}

/**
 * Get the date of last check-in
 * @returns {Date|null} Last check-in date or null
 */
export function getLastCheckinDate() {
  const state = getState()
  const lastActiveDate = state.lastActiveDate

  if (!lastActiveDate) {
    return null
  }

  return new Date(lastActiveDate)
}

/**
 * Check if streak might be lost (no check-in today)
 * @returns {boolean} True if streak is at risk
 */
export function isStreakAtRisk() {
  const streak = getCurrentStreak()
  if (streak === 0) {
    return false
  }

  const state = getState()
  const lastActiveDate = state.lastActiveDate
  if (!lastActiveDate) {
    return true
  }

  const today = new Date().toDateString()
  return lastActiveDate !== today
}

/**
 * Get hours remaining before streak resets at midnight
 * @returns {number} Hours remaining (0-24), or 0 if already lost
 */
export function getHoursUntilStreakLost() {
  const streak = getCurrentStreak()
  if (streak === 0) {
    return 0
  }

  const state = getState()
  const lastActiveDate = state.lastActiveDate
  if (!lastActiveDate) {
    return 0
  }

  const today = new Date()
  const todayStr = today.toDateString()

  // If already checked in today, full 24 hours remaining
  if (lastActiveDate === todayStr) {
    const midnight = new Date(today)
    midnight.setDate(midnight.getDate() + 1)
    midnight.setHours(0, 0, 0, 0)
    return Math.ceil((midnight.getTime() - today.getTime()) / MS_PER_HOUR)
  }

  // Check if last active was yesterday
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  if (lastActiveDate === yesterdayStr) {
    // Hours until midnight tonight
    const midnight = new Date(today)
    midnight.setDate(midnight.getDate() + 1)
    midnight.setHours(0, 0, 0, 0)
    return Math.ceil((midnight.getTime() - today.getTime()) / MS_PER_HOUR)
  }

  // Streak is already lost
  return 0
}

// ==================== REMINDERS ====================

/**
 * Send a streak reminder notification
 * @returns {boolean} True if reminder was sent
 */
export function sendStreakReminder() {
  const streak = getCurrentStreak()
  if (streak === 0) {
    return false
  }

  if (!isStreakAtRisk()) {
    console.log('[StreakReminder] Streak not at risk, no reminder needed')
    return false
  }

  const message = formatStreakMessage(streak, 'atRisk')
  const hours = getHoursUntilStreakLost()

  // Show toast notification
  showToast(`🔥 ${message}`, 'warning', 8000)

  // Update last reminder sent
  reminderSettings.lastReminderSent = Date.now()
  saveSettings()

  // Try to send push notification if available
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification('SpotHitch - Serie en danger!', {
          body: message,
          icon: '/Spothitch/icon-192.png',
          badge: '/Spothitch/icon-96.png',
          tag: 'streak-reminder',
          requireInteraction: true,
          data: { type: 'streak_reminder', hours },
        })
      } catch (e) {
        console.warn('[StreakReminder] Failed to send push notification:', e)
      }
    }
  }

  console.log(`[StreakReminder] Reminder sent: ${hours}h remaining for ${streak}-day streak`)
  return true
}

/**
 * Set preferred reminder time (hour of day)
 * @param {number} hour - Hour (0-23)
 * @returns {boolean} True if set successfully
 */
export function setReminderTime(hour) {
  if (typeof hour !== 'number' || hour < 0 || hour > 23) {
    console.warn('[StreakReminder] Invalid reminder hour:', hour)
    return false
  }

  reminderSettings.reminderHour = Math.floor(hour)
  saveSettings()

  // Reschedule if enabled
  if (reminderSettings.enabled) {
    scheduleReminder()
  }

  console.log(`[StreakReminder] Reminder time set to ${hour}:00`)
  return true
}

/**
 * Get current reminder time setting
 * @returns {number} Reminder hour (0-23)
 */
export function getReminderTime() {
  loadSettings()
  return reminderSettings.reminderHour
}

/**
 * Enable streak reminders
 * @returns {boolean} True if enabled successfully
 */
export function enableStreakReminder() {
  reminderSettings.enabled = true
  saveSettings()
  scheduleReminder()
  console.log('[StreakReminder] Reminders enabled')
  return true
}

/**
 * Disable streak reminders
 * @returns {boolean} True if disabled successfully
 */
export function disableStreakReminder() {
  reminderSettings.enabled = false
  saveSettings()

  if (reminderTimeout) {
    clearTimeout(reminderTimeout)
    reminderTimeout = null
  }

  console.log('[StreakReminder] Reminders disabled')
  return true
}

/**
 * Check if reminders are enabled
 * @returns {boolean} True if enabled
 */
export function isReminderEnabled() {
  loadSettings()
  return reminderSettings.enabled
}

/**
 * Schedule the next reminder
 * @private
 */
function scheduleReminder() {
  if (reminderTimeout) {
    clearTimeout(reminderTimeout)
    reminderTimeout = null
  }

  if (!reminderSettings.enabled) {
    return
  }

  const now = new Date()
  const scheduledTime = new Date(now)
  scheduledTime.setHours(reminderSettings.reminderHour, 0, 0, 0)

  // If the time has passed today, schedule for tomorrow
  if (scheduledTime.getTime() <= now.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const delay = scheduledTime.getTime() - now.getTime()

  reminderTimeout = setTimeout(() => {
    if (isStreakAtRisk() && reminderSettings.enabled) {
      sendStreakReminder()
    }
    // Schedule next day's reminder
    scheduleReminder()
  }, delay)

  console.log(`[StreakReminder] Next reminder scheduled in ${Math.round(delay / 1000 / 60)} minutes`)
}

// ==================== MILESTONES ====================

/**
 * Get all milestone thresholds
 * @returns {number[]} Array of milestone days
 */
export function getStreakMilestones() {
  return [...STREAK_MILESTONES]
}

/**
 * Check if a streak count is a milestone
 * @param {number} days - Number of days
 * @returns {boolean} True if it's a milestone
 */
export function isStreakMilestone(days) {
  return STREAK_MILESTONES.includes(days)
}

/**
 * Get the next milestone to reach
 * @returns {number|null} Next milestone or null if max reached
 */
export function getNextMilestone() {
  const streak = getCurrentStreak()

  for (const milestone of STREAK_MILESTONES) {
    if (streak < milestone) {
      return milestone
    }
  }

  return null
}

/**
 * Get days until next milestone
 * @returns {number} Days until next milestone, or 0 if max reached
 */
export function getDaysUntilNextMilestone() {
  const streak = getCurrentStreak()
  const next = getNextMilestone()

  if (next === null) {
    return 0
  }

  return next - streak
}

/**
 * Get reward points for a milestone
 * @param {number} milestone - Milestone day count
 * @returns {number} Points reward, or 0 if not a milestone
 */
export function getStreakReward(milestone) {
  return MILESTONE_REWARDS[milestone] || 0
}

/**
 * Get milestone progress percentage
 * @returns {number} Progress percentage (0-100)
 */
export function getMilestoneProgress() {
  const streak = getCurrentStreak()
  const next = getNextMilestone()

  if (next === null) {
    return 100
  }

  // Find previous milestone
  let prev = 0
  for (const m of STREAK_MILESTONES) {
    if (m >= next) break
    prev = m
  }

  const range = next - prev
  const progress = streak - prev
  return Math.round((progress / range) * 100)
}

// ==================== RENDERING ====================

/**
 * Render streak status card HTML
 * @returns {string} HTML string
 */
export function renderStreakCard() {
  const streak = getCurrentStreak()
  const atRisk = isStreakAtRisk()
  const hoursLeft = getHoursUntilStreakLost()
  const nextMilestone = getNextMilestone()
  const progress = getMilestoneProgress()
  const reward = nextMilestone ? getStreakReward(nextMilestone) : 0
  const startDate = getStreakStartDate()
  const isMilestone = isStreakMilestone(streak)

  const statusClass = atRisk ? 'border-amber-500 bg-amber-500/10' : 'border-primary-500 bg-primary-500/10'
  const statusIcon = atRisk ? '⚠️' : '🔥'
  const statusText = atRisk
    ? `${hoursLeft}h restantes !`
    : streak === 0
      ? 'Pas de serie'
      : 'Serie active'

  let milestoneSection = ''
  if (nextMilestone) {
    milestoneSection = `
      <div class="mt-4">
        <div class="flex justify-between text-sm text-slate-400 mb-1">
          <span>Prochain palier : ${nextMilestone} jours</span>
          <span>+${reward} pts</span>
        </div>
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary-500 to-amber-500 transition-all duration-500"
               style="width: ${progress}%"></div>
        </div>
        <div class="text-xs text-slate-500 mt-1">
          ${getDaysUntilNextMilestone()} jours restants
        </div>
      </div>
    `
  } else {
    milestoneSection = `
      <div class="mt-4 text-center">
        <span class="text-amber-400">🏆 Tous les paliers atteints !</span>
      </div>
    `
  }

  const milestoneDisplay = isMilestone
    ? `<div class="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">🎉 Palier!</div>`
    : ''

  return `
    <div class="streak-card relative rounded-xl border ${statusClass} p-4" role="region" aria-label="Streak status">
      ${milestoneDisplay}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-4xl" role="img" aria-label="fire">${statusIcon}</span>
          <div>
            <div class="text-3xl font-bold text-white">${streak}</div>
            <div class="text-sm text-slate-400">jours de serie</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-medium ${atRisk ? 'text-amber-400' : 'text-primary-400'}">
            ${statusText}
          </div>
          ${startDate ? `<div class="text-xs text-slate-500">Depuis le ${startDate.toLocaleDateString()}</div>` : ''}
        </div>
      </div>
      ${milestoneSection}
    </div>
  `
}

/**
 * Render streak reminder notification HTML
 * @returns {string} HTML string
 */
export function renderStreakReminder() {
  const streak = getCurrentStreak()
  const hoursLeft = getHoursUntilStreakLost()
  const message = formatStreakMessage(streak, 'atRisk')

  if (!isStreakAtRisk() || streak === 0) {
    return ''
  }

  return `
    <div class="streak-reminder fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-bounce-slow"
         role="alert" aria-live="assertive">
      <div class="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-2xl p-4">
        <div class="flex items-start gap-3">
          <span class="text-3xl animate-pulse">🔥</span>
          <div class="flex-1">
            <div class="font-bold text-white text-lg">Serie en danger !</div>
            <div class="text-amber-100 text-sm mt-1">${message}</div>
            <div class="flex items-center gap-2 mt-3">
              <div class="flex-1 h-2 bg-amber-800/50 rounded-full overflow-hidden">
                <div class="h-full bg-white transition-all" style="width: ${(hoursLeft / 24) * 100}%"></div>
              </div>
              <span class="text-white font-bold text-sm">${hoursLeft}h</span>
            </div>
            <button onclick="window.goToMap && window.goToMap()"
                    class="mt-3 w-full bg-white text-amber-600 font-bold py-2 px-4 rounded-lg hover:bg-amber-50 transition-colors"
                    aria-label="Check-in maintenant">
              Check-in maintenant !
            </button>
          </div>
          <button onclick="this.closest('.streak-reminder').remove()"
                  class="text-amber-200 hover:text-white p-1"
                  aria-label="Fermer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
}

/**
 * Format a streak message with humor
 * @param {number} days - Streak days
 * @param {string} type - Message type: 'atRisk', 'milestone', 'regular', 'lost', 'start'
 * @returns {string} Formatted message
 */
export function formatStreakMessage(days, type = 'regular') {
  const state = getState()
  const lang = state.lang || 'fr'
  const messages = STREAK_MESSAGES[lang] || STREAK_MESSAGES.fr

  const typeMessages = messages[type] || messages.regular

  // Pick a random message from the array
  const template = typeMessages[Math.floor(Math.random() * typeMessages.length)]

  return template.replace('{days}', String(days))
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the streak reminder service
 */
export function initStreakReminder() {
  loadSettings()

  if (reminderSettings.enabled) {
    scheduleReminder()
  }

  console.log('[StreakReminder] Service initialized')
  return true
}

// ==================== EXPORTS ====================

export default {
  // Streak data
  getCurrentStreak,
  getStreakStartDate,
  getLastCheckinDate,
  isStreakAtRisk,
  getHoursUntilStreakLost,

  // Reminders
  sendStreakReminder,
  setReminderTime,
  getReminderTime,
  enableStreakReminder,
  disableStreakReminder,
  isReminderEnabled,

  // Milestones
  getStreakMilestones,
  isStreakMilestone,
  getNextMilestone,
  getDaysUntilNextMilestone,
  getStreakReward,
  getMilestoneProgress,

  // Rendering
  renderStreakCard,
  renderStreakReminder,
  formatStreakMessage,

  // Initialization
  initStreakReminder,

  // Testing
  resetSettings,
}
