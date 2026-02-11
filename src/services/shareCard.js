/**
 * Share Card Service
 * Generates visual share cards after check-in
 */

import { getState } from '../stores/state.js'
import { copyToClipboard } from '../utils/share.js'
import { showToast } from './notifications.js'
import { t } from '../i18n/index.js'

const APP_URL = 'https://antoine626.github.io/Spothitch'

/**
 * Generate a visual share card for a spot
 * @param {Object} spot - Spot object
 * @returns {string} HTML string for the card
 */
export function generateShareCard(spot) {
  if (!spot) return ''

  const spotName = spot.name || `${spot.from} → ${spot.to}`
  const country = spot.country || '🌍'
  const rating = spot.globalRating?.toFixed(1) || '?'
  const waitTime = spot.avgWaitTime || '?'

  return `
    <div id="share-card" style="
      width: 400px;
      max-width: 90vw;
      padding: 24px;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border-radius: 16px;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    ">
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
        📍 Check-in!
      </div>
      <div style="font-size: 18px; margin-bottom: 4px; line-height: 1.4;">
        ${escapeHTML(spotName)}
      </div>
      <div style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">
        ${escapeHTML(country)}
      </div>
      <div style="display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="color: #fbbf24;">⭐</span>
          <span>${rating}/5</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <span>⏱️</span>
          <span>~${waitTime} min</span>
        </div>
      </div>
      <div style="
        border-top: 1px solid #334155;
        padding-top: 12px;
        font-size: 12px;
        color: #64748b;
        text-align: center;
      ">
        🤙 SpotHitch — ${t('shareCardTagline') || 'La communauté des autostoppeurs'}
      </div>
    </div>
  `
}

/**
 * Show share modal with visual card and share options
 * @param {Object} spot - Spot object
 */
export function showShareModal(spot) {
  if (!spot) {
    console.warn('[ShareCard] No spot provided')
    return
  }

  // Remove any existing share card modal
  const existing = document.getElementById('share-card-modal')
  if (existing) existing.remove()

  const spotName = spot.name || `${spot.from} → ${spot.to}`
  const spotUrl = `${APP_URL}/?spot=${spot.id}`
  const whatsappText = encodeURIComponent(
    `🚗 ${t('shareCardCheckedSpot') || 'Je viens de checker un spot d\'autostop'} : ${spotName} ! 🤙\n\n${spotUrl}`
  )

  const modal = document.createElement('div')
  modal.id = 'share-card-modal'
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease-out;
    padding: 20px;
  `

  modal.innerHTML = `
    <div style="
      background: #1e293b;
      max-width: 500px;
      width: 100%;
      border-radius: 20px;
      padding: 24px;
      animation: slideUp 0.3s ease-out;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    ">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="color: white; font-size: 1.5rem; font-weight: 700; margin: 0;">
          ${t('shareCardTitle') || 'Partager ton check-in'}
        </h3>
        <button onclick="window.closeShareModal()" style="
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.5rem;
          line-height: 1;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.2)'"
           onmouseout="this.style.background='rgba(255,255,255,0.1)'">
          ✕
        </button>
      </div>

      <!-- Share Card Preview -->
      <div style="
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
      ">
        ${generateShareCard(spot)}
      </div>

      <!-- Capture Screenshot Hint -->
      <div style="
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 20px;
        text-align: center;
      ">
        <span style="color: #60a5fa; font-size: 14px;">
          📸 ${t('shareCardScreenshotHint') || 'Fais une capture d\'écran pour partager cette carte !'}
        </span>
      </div>

      <!-- Share Buttons -->
      <div style="display: grid; gap: 12px; margin-bottom: 16px;">
        <!-- WhatsApp -->
        <a href="https://wa.me/?text=${whatsappText}" target="_blank" rel="noopener noreferrer" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: #25d366;
          border-radius: 12px;
          text-decoration: none;
          color: white;
          font-weight: 600;
          transition: all 0.2s;
        " onmouseover="this.style.background='#20c05c'"
           onmouseout="this.style.background='#25d366'">
          <span style="font-size: 24px;">📱</span>
          <span>${t('shareCardWhatsApp') || 'Partager sur WhatsApp'}</span>
        </a>

        <!-- Copy Link -->
        <button onclick="window.copySpotLink('${spot.id}')" style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          color: #60a5fa;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s;
        " onmouseover="this.style.background='rgba(59, 130, 246, 0.3)'"
           onmouseout="this.style.background='rgba(59, 130, 246, 0.2)'">
          <span style="font-size: 24px;">🔗</span>
          <span>${t('shareCardCopyLink') || 'Copier le lien du spot'}</span>
        </button>
      </div>

      <!-- Close Button -->
      <button onclick="window.closeShareModal()" style="
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #94a3b8;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.1)'"
         onmouseout="this.style.background='rgba(255,255,255,0.05)'">
        ${t('close') || 'Fermer'}
      </button>
    </div>
  `

  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeShareModal()
    }
  }

  // Add animation styles if not already present
  if (!document.getElementById('share-card-modal-styles')) {
    const style = document.createElement('style')
    style.id = 'share-card-modal-styles'
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(modal)
}

/**
 * Close the share modal
 */
export function closeShareModal() {
  const modal = document.getElementById('share-card-modal')
  if (modal) {
    modal.style.animation = 'fadeOut 0.2s ease-out'
    setTimeout(() => modal.remove(), 200)
  }
}

/**
 * Copy spot link to clipboard
 * @param {string|number} spotId - Spot ID
 */
export async function copySpotLink(spotId) {
  const url = `${APP_URL}/?spot=${spotId}`
  try {
    await copyToClipboard(url)
    showToast(t('shareCardLinkCopied') || 'Lien copié dans le presse-papier !', 'success')
  } catch (err) {
    console.error('[ShareCard] Failed to copy link:', err)
    showToast(t('shareCardCopyError') || 'Erreur lors de la copie', 'error')
  }
}

/**
 * Share on WhatsApp
 * @param {string|number} spotId - Spot ID
 */
export function shareOnWhatsApp(spotId) {
  const { spots } = getState()
  const spot = spots.find(s => s.id == spotId)

  if (!spot) {
    console.warn('[ShareCard] Spot not found:', spotId)
    return
  }

  const spotName = spot.name || `${spot.from} → ${spot.to}`
  const spotUrl = `${APP_URL}/?spot=${spotId}`
  const text = encodeURIComponent(
    `🚗 ${t('shareCardCheckedSpot') || 'Je viens de checker un spot d\'autostop'} : ${spotName} ! 🤙\n\n${spotUrl}`
  )

  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// Global handlers
if (typeof window !== 'undefined') {
  window.closeShareModal = closeShareModal
  window.copySpotLink = copySpotLink
  window.shareOnWhatsApp = shareOnWhatsApp
}

export default {
  generateShareCard,
  showShareModal,
  closeShareModal,
  copySpotLink,
  shareOnWhatsApp,
}
