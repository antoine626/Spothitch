/**
 * Enhanced Animation Utilities
 * Success, error, and feedback animations
 */

import { launchConfettiBurst, floatingEmojisBurst } from './confetti.js'

/**
 * Show success animation with optional confetti
 * @param {string} message - Success message
 * @param {Object} options - Animation options
 */
export function showSuccessAnimation(message, options = {}) {
  const {
    confetti = false,
    emoji = '✓',
    duration = 2000,
    position = 'center', // 'center', 'top', 'bottom'
  } = options

  // Create overlay
  const overlay = document.createElement('div')
  overlay.className = 'success-animation-overlay'
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: ${position === 'top' ? 'flex-start' : position === 'bottom' ? 'flex-end' : 'center'};
    justify-content: center;
    padding: ${position === 'center' ? '0' : '100px'};
    pointer-events: none;
    z-index: 9998;
  `

  // Create animation container
  const container = document.createElement('div')
  container.className = 'success-animation'
  container.innerHTML = `
    <div style="
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
      padding: 24px 48px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(16, 185, 129, 0.4);
      animation: successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    ">
      <div style="font-size: 3rem; margin-bottom: 12px; animation: successBounce 0.6s ease-out;">${emoji}</div>
      <div style="color: white; font-size: 1.25rem; font-weight: 600;">${message}</div>
    </div>
  `

  overlay.appendChild(container)
  document.body.appendChild(overlay)

  // Launch confetti if enabled
  if (confetti) {
    setTimeout(() => launchConfettiBurst(), 200)
  }

  // Remove after duration
  setTimeout(() => {
    overlay.style.opacity = '0'
    overlay.style.transition = 'opacity 0.3s ease-out'
    setTimeout(() => overlay.remove(), 300)
  }, duration)
}

/**
 * Show error animation
 * @param {string} message - Error message
 */
export function showErrorAnimation(message) {
  const overlay = document.createElement('div')
  overlay.className = 'error-animation-overlay'
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 9998;
  `

  const container = document.createElement('div')
  container.innerHTML = `
    <div style="
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
      padding: 24px 48px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(239, 68, 68, 0.4);
      animation: errorShake 0.5s ease-out;
    ">
      <div style="font-size: 3rem; margin-bottom: 12px;">❌</div>
      <div style="color: white; font-size: 1.25rem; font-weight: 600;">${message}</div>
    </div>
  `

  overlay.appendChild(container)
  document.body.appendChild(overlay)

  setTimeout(() => {
    overlay.style.opacity = '0'
    overlay.style.transition = 'opacity 0.3s ease-out'
    setTimeout(() => overlay.remove(), 300)
  }, 2000)
}

/**
 * Show badge unlock animation
 * @param {Object} badge - Badge object with icon, name, points
 */
export function showBadgeUnlockAnimation(badge) {
  const overlay = document.createElement('div')
  overlay.className = 'badge-unlock-overlay'
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    animation: fadeIn 0.3s ease-out;
  `

  overlay.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #1e293b, #0f172a);
      padding: 40px 60px;
      border-radius: 24px;
      text-align: center;
      border: 2px solid rgba(245, 158, 11, 0.5);
      box-shadow: 0 0 100px rgba(245, 158, 11, 0.3);
      animation: badgeReveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    ">
      <div style="font-size: 1rem; color: #f59e0b; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px;">
        Nouveau Badge !
      </div>
      <div style="
        width: 120px;
        height: 120px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        animation: badgeSpin 1s ease-out;
        box-shadow: 0 0 50px rgba(245, 158, 11, 0.5);
      ">
        ${badge.image ? `<img src="${badge.image}" alt="${badge.name}" style="width: 80px; height: 80px; object-fit: contain;">` : badge.icon}
      </div>
      <div style="font-size: 1.5rem; font-weight: bold; color: white; margin-bottom: 8px;">
        ${badge.name}
      </div>
      <div style="color: #94a3b8; margin-bottom: 16px;">
        ${badge.description || ''}
      </div>
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 20px;
        background: rgba(245, 158, 11, 0.2);
        border-radius: 20px;
        color: #f59e0b;
        font-weight: bold;
      ">
        +${badge.points} points
      </div>
    </div>
  `

  // Close on click
  overlay.onclick = () => {
    overlay.style.opacity = '0'
    overlay.style.transition = 'opacity 0.3s ease-out'
    setTimeout(() => overlay.remove(), 300)
  }

  document.body.appendChild(overlay)

  // Play sound if available
  playSound('badge')

  // Launch confetti
  setTimeout(() => launchConfettiBurst(), 500)

  // Auto close after 4 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.style.opacity = '0'
      overlay.style.transition = 'opacity 0.3s ease-out'
      setTimeout(() => overlay.remove(), 300)
    }
  }, 4000)
}

