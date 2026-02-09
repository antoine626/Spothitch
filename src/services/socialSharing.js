/**
 * Social Sharing Service
 * Share content to social networks (Facebook, Twitter, WhatsApp, Telegram)
 * with platform-specific text and image formatting
 */

import { t } from '../i18n/index.js'
import { getState } from '../stores/state.js'
import { trackEvent } from './analytics.js'

// Base URL for sharing
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/Spothitch'
  }
  return 'https://spothitch.app'
}

// Social network share URL templates
const SHARE_URLS = {
  facebook: 'https://www.facebook.com/sharer/sharer.php?u={url}&quote={text}',
  twitter: 'https://twitter.com/intent/tweet?url={url}&text={text}&hashtags={hashtags}',
  whatsapp: 'https://wa.me/?text={text}',
  telegram: 'https://t.me/share/url?url={url}&text={text}',
}

// Platform-specific character limits
const CHARACTER_LIMITS = {
  facebook: 500,
  twitter: 280,
  whatsapp: 1000,
  telegram: 4096,
}

// Default hashtags per platform
const DEFAULT_HASHTAGS = {
  twitter: ['SpotHitch', 'Hitchhiking', 'Autostop', 'Travel'],
  facebook: ['SpotHitch', 'Travel'],
  whatsapp: [],
  telegram: ['SpotHitch'],
}

// Content types supported
export const CONTENT_TYPES = {
  SPOT: 'spot',
  ACHIEVEMENT: 'achievement',
  STATS: 'stats',
  TRIP: 'trip',
  PROFILE: 'profile',
}

// Platforms supported
export const PLATFORMS = {
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
}

/**
 * Escape special characters for URL encoding
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeText(text) {
  if (!text) return ''
  return encodeURIComponent(text)
}

/**
 * Truncate text to character limit with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} limit - Character limit
 * @returns {string} Truncated text
 */
function truncateText(text, limit) {
  if (!text || text.length <= limit) return text
  return text.substring(0, limit - 3) + '...'
}

/**
 * Generate share text for a spot
 * @param {Object} spot - Spot object
 * @param {string} platform - Target platform
 * @returns {Object} { text, hashtags, url }
 */
function generateSpotShareContent(spot, platform) {
  const { lang } = getState()
  const url = `${getBaseUrl()}/#/spot/${spot.id}`

  // Platform-specific emoji usage
  const useEmoji = platform !== 'twitter' // Twitter sometimes has emoji issues
  const thumbEmoji = useEmoji ? '👍 ' : ''
  const starEmoji = useEmoji ? '⭐ ' : ''
  const pinEmoji = useEmoji ? '📍 ' : ''

  const rating = spot.rating ? `${starEmoji}${spot.rating.toFixed(1)}/5` : ''
  const waitTime = spot.averageWait ? `${spot.averageWait} min` : ''

  let text = ''
  const hashtags = [...(DEFAULT_HASHTAGS[platform] || [])]

  if (lang === 'fr') {
    text = `${thumbEmoji}Spot d'autostop : ${spot.from || 'Depart'} -> ${spot.to || 'Destination'}`
    if (rating) text += ` | ${rating}`
    if (waitTime) text += ` | Attente moy. ${waitTime}`
    text += `\n${pinEmoji}Decouvrez ce spot sur SpotHitch !`
  } else if (lang === 'es') {
    text = `${thumbEmoji}Spot de autostop: ${spot.from || 'Salida'} -> ${spot.to || 'Destino'}`
    if (rating) text += ` | ${rating}`
    if (waitTime) text += ` | Espera prom. ${waitTime}`
    text += `\n${pinEmoji}Descubre este spot en SpotHitch!`
  } else if (lang === 'de') {
    text = `${thumbEmoji}Tramper-Spot: ${spot.from || 'Start'} -> ${spot.to || 'Ziel'}`
    if (rating) text += ` | ${rating}`
    if (waitTime) text += ` | Wartezeit ca. ${waitTime}`
    text += `\n${pinEmoji}Entdecke diesen Spot auf SpotHitch!`
  } else {
    // Default to English
    text = `${thumbEmoji}Hitchhiking spot: ${spot.from || 'Start'} -> ${spot.to || 'Destination'}`
    if (rating) text += ` | ${rating}`
    if (waitTime) text += ` | Avg. wait ${waitTime}`
    text += `\n${pinEmoji}Check out this spot on SpotHitch!`
  }

  // Add country hashtag if available
  if (spot.country) {
    hashtags.push(spot.country)
  }

  return {
    text: truncateText(text, CHARACTER_LIMITS[platform]),
    hashtags,
    url,
  }
}

