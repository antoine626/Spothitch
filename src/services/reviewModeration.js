/**
 * Review Moderation Service
 * Auto-detects spam patterns in reviews
 *
 * Spam detection criteria:
 * - All caps text
 * - Excessive punctuation (!!!, ???)
 * - URLs/links
 * - Very short reviews (<10 chars)
 * - Repeated characters (aaaa, hhhh)
 * - Common spam words
 */

import { Storage } from '../utils/storage.js'

const MODERATION_LOG_KEY = 'spothitch_moderation_log'

const SPAM_KEYWORDS = [
  'click here', 'buy now', 'limited offer', 'act now', 'free money',
  'make money', 'earn cash', 'win prize', 'crypto', 'bitcoin',
  'investment', 'casino', 'viagra', 'porn', 'sex', 'dating',
  'singles', 'weight loss', 'discount', 'promo code', 'visit our',
  'check out', 'follow us', 'subscribe', 'acheter', 'gratuit',
  'argent facile', 'gagnez', 'promotion', 'cliquez ici',
]

const URL_PATTERN = /(?:https?:\/\/|www\.)\S+|[a-zA-Z0-9-]+\.(com|net|org|io|fr|de|es|uk|co)/gi

function detectAllCaps(text) {
  const words = text.split(/\s+/).filter(w => w.length > 3)
  if (words.length === 0) return 0
  const capsWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w))
  const capsRatio = capsWords.length / words.length
  if (capsRatio > 0.7) return 30
  if (capsRatio > 0.5) return 20
  if (capsRatio > 0.3) return 10
  return 0
}

function detectExcessivePunctuation(text) {
  const exclamations = (text.match(/!{2,}/g) || []).length
  const questions = (text.match(/\?{2,}/g) || []).length
  const dots = (text.match(/\.{3,}/g) || []).length
  const total = exclamations + questions + dots
  if (total >= 5) return 20
  if (total >= 3) return 15
  if (total >= 2) return 10
  return 0
}

function detectURLs(text) {
  const matches = text.match(URL_PATTERN)
  if (!matches) return 0
  if (matches.length >= 3) return 40
  if (matches.length >= 2) return 30
  return 20
}

function detectRepeatedChars(text) {
  const matches = text.match(/(.)(\1){3,}/g)
  if (!matches) return 0
  if (matches.length >= 5) return 15
  if (matches.length >= 3) return 10
  return 5
}

function detectSpamKeywords(text) {
  const lowerText = text.toLowerCase()
  let matchCount = 0
  for (const keyword of SPAM_KEYWORDS) {
    if (lowerText.includes(keyword)) matchCount++
  }
  if (matchCount >= 5) return 30
  if (matchCount >= 3) return 20
  if (matchCount >= 1) return 10
  return 0
}

function detectTooShort(text) {
  const trimmed = text.trim()
  if (trimmed.length === 0) return 15
  if (trimmed.length < 5) return 10
  if (trimmed.length < 10) return 5
  return 0
}

export function moderateReview(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, flags: [], blocked: false, reason: null }
  }

  const flags = []
  let totalScore = 0

  const checks = [
    ['all_caps', detectAllCaps],
    ['excessive_punctuation', detectExcessivePunctuation],
    ['contains_urls', detectURLs],
    ['repeated_characters', detectRepeatedChars],
    ['spam_keywords', detectSpamKeywords],
    ['too_short', detectTooShort],
  ]

  for (const [type, fn] of checks) {
    const score = fn(text)
    if (score > 0) {
      flags.push({ type, score })
      totalScore += score
    }
  }

  totalScore = Math.min(totalScore, 100)

  let blocked = false
  let reason = null

  if (totalScore > 90) {
    blocked = true
    reason = 'spam_blocked_high_score'
  } else if (totalScore > 70) {
    reason = 'spam_flagged_review'
  }

  logModerationResult({
    timestamp: new Date().toISOString(),
    score: totalScore,
    flags,
    blocked,
    textLength: text.length,
  })

  return { score: totalScore, flags, blocked, reason }
}

export function isSpam(text) {
  const result = moderateReview(text)
  return result.blocked || result.score > 70
}

function logModerationResult(result) {
  try {
    const logs = Storage.get(MODERATION_LOG_KEY) || []
    logs.push(result)
    if (logs.length > 100) logs.splice(0, logs.length - 100)
    Storage.set(MODERATION_LOG_KEY, logs)
  } catch (error) {
    console.error('[ReviewModeration] Error logging result:', error)
  }
}

export function getModerationLogs() {
  return Storage.get(MODERATION_LOG_KEY) || []
}

export function clearModerationLogs() {
  Storage.set(MODERATION_LOG_KEY, [])
}

export function getModerationStats() {
  const logs = getModerationLogs()
  if (logs.length === 0) {
    return { totalChecks: 0, blockedCount: 0, flaggedCount: 0, averageScore: 0, commonFlags: {} }
  }

  const blockedCount = logs.filter(l => l.blocked).length
  const flaggedCount = logs.filter(l => !l.blocked && l.score > 70).length
  const avgScore = logs.reduce((s, l) => s + l.score, 0) / logs.length

  const flagCounts = {}
  logs.forEach(l => l.flags.forEach(f => {
    flagCounts[f.type] = (flagCounts[f.type] || 0) + 1
  }))

  return {
    totalChecks: logs.length,
    blockedCount,
    flaggedCount,
    averageScore: Math.round(avgScore * 10) / 10,
    commonFlags: flagCounts,
  }
}

export default {
  moderateReview,
  isSpam,
  getModerationLogs,
  clearModerationLogs,
  getModerationStats,
}
