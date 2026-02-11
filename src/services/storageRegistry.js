/**
 * Storage Registry - Centralized registry of ALL localStorage keys
 * Used by DeleteAccount (RGPD suppression) and MyData (RGPD export)
 *
 * RULE: Every service that adds a new spothitch_* key MUST register it here.
 */

/**
 * Data categories for RGPD compliance
 */
export const DataCategory = {
  PERSONAL: 'personal',       // Identity, profile, devices
  ACTIVITY: 'activity',       // Check-ins, reviews, trips, forum
  SOCIAL: 'social',           // Friends, messages, groups, follows
  GAMIFICATION: 'gamification', // Badges, scores, streaks, seasons
  SETTINGS: 'settings',       // Preferences, UI settings, accessibility
  SECURITY: 'security',       // 2FA, login attempts, encryption
  ANALYTICS: 'analytics',     // Tracking, funnels, cohorts
  CACHE: 'cache',             // Temporary data, suggestions cache
  MODERATION: 'moderation',   // Reports, moderation logs
  MONETIZATION: 'monetization', // Affiliates, sponsors, ads
}

/**
 * Complete registry of all localStorage keys used by the app.
 * Each entry: { key, category, description, sensitive }
 */
export const STORAGE_KEYS = [
  // === PERSONAL ===
  { key: 'spothitch_user', category: DataCategory.PERSONAL, description: 'User name and avatar', sensitive: true },
  { key: 'spothitch_welcomed', category: DataCategory.PERSONAL, description: 'Welcome screen shown flag' },
  { key: 'spothitch_language_selected', category: DataCategory.SETTINGS, description: 'Language selection flag' },
  { key: 'spothitch_known_devices', category: DataCategory.PERSONAL, description: 'Known device fingerprints', sensitive: true },
  { key: 'spothitch_detailed_profiles', category: DataCategory.PERSONAL, description: 'Detailed user profiles', sensitive: true },
  { key: 'spothitch_registration_date', category: DataCategory.PERSONAL, description: 'Account creation date' },
  { key: 'spothitch_user_profiles', category: DataCategory.PERSONAL, description: 'Public profile data' },
  { key: 'spothitch_profile_visibility', category: DataCategory.PERSONAL, description: 'Profile visibility setting' },
  { key: 'spothitch_verified_phone', category: DataCategory.PERSONAL, description: 'Verified phone number', sensitive: true },

  // === ACTIVITY ===
  { key: 'spothitch_action_logs', category: DataCategory.ACTIVITY, description: 'User action audit logs' },
  { key: 'spothitch_detailed_reviews', category: DataCategory.ACTIVITY, description: 'Detailed spot reviews' },
  { key: 'spothitch_review_replies', category: DataCategory.ACTIVITY, description: 'Review replies' },
  { key: 'spothitch_review_reports', category: DataCategory.ACTIVITY, description: 'Review reports' },
  { key: 'spothitch_photo_gallery', category: DataCategory.ACTIVITY, description: 'Spot photos' },
  { key: 'spothitch_photoRotationConfig', category: DataCategory.ACTIVITY, description: 'Photo check-in config' },
  { key: 'spothitch_checkin_history', category: DataCategory.ACTIVITY, description: 'Check-in history' },
  { key: 'spothitch_trip_history', category: DataCategory.ACTIVITY, description: 'Trip history log' },
  { key: 'spothitch_saved_trips', category: DataCategory.ACTIVITY, description: 'Saved trip plans' },
  { key: 'spothitch_favorites', category: DataCategory.ACTIVITY, description: 'Favorite spots' },
  { key: 'spothitch_saved_routes', category: DataCategory.ACTIVITY, description: 'Saved routes' },
  { key: 'spothitch_search_history', category: DataCategory.ACTIVITY, description: 'Search history' },
  { key: 'spothitch_saved_filters', category: DataCategory.ACTIVITY, description: 'Saved search filters' },
  { key: 'spothitch_spot_corrections', category: DataCategory.ACTIVITY, description: 'Spot corrections proposed' },
  { key: 'spothitch_spot_verifications', category: DataCategory.ACTIVITY, description: 'Spot verifications done' },
  { key: 'spothitch_share_codes', category: DataCategory.ACTIVITY, description: 'Generated share codes' },
  { key: 'spothitch_distance_stats', category: DataCategory.ACTIVITY, description: 'Distance statistics' },
  { key: 'spothitch_community_tips', category: DataCategory.ACTIVITY, description: 'Community tips submitted' },
  { key: 'spothitch_guide_reports', category: DataCategory.ACTIVITY, description: 'Guide error reports' },
  { key: 'spothitch_contact_history', category: DataCategory.ACTIVITY, description: 'Contact form history' },
  { key: 'spothitch_user_feedback', category: DataCategory.ACTIVITY, description: 'In-app feedback' },
  { key: 'spothitch_forum', category: DataCategory.ACTIVITY, description: 'Forum posts and topics' },
  { key: 'spothitch_archived_spots', category: DataCategory.ACTIVITY, description: 'Archived spots list' },

  // === SOCIAL ===
  { key: 'spothitch_social', category: DataCategory.SOCIAL, description: 'Social hub data' },
  { key: 'spothitch_friends', category: DataCategory.SOCIAL, description: 'Friends list' },
  { key: 'spothitch_friend_requests_pending', category: DataCategory.SOCIAL, description: 'Pending friend requests' },
  { key: 'spothitch_friend_requests_sent', category: DataCategory.SOCIAL, description: 'Sent friend requests' },
  { key: 'spothitch_friend_suggestions', category: DataCategory.SOCIAL, description: 'Friend suggestions' },
  { key: 'spothitch_dismissed_suggestions', category: DataCategory.SOCIAL, description: 'Dismissed friend suggestions' },
  { key: 'spothitch_friend_nearby', category: DataCategory.SOCIAL, description: 'Nearby friends data' },
  { key: 'spothitch_followers', category: DataCategory.SOCIAL, description: 'Followers list' },
  { key: 'spothitch_following', category: DataCategory.SOCIAL, description: 'Following list' },
  { key: 'spothitch_blocked_users', category: DataCategory.SOCIAL, description: 'Blocked users' },
  { key: 'spothitch_blocked_by', category: DataCategory.SOCIAL, description: 'Blocked by users' },
  { key: 'spothitch_reported_users', category: DataCategory.SOCIAL, description: 'Reported users' },
  { key: 'spothitch_user_reports', category: DataCategory.SOCIAL, description: 'User report details' },
  { key: 'spothitch_conversations', category: DataCategory.SOCIAL, description: 'Private conversations', sensitive: true },
  { key: 'spothitch_private_messages', category: DataCategory.SOCIAL, description: 'Private messages', sensitive: true },
  { key: 'spothitch_unread_counts', category: DataCategory.SOCIAL, description: 'Unread message counts' },
  { key: 'spothitch_muted_conversations', category: DataCategory.SOCIAL, description: 'Muted conversations' },
  { key: 'spothitch_messages', category: DataCategory.SOCIAL, description: 'Chat messages' },
  { key: 'spothitch_chat_rooms', category: DataCategory.SOCIAL, description: 'Chat rooms' },
  { key: 'spothitch_chat_messages', category: DataCategory.SOCIAL, description: 'Chat messages storage' },
  { key: 'spothitch_message_reactions', category: DataCategory.SOCIAL, description: 'Message reactions' },
  { key: 'spothitch_message_replies', category: DataCategory.SOCIAL, description: 'Message replies' },
  { key: 'spothitch_shared_spots', category: DataCategory.SOCIAL, description: 'Spots shared in chat' },
  { key: 'spothitch_shared_positions', category: DataCategory.SOCIAL, description: 'Positions shared in chat' },
  { key: 'spothitch_travel_groups', category: DataCategory.SOCIAL, description: 'Travel groups' },
  { key: 'spothitch_group_itineraries', category: DataCategory.SOCIAL, description: 'Group itineraries' },
  { key: 'spothitch_travel_plans', category: DataCategory.SOCIAL, description: 'Travel plans for companion search' },
  { key: 'spothitch_plan_responses', category: DataCategory.SOCIAL, description: 'Plan responses' },

  // === GAMIFICATION ===
  { key: 'spothitch_weekly_leaderboard', category: DataCategory.GAMIFICATION, description: 'Weekly leaderboard data' },
  { key: 'spothitch_weekly_history', category: DataCategory.GAMIFICATION, description: 'Weekly leaderboard history' },
  { key: 'spothitch_geo_achievements', category: DataCategory.GAMIFICATION, description: 'Geographic achievements' },
  { key: 'spothitch_borders_crossed', category: DataCategory.GAMIFICATION, description: 'Borders crossed count' },
  { key: 'spothitch_capitals_visited', category: DataCategory.GAMIFICATION, description: 'Capitals visited' },
  { key: 'spothitch_season_data', category: DataCategory.GAMIFICATION, description: 'Current season data' },
  { key: 'spothitch_season_history', category: DataCategory.GAMIFICATION, description: 'Season history' },
  { key: 'spothitch_season_rewards', category: DataCategory.GAMIFICATION, description: 'Season rewards earned' },
  { key: 'spothitch_streak_reminder', category: DataCategory.GAMIFICATION, description: 'Streak reminder data' },
  { key: 'spothitch_anniversary_last_claimed', category: DataCategory.GAMIFICATION, description: 'Last anniversary reward claimed' },
  { key: 'spothitch_gamification_ui', category: DataCategory.GAMIFICATION, description: 'Gamification UI level' },
  { key: 'spothitch_roadmap_votes', category: DataCategory.GAMIFICATION, description: 'Roadmap votes' },

  // === SETTINGS ===
  { key: 'spothitch_notification_prefs', category: DataCategory.SETTINGS, description: 'Notification preferences' },
  { key: 'spothitch_notification_sound', category: DataCategory.SETTINGS, description: 'Sound notification toggle' },
  { key: 'spothitch_big_text', category: DataCategory.SETTINGS, description: 'Big text mode enabled' },
  { key: 'spothitch_text_scale', category: DataCategory.SETTINGS, description: 'Text scale factor' },
  { key: 'spothitch_reduced_motion', category: DataCategory.SETTINGS, description: 'Reduced animations' },
  { key: 'spothitch_high_contrast', category: DataCategory.SETTINGS, description: 'High contrast mode' },
  { key: 'spothitch_icon_accessibility', category: DataCategory.SETTINGS, description: 'Icon accessibility labels' },
  { key: 'spothitch_preferred_nav_app', category: DataCategory.SETTINGS, description: 'Preferred navigation app' },
  { key: 'spothitch_show_service_areas', category: DataCategory.SETTINGS, description: 'Show service areas toggle' },
  { key: 'spothitch_travel_mode', category: DataCategory.SETTINGS, description: 'Travel mode enabled' },
  { key: 'spothitch_language_pref', category: DataCategory.SETTINGS, description: 'Language preference' },
  { key: 'spothitch_last_country', category: DataCategory.SETTINGS, description: 'Last detected country' },
  { key: 'spothitch_notifications', category: DataCategory.SETTINGS, description: 'Legacy notification prefs' },

  // === SECURITY ===
  { key: 'spothitch_2fa_enabled', category: DataCategory.SECURITY, description: '2FA enabled flag', sensitive: true },
  { key: 'spothitch_2fa_method', category: DataCategory.SECURITY, description: '2FA method', sensitive: true },
  { key: 'spothitch_pending_2fa_code', category: DataCategory.SECURITY, description: 'Pending 2FA code', sensitive: true },
  { key: 'spothitch_2fa_code_expiry', category: DataCategory.SECURITY, description: '2FA code expiry', sensitive: true },
  { key: 'spothitch_last_activity', category: DataCategory.SECURITY, description: 'Session last activity timestamp' },
  { key: 'spothitch_login_attempts', category: DataCategory.SECURITY, description: 'Login attempt tracking' },
  { key: 'spothitch_encryption_meta', category: DataCategory.SECURITY, description: 'Encryption metadata', sensitive: true },
  { key: 'spothitch_rate_limits', category: DataCategory.SECURITY, description: 'Rate limiting counters' },
  { key: 'spothitch_confirmation_history', category: DataCategory.SECURITY, description: 'Destructive action confirmations' },

  // === ANALYTICS ===
  { key: 'spothitch_analytics_user_id', category: DataCategory.ANALYTICS, description: 'Analytics user ID' },
  { key: 'spothitch_analytics_events', category: DataCategory.ANALYTICS, description: 'Analytics events buffer' },
  { key: 'spothitch_user_properties', category: DataCategory.ANALYTICS, description: 'Analytics user properties' },
  { key: 'spothitch_funnel_data', category: DataCategory.ANALYTICS, description: 'Funnel tracking data' },
  { key: 'spothitch_cohort_week', category: DataCategory.ANALYTICS, description: 'Cohort assignment' },
  { key: 'spothitch_last_app_open', category: DataCategory.ANALYTICS, description: 'Last app open timestamp' },
  { key: 'spothitch_share_count_facebook', category: DataCategory.ANALYTICS, description: 'Facebook share count' },
  { key: 'spothitch_share_count_twitter', category: DataCategory.ANALYTICS, description: 'Twitter share count' },
  { key: 'spothitch_share_count_whatsapp', category: DataCategory.ANALYTICS, description: 'WhatsApp share count' },
  { key: 'spothitch_share_count_telegram', category: DataCategory.ANALYTICS, description: 'Telegram share count' },
  { key: 'spothitch_total_shares', category: DataCategory.ANALYTICS, description: 'Total shares count' },

  // === CACHE ===
  { key: 'spothitch_suggestions_cache_time', category: DataCategory.CACHE, description: 'Friend suggestions cache timestamp' },
  { key: 'spothitch_compatibility_cache', category: DataCategory.CACHE, description: 'Companion compatibility cache' },
  { key: 'spothitch_suggestion_cache', category: DataCategory.CACHE, description: 'Search suggestion cache' },
  { key: 'spothitch_custom_suggestions', category: DataCategory.CACHE, description: 'Custom search suggestions' },
  { key: 'spothitch_typing_indicators', category: DataCategory.CACHE, description: 'Chat typing indicators' },
  { key: 'spothitch_online_users', category: DataCategory.CACHE, description: 'Online users cache' },
  { key: 'spothitch_messages_cache', category: DataCategory.CACHE, description: 'Messages cache' },
  { key: 'spothitch_offline_queue', category: DataCategory.CACHE, description: 'Offline action queue' },
  { key: 'spothitch_cache_timestamp', category: DataCategory.CACHE, description: 'Cache timestamps' },
  { key: 'spothitch_badge_count', category: DataCategory.CACHE, description: 'Notification badge count' },
  { key: 'spothitch_notification_badge_count', category: DataCategory.CACHE, description: 'Badge count display' },
  { key: 'spothitch_notification_history', category: DataCategory.CACHE, description: 'Notification history' },
  { key: 'spothitch_changelog_read', category: DataCategory.CACHE, description: 'Changelog read status' },
  { key: 'spothitch_share_target', category: DataCategory.CACHE, description: 'Share target data' },
  { key: 'spothitch_clean_urls', category: DataCategory.CACHE, description: 'Clean URLs config' },
  { key: 'spothitch_static_seo', category: DataCategory.CACHE, description: 'Static SEO pages cache' },
  { key: 'spothitch_spot_subscriptions', category: DataCategory.CACHE, description: 'Spot notification subscriptions' },

  // === MODERATION ===
  { key: 'spothitch_moderation_log', category: DataCategory.MODERATION, description: 'Moderation action log' },
  { key: 'spothitch_moderator_roles', category: DataCategory.MODERATION, description: 'Moderator role definitions' },
  { key: 'spothitch_role_assignments', category: DataCategory.MODERATION, description: 'Role assignments' },
  { key: 'spothitch_moderation_history', category: DataCategory.MODERATION, description: 'Moderation action history' },
  { key: 'spothitch_suspicious_accounts', category: DataCategory.MODERATION, description: 'Suspicious accounts list' },
  { key: 'spothitch_account_activity', category: DataCategory.MODERATION, description: 'Account activity tracking' },
  { key: 'spothitch_moderation_queue', category: DataCategory.MODERATION, description: 'Moderation queue' },
  { key: 'spothitch_suspicious_checkins', category: DataCategory.MODERATION, description: 'Suspicious check-ins' },
  { key: 'spothitch_geoloc_threshold', category: DataCategory.MODERATION, description: 'Geolocation threshold' },
  { key: 'spothitch_ai_content_detection', category: DataCategory.MODERATION, description: 'AI content detection log' },
  { key: 'spothitch_dangerous_spots', category: DataCategory.MODERATION, description: 'Dangerous spot reports' },
  { key: 'spothitch_deletion_proposals', category: DataCategory.MODERATION, description: 'Spot deletion proposals' },
  { key: 'spothitch_closed_spots', category: DataCategory.MODERATION, description: 'Closed spots list' },
  { key: 'spothitch_pending_merges', category: DataCategory.MODERATION, description: 'Pending spot merges' },
  { key: 'spothitch_merge_history', category: DataCategory.MODERATION, description: 'Spot merge history' },
  { key: 'spothitch_spot_redirects', category: DataCategory.MODERATION, description: 'Spot redirect map' },

  // === MONETIZATION ===
  { key: 'spothitch_affiliation', category: DataCategory.MONETIZATION, description: 'Affiliation program data' },
  { key: 'spothitch_affiliation_clicks', category: DataCategory.MONETIZATION, description: 'Affiliation click tracking' },
  { key: 'spothitch_hostel_codes', category: DataCategory.MONETIZATION, description: 'Hostel partnership codes' },
  { key: 'spothitch_hostel_recs', category: DataCategory.MONETIZATION, description: 'Hostel recommendations' },
  { key: 'spothitch_hostel_upvotes', category: DataCategory.MONETIZATION, description: 'Hostel recommendation upvotes' },
  { key: 'spothitch_roadmap_items', category: DataCategory.MONETIZATION, description: 'Roadmap items' },

  // === STATE (via Storage.js with spothitch_v4_ prefix) ===
  { key: 'spothitch_v4_state', category: DataCategory.PERSONAL, description: 'Main app state (via Storage.js)', sensitive: true },
  { key: 'spothitch_state', category: DataCategory.PERSONAL, description: 'Legacy app state', sensitive: true },
]

