import { icon } from '../utils/icons.js'

/**
 * Webhooks System
 * Sends notifications to external services (Discord, Telegram, Slack)
 * Triggered on key app events (new spot, milestone, SOS)
 */

const STORAGE_KEY = 'spothitch_webhooks'

/**
 * Webhook types supported
 */
export const WEBHOOK_TYPES = {
  DISCORD: 'discord',
  TELEGRAM: 'telegram',
  SLACK: 'slack',
  CUSTOM: 'custom',
}

/**
 * Events that can trigger webhooks
 */
export const WEBHOOK_EVENTS = {
  SPOT_CREATED: 'spot_created',
  SPOT_VALIDATED: 'spot_validated',
  MILESTONE_REACHED: 'milestone_reached',
  SOS_TRIGGERED: 'sos_triggered',
  NEW_REVIEW: 'new_review',
  LEVEL_UP: 'level_up',
  BADGE_EARNED: 'badge_earned',
  TRIP_COMPLETED: 'trip_completed',
}

/**
 * Get all configured webhooks
 * @returns {Array}
 */
export function getWebhooks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch (e) {
    return []
  }
}

/**
 * Add a webhook configuration
 * @param {Object} config
 * @param {string} config.type - 'discord' | 'telegram' | 'slack' | 'custom'
 * @param {string} config.url - Webhook URL
 * @param {string[]} config.events - Events to listen to
 * @param {string} [config.name] - Display name
 * @returns {Object} Created webhook
 */
export function addWebhook(config) {
  const webhooks = getWebhooks()
  const webhook = {
    id: Date.now().toString(36),
    type: config.type,
    url: config.url,
    events: config.events || Object.values(WEBHOOK_EVENTS),
    name: config.name || `Webhook ${webhooks.length + 1}`,
    enabled: true,
    created: Date.now(),
  }

  webhooks.push(webhook)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooks))
  return webhook
}

/**
 * Remove a webhook
 * @param {string} webhookId
 */
export function removeWebhook(webhookId) {
  const webhooks = getWebhooks().filter(w => w.id !== webhookId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooks))
}

/**
 * Toggle a webhook on/off
 * @param {string} webhookId
 */
export function toggleWebhook(webhookId) {
  const webhooks = getWebhooks()
  const webhook = webhooks.find(w => w.id === webhookId)
  if (webhook) {
    webhook.enabled = !webhook.enabled
    localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooks))
  }
}

/**
 * Trigger webhooks for an event
 * @param {string} event - Event name from WEBHOOK_EVENTS
 * @param {Object} payload - Event data
 */
export async function triggerWebhooks(event, payload = {}) {
  const webhooks = getWebhooks().filter(w => w.enabled && w.events.includes(event))

  const results = await Promise.allSettled(
    webhooks.map(w => sendWebhook(w, event, payload))
  )

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn(`[Webhook] ${webhooks[i].name} failed:`, result.reason)
    }
  })
}

/**
 * Send a webhook notification
 */
async function sendWebhook(webhook, event, payload) {
  const body = formatPayload(webhook.type, event, payload)

  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
}

/**
 * Format payload based on webhook type
 */
function formatPayload(type, event, payload) {
  const title = getEventTitle(event)
  const description = getEventDescription(event, payload)

  switch (type) {
    case WEBHOOK_TYPES.DISCORD:
      return {
        embeds: [{
          title: `SpotHitch: ${title}`,
          description,
          color: getEventColor(event),
          timestamp: new Date().toISOString(),
          footer: { text: 'SpotHitch Notifications' },
        }],
      }

    case WEBHOOK_TYPES.TELEGRAM:
      return {
        text: `*SpotHitch: ${title}*\n${description}`,
        parse_mode: 'Markdown',
      }

    case WEBHOOK_TYPES.SLACK:
      return {
        text: `*SpotHitch: ${title}*\n${description}`,
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: `*${title}*\n${description}` },
        }],
      }

    default:
      return { event, title, description, payload, timestamp: Date.now() }
  }
}

function getEventTitle(event) {
  const titles = {
    spot_created: 'Nouveau spot ajoute',
    spot_validated: 'Spot valide',
    milestone_reached: 'Jalon atteint',
    sos_triggered: 'SOS Active',
    new_review: 'Nouvel avis',
    level_up: 'Niveau superieur',
    badge_earned: 'Badge debloque',
    trip_completed: 'Voyage termine',
  }
  return titles[event] || event
}

function getEventDescription(event, payload) {
  if (payload.message) return payload.message
  if (payload.spotName) return `Spot: ${payload.spotName}`
  if (payload.level) return `Niveau ${payload.level}`
  if (payload.badge) return `Badge: ${payload.badge}`
  return ''
}

function getEventColor(event) {
  const colors = {
    spot_created: 0x22c55e,
    spot_validated: 0x3b82f6,
    milestone_reached: 0xf59e0b,
    sos_triggered: 0xef4444,
    new_review: 0x8b5cf6,
    level_up: 0x0ea5e9,
    badge_earned: 0xeab308,
    trip_completed: 0x10b981,
  }
  return colors[event] || 0x6b7280
}

/**
 * Render webhooks settings UI
 * @returns {string} HTML
 */
export function renderWebhookSettings() {
  const webhooks = getWebhooks()

  return `
    <div class="space-y-3">
      <h3 class="text-lg font-semibold text-white">Webhooks</h3>
      <p class="text-sm text-slate-400">Recevez des notifications sur Discord, Telegram ou Slack.</p>

      ${webhooks.map(w => `
        <div class="flex items-center gap-3 bg-white/5 rounded-lg p-3">
          <div class="flex-1">
            <div class="text-sm font-medium text-white">${w.name}</div>
            <div class="text-xs text-slate-400">${w.type} - ${w.events.length} evenements</div>
          </div>
          <button onclick="window.toggleWebhookAction('${w.id}')"
                  class="px-2 py-1 text-xs rounded ${w.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}">
            ${w.enabled ? 'Actif' : 'Inactif'}
          </button>
          <button onclick="window.removeWebhookAction('${w.id}')" class="text-red-400 hover:text-red-300">
            ${icon('trash', 'w-3 h-3')}
          </button>
        </div>
      `).join('')}

      <button onclick="window.openAddWebhook()" class="w-full py-2 bg-primary-500/20 text-primary-400 rounded-lg text-sm hover:bg-primary-500/30">
        + Ajouter un webhook
      </button>
    </div>
  `
}

export default {
  WEBHOOK_TYPES,
  WEBHOOK_EVENTS,
  getWebhooks,
  addWebhook,
  removeWebhook,
  toggleWebhook,
  triggerWebhooks,
  renderWebhookSettings,
}