/**
 * Generate share text for an achievement/badge
 * @param {Object} achievement - Achievement object
 * @param {string} platform - Target platform
 * @returns {Object} { text, hashtags, url }
 */
function generateAchievementShareContent(achievement, platform) {
  const { lang } = getState()
  const url = `${getBaseUrl()}/#/badge/${achievement.id}`

  const useEmoji = platform !== 'twitter'
  const trophyEmoji = useEmoji ? '🏆 ' : ''
  const celebrateEmoji = useEmoji ? '🎉 ' : ''

  let text = ''
  const hashtags = [...(DEFAULT_HASHTAGS[platform] || []), 'Achievement']

  const badgeName = achievement.name || achievement.title || 'Unknown Badge'
  const badgeDesc = achievement.description || ''

  if (lang === 'fr') {
    text = `${trophyEmoji}Badge debloque : ${badgeName}!`
    if (badgeDesc) text += `\n${badgeDesc}`
    text += `\n${celebrateEmoji}Rejoins la communaute SpotHitch !`
  } else if (lang === 'es') {
    text = `${trophyEmoji}Insignia desbloqueada: ${badgeName}!`
    if (badgeDesc) text += `\n${badgeDesc}`
    text += `\n${celebrateEmoji}Unete a la comunidad SpotHitch!`
  } else if (lang === 'de') {
    text = `${trophyEmoji}Abzeichen freigeschaltet: ${badgeName}!`
    if (badgeDesc) text += `\n${badgeDesc}`
    text += `\n${celebrateEmoji}Tritt der SpotHitch-Community bei!`
  } else {
    text = `${trophyEmoji}Achievement unlocked: ${badgeName}!`
    if (badgeDesc) text += `\n${badgeDesc}`
    text += `\n${celebrateEmoji}Join the SpotHitch community!`
  }

  return {
    text: truncateText(text, CHARACTER_LIMITS[platform]),
    hashtags,
    url,
  }
}

/**
 * Generate share text for personal stats
 * @param {Object} stats - User stats object
 * @param {string} platform - Target platform
 * @returns {Object} { text, hashtags, url }
 */
function generateStatsShareContent(stats, platform) {
  const { lang, user } = getState()
  const username = user?.username || user?.displayName || stats.username || 'Hitchhiker'
  const url = stats.profileUrl || `${getBaseUrl()}/#/profile`

  const useEmoji = platform !== 'twitter'
  const chartEmoji = useEmoji ? '📊 ' : ''
  const thumbEmoji = useEmoji ? '👍 ' : ''
  const fireEmoji = useEmoji ? '🔥 ' : ''
  const roadEmoji = useEmoji ? '🛤️ ' : ''

  let text = ''
  const hashtags = [...(DEFAULT_HASHTAGS[platform] || []), 'Stats']

  const checkins = stats.checkins || stats.totalCheckins || 0
  const spots = stats.spots || stats.totalSpots || 0
  const distance = stats.distance || stats.totalDistance || 0
  const level = stats.level || 1
  const streak = stats.streak || 0

  if (lang === 'fr') {
    text = `${chartEmoji}Mes stats SpotHitch :\n`
    text += `${thumbEmoji}${checkins} check-ins | ${spots} spots\n`
    if (distance > 0) text += `${roadEmoji}${distance} km parcourus\n`
    text += `Niveau ${level}`
    if (streak > 0) text += ` | ${fireEmoji}Serie de ${streak} jours`
    text += `\nRejoins-moi sur SpotHitch !`
  } else if (lang === 'es') {
    text = `${chartEmoji}Mis estadisticas de SpotHitch:\n`
    text += `${thumbEmoji}${checkins} check-ins | ${spots} spots\n`
    if (distance > 0) text += `${roadEmoji}${distance} km recorridos\n`
    text += `Nivel ${level}`
    if (streak > 0) text += ` | ${fireEmoji}Racha de ${streak} dias`
    text += `\nUnete a mi en SpotHitch!`
  } else if (lang === 'de') {
    text = `${chartEmoji}Meine SpotHitch Statistik:\n`
    text += `${thumbEmoji}${checkins} Check-ins | ${spots} Spots\n`
    if (distance > 0) text += `${roadEmoji}${distance} km zurueckgelegt\n`
    text += `Level ${level}`
    if (streak > 0) text += ` | ${fireEmoji}${streak} Tage Serie`
    text += `\nTritt mir auf SpotHitch bei!`
  } else {
    text = `${chartEmoji}My SpotHitch stats:\n`
    text += `${thumbEmoji}${checkins} check-ins | ${spots} spots\n`
    if (distance > 0) text += `${roadEmoji}${distance} km traveled\n`
    text += `Level ${level}`
    if (streak > 0) text += ` | ${fireEmoji}${streak} day streak`
    text += `\nJoin me on SpotHitch!`
  }

  return {
    text: truncateText(text, CHARACTER_LIMITS[platform]),
    hashtags,
    url,
  }
}