/**
 * Dynamic keys (with variable suffixes)
 */
export const DYNAMIC_KEY_PATTERNS = [
  { pattern: 'spothitch_tracked_*', category: DataCategory.ANALYTICS, description: 'Event tracking flags' },
  { pattern: 'spothitch_offline_*', category: DataCategory.CACHE, description: 'Offline sync data' },
  { pattern: 'spothitch_v4_*', category: DataCategory.PERSONAL, description: 'Storage.js managed keys' },
]

/**
 * Get all registered keys
 * @returns {string[]}
 */
export function getAllRegisteredKeys() {
  return STORAGE_KEYS.map(entry => entry.key)
}

/**
 * Get keys by category
 * @param {string} category - DataCategory value
 * @returns {Array}
 */
export function getKeysByCategory(category) {
  return STORAGE_KEYS.filter(entry => entry.category === category)
}

/**
 * Get all sensitive keys
 * @returns {Array}
 */
export function getSensitiveKeys() {
  return STORAGE_KEYS.filter(entry => entry.sensitive)
}

/**
 * Clear ALL user data from localStorage (for account deletion - RGPD)
 * This is the single source of truth for data cleanup.
 * @returns {Object} { cleared: number, errors: string[] }
 */
export function clearAllUserData() {
  const result = { cleared: 0, errors: [] }

  // 1. Clear all registered static keys
  for (const entry of STORAGE_KEYS) {
    try {
      localStorage.removeItem(entry.key)
      result.cleared++
    } catch (e) {
      result.errors.push(`Failed to remove ${entry.key}: ${e.message}`)
    }
  }

  // 2. Clear all dynamic keys (spothitch_tracked_*, spothitch_offline_*, spothitch_v4_*)
  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('spothitch_')) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
      result.cleared++
    }
  } catch (e) {
    result.errors.push(`Failed to clear dynamic keys: ${e.message}`)
  }

  // 3. Clear sessionStorage too
  try {
    sessionStorage.removeItem('spothitch_session_id')
  } catch {
    // ignore
  }

  console.log(`[StorageRegistry] Cleared ${result.cleared} keys`)
  return result
}