/**
 * Show level up animation
 * @param {number} newLevel - New level reached
 */
export function showLevelUpAnimation(newLevel) {
  floatingEmojisBurst('⬆️', 8)

  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 9998;
  `

  overlay.innerHTML = `
    <div style="
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
      padding: 30px 60px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(59, 130, 246, 0.4);
      animation: levelUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    ">
      <div style="font-size: 3rem; margin-bottom: 8px;">🎉</div>
      <div style="color: white; font-size: 1rem; opacity: 0.8;">NIVEAU</div>
      <div style="color: white; font-size: 3rem; font-weight: 800;">${newLevel}</div>
    </div>
  `

  document.body.appendChild(overlay)
  playSound('levelup')
  launchConfettiBurst()

  setTimeout(() => {
    overlay.style.opacity = '0'
    overlay.style.transition = 'opacity 0.3s ease-out'
    setTimeout(() => overlay.remove(), 300)
  }, 2500)
}

/**
 * Show points earned animation
 * @param {number} points - Points earned
 * @param {number} x - X position (optional)
 * @param {number} y - Y position (optional)
 */
export function showPointsAnimation(points, x, y) {
  const posX = x || window.innerWidth / 2
  const posY = y || window.innerHeight / 2

  const element = document.createElement('div')
  element.style.cssText = `
    position: fixed;
    left: ${posX}px;
    top: ${posY}px;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    font-weight: bold;
    color: #f59e0b;
    text-shadow: 0 2px 10px rgba(245, 158, 11, 0.5);
    pointer-events: none;
    z-index: 9999;
    animation: pointsFloat 1.5s ease-out forwards;
  `
  element.textContent = `+${points}`

  document.body.appendChild(element)
  setTimeout(() => element.remove(), 1500)
}

/**
 * Play sound effect
 * @param {string} type - Sound type: 'badge', 'levelup', 'success', 'error', 'click'
 */
export function playSound(type) {
  // Create audio context on first interaction
  if (!window.audioContext) {
    try {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      return // Audio not supported
    }
  }

  const ctx = window.audioContext
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Different sounds for different events
  const sounds = {
    badge: { freq: [523, 659, 784], duration: 0.3 },
    levelup: { freq: [392, 523, 659, 784], duration: 0.4 },
    success: { freq: [523, 659], duration: 0.2 },
    error: { freq: [200, 150], duration: 0.3 },
    click: { freq: [800], duration: 0.05 },
  }

  const sound = sounds[type] || sounds.click
  let time = ctx.currentTime

  gainNode.gain.setValueAtTime(0.1, time)

  sound.freq.forEach((freq, i) => {
    oscillator.frequency.setValueAtTime(freq, time + i * (sound.duration / sound.freq.length))
  })

  gainNode.gain.exponentialRampToValueAtTime(0.01, time + sound.duration)

  oscillator.start(time)
  oscillator.stop(time + sound.duration)
}

// Add required CSS animations
const style = document.createElement('style')
style.textContent = `
  @keyframes successPop {
    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
    50% { transform: scale(1.1) rotate(2deg); }
    100% { transform: scale(1) rotate(0); opacity: 1; }
  }

  @keyframes successBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes errorShake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-10px); }
    40%, 80% { transform: translateX(10px); }
  }

  @keyframes badgeReveal {
    0% { transform: scale(0) rotateY(180deg); opacity: 0; }
    60% { transform: scale(1.1) rotateY(-10deg); }
    100% { transform: scale(1) rotateY(0); opacity: 1; }
  }

  @keyframes badgeSpin {
    0% { transform: rotateY(0); }
    100% { transform: rotateY(360deg); }
  }

  @keyframes levelUp {
    0% { transform: scale(0) translateY(50px); opacity: 0; }
    60% { transform: scale(1.2) translateY(-10px); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }

  @keyframes pointsFloat {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
    50% { opacity: 1; transform: translate(-50%, -100%) scale(1.2); }
    100% { opacity: 0; transform: translate(-50%, -150%) scale(1); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`
document.head.appendChild(style)

export default {
  showSuccessAnimation,
  showErrorAnimation,
  showBadgeUnlockAnimation,
  showLevelUpAnimation,
  showPointsAnimation,
  playSound,
}