/**
 * Generate share URL for a platform
 * @param {string} platform - Platform name
 * @param {Object} content - { text, hashtags, url }
 * @returns {string} Complete share URL
 */
function generateShareUrl(platform, content) {
  const template = SHARE_URLS[platform]
  if (!template) {
    console.warn(`[SocialSharing] Unknown platform: ${platform}`)
    return null
  }

  const { text, hashtags = [], url } = content

  // For WhatsApp, combine text and URL
  let shareText = text
  if (platform === 'whatsapp') {
    shareText = `${text}\n\n${url}`
  }

  let shareUrl = template
    .replace('{url}', escapeText(url))
    .replace('{text}', escapeText(shareText))

  // Add hashtags for Twitter
  if (platform === 'twitter' && hashtags.length > 0) {
    shareUrl = shareUrl.replace('{hashtags}', hashtags.join(','))
  } else {
    shareUrl = shareUrl.replace('&hashtags={hashtags}', '')
  }

  return shareUrl
}

/**
 * Open share window/popup
 * @param {string} url - Share URL
 * @param {string} platform - Platform name
 * @returns {boolean} True if window opened successfully
 */
function openShareWindow(url, platform) {
  if (!url) return false

  const width = 600
  const height = 400
  const left = typeof window !== 'undefined' ? (window.innerWidth - width) / 2 : 0
  const top = typeof window !== 'undefined' ? (window.innerHeight - height) / 2 : 0

  const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`

  try {
    const popup = window.open(url, `share_${platform}`, features)
    if (popup) {
      popup.focus()
      return true
    }
    // Popup blocked, fall back to direct navigation
    window.location.href = url
    return true
  } catch (error) {
    console.error(`[SocialSharing] Failed to open share window:`, error)
    return false
  }
}

/**
 * Share to Facebook
 * @param {Object} data - Content data { type, spot?, achievement?, stats? }
 * @returns {Object} { success: boolean, url?: string, error?: string }
 */
export function shareToFacebook(data) {
  if (!data) {
    return { success: false, error: 'no_data' }
  }

  let content
  const contentType = data.type || CONTENT_TYPES.SPOT

  switch (contentType) {
    case CONTENT_TYPES.SPOT:
      if (!data.spot || !data.spot.id) {
        return { success: false, error: 'invalid_spot' }
      }
      content = generateSpotShareContent(data.spot, PLATFORMS.FACEBOOK)
      break
    case CONTENT_TYPES.ACHIEVEMENT:
      if (!data.achievement || !data.achievement.id) {
        return { success: false, error: 'invalid_achievement' }
      }
      content = generateAchievementShareContent(data.achievement, PLATFORMS.FACEBOOK)
      break
    case CONTENT_TYPES.STATS:
      if (!data.stats) {
        return { success: false, error: 'invalid_stats' }
      }
      content = generateStatsShareContent(data.stats, PLATFORMS.FACEBOOK)
      break
    default:
      return { success: false, error: 'unsupported_type' }
  }

  const shareUrl = generateShareUrl(PLATFORMS.FACEBOOK, content)
  const success = openShareWindow(shareUrl, PLATFORMS.FACEBOOK)

  if (success) {
    trackShare(PLATFORMS.FACEBOOK, contentType)
  }

  return { success, url: shareUrl }
}

/**
 * Share to Twitter
 * @param {Object} data - Content data { type, spot?, achievement?, stats? }
 * @returns {Object} { success: boolean, url?: string, error?: string }
 */
export function shareToTwitter(data) {
  if (!data) {
    return { success: false, error: 'no_data' }
  }

  let content
  const contentType = data.type || CONTENT_TYPES.SPOT

  switch (contentType) {
    case CONTENT_TYPES.SPOT:
      if (!data.spot || !data.spot.id) {
        return { success: false, error: 'invalid_spot' }
      }
      content = generateSpotShareContent(data.spot, PLATFORMS.TWITTER)
      break
    case CONTENT_TYPES.ACHIEVEMENT:
      if (!data.achievement || !data.achievement.id) {
        return { success: false, error: 'invalid_achievement' }
      }
      content = generateAchievementShareContent(data.achievement, PLATFORMS.TWITTER)
      break
    case CONTENT_TYPES.STATS:
      if (!data.stats) {
        return { success: false, error: 'invalid_stats' }
      }
      content = generateStatsShareContent(data.stats, PLATFORMS.TWITTER)
      break
    default:
      return { success: false, error: 'unsupported_type' }
  }

  const shareUrl = generateShareUrl(PLATFORMS.TWITTER, content)
  const success = openShareWindow(shareUrl, PLATFORMS.TWITTER)

  if (success) {
    trackShare(PLATFORMS.TWITTER, contentType)
  }

  return { success, url: shareUrl }
}

/**
 * Share to WhatsApp
 * @param {Object} data - Content data { type, spot?, achievement?, stats? }
 * @returns {Object} { success: boolean, url?: string, error?: string }
 */
export function shareToWhatsApp(data) {
  if (!data) {
    return { success: false, error: 'no_data' }
  }

  let content
  const contentType = data.type || CONTENT_TYPES.SPOT

  switch (contentType) {
    case CONTENT_TYPES.SPOT:
      if (!data.spot || !data.spot.id) {
        return { success: false, error: 'invalid_spot' }
      }
      content = generateSpotShareContent(data.spot, PLATFORMS.WHATSAPP)
      break
    case CONTENT_TYPES.ACHIEVEMENT:
      if (!data.achievement || !data.achievement.id) {
        return { success: false, error: 'invalid_achievement' }
      }
      content = generateAchievementShareContent(data.achievement, PLATFORMS.WHATSAPP)
      break
    case CONTENT_TYPES.STATS:
      if (!data.stats) {
        return { success: false, error: 'invalid_stats' }
      }
      content = generateStatsShareContent(data.stats, PLATFORMS.WHATSAPP)
      break
    default:
      return { success: false, error: 'unsupported_type' }
  }

  const shareUrl = generateShareUrl(PLATFORMS.WHATSAPP, content)
  const success = openShareWindow(shareUrl, PLATFORMS.WHATSAPP)

  if (success) {
    trackShare(PLATFORMS.WHATSAPP, contentType)
  }

  return { success, url: shareUrl }
}

/**
 * Share to Telegram
 * @param {Object} data - Content data { type, spot?, achievement?, stats? }
 * @returns {Object} { success: boolean, url?: string, error?: string }
 */
export function shareToTelegram(data) {
  if (!data) {
    return { success: false, error: 'no_data' }
  }

  let content
  const contentType = data.type || CONTENT_TYPES.SPOT

  switch (contentType) {
    case CONTENT_TYPES.SPOT:
      if (!data.spot || !data.spot.id) {
        return { success: false, error: 'invalid_spot' }
      }
      content = generateSpotShareContent(data.spot, PLATFORMS.TELEGRAM)
      break
    case CONTENT_TYPES.ACHIEVEMENT:
      if (!data.achievement || !data.achievement.id) {
        return { success: false, error: 'invalid_achievement' }
      }
      content = generateAchievementShareContent(data.achievement, PLATFORMS.TELEGRAM)
      break
    case CONTENT_TYPES.STATS:
      if (!data.stats) {
        return { success: false, error: 'invalid_stats' }
      }
      content = generateStatsShareContent(data.stats, PLATFORMS.TELEGRAM)
      break
    default:
      return { success: false, error: 'unsupported_type' }
  }

  const shareUrl = generateShareUrl(PLATFORMS.TELEGRAM, content)
  const success = openShareWindow(shareUrl, PLATFORMS.TELEGRAM)

  if (success) {
    trackShare(PLATFORMS.TELEGRAM, contentType)
  }

  return { success, url: shareUrl }
}

/**
 * Render share buttons for a spot
 * @param {Object} spot - Spot object
 * @returns {string} HTML string with share buttons
 */
export function renderShareButtons(spot) {
  if (!spot || !spot.id) {
    console.warn('[SocialSharing] Cannot render share buttons: invalid spot')
    return ''
  }

  const dataAttr = escapeText(JSON.stringify({ type: CONTENT_TYPES.SPOT, spot }))

  return `
    <div class="share-buttons flex items-center gap-2" role="group" aria-label="${t('shareOnSocial') || 'Share on social networks'}">
      <button
        type="button"
        class="share-btn share-btn-facebook p-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2"
        onclick="window.shareToFacebook('${dataAttr}')"
        aria-label="${t('shareOnFacebook') || 'Share on Facebook'}"
        title="Facebook"
      >
        <i class="fab fa-facebook-f" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="share-btn share-btn-twitter p-2 bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:ring-offset-2"
        onclick="window.shareToTwitter('${dataAttr}')"
        aria-label="${t('shareOnTwitter') || 'Share on Twitter'}"
        title="Twitter"
      >
        <i class="fab fa-twitter" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="share-btn share-btn-whatsapp p-2 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
        onclick="window.shareToWhatsApp('${dataAttr}')"
        aria-label="${t('shareOnWhatsApp') || 'Share on WhatsApp'}"
        title="WhatsApp"
      >
        <i class="fab fa-whatsapp" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="share-btn share-btn-telegram p-2 bg-[#0088CC] hover:bg-[#007AB8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0088CC] focus:ring-offset-2"
        onclick="window.shareToTelegram('${dataAttr}')"
        aria-label="${t('shareOnTelegram') || 'Share on Telegram'}"
        title="Telegram"
      >
        <i class="fab fa-telegram-plane" aria-hidden="true"></i>
      </button>
    </div>
  `
}

/**
 * Render share buttons for an achievement
 * @param {Object} achievement - Achievement/badge object
 * @returns {string} HTML string with share buttons
 */
export function renderAchievementShareButtons(achievement) {
  if (!achievement || !achievement.id) {
    console.warn('[SocialSharing] Cannot render share buttons: invalid achievement')
    return ''
  }

  const dataAttr = escapeText(JSON.stringify({ type: CONTENT_TYPES.ACHIEVEMENT, achievement }))

  return `
    <div class="share-buttons flex items-center gap-2" role="group" aria-label="${t('shareAchievement') || 'Share achievement'}">
      <span class="text-sm text-gray-500 dark:text-gray-400 mr-1">${t('share') || 'Share'}:</span>
      <button
        type="button"
        class="share-btn share-btn-facebook p-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded transition-colors text-xs"
        onclick="window.shareToFacebook('${dataAttr}')"
        aria-label="${t('shareOnFacebook') || 'Share on Facebook'}"
      >
        <i class="fab fa-facebook-f" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="share-btn share-btn-twitter p-1.5 bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white rounded transition-colors text-xs"
        onclick="window.shareToTwitter('${dataAttr}')"
        aria-label="${t('shareOnTwitter') || 'Share on Twitter'}"
      >
        <i class="fab fa-twitter" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="share-btn share-btn-whatsapp p-1.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded transition-colors text-xs"
        onclick="window.shareToWhatsApp('${dataAttr}')"
        aria-label="${t('shareOnWhatsApp') || 'Share on WhatsApp'}"
      >
        <i class="fab fa-whatsapp" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="share-btn share-btn-telegram p-1.5 bg-[#0088CC] hover:bg-[#007AB8] text-white rounded transition-colors text-xs"
        onclick="window.shareToTelegram('${dataAttr}')"
        aria-label="${t('shareOnTelegram') || 'Share on Telegram'}"
      >
        <i class="fab fa-telegram-plane" aria-hidden="true"></i>
      </button>
    </div>
  `
}

/**
 * Render share buttons for personal stats
 * @param {Object} stats - Stats object
 * @returns {string} HTML string with share buttons
 */
export function renderStatsShareButtons(stats) {
  if (!stats) {
    console.warn('[SocialSharing] Cannot render share buttons: invalid stats')
    return ''
  }

  const dataAttr = escapeText(JSON.stringify({ type: CONTENT_TYPES.STATS, stats }))

  return `
    <div class="share-buttons flex items-center gap-3 mt-4" role="group" aria-label="${t('shareStats') || 'Share your stats'}">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${t('shareMyStats') || 'Share my stats'}:</span>
      <button
        type="button"
        class="share-btn share-btn-facebook px-3 py-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg transition-colors text-sm flex items-center gap-1"
        onclick="window.shareToFacebook('${dataAttr}')"
        aria-label="${t('shareOnFacebook') || 'Share on Facebook'}"
      >
        <i class="fab fa-facebook-f" aria-hidden="true"></i>
        <span class="hidden sm:inline">Facebook</span>
      </button>
      <button
        type="button"
        class="share-btn share-btn-twitter px-3 py-1.5 bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white rounded-lg transition-colors text-sm flex items-center gap-1"
        onclick="window.shareToTwitter('${dataAttr}')"
        aria-label="${t('shareOnTwitter') || 'Share on Twitter'}"
      >
        <i class="fab fa-twitter" aria-hidden="true"></i>
        <span class="hidden sm:inline">Twitter</span>
      </button>
      <button
        type="button"
        class="share-btn share-btn-whatsapp px-3 py-1.5 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg transition-colors text-sm flex items-center gap-1"
        onclick="window.shareToWhatsApp('${dataAttr}')"
        aria-label="${t('shareOnWhatsApp') || 'Share on WhatsApp'}"
      >
        <i class="fab fa-whatsapp" aria-hidden="true"></i>
        <span class="hidden sm:inline">WhatsApp</span>
      </button>
      <button
        type="button"
        class="share-btn share-btn-telegram px-3 py-1.5 bg-[#0088CC] hover:bg-[#007AB8] text-white rounded-lg transition-colors text-sm flex items-center gap-1"
        onclick="window.shareToTelegram('${dataAttr}')"
        aria-label="${t('shareOnTelegram') || 'Share on Telegram'}"
      >
        <i class="fab fa-telegram-plane" aria-hidden="true"></i>
        <span class="hidden sm:inline">Telegram</span>
      </button>
    </div>
  `
}

/**
 * Track a share event
 * @param {string} platform - Platform name (facebook, twitter, whatsapp, telegram)
 * @param {string} contentType - Content type (spot, achievement, stats)
 */
export function trackShare(platform, contentType) {
  if (!platform || !contentType) {
    console.warn('[SocialSharing] trackShare requires platform and contentType')
    return
  }

  const validPlatforms = Object.values(PLATFORMS)
  const validContentTypes = Object.values(CONTENT_TYPES)

  if (!validPlatforms.includes(platform)) {
    console.warn(`[SocialSharing] Unknown platform: ${platform}`)
  }

  if (!validContentTypes.includes(contentType)) {
    console.warn(`[SocialSharing] Unknown content type: ${contentType}`)
  }

  // Track with analytics service
  trackEvent('social_share', {
    platform,
    content_type: contentType,
    timestamp: new Date().toISOString(),
  })

  // Store share count locally
  try {
    const key = `spothitch_share_count_${platform}`
    const current = parseInt(localStorage.getItem(key) || '0', 10)
    localStorage.setItem(key, String(current + 1))

    // Also track total shares
    const totalKey = 'spothitch_total_shares'
    const total = parseInt(localStorage.getItem(totalKey) || '0', 10)
    localStorage.setItem(totalKey, String(total + 1))
  } catch (error) {
    // localStorage not available
  }

  if (import.meta.env.DEV) {
    console.log(`[SocialSharing] Tracked share: ${platform} - ${contentType}`)
  }
}

/**
 * Get share statistics
 * @returns {Object} Share stats by platform and total
 */
export function getShareStats() {
  try {
    return {
      facebook: parseInt(localStorage.getItem('spothitch_share_count_facebook') || '0', 10),
      twitter: parseInt(localStorage.getItem('spothitch_share_count_twitter') || '0', 10),
      whatsapp: parseInt(localStorage.getItem('spothitch_share_count_whatsapp') || '0', 10),
      telegram: parseInt(localStorage.getItem('spothitch_share_count_telegram') || '0', 10),
      total: parseInt(localStorage.getItem('spothitch_total_shares') || '0', 10),
    }
  } catch {
    return {
      facebook: 0,
      twitter: 0,
      whatsapp: 0,
      telegram: 0,
      total: 0,
    }
  }
}

/**
 * Get character limit for a platform
 * @param {string} platform - Platform name
 * @returns {number} Character limit
 */
export function getCharacterLimit(platform) {
  return CHARACTER_LIMITS[platform] || 500
}

/**
 * Get default hashtags for a platform
 * @param {string} platform - Platform name
 * @returns {string[]} Array of hashtags
 */
export function getDefaultHashtags(platform) {
  return [...(DEFAULT_HASHTAGS[platform] || [])]
}

/**
 * Check if a platform is supported
 * @param {string} platform - Platform name
 * @returns {boolean} True if platform is supported
 */
export function isPlatformSupported(platform) {
  return Object.values(PLATFORMS).includes(platform)
}

/**
 * Get all supported platforms
 * @returns {string[]} Array of supported platform names
 */
export function getSupportedPlatforms() {
  return Object.values(PLATFORMS)
}

/**
 * Get all supported content types
 * @returns {string[]} Array of supported content types
 */
export function getSupportedContentTypes() {
  return Object.values(CONTENT_TYPES)
}

// Global handlers for onclick usage
if (typeof window !== 'undefined') {
  window.shareToFacebook = (encodedData) => {
    try {
      const data = JSON.parse(decodeURIComponent(encodedData))
      return shareToFacebook(data)
    } catch (error) {
      console.warn('[SocialSharing] Failed to parse share data:', error)
      return { success: false, error: 'parse_error' }
    }
  }

  window.shareToTwitter = (encodedData) => {
    try {
      const data = JSON.parse(decodeURIComponent(encodedData))
      return shareToTwitter(data)
    } catch (error) {
      console.warn('[SocialSharing] Failed to parse share data:', error)
      return { success: false, error: 'parse_error' }
    }
  }

  window.shareToWhatsApp = (encodedData) => {
    try {
      const data = JSON.parse(decodeURIComponent(encodedData))
      return shareToWhatsApp(data)
    } catch (error) {
      console.warn('[SocialSharing] Failed to parse share data:', error)
      return { success: false, error: 'parse_error' }
    }
  }

  window.shareToTelegram = (encodedData) => {
    try {
      const data = JSON.parse(decodeURIComponent(encodedData))
      return shareToTelegram(data)
    } catch (error) {
      console.warn('[SocialSharing] Failed to parse share data:', error)
      return { success: false, error: 'parse_error' }
    }
  }
}

export default {
  shareToFacebook,
  shareToTwitter,
  shareToWhatsApp,
  shareToTelegram,
  renderShareButtons,
  renderAchievementShareButtons,
  renderStatsShareButtons,
  trackShare,
  getShareStats,
  getCharacterLimit,
  getDefaultHashtags,
  isPlatformSupported,
  getSupportedPlatforms,
  getSupportedContentTypes,
  CONTENT_TYPES,
  PLATFORMS,
}