/**
 * Export ALL user data from localStorage (for RGPD data export)
 * @returns {Object} Categorized data export
 */
export function exportAllUserData() {
  const exportData = {}

  for (const entry of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(entry.key)
      if (raw !== null) {
        if (!exportData[entry.category]) {
          exportData[entry.category] = {}
        }
        try {
          exportData[entry.category][entry.key] = JSON.parse(raw)
        } catch {
          exportData[entry.category][entry.key] = raw
        }
      }
    } catch {
      // skip inaccessible keys
    }
  }

  // Also grab any dynamic keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('spothitch_') && !STORAGE_KEYS.find(e => e.key === key)) {
        if (!exportData.other) exportData.other = {}
        try {
          exportData.other[key] = JSON.parse(localStorage.getItem(key))
        } catch {
          exportData.other[key] = localStorage.getItem(key)
        }
      }
    }
  } catch {
    // ignore
  }

  return exportData
}

/**
 * Get storage usage stats
 * @returns {Object} { totalKeys, totalBytes, byCategory }
 */
export function getStorageStats() {
  let totalBytes = 0
  const byCategory = {}

  for (const entry of STORAGE_KEYS) {
    const raw = localStorage.getItem(entry.key)
    if (raw !== null) {
      const bytes = new Blob([raw]).size
      totalBytes += bytes
      if (!byCategory[entry.category]) {
        byCategory[entry.category] = { keys: 0, bytes: 0 }
      }
      byCategory[entry.category].keys++
      byCategory[entry.category].bytes += bytes
    }
  }

  return {
    totalKeys: STORAGE_KEYS.length,
    totalBytes,
    totalKB: Math.round(totalBytes / 1024),
    byCategory,
  }
}

export default {
  DataCategory,
  STORAGE_KEYS,
  DYNAMIC_KEY_PATTERNS,
  getAllRegisteredKeys,
  getKeysByCategory,
  getSensitiveKeys,
  clearAllUserData,
  exportAllUserData,
  getStorageStats,
}
