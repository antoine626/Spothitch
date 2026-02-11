/**
 * Social Sharing Utilities
 * Share spots, achievements, and content on social media
 */

import { t } from '../i18n/index.js'

const APP_URL = 'https://antoine626.github.io/Spothitch';

/**
 * Share content using Web Share API or fallback
 * @param {Object} data - Share data { title, text, url }
 */
export async function share(data) {
  const { title, text, url } = data;

  // Try Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, reason: 'cancelled' };
      }
    }
  }

  // Fallback: show share modal
  showShareModal(data);
  return { success: true, method: 'modal' };
}

/**
 * Share a spot on social media
 * @param {Object} spot - Spot object
 */
export function shareSpot(spot) {
  const title = `${spot.from} → ${spot.to} | SpotHitch`;
  const text = t('shareSpotText') || `J'ai trouvé un super spot d'autostop ! ${spot.from} → ${spot.to} (${spot.globalRating?.toFixed(1) || '?'}/5) 🚗👍`;
  const url = `${APP_URL}/?spot=${spot.id}`;

  return share({ title, text, url });
}

/**
 * Share a badge achievement
 * @param {Object} badge - Badge object
 */
export function shareBadge(badge) {
  const title = (t('shareBadgeTitle') || 'Badge débloqué :') + ` ${badge.name} | SpotHitch`;
  const text = `${badge.icon} ${t('shareBadgeText') || 'Je viens de débloquer le badge'} "${badge.name}" ${t('onSpotHitch') || 'sur SpotHitch'} ! ${badge.description}`;
  const url = APP_URL;

  return share({ title, text, url });
}

/**
 * Share user stats
 * @param {Object} stats - User stats
 */
export function shareStats(stats) {
  const title = t('shareStatsTitle') || 'Mes stats SpotHitch';
  const text = `🎯 ${t('shareStatsIntro') || 'Mes stats d\'autostop'}:
📍 ${stats.checkins || 0} check-ins
🗺️ ${stats.spotsCreated || 0} ${t('spotsShared') || 'spots partagés'}
🔥 ${stats.streak || 0} ${t('dayStreak') || 'jours de série'}
🏆 ${t('level') || 'Niveau'} ${stats.level || 1}
${t('joinMeOnSpotHitch') || 'Rejoins-moi sur SpotHitch !'}`;
  const url = APP_URL;

  return share({ title, text, url });
}

/**
 * Share app invite
 */
export function shareApp() {
  const title = t('shareAppTitle') || 'SpotHitch - La communauté des autostoppeurs';
  const text = t('shareAppText') || '🚗👍 Découvre SpotHitch, l\'app pour trouver les meilleurs spots d\'autostop dans le monde ! Plus de 100 spots vérifiés, guides par pays, et une communauté active.';
  const url = APP_URL;

  return share({ title, text, url });
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * Show share modal with social options
 * @param {Object} data - Share data
 */
function showShareModal(data) {
  const { title, text, url } = data;
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const socialLinks = [
    {
      name: 'Twitter / X',
      icon: '𝕏',
      color: '#000000',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: 'f',
      color: '#1877f2',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      name: 'WhatsApp',
      icon: '📱',
      color: '#25d366',
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: '#0088cc',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      color: '#0077b5',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`,
    },
    {
      name: 'Email',
      icon: '✉️',
      color: '#6b7280',
      url: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    },
  ];

  const modal = document.createElement('div');
  modal.className = 'share-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease-out;
  `;

  modal.innerHTML = `
    <div style="
      background: #1e293b;
      width: 100%;
      max-width: 500px;
      border-radius: 24px 24px 0 0;
      padding: 24px;
      animation: slideUp 0.3s ease-out;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="color: white; font-size: 1.25rem; font-weight: 600;">${t('share') || 'Partager'}</h3>
        <button onclick="this.closest('.share-modal').remove()" style="
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
        ">✕</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
        ${socialLinks.map(link => `
          <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px;
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            text-decoration: none;
            transition: background 0.2s;
          " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            <div style="
              width: 48px;
              height: 48px;
              background: ${link.color};
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 1.5rem;
              font-weight: bold;
            ">${link.icon}</div>
            <span style="color: #94a3b8; font-size: 0.75rem;">${link.name}</span>
          </a>
        `).join('')}
      </div>

      <div style="
        display: flex;
        gap: 8px;
        padding: 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
      ">
        <input type="text" value="${url}" readonly style="
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 0.875rem;
          outline: none;
        " id="share-url-input">
        <button onclick="
          navigator.clipboard.writeText('${url}');
          this.textContent = '${t('copied') || 'Copié !'}';
          this.style.background = '#10b981';
          setTimeout(() => { this.textContent = '${t('copy') || 'Copier'}'; this.style.background = '#3b82f6'; }, 2000);
        " style="
          padding: 8px 16px;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        ">${t('copy') || 'Copier'}</button>
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  document.body.appendChild(modal);

  // Add slideUp animation
  if (!document.getElementById('share-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'share-modal-styles';
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Expose globally
window.shareSpot = shareSpot;
window.shareBadge = shareBadge;
window.shareStats = shareStats;
window.shareApp = shareApp;

export default {
  share,
  shareSpot,
  shareBadge,
  shareStats,
  shareApp,
  copyToClipboard,
};
